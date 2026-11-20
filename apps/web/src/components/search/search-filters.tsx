import { ArrowUpDown, ChevronDown, Server, X } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { IndexerInfo, SortOption } from '@/lib/api'
import { cn } from '@/lib/utils'

const SORT_GROUPS: { label: string; options: { value: SortOption; label: string }[] }[] = [
  { label: 'Default', options: [{ value: 'relevance', label: 'Relevance' }] },
  {
    label: 'Seeders',
    options: [
      { value: 'seeders_desc', label: 'Most seeders' },
      { value: 'seeders_asc', label: 'Fewest seeders' },
    ],
  },
  {
    label: 'Peers',
    options: [
      { value: 'peers_desc', label: 'Most peers' },
      { value: 'peers_asc', label: 'Fewest peers' },
    ],
  },
  {
    label: 'Size',
    options: [
      { value: 'size_desc', label: 'Largest first' },
      { value: 'size_asc', label: 'Smallest first' },
    ],
  },
  {
    label: 'Date',
    options: [
      { value: 'date_desc', label: 'Newest first' },
      { value: 'date_asc', label: 'Oldest first' },
    ],
  },
]

const SORT_LABEL: Record<SortOption, string> = Object.fromEntries(
  SORT_GROUPS.flatMap((g) => g.options.map((o) => [o.value, o.label])),
) as Record<SortOption, string>

/**
 * A rounded chip that opens a filter menu. Once changed from its default it is
 * tinted and gains a reset button beside the trigger (not inside it, since a
 * button can't contain another button).
 */
function FilterChip({
  icon,
  label,
  value,
  active,
  disabled,
  onReset,
}: {
  icon: React.ReactNode
  /** What the chip filters, for screen readers; the chip itself only shows the value. */
  label: string
  value: string
  active?: boolean
  disabled?: boolean
  onReset?: () => void
}) {
  const resettable = active && onReset && !disabled

  return (
    <div
      className={cn(
        'inline-flex h-8 shrink-0 items-center rounded-full border text-xs font-medium transition-colors',
        active
          ? 'border-primary/40 bg-primary/10 text-foreground'
          : 'border-border text-muted-foreground hover:border-foreground/25 hover:text-foreground',
        disabled && 'opacity-60',
      )}
    >
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          type="button"
          aria-label={`${label}: ${value}`}
          className={cn(
            'inline-flex h-full items-center gap-1.5 rounded-full pl-3 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed',
            resettable ? 'pr-1' : 'pr-2.5',
          )}
        >
          <span aria-hidden="true" className="[&>svg]:size-3.5">
            {icon}
          </span>
          {value}
          <ChevronDown aria-hidden="true" className="size-3 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      {resettable && (
        <button
          type="button"
          onClick={onReset}
          aria-label={`Reset ${label.toLowerCase()}`}
          className="mr-1 flex size-6 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-primary/15 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  )
}

export function SortMenu({ value, onChange }: { value: SortOption; onChange: (sort: SortOption) => void }) {
  return (
    <DropdownMenu>
      <FilterChip
        icon={<ArrowUpDown />}
        label="Sort"
        value={SORT_LABEL[value]}
        active={value !== 'relevance'}
        onReset={() => onChange('relevance')}
      />
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as SortOption)}>
          {SORT_GROUPS.map((group, i) => (
            <div key={group.label}>
              {i > 0 && <DropdownMenuSeparator />}
              {group.options.length > 1 && (
                <DropdownMenuLabel className="text-xs text-muted-foreground">{group.label}</DropdownMenuLabel>
              )}
              {group.options.map((opt) => (
                <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                  {opt.label}
                </DropdownMenuRadioItem>
              ))}
            </div>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function IndexerMenu({
  indexers,
  value,
  onChange,
  loading,
}: {
  indexers: IndexerInfo[]
  /** Selected indexer ids; empty means all. */
  value: string[]
  onChange: (ids: string[]) => void
  loading?: boolean
}) {
  const selected = new Set(value)
  const label =
    value.length === 0
      ? 'All indexers'
      : value.length === 1
        ? (indexers.find((i) => i.id === value[0])?.name ?? value[0]!)
        : `${value.length} indexers`

  const toggle = (id: string, checked: boolean) => {
    const next = new Set(selected)
    if (checked) next.add(id)
    else next.delete(id)
    onChange(indexers.filter((i) => next.has(i.id)).map((i) => i.id))
  }

  const disabled = !loading && indexers.length === 0

  return (
    <DropdownMenu>
      <FilterChip
        icon={<Server />}
        label="Indexers"
        value={loading ? 'Indexers…' : disabled ? 'No indexers' : label}
        active={value.length > 0}
        disabled={disabled}
        onReset={() => onChange([])}
      />
      <DropdownMenuContent align="end" className="max-h-80 w-56">
        <DropdownMenuItem
          disabled={value.length === 0}
          onSelect={(e) => {
            e.preventDefault()
            onChange([])
          }}
        >
          All indexers
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {indexers.map((indexer) => (
          <DropdownMenuCheckboxItem
            key={indexer.id}
            checked={selected.has(indexer.id)}
            onCheckedChange={(checked) => toggle(indexer.id, checked === true)}
            onSelect={(e) => e.preventDefault()}
          >
            <span className="truncate">{indexer.name}</span>
            {indexer.type && indexer.type !== 'public' && (
              <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">{indexer.type}</span>
            )}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
