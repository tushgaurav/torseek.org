export const MAX_QUERY_LENGTH = 200

export function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function csv(value: unknown): string[] {
  return str(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export type ParsedBase = { ok: true; q: string; indexers: string[] } | { ok: false; error: string }

/** `q` and `indexers`, shared by every endpoint that runs (or reuses) a search. */
export function parseBaseQuery(query: Record<string, unknown>): ParsedBase {
  const q = str(query.q)
  if (!q) return { ok: false, error: 'Missing required query parameter "q"' }
  if (q.length > MAX_QUERY_LENGTH) return { ok: false, error: `"q" must be at most ${MAX_QUERY_LENGTH} characters` }

  const indexers = csv(query.indexers)
  if (indexers.some((id) => !/^[a-z0-9_-]+$/i.test(id))) {
    return { ok: false, error: '"indexers" must be a comma-separated list of indexer ids' }
  }

  return { ok: true, q, indexers }
}
