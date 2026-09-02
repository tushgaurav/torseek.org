import { Search } from 'lucide-react'

export function NoSearchResults({ searchQuery }: { searchQuery: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] px-4 py-8">
      <div className="mb-8">
        <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center shadow-lg">
          <Search className="w-12 h-12 text-secondary-foreground" />
        </div>
      </div>

      <div className="text-center max-w-lg space-y-6">
        <div>
          <h2 className="text-xl font-bold text-muted-foreground mb-3">No results found</h2>
          {searchQuery && (
            <p className="text-md text-muted-foreground">
              We couldn't find anything for{' '}
              <span className="font-medium text-muted-foreground">"{searchQuery}"</span>
            </p>
          )}
        </div>

        <div className="bg-muted/30 rounded-lg p-6 border border-border/50">
          <h3 className="text-sm font-semibold text-foreground mb-4">Try these suggestions:</h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            {[
              'Try different or more general keywords',
              'Check your spelling and try again',
              'Use fewer search terms for broader results',
            ].map((tip) => (
              <li key={tip} className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
