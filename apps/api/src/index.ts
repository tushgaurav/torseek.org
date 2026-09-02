import { createApp } from './app.ts'
import { env } from './env.ts'

const app = createApp()

app.listen(env.PORT, () => {
  console.log(`[api] listening on http://localhost:${env.PORT}`)
  if (!env.JACKETT_API_KEY) {
    console.warn('[api] JACKETT_API_KEY not set; /api/search is serving fixture data')
  }
})
