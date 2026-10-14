import { useState } from 'react'
import api from '../api/client'
import { useGuideBookings, useTripBookings } from '../api/hooks'
import { invalidate } from '../hooks/useQuery'
import { Avatar, Badge, ConfirmSheet, Empty, ErrorState, Notice, PageTitle, Segmented, SkeletonRows } from '../components/ui'
import { useI18n } from '../i18n/I18nContext'
import { useToast } from '../context/ToastContext'
import { firstName, formatDate, formatPrice, formatRange, todayISO } from '../utils/helpers'
import { STATUS_TONE } from './BookingsPage'

// eslint-disable-next-line react-refresh/only-export-components
/** Splits a guide's bookings into what needs an answer, what's agreed, and what's finished. */
export function inboxGroups(list = [], today = todayISO()) {
  const requests = list.filter((b) => b.status === 'Pending').sort((a, b) => (a.startDate < b.startDate ? -1 : 1))
  const confirmed = list.filter((b) => b.status === 'Confirmed').sort((a, b) => (a.startDate < b.startDate ? -1 : 1))
  const history = list.filter((b) => b.status === 'Completed' || b.status === 'Cancelled').sort((a, b) => (a.startDate < b.startDate ? 1 : -1))
  // Confirmed bookings whose last day has come are waiting to be marked completed.
  const toFinish = confirmed.filter((b) => b.endDate <= today).length
  return { requests, confirmed, history, toFinish }
}

/**
 * The booking inbox for whoever runs a booking: a guide answers requests for themselves (mode "guide"),
 * the Imshina team answers ready-made trip bookings (mode "trips", admins only). Same rules, same screen.
 */
