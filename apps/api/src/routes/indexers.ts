import { Router } from 'express'

import { TOP_LEVEL_CATEGORIES } from '../lib/categories.ts'
import { JackettError } from '../lib/jackett.ts'
import { getIndexers, searchMode } from '../lib/search.ts'

export const indexersRouter: Router = Router()

indexersRouter.get('/', async (_req, res) => {
  try {
    const { indexers, cached } = await getIndexers()
    res.json({ mode: searchMode, cached, indexers, categories: TOP_LEVEL_CATEGORIES })
  } catch (err) {
    const code = err instanceof JackettError ? `JACKETT_${err.code}` : 'INTERNAL'
    console.error(`[api] indexer list failed (${code}):`, err instanceof Error ? err.message : err)
    res.status(err instanceof JackettError ? 503 : 500).json({ error: 'Could not load indexers', code })
  }
})
