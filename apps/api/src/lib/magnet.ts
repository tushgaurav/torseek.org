import { env } from '../env.ts'
import { MemoryCache } from './cache.ts'
import { jackettFetch } from './jackett.ts'
import type { MagnetTarget } from './magnet-token.ts'
import { parseTorrent, toMagnet, TorrentParseError } from './torrent-file.ts'

export type MagnetErrorCode = 'PRIVATE' | 'NOT_A_TORRENT' | 'TOO_LARGE' | 'NO_MAGNET'

export class MagnetError extends Error {
  constructor(
    public readonly code: MagnetErrorCode,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options)
    this.name = 'MagnetError'
  }
}

/** Real .torrent files are kilobytes; anything near this is not one. */
const MAX_TORRENT_BYTES = 10 * 1024 * 1024

// An info hash never changes, so resolved magnets stay valid; the TTL only bounds memory.
const magnetCache = new MemoryCache<string>({ ttlMs: 24 * 60 * 60_000, maxEntries: 5_000 })

export async function isMagnetCached(target: MagnetTarget): Promise<boolean> {
  return (await magnetCache.get(target.cacheKey)) !== undefined
}

/**
 * Magnet for a sealed Jackett download link. Each miss costs Jackett a request
 * to the indexer, so results are cached and concurrent lookups share one fetch.
 */
export async function resolveMagnet(target: MagnetTarget): Promise<{ magnet: string; cached: boolean }> {
  const { value, cached } = await magnetCache.getOrLoad(target.cacheKey, () => fetchMagnet(target.url))
  return { magnet: value, cached }
}

function isMagnet(value: string): boolean {
  return /^magnet:\?/i.test(value) && /[?&]xt=urn:bt(ih|mh):/i.test(value)
}

async function fetchMagnet(url: URL): Promise<string> {
  const res = await jackettFetch(url, { redirect: 'manual', timeoutMs: env.MAGNET_TIMEOUT_MS })

  // When the indexer's download turns out to be a magnet (1337x and most public
  // sites), Jackett answers with a redirect to it instead of a file.
  if (res.status >= 300 && res.status < 400) {
    await res.body?.cancel()
    const location = res.headers.get('location') ?? ''
    if (isMagnet(location)) return location
    throw new MagnetError('NO_MAGNET', 'Jackett redirected somewhere other than a magnet')
  }

  const body = await readCapped(res, MAX_TORRENT_BYTES)
  const text = new TextDecoder().decode(body.subarray(0, 7))
  if (text === 'magnet:') {
    const magnet = new TextDecoder().decode(body).trim()
    if (isMagnet(magnet)) return magnet
    throw new MagnetError('NO_MAGNET', 'Jackett returned a malformed magnet')
  }

  let meta
  try {
    meta = parseTorrent(body)
  } catch (err) {
    if (err instanceof TorrentParseError) {
      throw new MagnetError('NOT_A_TORRENT', `Jackett returned something other than a torrent: ${err.message}`, {
        cause: err,
      })
    }
    throw err
  }
  if (meta.isPrivate) throw new MagnetError('PRIVATE', 'Torrent is private-flagged')
  if (!meta.btih && !meta.btmh) throw new MagnetError('NO_MAGNET', 'Torrent has no usable info hash')
  return toMagnet(meta)
}

async function readCapped(res: Response, max: number): Promise<Uint8Array> {
  const tooLarge = () => new MagnetError('TOO_LARGE', `Download exceeds ${max} bytes`)
  if (Number(res.headers.get('content-length')) > max) {
    await res.body?.cancel()
    throw tooLarge()
  }
  if (!res.body) return new Uint8Array()

  const chunks: Uint8Array[] = []
  let total = 0
  for await (const chunk of res.body) {
    total += chunk.byteLength
    if (total > max) throw tooLarge() // leaving the loop cancels the stream
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}
