import { ChevronDown } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'

import { NoSearchResults } from '@/components/search/no-search-results'
import { SearchBar } from '@/components/search/search-bar'
import SearchResultCard, { SearchResultCardSkeleton } from '@/components/search/search-result-card'
import { Page } from '@/components/shared/page'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { PAGE_SIZE, searchTorrents, type SearchResponse, type SearchResult } from '@/lib/api'

type SortBy =
  | 'none'
  | 'seeders_asc'
  | 'seeders_desc'
  | 'peers_asc'
  | 'peers_desc'
  | 'date_uploaded_asc'
  | 'date_uploaded_desc'
  | 'size_asc'
  | 'size_desc'

const SORT_LABELS: Record<Exclude<SortBy, 'none'>, string> = {
  size_asc: 'Size Ascending',
  size_desc: 'Size Descending',
  seeders_asc: 'Seeders Ascending',
  seeders_desc: 'Seeders Descending',
  peers_asc: 'Peers Ascending',
  peers_desc: 'Peers Descending',
  date_uploaded_asc: 'Date Uploaded Ascending',
  date_uploaded_desc: 'Date Uploaded Descending',
}

const SORT_OPTIONS: { value: Exclude<SortBy, 'none'>; label: string }[] = [
  { value: 'size_asc', label: 'Size (Asc)' },
  { value: 'size_desc', label: 'Size (Desc)' },
  { value: 'seeders_asc', label: 'Seeders (Asc)' },
  { value: 'seeders_desc', label: 'Seeders (Desc)' },
  { value: 'peers_asc', label: 'Peers (Asc)' },
  { value: 'peers_desc', label: 'Peers (Desc)' },
  { value: 'date_uploaded_asc', label: 'Date Uploaded (Asc)' },
  { value: 'date_uploaded_desc', label: 'Date Uploaded (Desc)' },
]

function sortResults(results: SearchResult[], sortBy: SortBy): SearchResult[] {
  if (sortBy === 'none') return results
  const [field, dir] = sortBy.split(/_(?=asc$|desc$)/) as [string, 'asc' | 'desc']
  const sign = dir === 'asc' ? 1 : -1
  const key = (r: SearchResult): number => {
    switch (field) {
      case 'seeders':
        return Number(r.seeders)
      case 'peers':
        return Number(r.peers)
      case 'size':
        return Number(r.size)
      case 'date_uploaded':
        return new Date(r.pubDate).getTime()
      default:
        return 0
    }
  }
  return [...results].sort((a, b) => sign * (key(a) - key(b)))
}

const EMPTY: SearchResponse = { page: 1, page_size: PAGE_SIZE, total_results: 0, results: [] }

type RequestState = { key: string; data: SearchResponse; error: string | null }

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const requestKey = `${query}\u0000${page}`

  const [request, setRequest] = useState<RequestState>({ key: '', data: EMPTY, error: null })
  const [sortBy, setSortBy] = useState<SortBy>('none')

  useEffect(() => {
    document.title = query ? `${query} - torseek Search` : 'Search - torseek'
    if (!query) return

    let cancelled = false
    searchTorrents(query, page)
      .then((data) => {
        if (!cancelled) setRequest({ key: requestKey, data, error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setRequest({
            key: requestKey,
            data: EMPTY,
            error: err instanceof Error ? err.message : 'Search failed',
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [query, page, requestKey])

  // A request is in flight whenever the settled state doesn't match the URL yet.
  const loading = Boolean(query) && request.key !== requestKey
  const data = query && request.key === requestKey ? request.data : EMPTY
  const error = request.key === requestKey ? request.error : null

  const results = useMemo(() => sortResults(data.results, sortBy), [data.results, sortBy])

  const totalPages = Math.max(1, Math.ceil(data.total_results / PAGE_SIZE))
  const firstIndex = data.total_results === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const lastIndex = Math.min(page * PAGE_SIZE, data.total_results)

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return
    setSearchParams({ q: query, page: String(p) })
    window.scrollTo({ top: 0 })
  }

  return (
    <Page>
      <div className="flex items-center justify-between gap-2 w-full">
        <SearchBar key={query} initialValue={query} className="mt-4" />
      </div>

      <div className="mt-4 flex justify-end items-center gap-4">
        {sortBy !== 'none' && (
          <Badge className="p-2" variant="secondary">
            {SORT_LABELS[sortBy]}
          </Badge>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Sort by <ChevronDown className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {SORT_OPTIONS.map((opt) => (
              <DropdownMenuItem key={opt.value} onClick={() => setSortBy(opt.value)}>
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col gap-8 mt-4">
        {loading ? (
          <div className="flex flex-col gap-10">
            <SearchResultCardSkeleton />
            <SearchResultCardSkeleton />
            <SearchResultCardSkeleton />
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {results.map((result) => (
              <SearchResultCard key={result.guid} {...result} />
            ))}
            {results.length === 0 && <NoSearchResults searchQuery={query} />}
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {!loading && data.total_results > 0 && (
          <div className="flex justify-between max-w-xl mt-10 mb-8">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}. Showing {firstIndex}-{lastIndex} of {data.total_results} results
            </p>
          </div>
        )}

        {!loading && totalPages > 1 && (
          <Pagination className="max-w-xl m-0 justify-start">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  className="text-xs text-muted-foreground cursor-pointer"
                  aria-disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                />
              </PaginationItem>
              {pageWindow(page, totalPages).map((p, i) =>
                p === 'ellipsis' ? (
                  <PaginationItem key={`e-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink isActive={p === page} className="cursor-pointer" onClick={() => goToPage(p)}>
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}
              <PaginationItem>
                <PaginationNext
                  className="text-xs cursor-pointer"
                  aria-disabled={page >= totalPages}
                  onClick={() => goToPage(page + 1)}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </Page>
  )
}

/** Current page plus two after it, then an ellipsis and the last page when far away. */
function pageWindow(page: number, total: number): (number | 'ellipsis')[] {
  const pages: (number | 'ellipsis')[] = []
  for (let p = page; p <= Math.min(page + 2, total); p++) pages.push(p)
  const last = pages[pages.length - 1]
  if (typeof last === 'number' && last < total) {
    if (last < total - 1) pages.push('ellipsis')
    pages.push(total)
  }
  return pages
}
