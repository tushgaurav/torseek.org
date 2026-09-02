import { XMLParser } from 'fast-xml-parser'

/**
 * Raw shape of a torznab <item> as produced by the parser below. Attributes
 * are prefixed with "@" and mixed text nodes use "#text", mirroring Python's
 * xmltodict so the same normaliser works on Jackett responses and fixtures.
 */
export type RawItem = {
  title?: string
  guid?: string
  pubDate?: string
  size?: string
  files?: string
  description?: string
  link?: string
  category?: string | string[]
  comments?: string
  type?: string
  jackettindexer?: { '@id'?: string; '#text'?: string }
  enclosure?: Record<string, string>
  'torznab:attr'?: { '@name': string; '@value': string }[]
  /** Present on captured fixtures where torznab attrs were already flattened. */
  attrs?: Record<string, string | string[]>
}

export type TorrentItem = {
  title: string
  guid: string
  pubDate: string
  size: string
  files: string | null
  description: string
  magnetLink: string
  category: string[]
  comments: string | null
  type: string | null
  jackettindexer: { id: string; name: string }
  enclosure: Record<string, string> | null
  seeders: number
  peers: number
  attrs: Record<string, string | string[]>
}

const ALWAYS_ARRAY = new Set(['item', 'torznab:attr'])

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@',
  textNodeName: '#text',
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
  isArray: (name) => ALWAYS_ARRAY.has(name),
})

export function parseTorznab(xml: string): RawItem[] {
  const doc = parser.parse(xml) as { rss?: { channel?: { item?: RawItem[] } } }
  return doc.rss?.channel?.item ?? []
}

/** Indexer descriptions are untrusted HTML; keep only line breaks. */
function sanitizeDescription(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&lt;br\s*\/?&gt;/gi, '<br>')
}

export function normalizeItem(item: RawItem): TorrentItem {
  const attrs: Record<string, string | string[]> = { ...item.attrs }
  for (const attr of item['torznab:attr'] ?? []) {
    const { '@name': name, '@value': value } = attr
    const existing = attrs[name]
    if (existing === undefined) {
      attrs[name] = value
    } else if (Array.isArray(existing)) {
      existing.push(value)
    } else {
      attrs[name] = [existing, value]
    }
  }

  const category = item.category === undefined ? [] : Array.isArray(item.category) ? item.category : [item.category]

  return {
    title: item.title ?? '',
    guid: item.guid ?? '',
    pubDate: item.pubDate ?? '',
    size: item.size ?? '0',
    files: item.files ?? null,
    description: sanitizeDescription(item.description ?? ''),
    magnetLink: item.link ?? '',
    category,
    comments: item.comments ?? null,
    type: item.type ?? null,
    jackettindexer: {
      id: item.jackettindexer?.['@id'] ?? '',
      name: item.jackettindexer?.['#text'] ?? '',
    },
    enclosure: item.enclosure ?? null,
    seeders: Number(attrs.seeders ?? 0) || 0,
    peers: Number(attrs.peers ?? 0) || 0,
    attrs,
  }
}
