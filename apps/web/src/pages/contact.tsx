import { useEffect } from 'react'
import { Bug, Copy, Copyright, Lightbulb, Mail, ShieldCheck, type LucideIcon } from 'lucide-react'
import { toast } from 'sonner'

import { InlineText } from '@/components/articles/inline-text'
import { Page } from '@/components/shared/page'
import { Button } from '@/components/ui/button'
import { siteContent } from '@/content/content'
import { useScrollReset } from '@/lib/use-scroll-reset'

const topics: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Bug,
    title: 'Bugs and broken searches',
    text: 'Send the query, the filters you had on, and what you expected to see. If one indexer keeps failing, say which.',
  },
  {
    icon: Lightbulb,
    title: 'Ideas and indexers',
    text: 'Suggestions for filters, features, or public indexers worth adding are welcome.',
  },
  {
    icon: Copyright,
    title: 'Copyright and removals',
    text: 'torseek doesn’t host anything, so the fastest route is the indexer named on the result. [Copyright complaints](/terms#copyright-complaints) explains how, and what to include if you still need us.',
  },
  {
    icon: ShieldCheck,
    title: 'Privacy requests',
    text: 'To delete your analytics data or ask what we hold, see [Your choices](/privacy#your-choices) for what to include so we can find it.',
  },
]

export default function Contact() {
  const { email } = siteContent.contact

  useEffect(() => {
    document.title = `Contact | ${siteContent.structuredData.name}`
  }, [])

  useScrollReset('contact')

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email)
      toast.success('Email address copied to clipboard.')
    } catch {
      toast.error('Couldn’t copy the address. Select it and copy it instead.')
    }
  }

  return (
    <Page>
      <div className="mx-auto mt-4 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Contact</h1>
        <p className="mt-4 leading-7 text-foreground/90">
          Email is the best way to reach us. Every message gets read, though we can’t promise a reply to
          all of them.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-5 py-4">
          <a
            href={`mailto:${email}`}
            className="flex min-w-0 items-center gap-3 font-medium transition-colors hover:text-primary"
          >
            <Mail className="size-4 shrink-0 text-primary" />
            <span className="truncate">{email}</span>
          </a>
          <Button variant="outline" size="sm" onClick={copyEmail}>
            <Copy />
            Copy
          </Button>
        </div>

        <ul className="mt-12 flex flex-col divide-y divide-border/60 border-y border-border/60">
          {topics.map((topic) => (
            <li key={topic.title} className="flex gap-4 py-6">
              <topic.icon className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div>
                <h2 className="font-medium">{topic.title}</h2>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                  <InlineText text={topic.text} />
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Page>
  )
}
