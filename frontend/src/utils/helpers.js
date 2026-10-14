import { API_ORIGIN } from '../api/client'

// Turns an Axios error (ASP.NET ProblemDetails) into a readable message.
export function errorMessage(err) {
  const data = err?.response?.data
  if (data?.errors) {
    const first = Object.values(data.errors).flat()[0]
    if (first) return first
  }
  if (data?.detail) return data.detail
  if (data?.title) return data.title
  if (err?.code === 'ERR_NETWORK') return 'NETWORK'
  return err?.message || 'Something went wrong.'
}

export const problem = (err) => ({ status: err?.response?.status, ...(err?.response?.data || {}) })

export function imageUrl(url) {
  if (!url) return null
  return url.startsWith('/uploads') ? `${API_ORIGIN}${url}` : url
}

const locale = () => (typeof document !== 'undefined' && document.documentElement.lang === 'ar' ? 'ar-IQ-u-nu-latn' : 'en-GB')

export function formatDate(d, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!d) return ''
  const date = typeof d === 'string' && d.length === 10 ? parseISODate(d) : new Date(d)
  return date.toLocaleDateString(locale(), opts)
}

export const formatShortDate = (d) => formatDate(d, { weekday: 'short', day: 'numeric', month: 'short' })

export function formatRange(start, end) {
  if (!start) return ''
  if (!end || start === end) return formatShortDate(start)
  return `${formatDate(start, { day: 'numeric', month: 'short' })} – ${formatDate(end, { day: 'numeric', month: 'short' })}`
}

export function formatPrice(n) {
  return `$${Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

// Dates are handled as local calendar days ("2026-10-15"), never as UTC instants.
export function toISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
export function parseISODate(s) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const todayISO = () => toISODate(new Date())
export function addDaysISO(iso, n) {
  const d = parseISODate(iso)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}
export const daysInclusive = (a, b) => Math.round((parseISODate(b) - parseISODate(a)) / 86400000) + 1

// ---------- geo ----------
export function distanceMeters(a, b) {
  if (!a || !b) return null
  const R = 6371000
  const rad = (x) => (x * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
export const placePoint = (p) => (p ? { lat: p.latitude, lng: p.longitude } : null)
export function formatDistance(m) {
  if (m == null) return ''
  if (m < 1000) return `${Math.max(10, Math.round(m / 10) * 10)} m`
  if (m < 20000) return `${(m / 1000).toFixed(1)} km`
  return `${Math.round(m / 1000)} km`
}
// ~4.8 km/h; beyond 3 km people drive, so we stop quoting a walk.
export const walkMinutes = (m) => (m == null || m > 3000 ? null : Math.max(1, Math.round(m / 80)))

// ---------- people ----------
export function initials(name = '?') {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'
}
const AVATAR_TINTS = ['#9FB1E0', '#F2C66B', '#B9D5C4', '#E9C3D3', '#D9C3A0', '#C4D7E6']
export const avatarTint = (name = '') => AVATAR_TINTS[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_TINTS.length]
export const firstName = (name = '') => name.trim().split(/\s+/)[0] || name

// Each governorate stamps in its own ink.
const INKS = { baghdad: '#7A2E1F', najaf: '#0F5E54', karbala: '#2F6B4F', babylon: '#1D3A8C' }
const FALLBACK_INKS = ['#1D3A8C', '#7A2E1F', '#0F5E54', '#2F6B4F', '#5E3D0B']
export function govInk(name = '', id = 0) {
  return INKS[name.toLowerCase()] || FALLBACK_INKS[id % FALLBACK_INKS.length]
}

// Stable short code for a reward coupon, so staff can read it aloud.
export function couponCode(userId, rewardId) {
  const n = (Number(userId) * 7919 + Number(rewardId) * 104729) % 1679616
  return n.toString(36).toUpperCase().padStart(4, '7')
}

// Languages offered when a guide sets up their profile.
export const GUIDE_LANGS = ['English', 'Arabic', 'Kurdish', 'Persian', 'Turkish', 'German', 'French', 'Urdu']
