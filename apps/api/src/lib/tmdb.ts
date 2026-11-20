import { env } from '../env.ts'
import { MemoryCache } from './cache.ts'

/**
 * Minimal TMDB client for the title panel. Server-side only: the key never
 * reaches the browser, and posters are served through /api/meta/image so
 * visitors never talk to TMDB directly.
 */

export class TmdbError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'TmdbError'
  }
}

export type TitleKind = 'movie' | 'tv'

export type TmdbRef = { kind: TitleKind; id: number }

export type ExternalSource = 'imdb_id' | 'tvdb_id'

/** Normalised movie/show details, already shaped for the API response. */
export type TitleDetails = {
  kind: TitleKind
  tmdb_id: number
  imdb_id: string | null
  title: string
  /** Only set when it differs from `title`. */
  original_title: string | null
  year: number | null
  /** TV only: final year once a show has ended. */
  end_year: number | null
  tagline: string | null
  overview: string
  genres: string[]
  /** Movies only, in minutes. */
  runtime: number | null
  seasons: number | null
  episodes: number | null
  /** TV only, e.g. "Ended", "Returning Series". */
  status: string | null
  /** TMDB user score out of 10; null when too few votes to mean anything. */
  rating: number | null
  vote_count: number
  /** API path of the proxied poster, e.g. /api/meta/image/w342/abc.jpg. */
  poster: string | null
  credits: { label: string; names: string[] }[]
  links: { tmdb: string; imdb: string | null }
  adult: boolean
}

export const POSTER_SIZE = 'w342'
export const IMAGE_SIZES = new Set(['w92', 'w185', POSTER_SIZE, 'w500'])
/** TMDB image paths are opaque ids like /kqjL17yufvn9OVLyXYpvtyrFfak.jpg. */
export const IMAGE_FILE = /^[A-Za-z0-9_-]{1,64}\.(?:jpg|jpeg|png|webp)$/

const MIN_VOTES_FOR_RATING = 10
const DAY_MS = 24 * 60 * 60_000

// Metadata barely changes, so both caches hold entries for a day. A `null`
// value is cached too: "this IMDb id isn't on TMDB" is just as stable.
const findCache = new MemoryCache<TmdbRef | null>({ ttlMs: DAY_MS, maxEntries: 5_000 })
const detailsCache = new MemoryCache<TitleDetails | null>({ ttlMs: DAY_MS, maxEntries: 1_000 })

/** v4 read access tokens are JWTs; anything else is treated as a v3 api_key. */
const useBearer = env.TMDB_API_KEY.startsWith('eyJ')

async function tmdbGet<T>(path: string, params: Record<string, string> = {}): Promise<T | null> {
  const url = new URL(env.TMDB_API_URL + path)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const headers: Record<string, string> = { accept: 'application/json' }
  if (useBearer) headers.authorization = `Bearer ${env.TMDB_API_KEY}`
  else url.searchParams.set('api_key', env.TMDB_API_KEY)

  let res: Response
  try {
    res = await fetch(url, { headers, signal: AbortSignal.timeout(env.TMDB_TIMEOUT_MS) })
  } catch (err) {
    // `path` only: the URL itself may carry the api_key.
    throw new TmdbError(`TMDB request to ${path} failed`, { cause: err })
  }
  if (res.status === 404) return null
  if (!res.ok) throw new TmdbError(`TMDB responded with HTTP ${res.status} for ${path}`)
  try {
    return (await res.json()) as T
  } catch (err) {
    throw new TmdbError(`TMDB returned a non-JSON response for ${path}`, { cause: err })
  }
}

// --- /find -------------------------------------------------------------------

type FindResponse = {
  movie_results?: { id: number }[]
  tv_results?: { id: number }[]
  tv_season_results?: { show_id: number }[]
  tv_episode_results?: { show_id: number }[]
}

/**
 * Map an IMDb/TVDB id to a TMDB movie or show. Trackers sometimes tag a
 * season pack or episode with that season's/episode's own id, so those
 * resolve to their parent show.
 */
export function findByExternalId(source: ExternalSource, id: string): Promise<TmdbRef | null> {
  return findCache
    .getOrLoad(`${source}:${id}`, async () => {
      const body = await tmdbGet<FindResponse>(`/find/${encodeURIComponent(id)}`, { external_source: source })
      if (!body) return null
      const movie = body.movie_results?.[0]
      if (movie) return { kind: 'movie', id: movie.id }
      const show = body.tv_results?.[0]
      if (show) return { kind: 'tv', id: show.id }
      const showId = body.tv_season_results?.[0]?.show_id ?? body.tv_episode_results?.[0]?.show_id
      return showId ? { kind: 'tv', id: showId } : null
    })
    .then((r) => r.value)
}

// --- details -----------------------------------------------------------------

type Credits = {
  cast?: { name: string; order?: number }[]
  crew?: { name: string; job?: string }[]
}

type MovieResponse = {
  id: number
  title: string
  original_title?: string
  release_date?: string
  tagline?: string
  overview?: string
  genres?: { name: string }[]
  runtime?: number | null
  vote_average?: number
  vote_count?: number
  poster_path?: string | null
  imdb_id?: string | null
  adult?: boolean
  credits?: Credits
}

