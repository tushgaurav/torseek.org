import { InlineText } from '@/components/articles/inline-text'
import { sectionId, type ArticleBlock } from '@/content/articles'

export function ArticleBody({ body }: { body: ArticleBlock[] }) {
  return (
    <div className="flex flex-col gap-5">
      {body.map((block, i) => {
        if (block.type === 'p') {
          return (
            <p key={i}>
              <InlineText text={block.text} />
            </p>
          )
        }
        if (block.type === 'h2') {
          return (
            <h2
              key={i}
              id={sectionId(block.text)}
              className="mt-6 scroll-mt-28 text-xl font-semibold tracking-tight text-foreground first:mt-0 sm:text-2xl"
            >
              {block.text}
            </h2>
          )
        }
        if (block.type === 'ul') {
          return (
            <ul key={i} className="list-disc space-y-2 pl-5">
              {block.items.map((item) => (
                <li key={item}>
                  <InlineText text={item} />
                </li>
              ))}
            </ul>
          )
        }
        if (block.type === 'ol') {
          return (
            <ol key={i} className="list-decimal space-y-2 pl-5">
              {block.items.map((item) => (
                <li key={item}>
                  <InlineText text={item} />
                </li>
              ))}
            </ol>
          )
        }
        return (
          <aside
            key={i}
            className="border-l-2 border-primary bg-muted/60 px-4 py-3 text-sm leading-relaxed"
          >
            <p className="font-medium text-foreground">{block.title}</p>
            <p className="mt-1 text-muted-foreground">
              <InlineText text={block.text} />
            </p>
          </aside>
        )
      })}
    </div>
  )
}
