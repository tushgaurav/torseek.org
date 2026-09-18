import { Link } from 'react-router'

import { ArticleCover } from '@/components/articles/article-cover'
import { articlePath, type Article } from '@/content/articles'

export function ArticleCard({ article }: { article: Article }) {
  return (
    <li>
      <Link to={articlePath(article.slug)} className="group grid gap-5 sm:grid-cols-[254px_1fr] sm:gap-8">
        <ArticleCover article={article} />
        <div className="min-w-0 sm:pt-3">
          <h2 className="text-lg font-semibold leading-snug tracking-tight transition-colors group-hover:text-primary">
            {article.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{article.description}</p>
          <span className="mt-3 inline-block rounded-sm bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            {article.category}
          </span>
        </div>
      </Link>
    </li>
  )
}
