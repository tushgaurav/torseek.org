import { Router } from 'express'

import { JackettError } from '../lib/jackett.ts'
import { isMagnetCached, MagnetError, resolveMagnet } from '../lib/magnet.ts'
import { openMagnetToken } from '../lib/magnet-token.ts'
import { capture, distinctIdFrom, sessionIdFrom } from '../lib/posthog.ts'
import { RateLimiter } from '../lib/rate-limit.ts'

export const magnetRouter: Router = Router()

// Only lookups that reach Jackett (and through it, the indexer) count; cache hits are free.
const limiter = new RateLimiter({ windowMs: 60_000, max: 20 })

function errorResponse(err: unknown): { status: number; code: string; reason: string } {
  if (err instanceof JackettError) {
    if (err.code === 'UNAUTHORIZED') return { status: 502, code: 'JACKETT_UNAUTHORIZED', reason: err.code }
    return { status: err.code === 'TIMEOUT' ? 504 : 502, code: 'MAGNET_UNAVAILABLE', reason: err.code }
  }
  if (err instanceof MagnetError) {
    return { status: err.code === 'PRIVATE' ? 422 : 502, code: 'MAGNET_UNAVAILABLE', reason: err.code }
  }
  return { status: 500, code: 'INTERNAL', reason: 'INTERNAL' }
}

/**
 * Turns a result's magnetToken (see lib/magnet-token.ts) into a magnet URI,
 * fetching the torrent through Jackett the first time anyone asks for it.
 */
magnetRouter.get('/:token', async (req, res) => {
  const target = openMagnetToken(req.params.token)
  if (!target) {
    res.status(400).json({ error: 'Invalid magnet token', code: 'BAD_REQUEST' })
    return
  }
  const indexer = target.url.pathname.match(/\/dl\/([^/]+)/)?.[1] ?? null

  if (!(await isMagnetCached(target))) {
    const retryAfter = limiter.take(req.ip ?? 'unknown')
    if (retryAfter > 0) {
      res.set('Retry-After', String(retryAfter))
      res.status(429).json({ error: 'Too many magnet lookups; try again shortly', code: 'RATE_LIMITED' })
      return
    }
  }

  const distinctId = distinctIdFrom(req.headers)
  const started = performance.now()
  try {
    const { magnet, cached } = await resolveMagnet(target)
    capture(
      'magnet_resolved',
      distinctId,
      { indexer, ok: true, cached, took_ms: Math.round(performance.now() - started) },
      sessionIdFrom(req.headers),
    )
    res.set('Cache-Control', 'private, max-age=86400')
    res.json({ magnet })
  } catch (err) {
    const { status, code, reason } = errorResponse(err)
    // The path is safe to log: the API key only goes into the query string.
    const cause = err instanceof Error ? err.message : String(err)
    console.warn(`[api] magnet for ${indexer ?? target.url.pathname} failed (${reason}): ${cause}`)
    capture(
      'magnet_resolved',
      distinctId,
      { indexer, ok: false, reason, took_ms: Math.round(performance.now() - started) },
      sessionIdFrom(req.headers),
    )
    res.status(status).json({ error: 'Could not get a magnet link for this result', code })
  }
})
