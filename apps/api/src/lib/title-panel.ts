import { topLevelsOf } from './categories.ts'
import { findByExternalId, getTitleDetails, type TitleDetails, type TitleKind, type TmdbRef } from './tmdb.ts'
import type { TorrentItem } from './torznab.ts'

/**
 * Stage 1 of the title panel: no guessing from the query text. A panel is
 * shown only when the results themselves agree on which movie/show they are,
 * via the IMDb/TMDB/TVDB ids some indexers attach to each result. A wrong
 * panel is worse than none, so every check below fails towards "no panel".
 */

export type TitlePanel = Omit<TitleDetails, 'adult'> & {
  /**
   * How many id-tagged Movies/TV results backed this title, out of how many
   * usable tags; `discarded` tags were contradicted by their own release name.
   */
  match: { votes: number; of: number; discarded: number }
}

export type PanelReason =
  | 'shown'
  | 'disabled'
  | 'no_results'
  | 'not_media'
  | 'too_few_ids'
  | 'no_consensus'
  | 'not_found'
  | 'adult'
  | 'query_mismatch'
  | 'error'

export type PanelResult = { panel: TitlePanel | null; reason: PanelReason }

const MOVIES = 2000
const TV = 5000

/** Movies + TV must make up at least this share of all results. */
const MIN_MEDIA_SHARE = 0.5
/** The winning title needs at least this many results pointing at it... */
const MIN_VOTES = 3
/** ...and at least this share of all id-tagged Movies/TV results. */
const MIN_AGREEMENT = 0.6
/** Only the top few distinct ids are resolved against TMDB (they may merge). */
const MAX_CANDIDATES = 3

export async function resolveTitlePanel(query: string, items: TorrentItem[]): Promise<PanelResult> {
  if (items.length === 0) return { panel: null, reason: 'no_results' }

  const media = items.filter((item) => {
    const tops = topLevelsOf(item)
    return tops.has(MOVIES) || tops.has(TV)
  })
  if (media.length / items.length < MIN_MEDIA_SHARE) return { panel: null, reason: 'not_media' }

  // One vote per result, by the most specific id it carries.
  const tally = new Map<string, { ref: ExternalRef; items: TorrentItem[] }>()
  let tagged = 0
  for (const item of media) {
    const ref = externalRefOf(item)
    if (!ref) continue
    tagged += 1
    const key = refKey(ref)
    const entry = tally.get(key)
    if (entry) entry.items.push(item)
    else tally.set(key, { ref, items: [item] })
  }
  if (tagged < MIN_VOTES) return { panel: null, reason: 'too_few_ids' }

  // Different trackers tag the same title with different id types (IMDb vs
  // TVDB), so resolve the leading candidates and merge votes per TMDB title.
  const candidates = [...tally.values()].sort((a, b) => b.items.length - a.items.length).slice(0, MAX_CANDIDATES)
  const resolved = await settledValues(
    candidates.map(async (c) => ({ tmdb: await toTmdbRef(c.ref), items: c.items })),
  )

  const merged = new Map<string, { ref: TmdbRef; items: TorrentItem[] }>()
  for (const { tmdb, items: votes } of resolved) {
    if (!tmdb) continue
    const key = `${tmdb.kind}:${tmdb.id}`
    const entry = merged.get(key)
    if (entry) entry.items.push(...votes)
    else merged.set(key, { ref: tmdb, items: [...votes] })
  }
  if (merged.size === 0) return { panel: null, reason: 'not_found' }

  // Uploader-entered ids are often wrong (e.g. US "How I Met Your Mother"
  // S09 episodes tagged with the 2-season Russian remake). A vote whose own
  // release name contradicts its title is dropped from the count entirely:
  // it is evidence of a bad tag, not of any other title.
  const scored = (
    await settledValues(
      [...merged.values()].map(async (c) => {
        const details = await getTitleDetails(c.ref)
        if (!details) return null
        const votes = c.items.filter((item) => releaseFits(item.title, details)).length
        return { details, votes, discarded: c.items.length - votes }
      }),
    )
  ).filter((s) => s !== null)

  const discarded = scored.reduce((sum, s) => sum + s.discarded, 0)
  const usable = tagged - discarded
  const winner = scored.sort((a, b) => b.votes - a.votes)[0]
  if (!winner) return { panel: null, reason: 'not_found' }
  if (winner.votes < MIN_VOTES || winner.votes / usable < MIN_AGREEMENT) {
    return { panel: null, reason: 'no_consensus' }
  }

  const { adult, ...title } = winner.details
  if (adult) return { panel: null, reason: 'adult' }
  if (!queryMatchesTitle(query, title)) return { panel: null, reason: 'query_mismatch' }

  return { panel: { ...title, match: { votes: winner.votes, of: usable, discarded } }, reason: 'shown' }
}

