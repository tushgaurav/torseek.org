import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router'

import { cn } from '@/lib/utils'

/** How many pages the wordmark stretches to on desktop / narrow screens. */
const WINDOW = 10
const WINDOW_SM = 7

type LogoPaginationProps = {
  page: number
  totalPages: number
  /** Builds the link target for a page so numbers are real links (middle-click, copy, etc). */
  hrefFor: (page: number) => string
  onNavigate?: (page: number) => void
  className?: string
}

/**
 * Google-style pagination: the "torseek" wordmark grows one "e" per visible page,
 * with the page number under each letter and the current page's "e" highlighted.
 */
export function LogoPagination({ page, totalPages, hrefFor, onNavigate, className }: LogoPaginationProps) {
  if (totalPages <= 1) return null

  const pages = pageWindow(page, totalPages, WINDOW)
  const narrow = new Set(pageWindow(page, totalPages, WINDOW_SM))

  const letter = 'text-3xl font-bold leading-none tracking-tight sm:text-4xl'
  const label = 'mt-1.5 text-xs leading-none sm:text-sm'

  return (
    <nav aria-label="pagination" className={cn('flex select-none items-start justify-center', className)}>
      <EdgeLink
        to={hrefFor(page - 1)}
        page={page - 1}
        enabled={page > 1}
        onNavigate={onNavigate}
        label="Previous"
        icon={<ChevronLeft className="size-7 sm:size-8" strokeWidth={2.5} />}
        labelClassName={label}
      />

      <div className="flex items-start">
        <span aria-hidden className={cn(letter, 'text-foreground')}>
          tors
        </span>

        {pages.map((p) => {
          const current = p === page
          return (
            <Link
              key={p}
              to={hrefFor(p)}
              aria-label={`Page ${p}`}
              aria-current={current ? 'page' : undefined}
              onClick={(e) => {
                if (current) {
                  e.preventDefault()
                  return
                }
                onNavigate?.(p)
              }}
              className={cn(
                'group flex-col items-center outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring',
                narrow.has(p) ? 'flex' : 'hidden sm:flex',
                current && 'pointer-events-none',
              )}
            >
              <span aria-hidden className={cn(letter, current ? 'text-primary' : 'text-foreground')}>
                e
              </span>
              <span
                className={cn(
                  label,
                  current ? 'font-semibold text-foreground' : 'text-primary group-hover:underline',
                )}
              >
                {p}
              </span>
            </Link>
          )
        })}

        <span aria-hidden className={cn(letter, 'text-foreground')}>
          k
        </span>
      </div>

      <EdgeLink
        to={hrefFor(page + 1)}
        page={page + 1}
        enabled={page < totalPages}
        onNavigate={onNavigate}
        label="Next"
        icon={<ChevronRight className="size-7 sm:size-8" strokeWidth={2.5} />}
        labelClassName={label}
      />
    </nav>
  )
}

function EdgeLink({
  to,
  page,
  enabled,
  onNavigate,
  label,
  icon,
  labelClassName,
}: {
  to: string
  page: number
  enabled: boolean
  onNavigate?: (page: number) => void
  label: string
  icon: React.ReactNode
  labelClassName: string
}) {
  // Reserve the slot even when disabled so the wordmark doesn't shift between pages.
  if (!enabled) return <span aria-hidden className="w-12 sm:w-20" />

  return (
    <Link
      to={to}
      aria-label={`${label} page`}
      onClick={() => onNavigate?.(page)}
      className="group flex w-12 flex-col items-center px-1 text-primary outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring sm:w-20"
    >
      <span className="flex h-[1.875rem] items-center sm:h-9">{icon}</span>
      <span className={cn(labelClassName, 'hidden group-hover:underline sm:inline')}>{label}</span>
    </Link>
  )
}

/** A contiguous window of `size` pages that keeps the current page near the middle and never runs past the ends. */
function pageWindow(page: number, total: number, size: number): number[] {
  const count = Math.min(size, total)
  const start = Math.min(Math.max(1, page - Math.floor(size / 2) + 1), total - count + 1)
  return Array.from({ length: count }, (_, i) => start + i)
}
