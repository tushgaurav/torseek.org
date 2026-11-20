import type { TorrentItem } from './torznab.ts'

export type Category = { id: number; name: string }

export type CategoryFacet = Category & { count: number }

/**
 * Top-level newznab/torznab categories. Every indexer maps its own categories
 * onto these, so they are the only ones that make sense for an aggregate search.
 * Indexer-specific ids (>= 100000) are deliberately excluded.
 *
 * Listed in the order the search tabs show them; names are user-facing
 * (newznab's own are Console / Audio / PC / XXX).
 */
export const TOP_LEVEL_CATEGORIES: readonly Category[] = [
  { id: 2000, name: 'Movies' },
  { id: 5000, name: 'TV' },
  { id: 3000, name: 'Music' },
  { id: 1000, name: 'Games' },
  { id: 4000, name: 'Software' },
  { id: 7000, name: 'Books' },
  { id: 8000, name: 'Other' },
  { id: 6000, name: 'Adult' },
]

const TOP_LEVEL_IDS = new Set(TOP_LEVEL_CATEGORIES.map((c) => c.id))

export function isTopLevelCategory(id: number): boolean {
  return TOP_LEVEL_IDS.has(id)
}

/** 2045 -> 2000. Indexer-specific ids (>= 100000) have no top-level parent. */
export function topLevelOf(id: number): number | null {
  if (!Number.isFinite(id) || id >= 100_000 || id < 1000) return null
  return Math.floor(id / 1000) * 1000
}

/** Distinct top-level categories an item belongs to (usually one). */
function topLevelsOf(item: TorrentItem): Set<number> {
  const tops = new Set<number>()
  for (const c of item.category) {
    const top = topLevelOf(Number(c))
    if (top !== null && TOP_LEVEL_IDS.has(top)) tops.add(top)
  }
  return tops
}

/** Items in any of the given top-level categories; an empty list means no filter. */
export function filterByCategory(items: TorrentItem[], categories: number[]): TorrentItem[] {
  if (categories.length === 0) return items
  return items.filter((item) => {
    const tops = topLevelsOf(item)
    return categories.some((c) => tops.has(c))
  })
}

/**
 * Result count per top-level category over the unfiltered set, in tab order.
 * An item tagged with two top-level categories counts towards both.
 */
export function categoryFacets(items: TorrentItem[]): CategoryFacet[] {
  const counts = new Map<number, number>()
  for (const item of items) {
    for (const top of topLevelsOf(item)) counts.set(top, (counts.get(top) ?? 0) + 1)
  }
  return TOP_LEVEL_CATEGORIES.map((c) => ({ ...c, count: counts.get(c.id) ?? 0 }))
}
