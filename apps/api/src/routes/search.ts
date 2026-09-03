import { Router } from 'express'

import { isTopLevelCategory } from '../lib/categories.ts'
import { JackettError } from '../lib/jackett.ts'
import { runSearch, searchMode } from '../lib/search.ts'
import { isSortOption, sortItems, type SortOption } from '../lib/sort.ts'

const PAGE_SIZE = 15
const MAX_QUERY_LENGTH = 200

export const searchRouter: Router = Router()

type ParsedQuery =
  | { ok: true; q: string; page: number; sort: SortOption; categories: number[]; indexers: string[] }
  | { ok: false; error: string }

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function csv(value: unknown): string[] {
  return str(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function parseQuery(query: Record<string, unknown>): ParsedQuery {
  const q = str(query.q)
  if (!q) return { ok: false, error: 'Missing required query parameter "q"' }
  if (q.length > MAX_QUERY_LENGTH) return { ok: false, error: `"q" must be at most ${MAX_QUERY_LENGTH} characters` }

  const rawPage = str(query.page)
  const page = rawPage === '' ? 1 : Number(rawPage)
  if (!Number.isInteger(page) || page < 1) return { ok: false, error: '"page" must be a positive integer' }

  const sort = str(query.sort) || 'relevance'
  if (!isSortOption(sort)) return { ok: false, error: `Unknown "sort" value "${sort}"` }

  const categories = csv(query.cat).map(Number)
  if (categories.some((c) => !isTopLevelCategory(c))) {
    return { ok: false, error: '"cat" must be a comma-separated list of top-level category ids (e.g. 2000,5000)' }
  }

  const indexers = csv(query.indexers)
  if (indexers.some((id) => !/^[a-z0-9_-]+$/i.test(id))) {
    return { ok: false, error: '"indexers" must be a comma-separated list of indexer ids' }
  }

  return { ok: true, q, page, sort, categories, indexers }
}

function errorResponse(err: unknown): { status: number; body: { error: string; code: string } } {
  if (err instanceof JackettError) {
    switch (err.code) {
      case 'UNREACHABLE':
        return { status: 503, body: { error: 'Jackett is unreachable', code: 'JACKETT_UNREACHABLE' } }
      case 'TIMEOUT':
        return { status: 503, body: { error: 'Jackett took too long to respond', code: 'JACKETT_TIMEOUT' } }
      case 'UNAUTHORIZED':
        return { status: 502, body: { error: 'Jackett rejected the configured API key', code: 'JACKETT_UNAUTHORIZED' } }
      case 'UPSTREAM':
        return { status: 502, body: { error: 'Jackett returned an unexpected response', code: 'JACKETT_ERROR' } }
    }
  }
  return { status: 500, body: { error: 'Search failed', code: 'INTERNAL' } }
}

searchRouter.get('/', async (req, res) => {
  const parsed = parseQuery(req.query as Record<string, unknown>)
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error, code: 'BAD_REQUEST' })
    return
  }
  const { q, page, sort, categories, indexers } = parsed

  const started = performance.now()
  try {
    const { outcome, cached } = await runSearch({ query: q, categories, indexers })
    const sorted = sortItems(outcome.items, sort)
    const start = (page - 1) * PAGE_SIZE
    res.json({
      page,
      page_size: PAGE_SIZE,
      total_results: sorted.length,
      results: sorted.slice(start, start + PAGE_SIZE),
      meta: {
        mode: searchMode,
        cached,
        took_ms: Math.round(performance.now() - started),
        indexers: outcome.indexers,
      },
    })
  } catch (err) {
    const { status, body } = errorResponse(err)
    const cause = err instanceof Error ? (err.cause instanceof Error ? `${err.message}: ${err.cause.message}` : err.message) : String(err)
    console.error(`[api] search "${q}" failed (${body.code}): ${cause}`)
    res.status(status).json(body)
  }
})
