import { useEffect, useMemo, useState } from 'react'

import { ArticleCard } from '@/components/articles/article-card'
import { Page } from '@/components/shared/page'
import { articles, categories, type ArticleCategory } from '@/content/articles'
import { siteContent } from '@/content/content'
import { cn } from '@/lib/utils'

type Filter = 'All' | ArticleCategory

export default function Articles() {
  const [filter, setFilter] = useState<Filter>('All')

  useEffect(() => {
    document.title = `Articles | ${siteContent.structuredData.name}`
  }, [])

  const visible = useMemo(
    () => (filter === 'All' ? articles : articles.filter((article) => article.category === filter)),
    [filter],
  )

  const filters: Filter[] = [...categories, 'All']

  return (
    <Page>
      <div className="mx-auto max-w-3xl">
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-base font-medium">Articles</h1>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter articles by topic">
            {filters.map((name) => (
              <button
                key={name}
                type="button"
                aria-pressed={filter === name}
                onClick={() => setFilter(name)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  filter === name
                    ? 'bg-foreground text-background'
                    : 'bg-secondary text-secondary-foreground hover:bg-accent',
                )}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <ul className="mt-10 flex flex-col gap-12">
          {visible.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </ul>
      </div>
    </Page>
  )
}
