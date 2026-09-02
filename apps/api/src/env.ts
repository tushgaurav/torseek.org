// Bun loads .env files automatically; this module just validates and types them.

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback
}

export const env = {
  PORT: Number(optional('PORT', '8000')),
  CORS_ORIGIN: optional('CORS_ORIGIN', 'http://localhost:5173'),
  JACKETT_URL: optional('JACKETT_URL', 'http://localhost:9117'),
  JACKETT_API_KEY: optional('JACKETT_API_KEY', ''),
} as const
