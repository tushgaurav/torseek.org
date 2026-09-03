import { XMLParser } from 'fast-xml-parser'

import { env } from '../env.ts'
import { isJackettUrl, sanitizeDescription, type TorrentItem } from './torznab.ts'

export type JackettErrorCode = 'UNAUTHORIZED' | 'UNREACHABLE' | 'TIMEOUT' | 'UPSTREAM'

export class JackettError extends Error {
  constructor(
    public readonly code: JackettErrorCode,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options)
    this.name = 'JackettError'
  }
}

export type IndexerOutcome = {
  id: string
  name: string
  status: 'ok' | 'error' | 'unknown'
  results: number
  error?: string
}

export type SearchOutcome = {
  items: TorrentItem[]
  indexers: IndexerOutcome[]
}

export type IndexerInfo = {
  id: string
  name: string
  description: string
  link: string
  language: string
  type: string
  categories: { id: number; name: string }[]
}

export type SearchParams = {
  query: string
  categories?: number[]
  indexers?: string[]
}

/** Shape of one entry in Jackett's JSON `/results` response (Jackett.Common TrackerCacheResult). */
type JackettResult = {
  Title?: string | null
  Guid?: string | null
  Link?: string | null
  Details?: string | null
  PublishDate?: string | null
  Category?: number[] | null
  CategoryDesc?: string | null
  Size?: number | null
  Files?: number | null
  Grabs?: number | null
  Description?: string | null
  Imdb?: number | null
  TMDb?: number | null
  TVDBId?: number | null
  Seeders?: number | null
  Peers?: number | null
  Poster?: string | null
  InfoHash?: string | null
  MagnetUri?: string | null
  Tracker?: string | null
  TrackerId?: string | null
  TrackerType?: string | null
  DownloadVolumeFactor?: number | null
  UploadVolumeFactor?: number | null
}

type JackettIndexerResult = {
  ID?: string | null
  Name?: string | null
  Status?: number | string | null
  Results?: number | null
  Error?: string | null
  ElapsedTime?: number | null
}

type JackettSearchResponse = {
  Results?: JackettResult[]
  Indexers?: JackettIndexerResult[]
}

function buildUrl(path: string, params: Record<string, string>): URL {
  const url = new URL(path, env.JACKETT_URL)
  url.searchParams.set('apikey', env.JACKETT_API_KEY)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return url
}

async function jackettFetch(url: URL): Promise<Response> {
  let res: Response
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(env.JACKETT_TIMEOUT_MS) })
  } catch (err) {
    if (err instanceof Error && err.name === 'TimeoutError') {
      throw new JackettError('TIMEOUT', `Jackett did not respond within ${env.JACKETT_TIMEOUT_MS}ms`, { cause: err })
    }
    throw new JackettError('UNREACHABLE', `Could not connect to Jackett at ${jackettHost()}`, { cause: err })
  }
  if (res.status === 401 || res.status === 403) {
    throw new JackettError('UNAUTHORIZED', 'Jackett rejected the API key')
  }
  if (!res.ok) {
    throw new JackettError('UPSTREAM', `Jackett responded with HTTP ${res.status}`)
  }
  return res
}

/** Host portion of JACKETT_URL, safe to include in responses and logs. */
export function jackettHost(): string {
  try {
    return new URL(env.JACKETT_URL).host
  } catch {
    return env.JACKETT_URL
  }
}

/**
 * Search every configured indexer (or the given subset) via Jackett's JSON
 * results endpoint. Unlike the Torznab aggregate feed, this reports which
 * indexers succeeded or failed.
 */
export async function searchJackett({ query, categories = [], indexers = [] }: SearchParams): Promise<SearchOutcome> {
  const params: Record<string, string> = { Query: query }
  if (categories.length > 0) params['Category[]'] = categories.join(',')
  if (indexers.length > 0) params['Tracker[]'] = indexers.join(',')

  const res = await jackettFetch(buildUrl('/api/v2.0/indexers/all/results', params))
  let body: JackettSearchResponse
  try {
    body = (await res.json()) as JackettSearchResponse
  } catch (err) {
    throw new JackettError('UPSTREAM', 'Jackett returned a non-JSON response', { cause: err })
  }

  return {
    items: (body.Results ?? []).map(fromJackettResult),
    indexers: (body.Indexers ?? []).map(toIndexerOutcome),
  }
}

/** Jackett serialises ManualSearchResultIndexerStatus as Unknown=0, Error=1, OK=2 (or by name). */
function toIndexerOutcome(raw: JackettIndexerResult): IndexerOutcome {
  const status = typeof raw.Status === 'string' ? raw.Status.toLowerCase() : raw.Status
  const normalized: IndexerOutcome['status'] =
    status === 2 || status === 'ok' ? 'ok' : status === 1 || status === 'error' ? 'error' : 'unknown'

  const outcome: IndexerOutcome = {
    id: raw.ID ?? '',
    name: raw.Name ?? raw.ID ?? '',
    status: normalized,
    results: raw.Results ?? 0,
  }
  if (raw.Error) outcome.error = firstLine(raw.Error)
  return outcome
}

