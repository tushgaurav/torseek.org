import { useEffect, useState } from 'react'

import type { Section } from '@/content/articles'
import { cn } from '@/lib/utils'

/** Offset from the viewport top at which a heading counts as "reached". */
const ACTIVATION_OFFSET = 140

function useActiveSection(ids: string[]): string {
  const key = ids.join('|')
  const [active, setActive] = useState(ids[0] ?? '')

  useEffect(() => {
    const list = key.split('|').filter(Boolean)
    if (list.length === 0) return

    let frame = 0
    const update = () => {
      frame = 0
      const root = document.documentElement
      const atBottom = window.innerHeight + window.scrollY >= root.scrollHeight - 2
      if (atBottom) {
        setActive(list[list.length - 1]!)
        return
      }
      let current = list[0]!
      for (const id of list) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= ACTIVATION_OFFSET) current = id
      }
      setActive(current)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [key])

  return active
}

export function TableOfContents({ sections, className }: { sections: Section[]; className?: string }) {
  const active = useActiveSection(sections.map((section) => section.id))

  const jump = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.getElementById(id)
    if (!target) return
    event.preventDefault()
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    history.replaceState(null, '', `#${id}`)
  }

  return (
    <nav aria-label="On this page" className={className}>
      <ul className="flex flex-col gap-1">
        {sections.map((section) => {
          const isActive = section.id === active
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                onClick={(event) => jump(event, section.id)}
                aria-current={isActive ? 'location' : undefined}
                className={cn(
                  'block border-l-2 py-1.5 pl-4 text-sm leading-snug transition-colors',
                  isActive
                    ? 'border-primary font-medium text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {section.title}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
