import { useEffect, useState } from 'react'

import { useIsSearching } from '@/lib/search-activity'
import { cn } from '@/lib/utils'

/** Cached re-sorts and page flips return faster than this; don't flash for them. */
const SHOW_DELAY_MS = 150
/** Matches the opacity transition below, so the band keeps moving while it fades. */
const FADE_MS = 400

/**
 * A soft band of light gliding back and forth along the nav's bottom border
 * while a search is in flight (see `search-scanner` in index.css). Render
 * inside a positioned element; it overlays a 2px bottom border.
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
        // A size container so the scanner can travel exactly the line's width (100cqw).
        // No overflow clipping: the scanner stays inside, and its glow should spill.
        'pointer-events-none absolute inset-x-0 -bottom-0.5 h-0.5 @container transition-opacity duration-400',
        visible ? 'opacity-100' : 'opacity-0',
      )}
    >
      {mounted && <div className="search-scanner absolute inset-y-0 left-0" />}
    </div>
  )
}
