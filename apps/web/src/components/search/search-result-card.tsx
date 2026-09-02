import { ArrowDownUp, ArrowsUpFromLine, CalendarArrowUp, HardDriveDownload } from 'lucide-react'

import DownloadWebtorButton from '@/components/search/download-webtor-button'
import MagnetLinkButton from '@/components/search/magnet-link-button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { SearchResult } from '@/lib/api'
import { formatBytes, truncate } from '@/lib/utils'

export default function SearchResultCard({
  title,
  jackettindexer,
  size,
  pubDate,
  description,
  magnetLink,
  seeders,
  peers,
  attrs,
}: SearchResult) {
  const uploaded = new Date(pubDate)

  return (
    <div className="bg-zinc-100/50 dark:bg-[#111111]/50 rounded-lg p-4">
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <a href={magnetLink} target="_blank" rel="noopener noreferrer" className="text-md mb-1 font-medium">
            {truncate(title, 80)}
          </a>
        </div>

        <div className="flex items-center gap-4 text-sm mb-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <p>{jackettindexer.name}</p>
          </Badge>
          <Tooltip>
            <TooltipTrigger>
              <div className="flex items-center gap-1">
                <CalendarArrowUp className="size-4" />
                <p>
                  {uploaded.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {uploaded.toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true,
                })}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-1 mb-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <ArrowsUpFromLine className="size-4" />
            <p>Seeds: {seeders}</p>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <ArrowDownUp className="size-4" />
            <p>Peers: {peers}</p>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <HardDriveDownload className="size-4" />
            <p>{formatBytes(size)}</p>
          </Badge>
        </div>
        {/* Jackett descriptions contain <br> tags; the API strips everything else. */}
        <p className="max-w-[60ch] text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: description }} />
      </div>

      <div className="flex items-center gap-2 mt-3">
        <MagnetLinkButton magnetLink={magnetLink} />
        {attrs.infohash && <DownloadWebtorButton infoHash={attrs.infohash} />}
      </div>
    </div>
  )
}

export function SearchResultCardSkeleton() {
  return (
    <div className="flex flex-col gap-2 max-w-3xl bg-secondary p-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="w-full h-8 bg-secondary-foreground/20 dark:bg-primary-foreground animate-pulse" />
          <div className="h-8 bg-secondary-foreground/20 dark:bg-primary-foreground animate-pulse w-1/3" />
        </div>
        <div className="w-full h-20 bg-secondary-foreground/20 dark:bg-primary-foreground animate-pulse" />
      </div>
    </div>
  )
}
