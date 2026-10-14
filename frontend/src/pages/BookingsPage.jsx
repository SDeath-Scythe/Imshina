import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { Avatar, Badge, BackButton, ConfirmSheet, Empty, ErrorState, Segmented, SkeletonRows } from '../components/ui'
import api from '../api/client'
import { invalidate } from '../hooks/useQuery'
import { useToast } from '../context/ToastContext'
import { useI18n } from '../i18n/I18nContext'
import { useBookings } from '../api/hooks'
import { firstName, formatPrice, formatRange, todayISO } from '../utils/helpers'

export const STATUS_TONE = { Pending: 'gold', Confirmed: 'blue', Completed: 'green', Cancelled: 'clay' }

export default function BookingsPage() {
  const { t, te } = useI18n()
  const toast = useToast()
  const bookings = useBookings()
  const [cancelling, setCancelling] = useState(null) // the booking waiting for confirmation
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState('upcoming')
  const today = todayISO()
  const all = bookings.data || []
  const upcoming = all.filter((b) => b.endDate >= today && b.status !== 'Cancelled' && b.status !== 'Completed').sort((a, b) => (a.startDate < b.startDate ? -1 : 1))
  const past = all.filter((b) => !upcoming.includes(b)).sort((a, b) => (a.startDate < b.startDate ? 1 : -1))
  const list = tab === 'upcoming' ? upcoming : past
  // Pending: any time. Confirmed: until the day before it starts (the server checks the same rule).
  const canCancel = (b) => b.status === 'Pending' || (b.status === 'Confirmed' && b.startDate > today)

  const cancel = async () => {
    setBusy(true)
    try {
      await api.post(`/bookings/${cancelling.id}/cancel`)
      toast(t('bookings.cancelledToast'))
      setCancelling(null)
      bookings.reload()
      invalidate('bookings')
    } catch (err) { toast(te(err), 'error') } finally { setBusy(false) }
  }

  return (
    <div className="page">
      <header className="row" style={{ '--gap': '12px' }}>
        <BackButton fallback="/profile" />
        <h1 className="grow">{t('bookings.title')}</h1>
      </header>

      <Segmented label={t('bookings.title')} value={tab} onChange={setTab}
        options={[{ value: 'upcoming', label: t('bookings.upcoming'), sub: upcoming.length }, { value: 'past', label: t('bookings.past'), sub: past.length }]} />

      {bookings.error && <ErrorState error={bookings.error} onRetry={bookings.reload} />}
      {bookings.loading ? <SkeletonRows n={3} h={130} /> : list.length === 0 ? (
        <Empty icon="ticket" title={tab === 'upcoming' ? t('bookings.noneUpcoming') : t('bookings.nonePast')}
          action={tab === 'upcoming' ? <div className="row wrap" style={{ justifyContent: 'center' }}><Link to="/guides" className="btn btn-sm">{t('bookings.findGuide')}</Link><Link to="/trips" className="btn btn-outline btn-sm">{t('bookings.findTrip')}</Link></div> : null}>
          {tab === 'upcoming' ? t('bookings.noneUpcomingText') : null}
        </Empty>
      ) : (
        <div className="stack" style={{ '--gap': '12px' }}>
          {list.map((b) => {
            const isGuide = b.type === 'Guide'
            const title = isGuide ? b.guideName : b.tripTitle
            return (
              <article key={b.id} className="card card-pad stack" style={{ '--gap': '12px' }}>
                <div className="row" style={{ '--gap': '12px' }}>
                  {isGuide ? <Avatar name={b.guideName || '?'} size={48} /> : (
                    <span className="bricks-sm" style={{ width: 48, height: 48, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}><Icon name="route" /></span>
                  )}
                  <Link to={isGuide ? `/guides/${b.guideUserId}` : `/trips/${b.tripId}`} className="grow stack" style={{ '--gap': '0px', textDecoration: 'none', color: 'inherit' }}>
                    <b style={{ fontSize: 15.5 }}>{title}</b>
                    <span className="small muted">{isGuide ? t('bookings.guide') : t('bookings.trip')} · {formatRange(b.startDate, b.endDate)}</span>
                  </Link>
                  <Badge tone={STATUS_TONE[b.status]}>{t(`status.${b.status}`)}</Badge>
                </div>
                <div className="row-between" style={{ paddingTop: 10, borderTop: '1px solid #F0EBDF' }}>
                  <span className="small"><b className="num">{formatPrice(b.totalPrice)}</b> <span className="muted">· {t(`bookings.note${b.status}`)}</span></span>
                  {b.canReview && <Link to={`/bookings/${b.id}/review`} className="btn btn-gold btn-sm">{t('guide.writeReview')}</Link>}
                  {canCancel(b) && <button type="button" className="link-btn" style={{ color: 'var(--clay)', minHeight: 36, padding: '4px 0' }} onClick={() => setCancelling(b)}>{t('bookings.cancel')}</button>}
                </div>
              </article>
            )
          })}
        </div>
      )}

      <ConfirmSheet open={!!cancelling} onClose={() => setCancelling(null)} busy={busy}
        title={t('bookings.cancelTitle')} confirmLabel={t('bookings.cancel')} keepLabel={t('bookings.keep')} onConfirm={cancel}>
        {cancelling && t(cancelling.type === 'Guide' ? 'bookings.cancelTextGuide' : 'bookings.cancelTextTrip', { name: firstName(cancelling.guideName || ''), dates: formatRange(cancelling.startDate, cancelling.endDate) })}
      </ConfirmSheet>
    </div>
  )
}
