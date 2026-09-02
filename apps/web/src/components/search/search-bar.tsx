import { ArrowRight, Mic, Search as SearchIcon } from 'lucide-react'
import { useState } from 'react'
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

export function SearchBar({ initialValue = '', withSubmitButton = false, className }: SearchBarProps) {
  const [search, setSearch] = useState(initialValue)
  const navigate = useNavigate()

  const handleSearch = () => {
    const q = search.trim()
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`)
    }
  }

  return (
    <div className={cn('flex items-center gap-2 w-full max-w-2xl', className)}>
      <div className="flex-1 flex items-center gap-2 bg-secondary rounded-full">
        <SearchIcon
          className="size-6 ml-4 hover:text-secondary-foreground transition-colors duration-300 text-muted-foreground cursor-pointer"
          onClick={handleSearch}
        />
        <Input
          placeholder="Search"
          id="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch()
          }}
          className="max-w-xl p-4 h-12 border-none bg-transparent dark:bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-transparent"
        />
        <Mic className="size-6 mr-4 text-muted-foreground hover:text-secondary-foreground transition-colors duration-300" />
      </div>
      {withSubmitButton && (
        <Button className="rounded-full h-12 w-12" onClick={handleSearch} aria-label="Search">
          <ArrowRight className="size-6 text-secondary" />
        </Button>
      )}
    </div>
  )
}
