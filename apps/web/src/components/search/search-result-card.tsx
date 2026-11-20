import { ArrowDown, ArrowUp, Calendar, Download, ExternalLink, HardDrive, Magnet, User } from 'lucide-react'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { usePostHog } from '@posthog/react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { SearchResult } from '@/lib/api'
import { formatFullDate, parseDescription, timeAgo } from '@/lib/format'
import { cn, formatBytes } from '@/lib/utils'

export default function SearchResultCard({
  title,
  jackettindexer,
  size,
  pubDate,
  description,
  magnetLink,
  comments,
  seeders,
  peers,
  attrs,
}: SearchResult) {
  const posthog = usePostHog()
  const uploaded = new Date(pubDate)
  const { uploader, text } = useMemo(() => parseDescription(description, title), [description, title])
  const infohash = typeof attrs.infohash === 'string' ? attrs.infohash : null
  // Some indexers (e.g. 1337x) only expose the magnet on the torrent's own page,
  // which Jackett fetches lazily through a proxy URL that carries its key, so the
  // API withholds it. For those, the indexer's details page is the way in.
  const hasMagnet = magnetLink.startsWith('magnet:')
  // `comments` is the indexer's details page; only ever render it as an http(s) link.
  const detailsUrl = comments && /^https?:\/\//i.test(comments) ? comments : null
  const sourceLabel = `Open on ${jackettindexer.name}`

  const track = (event: string, extra?: Record<string, unknown>) => {
    posthog.capture(event, {
      indexer: jackettindexer.id,
      indexer_name: jackettindexer.name,
      seeders,
      peers,
      ...extra,
    })
  }

  const copyMagnet = async () => {
    await navigator.clipboard.writeText(magnetLink)
    track('magnet_copied')
    toast.success('Magnet link copied to clipboard.')
  }

  return (
    <li className="rounded-lg border border-border/60 bg-card/60 p-4 transition-colors hover:border-border hover:bg-card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          {hasMagnet ? (
            <a
              href={magnetLink}
              title={title}
              onClick={() => track('result_opened')}
              className="line-clamp-2 text-base font-medium leading-snug transition-colors hover:text-primary"
            >
              {title}
            </a>
          ) : detailsUrl ? (
            <a
              href={detailsUrl}
              title={title}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('source_opened', { has_magnet: false, from: 'title' })}
              className="line-clamp-2 text-base font-medium leading-snug transition-colors hover:text-primary"
            >
              {title}
            </a>
          ) : (
            <span title={title} className="line-clamp-2 text-base font-medium leading-snug">
              {title}
            </span>
          )}

          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            <span className="rounded-sm bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
              {jackettindexer.name}
            </span>

            <Meta icon={<HardDrive />}>{formatBytes(size)}</Meta>

            <Meta
              icon={<ArrowUp />}
              className={cn(seeders > 0 ? 'text-foreground' : 'text-muted-foreground/70')}
              label={`${seeders} seeders`}
            >
              {seeders.toLocaleString()}
            </Meta>

            <Meta icon={<ArrowDown />} label={`${peers} peers`}>
              {peers.toLocaleString()}
            </Meta>

            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Meta icon={<Calendar />}>{timeAgo(uploaded)}</Meta>
                </span>
              </TooltipTrigger>
              <TooltipContent>{formatFullDate(uploaded)}</TooltipContent>
            </Tooltip>

            {uploader && <Meta icon={<User />}>{uploader}</Meta>}
          </div>

          {text && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground/80">{text}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:pt-0.5">
          {hasMagnet && (
            <Button variant="outline" size="sm" onClick={copyMagnet} className="active:scale-[0.97]">
              <Magnet />
              Magnet link
            </Button>
          )}
          {!hasMagnet && detailsUrl && (
            <Button asChild variant="outline" size="sm" className="active:scale-[0.97]">
              <a
                href={detailsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track('source_opened', { has_magnet: false, from: 'button' })}
              >
                <ExternalLink />
                {sourceLabel}
              </a>
            </Button>
          )}
          {!hasMagnet && !detailsUrl && !infohash && (
            <span className="text-xs text-muted-foreground">No magnet available</span>
          )}
          {infohash && (
            <Button asChild variant="outline" size="sm" className="active:scale-[0.97]">
              <a
                href={`https://webtor.io/${infohash.toLowerCase()}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track('download_clicked', { destination: 'webtor' })}
              >
                <Download />
                Download
              </a>
            </Button>
          )}
          {hasMagnet && detailsUrl && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-foreground active:scale-[0.97]"
                >
                  <a
                    href={detailsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={sourceLabel}
                    onClick={() => track('source_opened', { has_magnet: true, from: 'button' })}
                  >
                    <ExternalLink />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{sourceLabel}</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </li>
  )
}

function Meta({
  icon,
  label,
  className,
  children,
}: {
  icon: React.ReactNode
  label?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 [&>svg]:size-4', className)} aria-label={label}>
      {icon}
      {children}
    </span>
  )
}

export function SearchResultCardSkeleton() {
  return (
    <li className="rounded-lg border border-border/60 bg-card/60 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="h-5 w-3/4 animate-pulse rounded bg-secondary" />
          <div className="mt-3 flex gap-4">
            <div className="h-4 w-24 animate-pulse rounded bg-secondary" />
            <div className="h-4 w-16 animate-pulse rounded bg-secondary" />
            <div className="h-4 w-12 animate-pulse rounded bg-secondary" />
            <div className="h-4 w-12 animate-pulse rounded bg-secondary" />
            <div className="h-4 w-20 animate-pulse rounded bg-secondary" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-28 animate-pulse rounded-md bg-secondary" />
          <div className="h-8 w-24 animate-pulse rounded-md bg-secondary" />
        </div>
      </div>
    </li>
  )
}
