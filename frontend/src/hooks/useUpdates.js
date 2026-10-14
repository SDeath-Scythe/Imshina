import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useBookings, useGroups, useGuideBookings, useRewards } from '../api/hooks'
import { todayISO } from '../utils/helpers'

const SEEN_KEY = 'imshina_seen_updates'
const readSeen = () => { try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')) } catch { return new Set() } }

/**
 * There is no notifications API, so updates are derived from data the API already returns:
 * unlocked rewards, group request decisions, booking status changes and reviews to write.
 * "Seen" state lives in this browser.
 */
export default function useUpdates() {
  const { user } = useAuth()
  const tourist = user?.role === 'Tourist'
  const rewards = useRewards()
  const bookings = useBookings()
  const groups = useGroups()
  const guideBookings = useGuideBookings()
  const [seen, setSeen] = useState(readSeen)

  const items = useMemo(() => {
    if (!user) return []
    const out = []
    if (tourist) {
      for (const r of rewards.data || []) {
        if (r.isUnlocked) out.push({ id: `reward-${r.id}`, kind: 'reward', to: `/rewards/${r.id}`, reward: r })
      }
      const today = todayISO()
      for (const b of bookings.data || []) {
        if (b.canReview) out.push({ id: `review-${b.id}`, kind: 'review', to: `/bookings/${b.id}/review`, booking: b })
        else if (b.status === 'Confirmed' && b.endDate >= today) out.push({ id: `confirmed-${b.id}`, kind: 'confirmed', to: '/bookings', booking: b })
        else if (b.status === 'Cancelled') out.push({ id: `cancelled-${b.id}`, kind: 'cancelled', to: '/bookings', booking: b })
      }
    }
    if (user.role === 'Guide') {
      for (const b of guideBookings.data || []) {
        if (b.status === 'Pending') out.push({ id: `request-${b.id}`, kind: 'request', to: '/guide/bookings', booking: b })
      }
    }
    for (const g of groups.data || []) {
      if (g.myStatus === 'Approved') out.push({ id: `approved-${g.id}`, kind: 'approved', to: `/groups/${g.id}`, group: g })
      if (g.myStatus === 'Rejected') out.push({ id: `rejected-${g.id}`, kind: 'rejected', to: `/groups/${g.id}`, group: g })
    }
    return out.map((x) => ({ ...x, unread: !seen.has(x.id) }))
  }, [user, tourist, rewards.data, bookings.data, groups.data, guideBookings.data, seen])

  // Other mounted copies of this hook (the bell, the desktop rail) re-read when updates are marked seen.
  useEffect(() => {
    const sync = () => setSeen(readSeen())
    window.addEventListener('updates:seen', sync)
    return () => window.removeEventListener('updates:seen', sync)
  }, [])

  const markAllRead = useCallback(() => {
    const next = new Set([...seen, ...items.map((x) => x.id)])
    localStorage.setItem(SEEN_KEY, JSON.stringify([...next]))
    setSeen(next)
    window.dispatchEvent(new Event('updates:seen'))
  }, [seen, items])

  return {
    items,
    unread: items.filter((x) => x.unread).length,
    markAllRead,
    loading: rewards.loading || bookings.loading || groups.loading || guideBookings.loading,
  }
}
