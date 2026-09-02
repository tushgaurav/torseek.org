export type SearchResult = {
  title: string
  guid: string
  pubDate: string
  size: string
  files: string | null
  description: string
  magnetLink: string
  category: string[]
  comments: string | null
  type: string | null
  jackettindexer: { id: string; name: string }
  seeders: number
  peers: number
  attrs: Record<string, string | string[]> & { infohash?: string }
}

export type SearchResponse = {
  page: number
  page_size: number
  total_results: number
  results: SearchResult[]
}

export const PAGE_SIZE = 15

export async function searchTorrents(query: string, page = 1): Promise<SearchResponse> {
  const params = new URLSearchParams({ q: query, page: String(page) })
  const res = await fetch(`/api/search?${params}`)
  if (!res.ok) {
    throw new Error(`Search failed with status ${res.status}`)
  }
  return res.json()
}
