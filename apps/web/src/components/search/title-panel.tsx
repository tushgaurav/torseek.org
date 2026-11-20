import { usePostHog } from '@posthog/react'
import { ExternalLink, Film, Star, Tv } from 'lucide-react'
import { useState } from 'react'

import { apiUrl, type TitlePanel as TitlePanelData } from '@/lib/api'
import { cn } from '@/lib/utils'

type TitlePanelProps = {
  panel: TitlePanelData
  /** `side`: right-hand column on wide screens. `inline`: compact card inside the result list. */
  variant: 'side' | 'inline'
  onDismiss: () => void
  className?: string
}

const compactNumber = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })

/** Movie/show summary shown next to results when the results agree on one title. */
export function TitlePanel({ panel, variant, onDismiss, className }: TitlePanelProps) {
  const posthog = usePostHog()
  const [posterFailed, setPosterFailed] = useState(false)
  const side = variant === 'side'

  const track = (event: string, extra?: Record<string, unknown>) => {
    posthog.capture(event, { kind: panel.kind, tmdb_id: panel.tmdb_id, title: panel.title, variant, ...extra })
  }

  const posterClass = cn('aspect-[2/3] shrink-0 rounded-md bg-secondary', side ? 'w-24' : 'w-20')

  return (
    <section
      aria-label={`About ${panel.title}`}
      className={cn('rounded-lg border border-border/60 bg-card/60 p-4', className)}
    >
      <div className="flex gap-4">
        {panel.poster && !posterFailed ? (
          <img
            src={apiUrl(panel.poster)}
            alt=""
            width={side ? 96 : 80}
            height={side ? 144 : 120}
            loading={side ? 'eager' : 'lazy'}
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setPosterFailed(true)}
            className={cn(posterClass, 'object-cover')}
          />
        ) : (
          <div aria-hidden="true" className={cn(posterClass, 'flex items-center justify-center text-muted-foreground')}>
            {panel.kind === 'tv' ? <Tv className="size-6" /> : <Film className="size-6" />}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold leading-tight">{panel.title}</h2>
          {panel.original_title && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground" title={panel.original_title}>
              {panel.original_title}
            </p>
          )}
          <p className="mt-1.5 text-xs text-muted-foreground">{factsLine(panel)}</p>
          {panel.rating !== null && (
            <p className="mt-1.5 flex items-center gap-1 text-xs">
              <Star className="size-3.5 fill-primary text-primary" aria-hidden="true" />
              <span className="font-medium text-foreground">{panel.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">/10 · {compactNumber.format(panel.vote_count)} votes</span>
            </p>
          )}
          {panel.genres.length > 0 && (
            <p className="mt-1.5 text-xs text-muted-foreground">{panel.genres.slice(0, 3).join(', ')}</p>
          )}
        </div>
      </div>

      {panel.overview && (
        <p className={cn('mt-3 text-sm leading-relaxed text-muted-foreground', side ? 'line-clamp-6' : 'line-clamp-3')}>
          {panel.overview}
        </p>
      )}

      {side && panel.credits.length > 0 && (
        <dl className="mt-3 space-y-1 text-xs">
          {panel.credits.map((row) => (
            <div key={row.label} className="flex gap-1.5">
              <dt className="shrink-0 text-muted-foreground">{row.label}:</dt>
              <dd className="text-foreground/90">{row.names.join(', ')}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-3 flex items-center justify-between gap-3 text-xs">
        <div>
          {panel.links.imdb && (
            <ExternalLinkItem href={panel.links.imdb} onClick={() => track('title_panel_link_clicked', { destination: 'imdb' })}>
              IMDb
            </ExternalLinkItem>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            track('title_panel_dismissed', { votes: panel.match.votes, of: panel.match.of })
            onDismiss()
          }}
          className="cursor-pointer text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Not this title?
        </button>
      </div>
    </section>
  )
}

function ExternalLinkItem({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      referrerPolicy="no-referrer"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
    >
      {children}
      <ExternalLink className="size-3" aria-hidden="true" />
    </a>
  )
}

/** "2021 · Movie · 2h 35m" or "2005–2013 · TV series · 9 seasons". */
function factsLine(p: TitlePanelData): string {
  const parts: string[] = []
  if (p.kind === 'movie') {
    if (p.year) parts.push(String(p.year))
    parts.push('Movie')
    if (p.runtime) parts.push(formatRuntime(p.runtime))
  } else {
    if (p.year) {
      if (p.end_year && p.end_year !== p.year) parts.push(`${p.year}–${p.end_year}`)
      else if (!p.end_year && p.status === 'Returning Series') parts.push(`${p.year}–`)
      else parts.push(String(p.year))
    }
    parts.push('TV series')
    if (p.seasons) parts.push(`${p.seasons} ${p.seasons === 1 ? 'season' : 'seasons'}`)
  }
  return parts.join(' · ')
}

function formatRuntime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`
}
