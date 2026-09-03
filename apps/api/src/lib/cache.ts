/**
 * Minimal async cache contract so the in-process implementation below can be
 * swapped for a shared store (Redis/Valkey) if the API ever runs as more than
 * one replica. Search results are throwaway and short-lived, so a Map is the
 * right default.
 */
export interface AsyncCache<V> {
  get(key: string): Promise<V | undefined>
  set(key: string, value: V): Promise<void>
  delete(key: string): Promise<void>
  /**
   * Return the cached value or run `load` once and cache its result. Concurrent
   * callers for the same key share a single in-flight load.
   */
  getOrLoad(key: string, load: () => Promise<V>): Promise<{ value: V; cached: boolean }>
}

type Entry<V> = { value: V; expiresAt: number }

export class MemoryCache<V> implements AsyncCache<V> {
  private readonly entries = new Map<string, Entry<V>>()
  private readonly inflight = new Map<string, Promise<V>>()

  constructor(private readonly opts: { ttlMs: number; maxEntries: number }) {}

  async get(key: string): Promise<V | undefined> {
    const entry = this.entries.get(key)
    if (!entry) return undefined
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key)
      return undefined
    }
    // Re-insert so Map iteration order doubles as LRU order.
    this.entries.delete(key)
    this.entries.set(key, entry)
    return entry.value
  }

  async set(key: string, value: V): Promise<void> {
    this.entries.delete(key)
    this.entries.set(key, { value, expiresAt: Date.now() + this.opts.ttlMs })
    this.evict()
  }

  async delete(key: string): Promise<void> {
    this.entries.delete(key)
  }

  async getOrLoad(key: string, load: () => Promise<V>): Promise<{ value: V; cached: boolean }> {
    const hit = await this.get(key)
    if (hit !== undefined) return { value: hit, cached: true }

    let pending = this.inflight.get(key)
    if (!pending) {
      pending = load()
        .then(async (value) => {
          await this.set(key, value)
          return value
        })
        .finally(() => this.inflight.delete(key))
      this.inflight.set(key, pending)
    }
    return { value: await pending, cached: false }
  }

  get size(): number {
    return this.entries.size
  }

  private evict(): void {
    const now = Date.now()
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt <= now) this.entries.delete(key)
    }
    while (this.entries.size > this.opts.maxEntries) {
      const oldest = this.entries.keys().next().value
      if (oldest === undefined) break
      this.entries.delete(oldest)
    }
  }
}
