import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

// Location is only requested after the traveller asks for something that needs it
// (never on page load). If they already granted it before, we quietly start watching.
const GeoContext = createContext(null)
const supported = typeof navigator !== 'undefined' && 'geolocation' in navigator

function toPos(p) {
  return { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy, at: p.timestamp }
}

export function GeoProvider({ children }) {
  const [position, setPosition] = useState(null)
  const [status, setStatus] = useState(supported ? 'idle' : 'unavailable')
  const watchId = useRef(null)

  const startWatch = useCallback(() => {
    if (!supported || watchId.current != null) return
    watchId.current = navigator.geolocation.watchPosition(
      (p) => { setPosition(toPos(p)); setStatus('ok') },
      (e) => { if (e.code === 1) setStatus('denied') },
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 },
    )
  }, [])

  useEffect(() => {
    if (!supported || !navigator.permissions?.query) return undefined
    let perm
    const onChange = () => {
      if (perm.state === 'granted') startWatch()
      if (perm.state === 'denied') setStatus('denied')
    }
    navigator.permissions.query({ name: 'geolocation' }).then((p) => {
      perm = p
      onChange()
      p.addEventListener?.('change', onChange)
    }).catch(() => {})
    return () => {
      perm?.removeEventListener?.('change', onChange)
    }
  }, [startWatch])

  useEffect(() => () => {
    if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current)
  }, [])

  // One accurate, fresh fix — used when collecting a stamp.
  const locate = useCallback(() => new Promise((resolve, reject) => {
    if (!supported) { setStatus('unavailable'); reject(Object.assign(new Error('unavailable'), { code: 0 })); return }
    setStatus('locating')
    navigator.geolocation.getCurrentPosition(
      (p) => { const pos = toPos(p); setPosition(pos); setStatus('ok'); startWatch(); resolve(pos) },
      (e) => { setStatus(e.code === 1 ? 'denied' : 'error'); reject(e) },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
    )
  }), [startWatch])

  const value = useMemo(() => ({ position, status, locate, supported }), [position, status, locate])
  return <GeoContext.Provider value={value}>{children}</GeoContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGeo() {
  const ctx = useContext(GeoContext)
  if (!ctx) throw new Error('useGeo must be used inside GeoProvider')
  return ctx
}
