import { Router } from 'express'

import { env, tmdbEnabled } from '../env.ts'
import { JackettError } from '../lib/jackett.ts'
import { parseBaseQuery } from '../lib/params.ts'
import { capture, distinctIdFrom, posthog, sessionIdFrom } from '../lib/posthog.ts'
import { runSearch } from '../lib/search.ts'
import { resolveTitlePanel, type PanelResult } from '../lib/title-panel.ts'
import { IMAGE_FILE, IMAGE_SIZES } from '../lib/tmdb.ts'

export const metaRouter: Router = Router()

/**
 * Title panel for a query. The web app calls this alongside /api/search; both
 * share the same cached (or in-flight) result set, so Jackett is hit once.
 * Never fails the page: anything that goes wrong is just "no panel".
 */
metaRouter.get('/', async (req, res) => {
  const parsed = parseBaseQuery(req.query as Record<string, unknown>)
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error, code: 'BAD_REQUEST' })
    return
  }
  if (!tmdbEnabled) {
    res.json({ panel: null, reason: 'disabled' } satisfies PanelResult)
    return
  }

  const { q, indexers } = parsed
  const distinctId = distinctIdFrom(req.headers)
  const started = performance.now()
  let result: PanelResult
  try {
    const { outcome } = await runSearch({ query: q, indexers })
    result = await resolveTitlePanel(q, outcome.items)
  } catch (err) {
    // Search failures are already reported by /api/search; only report the rest here.
    if (!(err instanceof JackettError)) {
      console.error(`[api] title panel for "${q}" failed:`, err instanceof Error ? err.message : err)
      posthog?.captureException(err, distinctId)
    }
    result = { panel: null, reason: 'error' }
  }

  capture(
    'title_panel_resolved',
    distinctId,
    {
      query: q,
      query_normalized: q.toLowerCase(),
      reason: result.reason,
      shown: result.panel !== null,
      kind: result.panel?.kind ?? null,
      tmdb_id: result.panel?.tmdb_id ?? null,
      votes: result.panel?.match.votes ?? null,
      of: result.panel?.match.of ?? null,
      discarded: result.panel?.match.discarded ?? null,
      took_ms: Math.round(performance.now() - started),
    },
    sessionIdFrom(req.headers),
  )
  res.json(result)
})

/**
 * Poster proxy so visitors' browsers never contact TMDB (no IP or Referer
 * leak). TMDB image paths are content-addressed, so responses are immutable.
 */
metaRouter.get('/image/:size/:file', async (req, res) => {
  const { size, file } = req.params
  if (!tmdbEnabled || !IMAGE_SIZES.has(size) || !IMAGE_FILE.test(file)) {
    res.status(404).end()
    return
  }

  let upstream: Response
  try {
    upstream = await fetch(`${env.TMDB_IMAGE_URL}/${size}/${file}`, {
      signal: AbortSignal.timeout(env.TMDB_TIMEOUT_MS * 2),
    })
  } catch {
    res.status(504).end()
    return
  }
  const type = upstream.headers.get('content-type') ?? ''
  if (!upstream.ok || !type.startsWith('image/')) {
    res.status(upstream.status === 404 ? 404 : 502).end()
    return
  }

  res.set({
    'Content-Type': type,
    'Cache-Control': 'public, max-age=2592000, immutable',
    'X-Content-Type-Options': 'nosniff',
  })
  res.send(Buffer.from(await upstream.arrayBuffer()))
})