export default function GuideInboxPage({ mode = 'guide' }) {
  const { t, te } = useI18n()
  const toast = useToast()
  const trips = mode === 'trips'
  const guideBookings = useGuideBookings()
  const tripBookings = useTripBookings()
  const bookings = trips ? tripBookings : guideBookings
  const endpoint = trips ? '/admin/trip-bookings' : '/guide/bookings'
  const today = todayISO()
  const { requests, confirmed, history, toFinish } = inboxGroups(bookings.data || [], today)
  const [tab, setTab] = useState(() => (requests.length === 0 && toFinish > 0 ? 'confirmed' : 'requests'))
  const [busy, setBusy] = useState(null)
  const [ask, setAsk] = useState(null) // { booking, status: 'Cancelled' } waiting for confirmation

  const setStatus = async (b, status) => {
    // Read what's needed before the request: the list refreshes once it succeeds.
    const name = firstName(b.touristName)
    const declined = status === 'Cancelled' && b.status === 'Pending'
    setBusy(b.id)
    try {
      await api.put(`${endpoint}/${b.id}/status`, { status })
      toast(status === 'Confirmed' ? t('inbox.acceptedToast', { name })
        : status === 'Completed' ? t(trips ? 'tripInbox.completedToast' : 'inbox.completedToast', { name })
          : declined ? t('inbox.declinedToast') : t('inbox.cancelledToast'))
      setAsk(null)
      bookings.reload()
      invalidate(trips ? 'trip-bookings' : 'guide-bookings')
    } catch (err) { toast(te(err), 'error') } finally { setBusy(null) }
  }

  const list = tab === 'requests' ? requests : tab === 'confirmed' ? confirmed : history
  const empty = {
    requests: [t('inbox.noRequests'), t(trips ? 'tripInbox.noRequestsText' : 'inbox.noRequestsText')],
    confirmed: [t('inbox.noConfirmed'), t('inbox.noConfirmedText')],
    history: [t('inbox.noHistory'), null],
  }[tab]

  return (
    <div className="page">
      <PageTitle title={t(trips ? 'tripInbox.title' : 'inbox.title')} subtitle={t(trips ? 'tripInbox.sub' : 'inbox.sub')} />

      <Segmented label={t('inbox.title')} value={tab} onChange={setTab} options={[
        { value: 'requests', label: t('inbox.requests'), sub: requests.length },
        { value: 'confirmed', label: t('inbox.confirmed'), sub: confirmed.length },
        { value: 'history', label: t('inbox.history'), sub: history.length },
      ]} />

      {tab === 'confirmed' && toFinish > 0 && <Notice tone="info">{t(trips ? 'tripInbox.toFinish' : 'inbox.toFinish', { n: toFinish })}</Notice>}
      {bookings.error && <ErrorState error={bookings.error} onRetry={bookings.reload} />}

      {bookings.loading ? <SkeletonRows n={3} h={150} /> : list.length === 0 ? (
        <Empty icon="ticket" title={empty[0]}>{empty[1]}</Empty>
      ) : (
        <div className="stack" style={{ '--gap': '12px' }}>
          {list.map((b) => {
            const started = b.startDate <= today
            const ended = b.endDate <= today
            const tooLate = b.status === 'Pending' && b.startDate < today
            return (
              <article key={b.id} className="card card-pad stack" style={{ '--gap': '12px' }} aria-busy={busy === b.id}>
                <div className="row" style={{ '--gap': '12px' }}>
                  <Avatar name={b.touristName} size={48} />
                  <span className="grow stack" style={{ '--gap': '0px', minWidth: 0 }}>
                    <b style={{ fontSize: 15.5 }}>{b.touristName}</b>
                    <span className="small muted">{b.touristCountry} · {t('host.asked', { date: formatDate(b.createdAt) })}</span>
                  </span>
                  <Badge tone={STATUS_TONE[b.status]}>{t(`status.${b.status}`)}</Badge>
                </div>

                {trips && b.tripTitle && <b className="small" style={{ color: 'var(--lapis)' }}>{b.tripTitle}</b>}
                <dl className="inbox-facts">
                  <div><dt>{t('inbox.dates')}</dt><dd>{formatRange(b.startDate, b.endDate)}</dd></div>
                  <div><dt>{t('inbox.length')}</dt><dd>{t('common.days', { n: b.days })}</dd></div>
                  <div><dt>{t('inbox.total')}</dt><dd className="num">{formatPrice(b.totalPrice)}</dd></div>
                </dl>

                {tooLate && <Notice tone="warn">{t('inbox.tooLate')}</Notice>}

                {b.status === 'Pending' && (
                  <div className="row" style={{ '--gap': '8px' }}>
                    <button type="button" className="btn btn-danger grow" disabled={busy === b.id} onClick={() => setAsk({ booking: b })}>{t('host.decline')}</button>
                    {!tooLate && <button type="button" className="btn grow" style={{ flex: 2 }} disabled={busy === b.id} onClick={() => setStatus(b, 'Confirmed')}>{t('inbox.accept')}</button>}
                  </div>
                )}
                {b.status === 'Confirmed' && ended && (
                  <button type="button" className="btn btn-gold" disabled={busy === b.id} onClick={() => setStatus(b, 'Completed')}>{t('inbox.complete')}</button>
                )}
                {b.status === 'Confirmed' && !started && (
                  <button type="button" className="link-btn" style={{ alignSelf: 'flex-start', color: 'var(--clay)' }} disabled={busy === b.id} onClick={() => setAsk({ booking: b })}>{t('inbox.cancel')}</button>
                )}
                {b.status === 'Confirmed' && started && !ended && <p className="small muted">{t('inbox.inProgress', { date: formatDate(b.endDate) })}</p>}
              </article>
            )
          })}
        </div>
      )}

      <ConfirmSheet open={!!ask} onClose={() => setAsk(null)} busy={!!ask && busy === ask.booking.id}
        title={ask?.booking.status === 'Pending' ? t('inbox.declineTitle', { name: firstName(ask.booking.touristName) }) : t('inbox.cancelTitle')}
        confirmLabel={ask?.booking.status === 'Pending' ? t('host.decline') : t('inbox.cancel')}
        keepLabel={t('inbox.keep')}
        onConfirm={() => setStatus(ask.booking, 'Cancelled')}>
        {ask && t('inbox.cancelText', { name: firstName(ask.booking.touristName) })}
      </ConfirmSheet>
    </div>
  )
}
