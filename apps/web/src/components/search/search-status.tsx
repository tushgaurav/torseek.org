import { AlertTriangle, FlaskConical } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { SearchMeta } from '@/lib/api'

/** Upstream summary under the results header: sample-data notice and failed indexers. */
export function SearchStatus({ meta }: { meta: SearchMeta }) {
  const failed = meta.indexers.filter((i) => i.status !== 'ok')
  const queried = meta.indexers.length

  if (meta.mode !== 'fixture' && failed.length === 0) return null

  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {meta.mode === 'fixture' && (
        <span className="inline-flex items-center gap-1">
          <FlaskConical className="size-3.5" />
          Sample data: Jackett is not configured on the server.
        </span>
      )}
      {failed.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex cursor-help items-center gap-1 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="size-3.5" />
              {failed.length} of {queried} indexers failed
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <ul className="space-y-1">
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
    </div>
  )
}
