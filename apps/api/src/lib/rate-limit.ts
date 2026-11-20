type Window = { count: number; resetAt: number }

/** Fixed-window counter per key (a client IP). In-process, like MemoryCache. */
export class RateLimiter {
  private readonly windows = new Map<string, Window>()

  constructor(private readonly opts: { windowMs: number; max: number }) {}

  /** Counts one hit. Returns 0 when allowed, else the seconds until the window resets. */
  take(key: string): number {
    const now = Date.now()
    let window = this.windows.get(key)
    if (!window || window.resetAt <= now) {
      if (this.windows.size >= 10_000) this.sweep(now)
      window = { count: 0, resetAt: now + this.opts.windowMs }
      this.windows.set(key, window)
    }
    window.count += 1
    return window.count > this.opts.max ? Math.ceil((window.resetAt - now) / 1000) : 0
  }

  private sweep(now: number): void {
    for (const [key, window] of this.windows) {
      if (window.resetAt <= now) this.windows.delete(key)
    }
  }
}
