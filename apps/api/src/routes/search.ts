import { Router } from 'express'

import { env } from '../env.ts'
import { normalizeItem, parseTorznab, type RawItem, type TorrentItem } from '../lib/torznab.ts'

const PAGE_SIZE = 15

export const searchRouter: Router = Router()

async function searchJackett(query: string): Promise<TorrentItem[]> {
  const url = new URL('/api/v2.0/indexers/all/results/torznab/api', env.JACKETT_URL)
  url.searchParams.set('apikey', env.JACKETT_API_KEY)
  url.searchParams.set('t', 'search')
  url.searchParams.set('q', query)

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Jackett responded with ${res.status}`)
  }
  return parseTorznab(await res.text()).map(normalizeItem)
}

/**
 * Dev fallback when Jackett isn't configured: serve a captured torznab
 * response so the frontend has realistic data to render.
 */
async function searchFixture(query: string): Promise<TorrentItem[]> {
  const raw = (await Bun.file(new URL('../../fixtures/sample-results.json', import.meta.url)).json()) as RawItem[]
  const items = raw.map(normalizeItem)
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  const matches = items.filter((item) => words.some((w) => item.title.toLowerCase().includes(w)))
  return matches.length > 0 ? matches : items
}

searchRouter.get('/', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
  const page = Math.max(1, Number(req.query.page) || 1)

  if (!q) {
    res.status(400).json({ error: 'Missing required query parameter "q"' })
    return
  }

  try {
    const items = env.JACKETT_API_KEY ? await searchJackett(q) : await searchFixture(q)
    const start = (page - 1) * PAGE_SIZE
    res.json({
      page,
      page_size: PAGE_SIZE,
      total_results: items.length,
      results: items.slice(start, start + PAGE_SIZE),
    })
  } catch (err) {
    console.error('[api] search failed:', err)
    res.status(502).json({ error: 'Search upstream failed' })
  }
})
