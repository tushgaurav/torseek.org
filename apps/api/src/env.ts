// Bun loads .env files automatically; this module just validates and types them.

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback
}

function integer(name: string, fallback: number): number {
  const raw = process.env[name]
  if (raw === undefined || raw === '') return fallback
  const n = Number(raw)
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(`[api] ${name} must be a positive integer, got "${raw}"`)
  }
  return n
}

function flag(name: string): boolean {
  return /^(1|true|yes)$/i.test(process.env[name] ?? '')
}

const JACKETT_URL = optional('JACKETT_URL', 'http://localhost:9117')
const JACKETT_API_KEY = optional('JACKETT_API_KEY', '').trim()

if (flag('REQUIRE_JACKETT') && !JACKETT_API_KEY) {
  throw new Error('[api] REQUIRE_JACKETT is set but JACKETT_API_KEY is empty; refusing to serve fixture data')
}

if (JACKETT_API_KEY) {
  let parsed: URL
  try {
    parsed = new URL(JACKETT_URL)
  } catch {
    throw new Error(`[api] JACKETT_URL is not a valid URL: "${JACKETT_URL}"`)
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`[api] JACKETT_URL must use http or https, got "${parsed.protocol}"`)
  }
}

export const env = {
  PORT: integer('PORT', 8000),
  CORS_ORIGIN: optional('CORS_ORIGIN', 'http://localhost:5173'),
  JACKETT_URL,
  JACKETT_API_KEY,
  /** Upper bound for a single round-trip to Jackett. Aggregate searches wait for the slowest indexer. */
  JACKETT_TIMEOUT_MS: integer('JACKETT_TIMEOUT_MS', 30_000),
  /** How long a full result set stays in the API's in-process cache for paging and re-sorting. */
  SEARCH_CACHE_TTL_MS: integer('SEARCH_CACHE_TTL_MS', 600_000),
} as const

/** True when searches go to Jackett rather than the bundled fixture. */
export const jackettEnabled = env.JACKETT_API_KEY.length > 0
