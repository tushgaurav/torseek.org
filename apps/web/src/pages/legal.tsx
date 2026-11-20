import { useEffect } from 'react'

import { ArticleBody } from '@/components/articles/article-body'
import { TableOfContents } from '@/components/articles/table-of-contents'
import { Page } from '@/components/shared/page'
import { articleSections, formatArticleDate, INTRO_ID } from '@/content/articles'
import { siteContent } from '@/content/content'
import type { LegalDocument } from '@/content/legal'
import { useScrollReset } from '@/lib/use-scroll-reset'

export default function LegalPage({ doc }: { doc: LegalDocument }) {
  useEffect(() => {
    document.title = `${doc.title} | ${siteContent.structuredData.name}`
  }, [doc])

  // Privacy and Terms share this component, so React reuses the instance when
  // moving between them; key the reset on the document, not on mount.
  useScrollReset(doc.title)

  const sections = articleSections(doc)

  return (
    <Page>
      <div className="mx-auto mt-4 max-w-5xl lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <TableOfContents sections={sections} />
          </div>
        </aside>

        <article className="max-w-2xl">
          <h1
            id={INTRO_ID}
            className="scroll-mt-28 text-2xl font-semibold tracking-tight text-balance sm:text-3xl"
          >
            {doc.title}
          </h1>

          <p className="mt-3 text-xs text-muted-foreground">
            Last updated <time dateTime={doc.updatedAt}>{formatArticleDate(doc.updatedAt)}</time>
          </p>

          <div className="mt-8 leading-7 text-foreground/90">
            <ArticleBody body={doc.body} />
          </div>
        </article>
      </div>
    </Page>
  )
}
