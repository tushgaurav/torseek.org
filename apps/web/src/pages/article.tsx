import { useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { ArticleBody } from '@/components/articles/article-body'
import { ArticleCard } from '@/components/articles/article-card'
import { ArticleCover } from '@/components/articles/article-cover'
import { TableOfContents } from '@/components/articles/table-of-contents'
import { Page } from '@/components/shared/page'
import {
  articleSections,
  formatArticleDate,
  getArticle,
  INTRO_ID,
  readingMinutes,
  relatedArticles,
} from '@/content/articles'
import { siteContent } from '@/content/content'

import NotFound from './not-found'

export default function Article() {
  const { slug } = useParams()
  const article = getArticle(slug)

  useEffect(() => {
    if (article) {
      document.title = `${article.title} | ${siteContent.structuredData.name}`
    }
  }, [article])

  // React Router keeps the scroll position between articles; reset it, or
  // honour a deep link to a section if one was shared.
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    const target = hash ? document.getElementById(hash) : null
    if (target) target.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [slug])

  if (!article) return <NotFound />

  const sections = articleSections(article)
  const firstHeading = article.body.findIndex((block) => block.type === 'h2')
  const intro = firstHeading === -1 ? article.body : article.body.slice(0, firstHeading)
  const rest = firstHeading === -1 ? [] : article.body.slice(firstHeading)
  const related = relatedArticles(article.slug)

  return (
    <Page>
      <div className="mx-auto mt-4 max-w-5xl lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <Link
              to="/articles"
              className="mb-6 inline-flex items-center gap-1.5 pl-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              All articles
            </Link>
            <TableOfContents sections={sections} />
          </div>
        </aside>

        <div className="max-w-2xl">
          <Link
            to="/articles"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground lg:hidden"
          >
            <ArrowLeft className="size-3.5" />
            All articles
          </Link>

          <h1
            id={INTRO_ID}
            className="mt-4 scroll-mt-28 text-2xl font-semibold tracking-tight text-balance sm:text-3xl lg:mt-0"
          >
            {article.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            <span>{article.category}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={article.publishedAt}>{formatArticleDate(article.publishedAt)}</time>
            <span aria-hidden="true">·</span>
            <span>{readingMinutes(article)} min read</span>
          </div>

          <div className="mt-6 leading-7 text-foreground/90">
            <ArticleBody body={intro} />
          </div>

          <ArticleCover article={article} size="lg" className="mt-8" />

          {rest.length > 0 && (
            <div className="mt-10 leading-7 text-foreground/90">
              <ArticleBody body={rest} />
            </div>
          )}

          {related.length > 0 && (
            <section className="mt-16 border-t border-border/60 pt-10">
              <h2 className="text-sm font-medium text-muted-foreground">Keep reading</h2>
              <ul className="mt-6 flex flex-col gap-10">
                {related.map((item) => (
                  <ArticleCard key={item.slug} article={item} />
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </Page>
  )
}
