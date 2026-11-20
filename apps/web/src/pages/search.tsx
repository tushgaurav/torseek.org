import { Fragment, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'

import { CategoryTabs } from '@/components/search/category-tabs'
import { LogoPagination } from '@/components/search/logo-pagination'
import { NoSearchResults } from '@/components/search/no-search-results'
import { SearchBar } from '@/components/search/search-bar'
import { IndexerMenu, SortMenu } from '@/components/search/search-filters'
import SearchResultCard, { SearchResultCardSkeleton } from '@/components/search/search-result-card'
import { SearchSummary } from '@/components/search/search-status'
import { TitlePanel } from '@/components/search/title-panel'
import { Page } from '@/components/shared/page'
import {
  friendlyErrorMessage,
  getIndexers,
  getTitlePanel,
  isSortOption,
  PAGE_SIZE,
  searchTorrents,
  type Category,
  type IndexerInfo,
  type SearchResponse,
  type SortOption,
  type TitlePanel as TitlePanelData,
} from '@/lib/api'
import { useReportSearching } from '@/lib/search-activity'
import { cn } from '@/lib/utils'

const EMPTY: SearchResponse = {
  page: 1,
  page_size: PAGE_SIZE,
  total_results: 0,
  results: [],
  facets: { total: 0, categories: [] },
  meta: { mode: 'jackett', cached: false, took_ms: 0, indexers: [] },
}

/**
 * `key` identifies the exact request; `baseKey` identifies the underlying
 * result set (query + indexers) that the server caches and re-filters.
 */
type RequestState = {
  key: string
  baseKey: string
  data: SearchResponse
  error: string | null
  /** How long the underlying search took upstream; null if it was only ever served from cache. */
  tookMs: number | null
}

type IndexerCatalog = { indexers: IndexerInfo[]; categories: Category[]; loading: boolean }

/** The title panel belongs to a result set, not to a tab/sort/page view of it. */
type PanelState = { baseKey: string; panel: TitlePanelData | null }

const MOVIES = 2000
const TV = 5000
/** On narrow screens the panel sits inside the list, after this many results. */
const INLINE_PANEL_AFTER = 3

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

  const baseKey = [query, indexersKey].join('\u0000')
  const requestKey = [baseKey, page, sort, category ?? ''].join('\u0000')

  const [request, setRequest] = useState<RequestState>({
    key: '',
    baseKey: '',
    data: EMPTY,
    error: null,
    tookMs: null,
  })
  const [catalog, setCatalog] = useState<IndexerCatalog>({ indexers: [], categories: [], loading: true })
  const [titlePanel, setTitlePanel] = useState<PanelState>({ baseKey: '', panel: null })
  const [dismissedPanel, setDismissedPanel] = useState<string | null>(null)

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
        if (cancelled) return
        setRequest((prev) => ({
          key: requestKey,
          baseKey,
          data,
          error: null,
          // Tab, sort and page changes are served from the server's cache; keep
          // the time the search itself took instead of dropping it.
          tookMs: !data.meta.cached ? data.meta.took_ms : prev.baseKey === baseKey ? prev.tookMs : null,
        }))
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setRequest({ key: requestKey, baseKey, data: EMPTY, error: friendlyErrorMessage(err), tookMs: null })
        }
      })

    return () => {
      cancelled = true
    }
  }, [query, page, sort, category, indexersKey, requestKey, baseKey])

  // Fired alongside the search; the API joins the same in-flight Jackett request.
  // Not refetched on tab/sort/page changes since the result set is the same.
  useEffect(() => {
    if (!query) return
    let cancelled = false
    getTitlePanel({ query, indexers: indexersKey ? indexersKey.split(',') : [] })
      .then((res) => {
        if (!cancelled) setTitlePanel({ baseKey, panel: res.panel })
      })
      .catch(() => {
        if (!cancelled) setTitlePanel({ baseKey, panel: null })
      })
    return () => {
      cancelled = true
    }
  }, [query, indexersKey, baseKey])

  // A request is in flight whenever the settled state doesn't match the URL yet.
  const settled = request.key === requestKey
  const loading = Boolean(query) && !settled
  // Tab, sort and page changes re-filter the server's cached result set and come
  // back almost instantly, so keep the previous results up (dimmed) rather than
  // flashing skeletons. Only a new query or indexer selection shows skeletons.
  const stale = loading && request.baseKey === baseKey && !request.error
  const data = query && (settled || stale) ? request.data : EMPTY
  const error = settled ? request.error : null
  const facets = data === EMPTY ? null : data.facets
  const showingResults = (!loading || stale) && !error && data.results.length > 0

  // Drives the sweep along the nav's bottom border. Only the search itself
  // counts; the title panel loads on its own and shouldn't hold the bar open.
  useReportSearching(loading)

  // Shown on All and on the tab matching its kind (a movie panel on the TV tab would be wrong).
  const panelTab = titlePanel.panel?.kind === 'tv' ? TV : MOVIES
  const panel =
    showingResults &&
    titlePanel.baseKey === baseKey &&
    dismissedPanel !== baseKey &&
    (category === null || category === panelTab)
      ? titlePanel.panel
      : null
  const inlinePanelAt = page === 1 ? Math.min(INLINE_PANEL_AFTER, data.results.length) - 1 : -1

  const totalPages = Math.max(1, Math.ceil(data.total_results / PAGE_SIZE))

  /** Rewrite the URL; any change other than the page number resets to page 1. */
  const updateParams = (patch: { page?: number; sort?: SortOption; indexers?: string[] }) => {
    const next = new URLSearchParams(searchParams)
    if (patch.sort !== undefined) {
      if (patch.sort === 'relevance') next.delete('sort')
      else next.set('sort', patch.sort)
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

  const categoryHref = (cat: number | null) => {
    const next = new URLSearchParams(searchParams)
    if (cat === null) next.delete('cat')
    else next.set('cat', String(cat))
    next.delete('page')
    return `?${next.toString()}`
  }

  return (
    <Page>
      {/* The header and the results share one 48rem column, so the search bar, tabs,
          toolbar and cards line up on both edges. The title panel only gets its own
          column from xl, where both fit at full width; below that it sits inline in
          the list, so the results never shrink to make room for it. */}
      <div className="max-w-3xl xl:grid xl:max-w-none xl:grid-cols-[minmax(0,48rem)_22rem] xl:items-start xl:gap-x-12">
        <div className="min-w-0">
          <SearchBar key={query} initialValue={query} className="mt-2 max-w-none" />

          <CategoryTabs
            className="mt-5"
            facets={facets}
            categories={catalog.categories}
            value={category}
            hrefFor={categoryHref}
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <SearchSummary
              searching={loading && !stale}
              total={Boolean(query) && !error && (settled || stale) ? data.total_results : null}
              meta={data.meta}
              tookMs={request.tookMs}
            />

            <div className="flex shrink-0 items-center gap-2 sm:ml-auto">
              <SortMenu value={sort} onChange={(s) => updateParams({ sort: s })} />
              <IndexerMenu
                indexers={catalog.indexers}
                value={indexers}
                loading={catalog.loading}
                onChange={(ids) => updateParams({ indexers: ids })}
              />
            </div>
          </div>
        </div>

        <div className="min-w-0 xl:col-start-1">
          {loading && !stale ? (
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
            <ul
              aria-busy={stale}
              className={cn('mt-4 flex flex-col gap-3 transition-opacity duration-150', stale && 'opacity-60')}
            >
              {data.results.map((result, i) => (
                <Fragment key={result.guid || `${result.jackettindexer.id}:${result.title}`}>
                  <SearchResultCard {...result} />
                  {panel && i === inlinePanelAt && (
                    <li className="xl:hidden">
                      <TitlePanel panel={panel} variant="inline" onDismiss={() => setDismissedPanel(baseKey)} />
                    </li>
                  )}
                </Fragment>
              ))}
            </ul>
          ) : (
            <NoSearchResults searchQuery={query} />
          )}

          {showingResults && (
            <div className="mt-10 mb-4 flex flex-col items-center gap-8">
              <LogoPagination
                page={page}
                totalPages={totalPages}
                hrefFor={pageHref}
                onNavigate={() => window.scrollTo({ top: 0 })}
              />
              <p className="text-sm text-muted-foreground">Results are not personalised</p>
            </div>
          )}
        </div>

        {panel && (
          <aside className="mt-4 hidden xl:col-start-2 xl:row-start-2 xl:block">
            <TitlePanel panel={panel} variant="side" onDismiss={() => setDismissedPanel(baseKey)} />
          </aside>
        )}
      </div>
    </Page>
  )
}
