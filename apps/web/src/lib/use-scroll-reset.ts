import { useEffect } from 'react'

/**
 * React Router keeps the scroll position between pages; reset it whenever
 * `key` changes, or honour a deep link to a section if one was shared.
 */
export function useScrollReset(key: unknown) {
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    const target = hash ? document.getElementById(hash) : null
    if (target) target.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [key])
}
