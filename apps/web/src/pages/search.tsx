import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'

import { LogoPagination } from '@/components/search/logo-pagination'
import { NoSearchResults } from '@/components/search/no-search-results'
import { SearchBar } from '@/components/search/search-bar'
import { CategoryMenu, IndexerMenu, SortMenu } from '@/components/search/search-filters'
import SearchResultCard, { SearchResultCardSkeleton } from '@/components/search/search-result-card'
import { SearchStatus } from '@/components/search/search-status'
import { Page } from '@/components/shared/page'
import {
  friendlyErrorMessage,
  getIndexers,
  isSortOption,
  PAGE_SIZE,
  searchTorrents,
  type Category,
  type IndexerInfo,
  type SearchResponse,
  type SortOption,
} from '@/lib/api'

const EMPTY: SearchResponse = {
  page: 1,
  page_size: PAGE_SIZE,
  total_results: 0,
  results: [],
  meta: { mode: 'jackett', cached: false, took_ms: 0, indexers: [] },
}

type RequestState = { key: string; data: SearchResponse; error: string | null }

type IndexerCatalog = { indexers: IndexerInfo[]; categories: Category[]; loading: boolean }

function parseCategory(raw: string | null): number | null {
  if (!raw) return null
  const n = Number(raw.split(',')[0])
  return Number.isInteger(n) && n > 0 ? n : null
}

function parseIndexers(raw: string | null): string[] {
  return raw ? raw.split(',').filter(Boolean) : []
}

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const sortParam = searchParams.get('sort')
  const sort: SortOption = isSortOption(sortParam) ? sortParam : 'relevance'
  const category = parseCategory(searchParams.get('cat'))
  const indexers = parseIndexers(searchParams.get('indexers'))
  const indexersKey = indexers.join(',')

  const requestKey = [query, page, sort, category ?? '', indexersKey].join('\u0000')

  const [request, setRequest] = useState<RequestState>({ key: '', data: EMPTY, error: null })
  const [catalog, setCatalog] = useState<IndexerCatalog>({ indexers: [], categories: [], loading: true })

  useEffect(() => {
    let cancelled = false
    getIndexers()
      .then((res) => {
        if (!cancelled) setCatalog({ indexers: res.indexers, categories: res.categories, loading: false })
      })
      .catch(() => {
        if (!cancelled) setCatalog((c) => ({ ...c, loading: false }))
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    document.title = query ? `${query} - torseek Search` : 'Search - torseek'
    if (!query) return

    let cancelled = false
    searchTorrents({
      query,
      page,
      sort,
      categories: category === null ? [] : [category],
      indexers: indexersKey ? indexersKey.split(',') : [],
    })
      .then((data) => {
        if (!cancelled) setRequest({ key: requestKey, data, error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled) setRequest({ key: requestKey, data: EMPTY, error: friendlyErrorMessage(err) })
      })

    return () => {
      cancelled = true
    }
  }, [query, page, sort, category, indexersKey, requestKey])

  // A request is in flight whenever the settled state doesn't match the URL yet.
  const loading = Boolean(query) && request.key !== requestKey
  const data = query && request.key === requestKey ? request.data : EMPTY
  const error = request.key === requestKey ? request.error : null

  const totalPages = Math.max(1, Math.ceil(data.total_results / PAGE_SIZE))
  const firstIndex = data.total_results === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const lastIndex = Math.min(page * PAGE_SIZE, data.total_results)

  /** Rewrite the URL; any change other than the page number resets to page 1. */
  const updateParams = (patch: { page?: number; sort?: SortOption; cat?: number | null; indexers?: string[] }) => {
    const next = new URLSearchParams(searchParams)
    if (patch.sort !== undefined) {
      if (patch.sort === 'relevance') next.delete('sort')
      else next.set('sort', patch.sort)
    }
    if (patch.cat !== undefined) {
      if (patch.cat === null) next.delete('cat')
      else next.set('cat', String(patch.cat))
    }
    if (patch.indexers !== undefined) {
      if (patch.indexers.length === 0) next.delete('indexers')
      else next.set('indexers', patch.indexers.join(','))
    }
    if (patch.page !== undefined && patch.page > 1) next.set('page', String(patch.page))
    else next.delete('page')
    setSearchParams(next)
  }

  const pageHref = (p: number) => {
    const next = new URLSearchParams(searchParams)
    if (p > 1) next.set('page', String(p))
    else next.delete('page')
    return `?${next.toString()}`
  }

  const okIndexers = data.meta.indexers.filter((i) => i.status === 'ok').length

  return (
    <Page>
      <div className="w-full max-w-3xl">
        <SearchBar key={query} initialValue={query} className="mt-2" />

        <div className="mt-6 border-b pb-2">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
              {loading ? (
                'Searching…'
              ) : data.total_results > 0 ? (
                <>
                  <span className="font-medium text-foreground">{data.total_results.toLocaleString()}</span> results
                  {query && (
                    <>
                      {' '}
                      for <span className="text-foreground">“{query}”</span>
                    </>
                  )}
                  <span className="hidden sm:inline">
                    {okIndexers > 0 && (
                      <>
                        {' '}
                        from {okIndexers} {okIndexers === 1 ? 'indexer' : 'indexers'}
                      </>
                    )}
                    {' '}
                    · showing {firstIndex}–{lastIndex}
                  </span>
                </>
              ) : (
                query &&
                !error && (
                  <>
                    No results for <span className="text-foreground">“{query}”</span>
                  </>
                )
              )}
            </p>

            <div className="flex shrink-0 items-center gap-0.5">
              <CategoryMenu categories={catalog.categories} value={category} onChange={(cat) => updateParams({ cat })} />
              <IndexerMenu
                indexers={catalog.indexers}
                value={indexers}
                loading={catalog.loading}
                onChange={(ids) => updateParams({ indexers: ids })}
              />
              <SortMenu value={sort} onChange={(s) => updateParams({ sort: s })} />
            </div>
          </div>

          {!loading && data.meta && <SearchStatus meta={data.meta} />}
        </div>

        {loading ? (
          <ul className="mt-4 flex flex-col gap-3">
            {Array.from({ length: 4 }, (_, i) => (
              <SearchResultCardSkeleton key={i} />
            ))}
          </ul>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
            <p className="text-sm font-medium text-destructive">{error}</p>
            <p className="text-xs text-muted-foreground">Your query and filters are kept; retry once the backend is back.</p>
          </div>
        ) : data.results.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-3">
            {data.results.map((result) => (
              <SearchResultCard key={result.guid || `${result.jackettindexer.id}:${result.title}`} {...result} />
            ))}
          </ul>
        ) : (
          <NoSearchResults searchQuery={query} />
        )}

        {!loading && !error && totalPages > 1 && (
          <LogoPagination
            className="mt-10 mb-4"
            page={page}
            totalPages={totalPages}
            hrefFor={pageHref}
            onNavigate={() => window.scrollTo({ top: 0 })}
          />
        )}
      </div>
    </Page>
  )
}