/** Jackett's Error field is an exception ToString(); the first line is the human message. */
function firstLine(text: string): string {
  const line = text.split(/\r?\n/, 1)[0] ?? text
  // "Jackett.Common.IndexerException: Exception (1337x): message" -> "message"
  return line.replace(/^[\w.]+Exception:\s*(?:Exception\s*\([^)]*\):\s*)?/, '').trim() || line
}

/** Accept only magnet URIs for the client; anything else is a Jackett proxy URL carrying the API key. */
function magnetOnly(...candidates: (string | null | undefined)[]): string {
  for (const c of candidates) {
    if (c && c.startsWith('magnet:')) return c
  }
  return ''
}

function setAttr(attrs: Record<string, string | string[]>, name: string, value: unknown): void {
  if (value === null || value === undefined || value === '') return
  attrs[name] = String(value)
}

export function fromJackettResult(r: JackettResult): TorrentItem {
  const attrs: Record<string, string | string[]> = {}
  const categoryIds = (r.Category ?? []).map(String)
  if (categoryIds.length > 0) attrs.category = categoryIds
  setAttr(attrs, 'seeders', r.Seeders)
  setAttr(attrs, 'peers', r.Peers)
  setAttr(attrs, 'infohash', r.InfoHash)
  setAttr(attrs, 'grabs', r.Grabs)
  setAttr(attrs, 'imdb', r.Imdb)
  if (r.Imdb) attrs.imdbid = `tt${String(r.Imdb).padStart(7, '0')}`
  setAttr(attrs, 'tmdbid', r.TMDb)
  setAttr(attrs, 'tvdbid', r.TVDBId)
  setAttr(attrs, 'downloadvolumefactor', r.DownloadVolumeFactor)
  setAttr(attrs, 'uploadvolumefactor', r.UploadVolumeFactor)
  setAttr(attrs, 'categorydesc', r.CategoryDesc)
  if (r.Poster && !isJackettUrl(r.Poster)) attrs.coverurl = r.Poster

  const magnetLink = magnetOnly(r.MagnetUri, r.Link)
  if (magnetLink) attrs.magneturl = magnetLink

  return {
    title: r.Title ?? '',
    guid: r.Guid ?? magnetLink ?? '',
    pubDate: r.PublishDate ?? '',
    size: String(r.Size ?? 0),
    files: r.Files === null || r.Files === undefined ? null : String(r.Files),
    description: sanitizeDescription(r.Description ?? ''),
    magnetLink,
    category: categoryIds,
    comments: r.Details && !isJackettUrl(r.Details) ? r.Details : null,
    type: r.TrackerType ?? null,
    jackettindexer: { id: r.TrackerId ?? '', name: r.Tracker ?? r.TrackerId ?? '' },
    enclosure: null,
    seeders: r.Seeders ?? 0,
    peers: r.Peers ?? 0,
    attrs,
  }
}

// --- Indexer listing (Torznab t=indexers) -----------------------------------

const indexerListParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@',
  textNodeName: '#text',
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
  isArray: (name) => name === 'indexer' || name === 'category' || name === 'subcat',
})

type RawIndexer = {
  '@id'?: string
  '@configured'?: string
  title?: string
  description?: string
  link?: string
  language?: string
  type?: string
  caps?: { categories?: { category?: { '@id'?: string; '@name'?: string }[] } }
}

type RawIndexerList = {
  indexers?: { indexer?: RawIndexer[] }
  error?: { '@code'?: string; '@description'?: string }
}

/**
 * Configured indexers with their top-level category support. Jackett answers
 * Torznab errors with HTTP 200 and an <error> document, so that is checked too.
 */
export async function listIndexers(): Promise<IndexerInfo[]> {
  const url = buildUrl('/api/v2.0/indexers/all/results/torznab/api', { t: 'indexers', configured: 'true' })
  const res = await jackettFetch(url)
  const doc = indexerListParser.parse(await res.text()) as RawIndexerList

  if (doc.error) {
    const code = doc.error['@code']
    const description = doc.error['@description'] ?? 'unknown Torznab error'
    if (code === '100') throw new JackettError('UNAUTHORIZED', 'Jackett rejected the API key')
    throw new JackettError('UPSTREAM', `Jackett Torznab error ${code ?? '?'}: ${description}`)
  }

  return (doc.indexers?.indexer ?? []).map((raw) => ({
    id: raw['@id'] ?? '',
    name: raw.title ?? raw['@id'] ?? '',
    description: raw.description ?? '',
    link: raw.link ?? '',
    language: raw.language ?? '',
    type: raw.type ?? '',
    categories: (raw.caps?.categories?.category ?? [])
      .map((c) => ({ id: Number(c['@id']), name: c['@name'] ?? '' }))
      .filter((c) => Number.isFinite(c.id) && c.id < 100_000),
  }))
}