type TvResponse = {
  id: number
  name: string
  original_name?: string
  first_air_date?: string
  last_air_date?: string
  status?: string
  tagline?: string
  overview?: string
  genres?: { name: string }[]
  number_of_seasons?: number
  number_of_episodes?: number
  vote_average?: number
  vote_count?: number
  poster_path?: string | null
  adult?: boolean
  created_by?: { name: string }[]
  credits?: Credits
  external_ids?: { imdb_id?: string | null }
}

export function getTitleDetails(ref: TmdbRef): Promise<TitleDetails | null> {
  return detailsCache
    .getOrLoad(`${ref.kind}:${ref.id}`, async () => {
      if (ref.kind === 'movie') {
        const m = await tmdbGet<MovieResponse>(`/movie/${ref.id}`, { append_to_response: 'credits' })
        return m && fromMovie(m)
      }
      const t = await tmdbGet<TvResponse>(`/tv/${ref.id}`, { append_to_response: 'credits,external_ids' })
      return t && fromTv(t)
    })
    .then((r) => r.value)
}

function fromMovie(m: MovieResponse): TitleDetails {
  const directors = (m.credits?.crew ?? []).filter((c) => c.job === 'Director').map((c) => c.name)
  const imdb = m.imdb_id || null
  return {
    kind: 'movie',
    tmdb_id: m.id,
    imdb_id: imdb,
    title: m.title,
    original_title: differentTitle(m.original_title, m.title),
    year: yearOf(m.release_date),
    end_year: null,
    tagline: m.tagline || null,
    overview: m.overview ?? '',
    genres: (m.genres ?? []).map((g) => g.name),
    runtime: m.runtime || null,
    seasons: null,
    episodes: null,
    status: null,
    ...rating(m),
    poster: posterPath(m.poster_path),
    credits: compactCredits([
      { label: directors.length > 1 ? 'Directors' : 'Director', names: unique(directors).slice(0, 2) },
      { label: 'Starring', names: topCast(m.credits) },
    ]),
    links: { tmdb: `https://www.themoviedb.org/movie/${m.id}`, imdb: imdbUrl(imdb) },
    adult: m.adult === true,
  }
}

function fromTv(t: TvResponse): TitleDetails {
  const creators = (t.created_by ?? []).map((c) => c.name)
  const imdb = t.external_ids?.imdb_id || null
  const ended = t.status === 'Ended' || t.status === 'Canceled'
  return {
    kind: 'tv',
    tmdb_id: t.id,
    imdb_id: imdb,
    title: t.name,
    original_title: differentTitle(t.original_name, t.name),
    year: yearOf(t.first_air_date),
    end_year: ended ? yearOf(t.last_air_date) : null,
    tagline: t.tagline || null,
    overview: t.overview ?? '',
    genres: (t.genres ?? []).map((g) => g.name),
    runtime: null,
    seasons: t.number_of_seasons ?? null,
    episodes: t.number_of_episodes ?? null,
    status: t.status || null,
    ...rating(t),
    poster: posterPath(t.poster_path),
    credits: compactCredits([
      { label: 'Created by', names: unique(creators).slice(0, 2) },
      { label: 'Starring', names: topCast(t.credits) },
    ]),
    links: { tmdb: `https://www.themoviedb.org/tv/${t.id}`, imdb: imdbUrl(imdb) },
    adult: t.adult === true,
  }
}

function yearOf(date: string | undefined): number | null {
  const y = Number(date?.slice(0, 4))
  return Number.isInteger(y) && y > 1800 ? y : null
}

function differentTitle(original: string | undefined, title: string): string | null {
  return original && original.toLowerCase() !== title.toLowerCase() ? original : null
}

function rating(r: { vote_average?: number; vote_count?: number }): { rating: number | null; vote_count: number } {
  const votes = r.vote_count ?? 0
  const avg = r.vote_average ?? 0
  return { rating: votes >= MIN_VOTES_FOR_RATING && avg > 0 ? Math.round(avg * 10) / 10 : null, vote_count: votes }
}

function posterPath(path: string | null | undefined): string | null {
  const file = path?.replace(/^\//, '')
  return file && IMAGE_FILE.test(file) ? `/api/meta/image/${POSTER_SIZE}/${file}` : null
}

function imdbUrl(id: string | null): string | null {
  return id && /^tt\d+$/.test(id) ? `https://www.imdb.com/title/${id}/` : null
}

function topCast(credits: Credits | undefined): string[] {
  return unique(
    [...(credits?.cast ?? [])].sort((a, b) => (a.order ?? 999) - (b.order ?? 999)).map((c) => c.name),
  ).slice(0, 4)
}

function unique(names: string[]): string[] {
  return [...new Set(names.filter(Boolean))]
}

function compactCredits(rows: { label: string; names: string[] }[]): { label: string; names: string[] }[] {
  return rows.filter((r) => r.names.length > 0)
}
