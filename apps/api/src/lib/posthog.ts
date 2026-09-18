import type { IncomingHttpHeaders } from 'node:http'

import { PostHog } from 'posthog-node'

import { env } from '../env.ts'

export const posthog = env.POSTHOG_PROJECT_TOKEN
  ? new PostHog(env.POSTHOG_PROJECT_TOKEN, {
      host: env.POSTHOG_HOST,
      enableExceptionAutocapture: true,
    })
  : null

const DISTINCT_HEADER = 'x-posthog-distinct-id'
const SESSION_HEADER = 'x-posthog-session-id'

function header(headers: IncomingHttpHeaders, name: string): string | undefined {
  const value = headers[name]
  if (Array.isArray(value)) return value[0]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

export function distinctIdFrom(headers: IncomingHttpHeaders): string {
  return header(headers, DISTINCT_HEADER) ?? 'anonymous'
}

export function sessionIdFrom(headers: IncomingHttpHeaders): string | undefined {
  return header(headers, SESSION_HEADER)
}

export function capture(
  event: string,
  distinctId: string,
  properties: Record<string, unknown>,
  sessionId?: string,
): void {
  posthog?.capture({
    distinctId,
    event,
    properties: sessionId ? { ...properties, $session_id: sessionId } : properties,
  })
}