/**
 * Fulfilled values only. Skipping a candidate TMDB failed on only removes
 * votes, so it can make a panel less likely but never pick a wrong title.
 * Gives up (rethrows) only when every lookup failed.
 */
async function settledValues<T>(promises: Promise<T>[]): Promise<T[]> {
  const settled = await Promise.allSettled(promises)
  const values = settled.flatMap((s) => (s.status === 'fulfilled' ? [s.value] : []))
  const failure = settled.find((s) => s.status === 'rejected')
  if (values.length === 0 && failure) throw failure.reason
  return values
}

// --- release-name consistency ----------------------------------------------------

/**
 * False when a release name contradicts the title its id points at: a season
 * the show doesn't have, or a movie year more than one off. No evidence
 * either way (no season/year in the name) counts as consistent.
 */
function releaseFits(release: string, title: TitleDetails): boolean {
  const name = release.toLowerCase()
  if (title.kind === 'tv') {
    const seasons = title.seasons
    // +1: TMDB's season count can lag a season that has just started airing.
    return seasons === null || seasonsIn(name).every((s) => s <= seasons + 1)
  }
  const year = title.year
  if (year === null) return true
  const years = [...name.matchAll(/\b(19\d{2}|20\d{2})\b/g)].map((m) => Number(m[1]))
  // A title can contain a year of its own ("Blade Runner 2049"), so any fit will do.
  return years.length === 0 || years.some((y) => Math.abs(y - year) <= 1)
}

/** Season numbers mentioned in a release name: S03, S03E04, S01-S05, Season 2, 3x04. */
function seasonsIn(name: string): number[] {
  const patterns = [/\bs(\d{1,2})(?:e\d{1,3})?\b/g, /\bseasons?[\s._-]*(\d{1,2})\b/g, /\b(\d{1,2})x\d{2,3}\b/g]
  return patterns.flatMap((re) => [...name.matchAll(re)].map((m) => Number(m[1])))
}

// --- ids ---------------------------------------------------------------------

type ExternalRef =
  | { source: 'imdb'; id: string }
  | { source: 'tmdb'; kind: TitleKind; id: number }
  | { source: 'tvdb'; id: string }

function attr(item: TorrentItem, name: string): string | null {
  const value = item.attrs[name]
  const s = Array.isArray(value) ? value[0] : value
  return s ? s.trim() : null
}

function positiveInt(s: string | null): number | null {
  if (!s || !/^\d+$/.test(s)) return null
  const n = Number(s)
  return n > 0 ? n : null
}

/** IMDb first (globally unique), then TMDB, then TVDB. */
function externalRefOf(item: TorrentItem): ExternalRef | null {
  const imdb = attr(item, 'imdbid')
  if (imdb && /^tt\d{7,10}$/.test(imdb) && !/^tt0+$/.test(imdb)) return { source: 'imdb', id: imdb }

  // A bare TMDB id doesn't say whether it's a movie or a show; the result's category does.
  const tmdb = positiveInt(attr(item, 'tmdbid'))
  if (tmdb) return { source: 'tmdb', kind: topLevelsOf(item).has(TV) ? 'tv' : 'movie', id: tmdb }

  const tvdb = positiveInt(attr(item, 'tvdbid'))
  if (tvdb) return { source: 'tvdb', id: String(tvdb) }

  return null
}

