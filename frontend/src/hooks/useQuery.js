import { useCallback, useEffect, useRef, useState } from 'react'

// Tiny stale-while-revalidate cache. Going back to a page shows its last data instantly
// and refreshes quietly in the background, so the app never flashes empty screens.
const cache = new Map()
const listeners = new Set()

// Every mount refetches anyway; this tells pages that are on screen right now to refresh.
export function invalidate(prefix = '') {
  listeners.forEach((fn) => fn(prefix))
}

export function clearCache() {
  cache.clear()
}

/**
 * useQuery(key, fetcher) — key: string, or null to skip.
 * Returns { data, error, loading, refreshing, reload, setData }. Data always belongs to the current key.
 */
export default function useQuery(key, fetcher) {
  const [state, setState] = useState(() => {
    const hit = key != null ? cache.get(key) : undefined
    return { key, data: hit?.data ?? null, error: null, loading: key != null && !hit, refreshing: !!hit }
  })
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher
  const keyRef = useRef(key)
  keyRef.current = key

  const run = useCallback(async () => {
    if (key == null) return
    const cached = cache.get(key)
    setState({ key, data: cached?.data ?? null, error: null, loading: !cached, refreshing: !!cached })
    try {
      const data = await fetcherRef.current()
      cache.set(key, { data, at: Date.now() })
      if (keyRef.current === key) setState({ key, data, error: null, loading: false, refreshing: false })
    } catch (error) {
      if (keyRef.current === key) setState((s) => ({ ...s, key, error, loading: false, refreshing: false }))
    }
  }, [key])

  useEffect(() => { run() }, [run])

  useEffect(() => {
    if (key == null) return undefined
    const onInvalidate = (prefix) => { if (key.startsWith(prefix)) run() }
    listeners.add(onInvalidate)
    return () => { listeners.delete(onInvalidate) }
  }, [key, run])

  const setData = useCallback((updater) => {
    setState((s) => {
      const data = typeof updater === 'function' ? updater(s.data) : updater
      if (key != null) cache.set(key, { data, at: Date.now() })
      return { ...s, key, data }
    })
  }, [key])

  // Between a key change and the effect that loads it, answer from the cache for the new key.
  if (state.key !== key) {
    const hit = key != null ? cache.get(key) : undefined
    return { data: hit?.data ?? null, error: null, loading: key != null && !hit, refreshing: false, reload: run, setData }
  }
  return { data: state.data, error: state.error, loading: state.loading, refreshing: state.refreshing, reload: run, setData }
}
