import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api/client'
import Icon from '../components/Icon'
import RangeCalendar from '../components/RangeCalendar'
import { ActionBar, Avatar, BackButton, ErrorState, Notice, Skeleton } from '../components/ui'
import { useI18n } from '../i18n/I18nContext'
import { useGuide } from '../api/hooks'
import { invalidate } from '../hooks/useQuery'
import { daysInclusive, formatPrice, formatRange, problem } from '../utils/helpers'

export default function BookGuidePage() {
  const { id } = useParams()
  const { t, te } = useI18n()
  const guide = useGuide(id)
  const [range, setRange] = useState({ start: null, end: null })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [booked, setBooked] = useState(null)
  const g = guide.data

  if (guide.error) return <div className="page"><BackButton /><ErrorState error={guide.error} onRetry={guide.reload} /></div>
  if (!g) return <div className="page"><Skeleton h={60} /><Skeleton h={360} r={20} /></div>

  const last = range.end || range.start
  const days = range.start ? daysInclusive(range.start, last) : 0
  const total = days * g.pricePerDay
  const first = g.fullName.split(' ')[0]

  const submit = async () => {
    setBusy(true); setError('')
    try {
      const { data } = await api.post('/bookings', { type: 'Guide', guideUserId: Number(id), startDate: range.start, endDate: last })
      setBooked(data)
      invalidate('bookings')
    } catch (err) {
      const pb = problem(err)
      setError(pb.status === 409 ? t('book.unavailable', { name: first }) : te(err))
    } finally { setBusy(false) }
  }

  if (booked) {
    return (
      <div className="page" style={{ minHeight: '80dvh', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <span style={{ width: 88, height: 88, borderRadius: 44, background: 'var(--ochre-soft)', color: 'var(--ochre)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="clock" size={40} /></span>
        <h1>{t('book.sentTitle')}</h1>
        <p className="muted" style={{ maxWidth: 360 }}>{t('book.sentText', { name: first, dates: formatRange(booked.startDate, booked.endDate), total: formatPrice(booked.totalPrice) })}</p>
        <div className="stack" style={{ width: 'min(100%, 360px)', '--gap': '10px' }}>
          <Link to="/bookings" replace className="btn btn-lg">{t('book.seeBookings')}</Link>
          <Link to="/" replace className="btn btn-ghost">{t('book.backExploring')}</Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="page">
        <header className="row" style={{ '--gap': '12px' }}>
          <BackButton fallback={`/guides/${id}`} />
          <Avatar name={g.fullName} size={44} />
          <span className="stack grow" style={{ '--gap': '0px' }}>
            <h1 style={{ fontSize: 20 }}>{t('book.title', { name: g.fullName })}</h1>
            <span className="small muted num">{formatPrice(g.pricePerDay)} {t('guides.perDay')}</span>
          </span>
        </header>

        <section className="card card-pad stack" style={{ '--gap': '8px' }} aria-label={t('book.dates')}>
          <span className="small muted">{range.start && !range.end ? t('book.pickLast') : t('book.pickFirst')}</span>
          <RangeCalendar value={range} onChange={(v) => { setRange(v); setError('') }} maxSpan={30} />
        </section>

        <Notice tone="info" icon="info">{t('book.howItWorks', { name: first })}</Notice>
        {error && <Notice tone="error">{error}</Notice>}
      </div>

      <ActionBar>
        <span className="stack grow" style={{ '--gap': '0px' }}>
          <b>{range.start ? `${formatRange(range.start, last)} · ${t('common.days', { n: days })}` : t('book.noDates')}</b>
          <span className="small muted num">{range.start ? formatPrice(total) : t('book.priceHint', { price: formatPrice(g.pricePerDay) })}</span>
        </span>
        <button type="button" className="btn btn-lg" disabled={!range.start || busy} onClick={submit}>
          {busy ? t('book.sending') : t('book.send')}
        </button>
      </ActionBar>
    </>
  )
}
