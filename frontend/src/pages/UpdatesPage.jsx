import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { BackButton, Empty, SkeletonRows } from '../components/ui'
import { useI18n } from '../i18n/I18nContext'
import useUpdates from '../hooks/useUpdates'
import { formatRange } from '../utils/helpers'

const LOOK = {
  reward: { icon: 'gift', bg: 'var(--gold)', fg: 'var(--ink)' },
  review: { icon: 'star', bg: 'var(--ochre-soft)', fg: 'var(--ochre)' },
  confirmed: { icon: 'calendar', bg: 'var(--green)', fg: '#fff' },
  cancelled: { icon: 'close', bg: 'var(--clay-soft)', fg: 'var(--clay)' },
  approved: { icon: 'users', bg: 'var(--lapis)', fg: 'var(--gold)' },
  rejected: { icon: 'users', bg: 'var(--paper-2)', fg: 'var(--muted)' },
  request: { icon: 'ticket', bg: 'var(--gold)', fg: 'var(--ink)' },
}

export default function UpdatesPage() {
  const { t } = useI18n()
  const { items, unread, markAllRead, loading } = useUpdates()
  const markRef = useRef(markAllRead)
  markRef.current = markAllRead
  // Everything on screen counts as seen once the traveller leaves the page.
  // (The time check skips React StrictMode's instant dev-only unmount.)
  useEffect(() => {
    const mountedAt = Date.now()
    return () => { if (Date.now() - mountedAt > 800) markRef.current() }
  }, [])

  const text = (x) => {
    switch (x.kind) {
      case 'reward': return [t('updates.reward'), t('updates.rewardText', { reward: x.reward.title, partner: x.reward.partnerName })]
      case 'review': return [t('updates.review', { name: x.booking.guideName }), t('updates.reviewText')]
      case 'confirmed': return [t('updates.confirmed'), `${x.booking.guideName || x.booking.tripTitle} · ${formatRange(x.booking.startDate, x.booking.endDate)}`]
      case 'cancelled': return [t('updates.cancelled'), `${x.booking.guideName || x.booking.tripTitle} · ${formatRange(x.booking.startDate, x.booking.endDate)}`]
      case 'request': return [t(x.booking.tripTitle ? 'updates.tripRequest' : 'updates.request'), `${x.booking.touristName}${x.booking.tripTitle ? ` · ${x.booking.tripTitle}` : ''} · ${formatRange(x.booking.startDate, x.booking.endDate)}`]
      case 'approved': return [t('updates.approved'), x.group.name]
      case 'rejected': return [t('updates.rejected'), x.group.name]
      default: return ['', '']
    }
  }

  return (
    <div className="page">
      <header className="row" style={{ '--gap': '12px' }}>
        <BackButton />
        <h1 className="grow">{t('updates.title')}</h1>
        {unread > 0 && <button type="button" className="link-btn" onClick={markAllRead}>{t('updates.markRead')}</button>}
      </header>

      {loading && items.length === 0 ? <SkeletonRows n={4} h={68} /> : items.length === 0 ? (
        <Empty icon="bell" title={t('updates.emptyTitle')}>{t('updates.emptyText')}</Empty>
      ) : (
        <div className="stack" style={{ '--gap': '4px' }}>
          {items.map((x) => {
            const [title, body] = text(x)
            const look = LOOK[x.kind]
            return (
              <Link key={x.id} to={x.to} className="row" style={{ '--gap': '12px', padding: '12px 10px', borderRadius: 16, textDecoration: 'none', color: 'inherit', background: x.unread ? 'var(--surface)' : 'transparent' }}>
                <span style={{ width: 44, height: 44, borderRadius: 22, background: look.bg, color: look.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={look.icon} size={20} /></span>
                <span className="grow stack" style={{ '--gap': '0px' }}>
                  <b style={{ fontSize: 14.5 }}>{title}</b>
                  <span className="small muted">{body}</span>
                </span>
                {x.unread && <span role="img" aria-label={t('updates.new')} style={{ width: 10, height: 10, borderRadius: 5, background: 'var(--lapis)', flexShrink: 0 }} />}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
