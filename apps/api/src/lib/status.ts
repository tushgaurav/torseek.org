import { JackettError, jackettHost, listIndexers } from './jackett.ts'
import { searchMode, type SearchMode } from './search.ts'

export type JackettStatus = {
  host: string
  reachable: boolean
  latency_ms: number | null
  configured_indexers: number | null
  error?: { code: string; message: string }
}

export type ApiStatus = {
  mode: SearchMode
  jackett: JackettStatus | null
}

/** Live probe of Jackett; never includes the API key. */
export async function checkJackett(): Promise<ApiStatus> {
  if (searchMode === 'fixture') return { mode: 'fixture', jackett: null }

  const started = performance.now()
  try {
    const indexers = await listIndexers()
    return {
      mode: 'jackett',
      jackett: {
        host: jackettHost(),
        reachable: true,
        latency_ms: Math.round(performance.now() - started),
        configured_indexers: indexers.length,
      },
    }
  } catch (err) {
    const code = err instanceof JackettError ? err.code : 'UNKNOWN'
    const message = err instanceof Error ? err.message : String(err)
    return {
      mode: 'jackett',
      jackett: {
        host: jackettHost(),
        reachable: code !== 'UNREACHABLE' && code !== 'TIMEOUT',
        latency_ms: null,
        configured_indexers: null,
        error: { code, message },
      },
    }
  }
}

/** Startup diagnostics so a misconfigured deployment is obvious in the logs. */
export async function logJackettStatus(): Promise<void> {
  const status = await checkJackett()
  if (status.mode === 'fixture') {
    console.warn('[api] JACKETT_API_KEY not set; /api/search is serving fixture data')
    return
  }
  const j = status.jackett!
  if (j.error) {
    console.warn(`[api] Jackett at ${j.host}: ${j.error.code} - ${j.error.message}`)
  } else if (j.configured_indexers === 0) {
    console.warn(`[api] Jackett at ${j.host} is reachable but has no configured indexers; searches will return nothing`)
  } else {
    console.log(`[api] Jackett at ${j.host}: ${j.configured_indexers} indexers configured (${j.latency_ms}ms)`)
  }
}
