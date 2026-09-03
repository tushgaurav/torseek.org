const relativeTime = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 1000 * 60 * 60 * 24 * 365],
  ['month', 1000 * 60 * 60 * 24 * 30],
  ['week', 1000 * 60 * 60 * 24 * 7],
  ['day', 1000 * 60 * 60 * 24],
  ['hour', 1000 * 60 * 60],
  ['minute', 1000 * 60],
]

export function timeAgo(date: Date, now = new Date()): string {
  const diff = date.getTime() - now.getTime()
  if (Number.isNaN(diff)) return ''
  for (const [unit, ms] of UNITS) {
    if (Math.abs(diff) >= ms) {
      return relativeTime.format(Math.round(diff / ms), unit)
    }
  }
  return 'just now'
}

export function formatFullDate(date: Date): string {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatCount(n: number): string {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}

function decodeEntities(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.documentElement.textContent ?? ''
}

/** Loose equality for titles that differ only in separators ("Foo.Bar" vs "Foo Bar"). */
function normalizeTitle(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

export type ParsedDescription = {
  uploader: string | null
  /** Remaining description text, or null when it just repeats the title. */
  text: string | null
}

/**
 * Jackett descriptions are usually "Uploader: name<br>title". Pull the
 * uploader out and drop the redundant title so rows stay compact.
 */
export function parseDescription(description: string, title: string): ParsedDescription {
  const lines = description
    .split(/<br\s*\/?>/i)
    .map((line) => decodeEntities(line).trim())
    .filter(Boolean)

  let uploader: string | null = null
  const rest: string[] = []
  for (const line of lines) {
    const match = /^uploader:\s*(.+)$/i.exec(line)
    if (match && !uploader) {
      uploader = match[1]!.trim()
    } else if (normalizeTitle(line) !== normalizeTitle(title)) {
      rest.push(line)
    }
  }

  return { uploader, text: rest.length > 0 ? rest.join(' ') : null }
}
