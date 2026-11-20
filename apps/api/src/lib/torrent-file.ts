import { createHash } from 'node:crypto'

/**
 * Just enough bencode to turn a .torrent into a magnet URI. The info hash is
 * taken over the `info` dictionary's original bytes; decoding and re-encoding
 * would only reproduce them if the file was perfectly canonical.
 */

type BValue = number | Uint8Array | BValue[] | BDict
type BDict = { [key: string]: BValue }

const MAX_DEPTH = 64
const utf8 = new TextDecoder('utf-8', { fatal: false })

export class TorrentParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TorrentParseError'
  }
}

class Decoder {
  pos = 0
  /** Byte range of the top-level `info` value, once seen. */
  infoSpan: [number, number] | null = null

  constructor(private readonly buf: Uint8Array) {}

  decode(depth = 0): BValue {
    if (depth > MAX_DEPTH) throw new TorrentParseError('bencode nested too deeply')
    const c = this.peek()
    if (c === 0x69 /* i */) return this.integer()
    if (c === 0x6c /* l */) {
      this.pos++
      const list: BValue[] = []
      while (this.peek() !== 0x65 /* e */) list.push(this.decode(depth + 1))
      this.pos++
      return list
    }
    if (c === 0x64 /* d */) {
      this.pos++
      const dict: BDict = Object.create(null)
      while (this.peek() !== 0x65 /* e */) {
        const key = utf8.decode(this.bytes())
        const start = this.pos
        dict[key] = this.decode(depth + 1)
        if (depth === 0 && key === 'info') this.infoSpan = [start, this.pos]
      }
      this.pos++
      return dict
    }
    if (c >= 0x30 && c <= 0x39) return this.bytes()
    throw new TorrentParseError(`unexpected byte 0x${c.toString(16)} at ${this.pos}`)
  }

  private peek(): number {
    const c = this.buf[this.pos]
    if (c === undefined) throw new TorrentParseError('unexpected end of data')
    return c
  }

  private integer(): number {
    const end = this.buf.indexOf(0x65, this.pos)
    if (end === -1) throw new TorrentParseError('unterminated integer')
    const text = utf8.decode(this.buf.subarray(this.pos + 1, end))
    if (!/^-?\d+$/.test(text)) throw new TorrentParseError(`invalid integer "${text}"`)
    this.pos = end + 1
    return Number(text)
  }

  private bytes(): Uint8Array {
    const colon = this.buf.indexOf(0x3a /* : */, this.pos)
    if (colon === -1) throw new TorrentParseError('unterminated string length')
    const text = utf8.decode(this.buf.subarray(this.pos, colon))
    if (!/^\d+$/.test(text)) throw new TorrentParseError(`invalid string length "${text}"`)
    const start = colon + 1
    const end = start + Number(text)
    if (end > this.buf.length) throw new TorrentParseError('string runs past end of data')
    this.pos = end
    return this.buf.subarray(start, end)
  }
}

function isDict(v: BValue | undefined): v is BDict {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && !(v instanceof Uint8Array)
}

function text(v: BValue | undefined): string | null {
  return v instanceof Uint8Array ? utf8.decode(v) : null
}

/** Announce URLs in tier order, deduplicated, limited to schemes clients can use. */
function trackersOf(root: BDict): string[] {
  const urls: string[] = []
  const tiers = root['announce-list']
  if (Array.isArray(tiers)) {
    for (const tier of tiers) {
      if (Array.isArray(tier)) for (const url of tier) urls.push(text(url) ?? '')
    }
  }
  urls.push(text(root.announce) ?? '')
  return [...new Set(urls.map((u) => u.trim()).filter((u) => /^(https?|udp|wss?):\/\//i.test(u)))]
}

export type TorrentMeta = {
  /** v1 SHA-1 info hash, hex. Null for v2-only torrents. */
  btih: string | null
  /** v2 SHA-256 info hash as a multihash (1220 + hex). Null for v1-only torrents. */
  btmh: string | null
  name: string | null
  trackers: string[]
  /** Private-flagged torrents only work through their tracker; never turn them into public magnets. */
  isPrivate: boolean
}

export function parseTorrent(buf: Uint8Array): TorrentMeta {
  const decoder = new Decoder(buf)
  const root = decoder.decode()
  if (!isDict(root) || !isDict(root.info) || !decoder.infoSpan) {
    throw new TorrentParseError('not a torrent file (no info dictionary)')
  }
  const info = root.info
  const raw = buf.subarray(...decoder.infoSpan)

  // Hybrid torrents carry both v1 `pieces` and v2 `meta version`; hash for each.
  const isV2 = info['meta version'] === 2
  const isV1 = !isV2 || info.pieces instanceof Uint8Array
  return {
    btih: isV1 ? createHash('sha1').update(raw).digest('hex') : null,
    btmh: isV2 ? `1220${createHash('sha256').update(raw).digest('hex')}` : null,
    name: text(info['name.utf-8']) ?? text(info.name),
    trackers: trackersOf(root),
    isPrivate: info.private === 1,
  }
}

export function toMagnet({ btih, btmh, name, trackers }: TorrentMeta): string {
  const parts: string[] = []
  if (btih) parts.push(`xt=urn:btih:${btih}`)
  if (btmh) parts.push(`xt=urn:btmh:${btmh}`)
  if (name) parts.push(`dn=${encodeURIComponent(name)}`)
  for (const tr of trackers) parts.push(`tr=${encodeURIComponent(tr)}`)
  return `magnet:?${parts.join('&')}`
}
