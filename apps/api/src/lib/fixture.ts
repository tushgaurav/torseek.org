import { topLevelOf } from './categories.ts'
import type { IndexerInfo, IndexerOutcome, SearchOutcome, SearchParams } from './jackett.ts'
import { normalizeItem, type RawItem, type TorrentItem } from './torznab.ts'

let loaded: Promise<TorrentItem[]> | null = null

/**
 * Dev fallback when Jackett isn't configured: a captured torznab response so
 * the frontend has realistic data to render. Parsed once per process.
 */
function loadFixture(): Promise<TorrentItem[]> {
  loaded ??= Bun.file(new URL('../../fixtures/sample-results.json', import.meta.url))
    .json()
    .then((raw: RawItem[]) => raw.map(normalizeItem))
  return loaded
}

function matchesCategory(item: TorrentItem, categories: number[]): boolean {
  if (categories.length === 0) return true
  return item.category.some((c) => {
    const top = topLevelOf(Number(c))
    return top !== null && categories.includes(top)
  })
}

export async function searchFixture({ query, categories = [], indexers = [] }: SearchParams): Promise<SearchOutcome> {
  const all = await loadFixture()

  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  const byTitle = all.filter((item) => words.some((w) => item.title.toLowerCase().includes(w)))
  const scoped = (byTitle.length > 0 ? byTitle : all).filter(
    (item) =>
      matchesCategory(item, categories) && (indexers.length === 0 || indexers.includes(item.jackettindexer.id)),
  )

  const counts = new Map<string, IndexerOutcome>()
  for (const item of all) {
    const { id, name } = item.jackettindexer
    if (indexers.length > 0 && !indexers.includes(id)) continue
    const outcome = counts.get(id) ?? { id, name, status: 'ok', results: 0 }
    counts.set(id, outcome)
  }
  for (const item of scoped) {
    const outcome = counts.get(item.jackettindexer.id)
    if (outcome) outcome.results += 1
  }

  return { items: scoped, indexers: [...counts.values()] }
}

export async function listFixtureIndexers(): Promise<IndexerInfo[]> {
  const all = await loadFixture()
  const seen = new Map<string, IndexerInfo>()
  for (const item of all) {
    const { id, name } = item.jackettindexer
    if (!id || seen.has(id)) continue
    seen.set(id, {
      id,
      name,
      description: `${name} (fixture)`,
      link: '',
      language: 'en-US',
      type: item.type ?? 'public',
      categories: [],
    })
  }
  return [...seen.values()]
}
