import { useEffect, useSyncExternalStore } from 'react'

/**
 * SHOWN WHEN THE SEARCH IS IN FLIGHT
 * 
 * StrictMode's double effects and overlapping reporters can't leave it stuck.
 */

let active = 0
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useReportSearching(searching: boolean) {
  useEffect(() => {
    if (!searching) return
    active += 1
    emit()
    return () => {
      active -= 1
      emit()
    }
  }, [searching])
}

export function useIsSearching(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => active > 0,
    () => false,
  )
}
