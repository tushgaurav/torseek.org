import cors from 'cors'
import express from 'express'

import { env } from './env.ts'
import { healthRouter } from './routes/health.ts'
import { searchRouter } from './routes/search.ts'

export function createApp() {
  const app = express()

  app.use(cors({ origin: env.CORS_ORIGIN }))
  app.use(express.json())

  app.use('/api/health', healthRouter)
  app.use('/api/search', searchRouter)

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' })
  })

  return app
}
