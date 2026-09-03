import type { TorrentItem } from './torznab.ts'

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

export function isSortOption(value: string): value is SortOption {
  return (SORT_OPTIONS as readonly string[]).includes(value)
}

function sortKey(field: string): (item: TorrentItem) => number {
  switch (field) {
    case 'seeders':
      return (i) => i.seeders
    case 'peers':
      return (i) => i.peers
    case 'size':
      return (i) => Number(i.size) || 0
    case 'date':
      return (i) => {
        const t = Date.parse(i.pubDate)
        return Number.isNaN(t) ? 0 : t
      }
    default:
      return () => 0
  }
}

/** Stable sort; 'relevance' preserves the order Jackett returned. */
export function sortItems(items: TorrentItem[], sort: SortOption): TorrentItem[] {
  if (sort === 'relevance') return items
  const [field, dir] = sort.split('_') as [string, 'asc' | 'desc']
  const sign = dir === 'asc' ? 1 : -1
  const key = sortKey(field)
  return items
    .map((item, index) => ({ item, index, k: key(item) }))
    .sort((a, b) => sign * (a.k - b.k) || a.index - b.index)
    .map((x) => x.item)
}
