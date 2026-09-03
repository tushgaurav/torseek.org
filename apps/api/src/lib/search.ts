import { env, jackettEnabled } from '../env.ts'
import { MemoryCache } from './cache.ts'
import { listFixtureIndexers, searchFixture } from './fixture.ts'
import { listIndexers, searchJackett, type IndexerInfo, type SearchOutcome, type SearchParams } from './jackett.ts'

export type SearchMode = 'jackett' | 'fixture'

export const searchMode: SearchMode = jackettEnabled ? 'jackett' : 'fixture'

const resultCache = new MemoryCache<SearchOutcome>({ ttlMs: env.SEARCH_CACHE_TTL_MS, maxEntries: 200 })
const indexerCache = new MemoryCache<IndexerInfo[]>({ ttlMs: 10 * 60_000, maxEntries: 1 })

export function normalizeParams(params: SearchParams): Required<SearchParams> {
  return {
    query: params.query.trim().replace(/\s+/g, ' '),
    categories: [...new Set(params.categories ?? [])].sort((a, b) => a - b),
    indexers: [...new Set(params.indexers ?? [])].sort(),
  }
}

function cacheKey({ query, categories, indexers }: Required<SearchParams>): string {
  return JSON.stringify([query.toLowerCase(), categories, indexers])
}

/**
 * Full (unpaged) result set for a query, served from the in-process cache when
 * possible so paging and re-sorting never hit Jackett.
 */
export async function runSearch(params: SearchParams): Promise<{ outcome: SearchOutcome; cached: boolean }> {
  const normalized = normalizeParams(params)
  const load = () => (searchMode === 'jackett' ? searchJackett(normalized) : searchFixture(normalized))
  const { value, cached } = await resultCache.getOrLoad(cacheKey(normalized), load)
  return { outcome: value, cached }
}

export async function getIndexers(): Promise<{ indexers: IndexerInfo[]; cached: boolean }> {
  const load = () => (searchMode === 'jackett' ? listIndexers() : listFixtureIndexers())
  const { value, cached } = await indexerCache.getOrLoad('indexers', load)
  return { indexers: value, cached }
}