function refKey(ref: ExternalRef): string {
  return ref.source === 'tmdb' ? `tmdb:${ref.kind}:${ref.id}` : `${ref.source}:${ref.id}`
}

function toTmdbRef(ref: ExternalRef): Promise<TmdbRef | null> {
  switch (ref.source) {
    case 'tmdb':
      return Promise.resolve({ kind: ref.kind, id: ref.id })
    case 'imdb':
      return findByExternalId('imdb_id', ref.id)
    case 'tvdb':
      return findByExternalId('tvdb_id', ref.id)
  }
}

// --- query sanity check --------------------------------------------------------

/** Words and release tags that say nothing about which title was meant. */
const NOISE = new Set([
  'the', 'a', 'an', 'of', 'and', 'in', 'on', 'at', 'to', 'for', 'with',
  'complete', 'season', 'seasons', 'series', 'episode', 'episodes', 'collection', 'movie', 'film', 'show', 'tv',
  'extended', 'remastered', 'uncut', 'directors', 'cut', 'proper', 'repack', 'internal', 'limited', 'unrated',
  'multi', 'dual', 'audio', 'subs', 'sub', 'subbed', 'dubbed', 'hdr', 'hdr10', 'dv', 'dolby', 'vision', 'atmos', 'imax',
  'web', 'webrip', 'webdl', 'dl', 'bluray', 'bdrip', 'brrip', 'dvdrip', 'hdtv', 'hdrip', 'remux', 'cam', 'hdcam',
  'x264', 'x265', 'h264', 'h265', 'hevc', 'avc', 'aac', 'ac3', 'dts', 'ddp', 'ddp5', 'eac3', 'opus',
  '4k', 'uhd', 'sd', 'hd', 'fhd', 'yts', 'yify', 'rarbg', 'eztv', 'amzn', 'nf', 'dsnp', 'hmax', 'atvp',
])

function normalize(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function isNoise(token: string): boolean {
  return (
    NOISE.has(token) ||
    /^\d{3,4}p$/.test(token) || // 1080p
    /^s\d{1,2}(e\d{1,3})?$/.test(token) || // s01, s01e02
    /^e\d{1,3}$/.test(token) ||
    /^\d{1,2}x\d{1,3}$/.test(token) // 1x02
  )
}

/**
 * Last line of defence against a confidently wrong panel: the title must
 * share at least half of the query's meaningful words, and a year in the
 * query must fit the title's years.
 */
function queryMatchesTitle(query: string, title: Omit<TitleDetails, 'adult'>): boolean {
  const names = [title.title, title.original_title].filter((s): s is string => Boolean(s)).map(normalize)
  const nameTokens = new Set(names.flatMap((n) => n.split(' ')))
  const compact = names.map((n) => n.replace(/ /g, ''))

  const all = normalize(query).split(' ').filter(Boolean)
  const years = all.filter((t) => /^(19|20)\d{2}$/.test(t) && !nameTokens.has(t)).map(Number)
  let words = all.filter((t) => !isNoise(t) && !years.includes(Number(t)))
  if (words.length === 0) words = all.filter((t) => !years.includes(Number(t)))
  if (words.length === 0) return false

  // Short words must match a whole word ("up", "it"); longer ones may sit
  // inside a run-together title ("spiderman" ~ "Spider-Man").
  const hits = words.filter((w) => (w.length < 4 ? nameTokens.has(w) : compact.some((c) => c.includes(w)))).length
  if (hits < Math.ceil(words.length / 2)) return false

  const first = title.year
  if (years.length > 0 && first !== null) {
    const last = title.end_year ?? (title.kind === 'tv' ? new Date().getFullYear() : first)
    if (!years.some((y) => y >= first - 1 && y <= last + 1)) return false
  }
  return true
}
