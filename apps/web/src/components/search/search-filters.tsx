import { ArrowUpDown, ChevronDown, Server } from 'lucide-react'

import { Button } from '@/components/ui/button'
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

function FilterTrigger({
  icon,
  prefix,
  value,
  active,
  disabled,
}: {
  icon: React.ReactNode
  prefix: string
  value: string
  active?: boolean
  disabled?: boolean
}) {
  return (
    <DropdownMenuTrigger asChild disabled={disabled}>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'shrink-0 text-muted-foreground hover:text-foreground',
          active && 'text-foreground',
          disabled && 'opacity-60',
        )}
      >
        <span className="[&>svg]:size-3.5">{icon}</span>
        <span className="hidden sm:inline">{prefix}:</span> {value}
        <ChevronDown className="size-3.5 opacity-60" />
      </Button>
    </DropdownMenuTrigger>
  )
}

export function SortMenu({ value, onChange }: { value: SortOption; onChange: (sort: SortOption) => void }) {
  return (
    <DropdownMenu>
      <FilterTrigger icon={<ArrowUpDown />} prefix="Sort" value={SORT_LABEL[value]} active={value !== 'relevance'} />
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
      ? 'All'
      : value.length === 1
        ? (indexers.find((i) => i.id === value[0])?.name ?? value[0]!)
        : `${value.length} selected`

  const toggle = (id: string, checked: boolean) => {
    const next = new Set(selected)
    if (checked) next.add(id)
    else next.delete(id)
    onChange(indexers.filter((i) => next.has(i.id)).map((i) => i.id))
  }

  const disabled = !loading && indexers.length === 0

  return (
    <DropdownMenu>
      <FilterTrigger
        icon={<Server />}
        prefix="Indexers"
        value={loading ? '…' : disabled ? 'None' : label}
        active={value.length > 0}
        disabled={disabled}
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
