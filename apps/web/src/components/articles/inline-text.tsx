import { Fragment } from 'react'
import { Link } from 'react-router'

const TOKEN = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g

export function InlineText({ text }: { text: string }) {
  const parts = text.split(TOKEN)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} className="font-semibold text-foreground">
              {part.slice(2, -2)}
            </strong>
          )
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={i}
              className="rounded-sm bg-secondary px-1 py-0.5 font-mono text-[0.85em] text-foreground"
            >
              {part.slice(1, -1)}
            </code>
          )
        }
        const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part)
        if (link) {
          const label = link[1]!
          const href = link[2]!
          const className = "text-primary underline decoration-primary/40 underline-offset-3 transition-colors hover:decoration-primary"
          if (href.startsWith('/')) {
            return (
              <Link key={i} to={href} className={className}>
                {label}
              </Link>
            )
          }
          return (
            <a key={i} href={href} target="_blank" rel="noopener noreferrer" className={className}>
              {label}
            </a>
          )
        }
        return <Fragment key={i}>{part}</Fragment>
      })}
    </>
  )
}
