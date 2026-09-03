export type Category = { id: number; name: string }

/**
 * Top-level newznab/torznab categories. Every indexer maps its own categories
 * onto these, so they are the only ones that make sense for an aggregate search.
 * Indexer-specific ids (>= 100000) are deliberately excluded.
 */
export const TOP_LEVEL_CATEGORIES: readonly Category[] = [
  { id: 1000, name: 'Console' },
  { id: 2000, name: 'Movies' },
  { id: 3000, name: 'Audio' },
  { id: 4000, name: 'PC' },
  { id: 5000, name: 'TV' },
  { id: 6000, name: 'XXX' },
  { id: 7000, name: 'Books' },
  { id: 8000, name: 'Other' },
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
