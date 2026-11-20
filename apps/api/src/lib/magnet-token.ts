import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

import { env } from '../env.ts'

/**
 * Opaque handle for a result whose magnet Jackett can only produce on demand.
 * It seals the Jackett download path (API key stripped) with AES-256-GCM, so
 * the browser learns nothing about Jackett and cannot point the API at any
 * other URL. Stateless: tokens survive restarts and search-cache expiry.
 */

type Payload = {
  /** Jackett path and query, without the API key; resolved against JACKETT_URL. */
  u: string
  /** Stable per-torrent cache key. Jackett re-encrypts download paths on every search, so they make poor keys. */
  k: string
}

const IV_BYTES = 12
const TAG_BYTES = 16
const MAX_TOKEN_LENGTH = 8192

// Derived from the Jackett key: already a server-only secret, and shared by every replica.
const key = createHash('sha256').update('torseek magnet-token v1\0').update(env.JACKETT_API_KEY).digest()

export function sealMagnetToken(jackettLink: string, cacheId: string): string | null {
  let url: URL
  try {
    url = new URL(jackettLink)
  } catch {
    return null
  }
  url.searchParams.delete('jackett_apikey')
  url.searchParams.delete('apikey')
  const payload: Payload = {
    u: url.pathname + url.search,
    k: createHash('sha256').update(cacheId).digest('base64url').slice(0, 22),
  }

  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const sealed = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()])
  return Buffer.concat([iv, sealed, cipher.getAuthTag()]).toString('base64url')
}

export type MagnetTarget = { url: URL; cacheKey: string }

/** Null for anything not sealed by this server (tampered, truncated, or made with another key). */
export function openMagnetToken(token: string): MagnetTarget | null {
  if (token.length > MAX_TOKEN_LENGTH || !/^[\w-]+$/.test(token)) return null
  const raw = Buffer.from(token, 'base64url')
  if (raw.length <= IV_BYTES + TAG_BYTES) return null

  try {
    const decipher = createDecipheriv('aes-256-gcm', key, raw.subarray(0, IV_BYTES))
    decipher.setAuthTag(raw.subarray(raw.length - TAG_BYTES))
    const plain = Buffer.concat([decipher.update(raw.subarray(IV_BYTES, raw.length - TAG_BYTES)), decipher.final()])
    const payload = JSON.parse(plain.toString('utf8')) as Payload
    if (typeof payload.u !== 'string' || !/^\/(?!\/)/.test(payload.u) || typeof payload.k !== 'string') return null

    // Always Jackett's origin, whatever host Jackett put in the link it handed out.
    const base = new URL(env.JACKETT_URL)
    const url = new URL(payload.u, base.origin)
    if (url.origin !== base.origin) return null
    url.searchParams.set('jackett_apikey', env.JACKETT_API_KEY)
    return { url, cacheKey: payload.k }
  } catch {
    return null
  }
}
