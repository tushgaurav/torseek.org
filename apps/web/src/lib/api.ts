import posthog from 'posthog-js'

export type SearchResult = {
  title: string
  guid: string
  pubDate: string
  size: string
  files: string | null
  description: string
  /** Magnet URI, or empty string when the indexer only offers a .torrent download. */
  magnetLink: string
  category: string[]
  comments: string | null
  type: string | null
  jackettindexer: { id: string; name: string }
  seeders: number
  peers: number
  attrs: Record<string, string | string[]> & { infohash?: string }
}

export type IndexerOutcome = {
  id: string
  name: string
  status: 'ok' | 'error' | 'unknown'
  results: number
  error?: string
}

export type SearchMeta = {
  mode: 'jackett' | 'fixture'
  cached: boolean
  took_ms: number
  indexers: IndexerOutcome[]
}

export type SearchResponse = {
  page: number
  page_size: number
  total_results: number
  results: SearchResult[]
  meta: SearchMeta
}

export const SORT_OPTIONS = [
  'relevance',
  'seeders_desc',
  'seeders_asc',
  'peers_desc',
  'peers_asc',
  'size_desc',
  'size_asc',
  'date_desc',
  'date_asc',
] as const

export type SortOption = (typeof SORT_OPTIONS)[number]

export function isSortOption(value: string | null): value is SortOption {
  return value !== null && (SORT_OPTIONS as readonly string[]).includes(value)
}

export type SearchRequest = {
  query: string
  page?: number
  sort?: SortOption
  categories?: number[]
  indexers?: string[]
}

export type Category = { id: number; name: string }

export type IndexerInfo = {
  id: string
  name: string
  description: string
  link: string
  language: string
  type: string
  categories: Category[]
}

export type IndexersResponse = {
  mode: 'jackett' | 'fixture'
  cached: boolean
  indexers: IndexerInfo[]
  categories: Category[]
}

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'JACKETT_UNREACHABLE'
  | 'JACKETT_TIMEOUT'
  | 'JACKETT_UNAUTHORIZED'
  | 'JACKETT_ERROR'
  | 'INTERNAL'
  | 'NETWORK'

export class ApiError extends Error {
  readonly code: ApiErrorCode
  readonly status: number

  constructor(code: ApiErrorCode, message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

const FRIENDLY_MESSAGES: Record<ApiErrorCode, string> = {
  BAD_REQUEST: 'That search request was invalid.',
  JACKETT_UNREACHABLE: 'The search backend (Jackett) is unreachable right now.',
  JACKETT_TIMEOUT: 'The indexers took too long to respond. Try again in a moment.',
  JACKETT_UNAUTHORIZED: 'The server is misconfigured: Jackett rejected its API key.',
  JACKETT_ERROR: 'The search backend returned an unexpected response.',
  INTERNAL: 'Something went wrong on the server.',
  NETWORK: 'Could not reach the server. Check your connection.',
}

export function friendlyErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return FRIENDLY_MESSAGES[err.code]
  return err instanceof Error ? err.message : 'Search failed'
}

function analyticsHeaders(): HeadersInit {
  try {
    const distinctId = posthog.get_distinct_id()
    const sessionId = posthog.get_session_id()
    const headers: Record<string, string> = {}
    if (distinctId) headers['X-POSTHOG-DISTINCT-ID'] = distinctId
    if (sessionId) headers['X-POSTHOG-SESSION-ID'] = sessionId
    return headers
  } catch {
    return {}
  }
}

// Origin the API is served from, e.g. https://api.torseek.org in production.
// Vite inlines it at build time. Empty in development so requests stay
// same-origin and reach the Express server through the Vite proxy
// (see vite.config.ts).
const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

async function request<T>(path: string): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { headers: analyticsHeaders() })
  } catch (err) {
    throw new ApiError('NETWORK', err instanceof Error ? err.message : 'Network error', 0)
  }
  if (!res.ok) {
    let code: ApiErrorCode = 'INTERNAL'
    let message = `Request failed with status ${res.status}`
    try {
      const body = (await res.json()) as { error?: string; code?: string }
      if (body.code && body.code in FRIENDLY_MESSAGES) code = body.code as ApiErrorCode
      if (body.error) message = body.error
    } catch {
      // non-JSON error body; keep defaults
    }
    throw new ApiError(code, message, res.status)
  }
  return res.json() as Promise<T>
}

export const PAGE_SIZE = 15

export function searchTorrents({ query, page = 1, sort, categories, indexers }: SearchRequest): Promise<SearchResponse> {
  const params = new URLSearchParams({ q: query, page: String(page) })
  if (sort && sort !== 'relevance') params.set('sort', sort)
  if (categories && categories.length > 0) params.set('cat', categories.join(','))
  if (indexers && indexers.length > 0) params.set('indexers', indexers.join(','))
  return request<SearchResponse>(`/api/search?${params}`)
}

export function getIndexers(): Promise<IndexersResponse> {
  return request<IndexersResponse>('/api/indexers')
}
