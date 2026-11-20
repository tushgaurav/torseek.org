import { ArrowRight, Search as SearchIcon, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type SearchBarProps = {
  initialValue?: string
  /** Show the round arrow submit button next to the pill (home page style). */
  withSubmitButton?: boolean
  className?: string
}

const iconButtonClass =
  'flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 cursor-pointer'

export function SearchBar({ initialValue = '', withSubmitButton = false, className }: SearchBarProps) {
  const [search, setSearch] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const handleSearch = () => {
    const q = search.trim()
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`)
    }
  }

  const handleClear = () => {
    setSearch('')
    inputRef.current?.focus()
  }

  return (
    <form
      role="search"
      className={cn('flex items-center gap-2 w-full max-w-2xl', className)}
      onSubmit={(e) => {
        e.preventDefault()
        handleSearch()
      }}
    >
      <div className="flex-1 flex items-center bg-secondary rounded-full pr-2">
        <Input
          ref={inputRef}
          placeholder="Search"
          id="search"
          autoComplete="off"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && search) {
              e.preventDefault()
              setSearch('')
            }
          }}
          className="flex-1 pl-6 pr-2 h-12 border-none bg-transparent dark:bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-transparent"
        />
        {search && (
          <>
            <button type="button" onClick={handleClear} aria-label="Clear search" className={iconButtonClass}>
              <X className="size-5" strokeWidth={1.75} />
            </button>
            <span aria-hidden="true" className="mx-1 h-6 w-px bg-muted-foreground/40" />
          </>
        )}
        <button type="submit" aria-label="Search" className={iconButtonClass}>
          <SearchIcon className="size-5" strokeWidth={1.75} />
        </button>
      </div>
      {withSubmitButton && (
        <Button type="submit" className="rounded-full h-12 w-12" aria-label="Search">
          <ArrowRight className="size-6 text-secondary" />
        </Button>
      )}
    </form>
  )
}
