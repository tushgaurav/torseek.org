import { createApp } from './app.ts'
import { env } from './env.ts'
import { logJackettStatus } from './lib/status.ts'

const app = createApp()

app.listen(env.PORT, () => {
  console.log(`[api] listening on http://localhost:${env.PORT}`)
  void logJackettStatus()
})
