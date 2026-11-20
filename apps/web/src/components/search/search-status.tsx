import { AlertTriangle, FlaskConical } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { SearchMeta } from '@/lib/api'
import { formatDuration } from '@/lib/format'

type SearchSummaryProps = {
  searching: boolean
  /** Results for the current view, or null when there is nothing to summarise yet. */
  total: number | null
  meta: SearchMeta
  /** How long the search took upstream; null when it was served from cache. */
  tookMs: number | null
}

/** Each item after the first gets a leading "·" that hides along with it. */
const item = "before:mr-2 before:content-['·']"

/**
 * One line above the results: "150 results · 2 indexers · 1.2s", followed by
 * any upstream notices (sample data, failed indexers) with details on hover.
 */
export function SearchSummary({ searching, total, meta, tookMs }: SearchSummaryProps) {
  if (searching) return <p className="text-xs text-muted-foreground">Searching…</p>
  if (total === null) return null

  const ok = meta.indexers.filter((i) => i.status === 'ok').length
  const failed = meta.indexers.filter((i) => i.status !== 'ok')

  return (
    <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
      <span>
        {total > 0 ? (
          <>
            <span className="font-medium tabular-nums text-foreground">{total.toLocaleString()}</span>{' '}
            {total === 1 ? 'result' : 'results'}
          </>
        ) : (
          'No results'
        )}
      </span>
      {ok > 0 && (
        <span className={`hidden sm:inline ${item}`}>
          {ok} {ok === 1 ? 'indexer' : 'indexers'}
        </span>
      )}
      {tookMs !== null && <span className={`hidden tabular-nums sm:inline ${item}`}>{formatDuration(tookMs)}</span>}

      {meta.mode === 'fixture' && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0} className="ml-1 inline-flex cursor-help items-center gap-1 outline-none focus-visible:underline">
              <FlaskConical className="size-3.5" />
              Sample data
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            Jackett isn’t configured on the server, so these are captured results.
          </TooltipContent>
        </Tooltip>
      )}
      {failed.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              tabIndex={0}
              className="ml-1 inline-flex cursor-help items-center gap-1 text-amber-600 outline-none focus-visible:underline dark:text-amber-400"
            >
              <AlertTriangle className="size-3.5" />
              {failed.length} failed
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-medium">
              {failed.length} of {meta.indexers.length} indexers failed
            </p>
            <ul className="mt-1 space-y-1">
              {failed.map((i) => (
                <li key={i.id || i.name}>
                  <span className="font-medium">{i.name}</span>
                  {i.error && <span className="opacity-80">: {i.error}</span>}
                </li>
              ))}
            </ul>
          </TooltipContent>
        </Tooltip>
      )}
    </p>
  )
}
