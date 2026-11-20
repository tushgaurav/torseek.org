import cors from 'cors'
import express from 'express'

import { env } from './env.ts'
import { healthRouter } from './routes/health.ts'
import { indexersRouter } from './routes/indexers.ts'
import { magnetRouter } from './routes/magnet.ts'
import { metaRouter } from './routes/meta.ts'
import { searchRouter } from './routes/search.ts'
import { statusRouter } from './routes/status.ts'

export function createApp() {
  const app = express()

  // In production Caddy (on the private Docker network) sets X-Forwarded-For;
  // trusting private-range hops gives req.ip the real client for rate limiting.
  app.set('trust proxy', 'loopback, linklocal, uniquelocal')

  app.use(cors({ origin: env.CORS_ORIGIN }))
  app.use(express.json())

  app.use('/api/health', healthRouter)
  app.use('/api/status', statusRouter)
  app.use('/api/indexers', indexersRouter)
  app.use('/api/search', searchRouter)
  app.use('/api/meta', metaRouter)
  app.use('/api/magnet', magnetRouter)

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' })
  })

  return app
}
