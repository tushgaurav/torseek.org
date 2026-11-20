import { Link } from 'react-router'

import type { Category, CategoryFacet } from '@/lib/api'
import { cn } from '@/lib/utils'

type Tab = { id: number | null; name: string; count: number | null }

type CategoryTabsProps = {
  /** Facets for the current query, or null while its first response is in flight. */
  facets: { total: number; categories: CategoryFacet[] } | null
  /** Names to fall back on for the active tab before facets arrive. */
  categories: Category[]
  /** Active top-level category, or null for All. */
  value: number | null
  /** Builds the link target for a tab so they are real links (middle-click, copy, etc). */
  hrefFor: (category: number | null) => string
  className?: string
}

/**
 * Google-style result tabs. Categories with no results for the query are hidden,
 * except the active one so the user can always see what they're filtering on.
 */
export function CategoryTabs({ facets, categories, value, hrefFor, className }: CategoryTabsProps) {
  const tabs: Tab[] = [{ id: null, name: 'All', count: facets?.total ?? null }]

  if (facets) {
    for (const c of facets.categories) {
      if (c.count > 0 || c.id === value) tabs.push({ id: c.id, name: c.name, count: c.count })
    }
  } else if (value !== null) {
    tabs.push({ id: value, name: categories.find((c) => c.id === value)?.name ?? String(value), count: null })
  }

  return (
    <nav
      aria-label="Result categories"
      className={cn(
        'flex gap-1 overflow-x-auto border-b [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      {tabs.map((tab) => {
        const active = tab.id === value
        return (
          <Link
            key={tab.id ?? 'all'}
            to={hrefFor(tab.id)}
            aria-current={active ? 'page' : undefined}
            onClick={(e) => {
              if (active) e.preventDefault()
            }}
            className={cn(
              'relative flex shrink-0 items-baseline gap-1.5 px-3 pt-1 pb-3 text-sm whitespace-nowrap transition-colors outline-none',
              'focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring/50',
              active ? 'font-semibold text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.name}
            {tab.count !== null && (
              <span className="text-xs font-normal tabular-nums text-muted-foreground">
                {tab.count.toLocaleString()}
              </span>
            )}
            {active && <span aria-hidden="true" className="absolute inset-x-3 bottom-0 h-[3px] rounded-t-full bg-primary" />}
          </Link>
        )
      })}
    </nav>
  )
}
