import { createApp } from './app.ts'
import { env } from './env.ts'
import { posthog } from './lib/posthog.ts'
import { logJackettStatus } from './lib/status.ts'

const app = createApp()

const server = app.listen(env.PORT, () => {
  console.log(`[api] listening on http://localhost:${env.PORT}`)
  void logJackettStatus()
})

async function shutdown() {
  server.close()
  await posthog?.shutdown()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
