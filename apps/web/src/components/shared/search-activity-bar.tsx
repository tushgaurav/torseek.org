import { useEffect, useState } from 'react'

import { useIsSearching } from '@/lib/search-activity'
import { cn } from '@/lib/utils'

/** Cached re-sorts and page flips return faster than this; don't flash for them. */
const SHOW_DELAY_MS = 150
/** Matches the opacity transition below, so the band keeps moving while it fades. */
const FADE_MS = 400

const band =
  'absolute inset-y-0 left-0 w-1/3 animate-search-sweep bg-linear-to-r from-transparent via-primary to-transparent motion-reduce:w-full motion-reduce:animate-pulse'

/**
 * A copper band sweeping along the nav's bottom border while a search is in
 * flight. Render inside a positioned element; it overlays a 2px bottom border.
 */
export function SearchActivityBar() {
  const searching = useIsSearching()
  // 'shown' from SHOW_DELAY_MS after a search starts until FADE_MS after it ends.
  const [phase, setPhase] = useState<'idle' | 'shown'>('idle')

  useEffect(() => {
    const timer = searching
      ? setTimeout(() => setPhase('shown'), SHOW_DELAY_MS)
      : setTimeout(() => setPhase('idle'), FADE_MS)
    return () => clearTimeout(timer)
  }, [searching])

  const mounted = phase === 'shown'
  const visible = mounted && searching

  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-x-0 -bottom-0.5 h-0.5 overflow-hidden transition-opacity duration-400',
        visible ? 'opacity-100' : 'opacity-0',
      )}
    >
      {mounted && (
        <>
          <div className={band} />
          {/* Half a cycle behind (the sweep is 1.6s), so one band enters as the
              other leaves and the line never sits empty between passes. */}
          <div className={cn(band, '[animation-delay:-0.8s] motion-reduce:hidden')} />
        </>
      )}
    </div>
  )
}
