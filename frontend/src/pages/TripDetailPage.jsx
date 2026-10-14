import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api/client'
import Icon from '../components/Icon'
import MapView from '../components/MapView'
import RangeCalendar from '../components/RangeCalendar'
import { ActionBar, BackButton, ErrorState, Notice, Section, Segmented, Sheet, Skeleton } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { useGroups, useMyTrips, usePassport, useTrips } from '../api/hooks'
import { invalidate } from '../hooks/useQuery'
import { addDaysISO, formatPrice, formatRange, formatShortDate, govInk } from '../utils/helpers'
import { tripPlaceIds, useTripCities } from './TripsPage'
import NotFoundPage from './NotFoundPage'

function BookTripSheet({ trip, open, onClose }) {
  const { t, te } = useI18n()
  const [range, setRange] = useState({ start: null, end: null })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(null)
  const end = range.start ? addDaysISO(range.start, trip.durationDays - 1) : null

  const book = async () => {
    setBusy(true); setError('')
    try {
      const { data } = await api.post('/bookings', { type: 'Trip', tripId: trip.id, startDate: range.start })
      setDone(data)
      invalidate('bookings')
    } catch (err) { setError(te(err)) } finally { setBusy(false) }
  }

  return (
    <Sheet open={open} onClose={onClose} title={done ? t('book.sentTitle') : t('trips.bookTitle')}>
      {done ? (
        <>
          <p className="muted">{t('trips.bookedText', { title: trip.title, dates: formatRange(done.startDate, done.endDate) })}</p>
          <Link to="/bookings" className="btn btn-lg">{t('book.seeBookings')}</Link>
        </>
      ) : (
        <>
          <span className="small muted">{t('trips.pickStart', { n: trip.durationDays })}</span>
          <RangeCalendar single value={{ start: range.start, end }} onChange={(v) => { setRange({ start: v.start, end: null }); setError('') }} />
          {error && <Notice tone="error">{error}</Notice>}
          <div className="row-between">
            <span className="stack" style={{ '--gap': '0px' }}>
              <b>{range.start ? formatRange(range.start, end) : t('book.noDates')}</b>
              <span className="small muted">{t('common.days', { n: trip.durationDays })}</span>
            </span>
            <b className="num" style={{ fontSize: 20 }}>{formatPrice(trip.price)}</b>
          </div>
          <button type="button" className="btn btn-lg" onClick={book} disabled={!range.start || busy}>{busy ? t('book.sending') : t('trips.confirmBooking')}</button>
          <span className="xsmall muted center">{t('trips.payLater')}</span>
        </>
      )}
    </Sheet>
  )
}

export default function TripDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { t, loc } = useI18n()
  const trips = useTrips()
  const mine = useMyTrips()
  const passport = usePassport()
  const groups = useGroups()
  const [day, setDay] = useState(1)
  const [booking, setBooking] = useState(false)
  const trip = (trips.data || []).find((x) => String(x.id) === String(id)) || (mine.data || []).find((x) => String(x.id) === String(id))
  const cities = useTripCities(trip)
  const stamped = useMemo(() => new Set((passport.data?.stamps || []).map((s) => s.placeId)), [passport.data])

  const loading = trips.loading || (user?.role === 'Tourist' && mine.loading)
  if (!trip && loading) return <div className="page"><Skeleton h={220} r={24} /><Skeleton h={200} /></div>
  if (!trip && trips.error) return <div className="page"><BackButton fallback="/trips" /><ErrorState error={trips.error} onRetry={trips.reload} /></div>
  if (!trip) return <NotFoundPage />

  const isTourist = user?.role === 'Tourist'
  const ids = tripPlaceIds(trip)
  const fresh = ids.filter((pid) => !stamped.has(pid)).length
  const current = trip.days.find((d) => d.dayNumber === day) || trip.days[0]
  const stops = [...(current?.places || [])].sort((a, b) => a.orderInDay - b.orderInDay)
  const mapPlaces = stops.map((p) => ({ id: p.placeId, name: p.name, nameAr: p.nameAr, latitude: p.latitude, longitude: p.longitude }))
  const linkedGroups = (groups.data || []).filter((g) => g.tripId === trip.id)
  const ink = cities[0] ? govInk(cities[0].name, cities[0].id) : 'var(--lapis)'

  return (
    <>
      <header className="hero-top bricks" style={{ '--brick': ink }}>
        <BackButton fallback="/trips" variant="on-dark" />
        <span className="hero-eyebrow">{trip.isReadyMade ? t('trips.readyMade') : t('trips.yours')}{cities.length ? ` · ${cities.map((c) => loc(c, 'name')).join(' · ')}` : ''}</span>
        <h1 style={{ fontSize: 30 }}>{trip.title}</h1>
        {trip.description && <p className="muted" style={{ fontSize: 15, maxWidth: 640 }}>{trip.description}</p>}
        <div className="row wrap" style={{ '--gap': '8px' }}>
          <span className="badge" style={{ background: 'rgba(255,255,255,0.14)', color: '#fff' }}>{t('common.days', { n: trip.durationDays })}</span>
          <span className="badge" style={{ background: 'rgba(255,255,255,0.14)', color: '#fff' }}>{t('trips.stops', { n: ids.length })}</span>
          {isTourist && fresh > 0 && <span className="badge" style={{ background: 'var(--gold)', color: 'var(--ink)' }}>{t('trips.newStamps', { n: fresh })}</span>}
        </div>
      </header>

      <div className="page">
        {trip.days.length > 1 && (
          <Segmented label={t('trips.days')} value={current.dayNumber} onChange={setDay}
            options={trip.days.map((d) => ({ value: d.dayNumber, label: t('trips.day', { n: d.dayNumber }), sub: t('trips.stops', { n: d.places.length }) }))} />
        )}

        <ol className="stops">
          {stops.map((p, i) => (
            <li key={p.placeId} className="stop">
              <span className="stop-rail"><span className={`stop-num ${stamped.has(p.placeId) ? 'done' : ''}`}>{i + 1}</span><span className="stop-line" /></span>
              <Link to={`/places/${p.placeId}`} className="stop-body">
                <b style={{ fontWeight: 600, fontSize: 15.5 }}>{loc(p, 'name')}</b>
                {isTourist && <span className="small bold" style={{ color: stamped.has(p.placeId) ? 'var(--green)' : 'var(--ochre)' }}>{stamped.has(p.placeId) ? t('trips.inPassport') : t('trips.newStamp')}</span>}
              </Link>
            </li>
          ))}
        </ol>

        {mapPlaces.length > 0 && <MapView places={mapPlaces} stamped={stamped} height={240} label={t('trips.mapLabel', { n: current.dayNumber })} />}

        {trip.isReadyMade && (
          <Section title={t('trips.travelTogether')}>
            {linkedGroups.map((g) => (
              <Link key={g.id} to={`/groups/${g.id}`} className="card card-link card-pad row" style={{ '--gap': '12px' }}>
                <Icon name="users" style={{ color: 'var(--lapis)' }} />
                <span className="grow stack" style={{ '--gap': '0px' }}><b>{g.name}</b><span className="small muted">{formatShortDate(g.startDate)} · {t('groups.spotsLeft', { n: Math.max(0, g.maxMembers - g.membersCount), max: g.maxMembers })}</span></span>
                <Icon name="forward" className="flip-rtl faint" />
              </Link>
            ))}
            {(isTourist || user?.role === 'Agency') && (
              <Link to={`/groups/new?trip=${trip.id}`} className="card-dark row" style={{ '--gap': '12px', textDecoration: 'none' }}>
                <span className="grow stack" style={{ '--gap': '0px' }}><b>{t('trips.noAlone')}</b><span className="small muted">{t('trips.noAloneText')}</span></span>
                <Icon name="forward" className="flip-rtl" style={{ color: 'var(--gold)' }} />
              </Link>
            )}
          </Section>
        )}
      </div>

      {trip.isReadyMade && (
        <ActionBar>
          <span className="stack" style={{ '--gap': '0px' }}><b className="num" style={{ fontSize: 18 }}>{formatPrice(trip.price)}</b><span className="xsmall muted">{t('common.days', { n: trip.durationDays })}</span></span>
          {!user ? (
            <Link to="/login" state={{ from: `/trips/${id}` }} className="btn btn-lg grow">{t('trips.loginToBook')}</Link>
          ) : isTourist ? (
            <button type="button" className="btn btn-lg grow" onClick={() => setBooking(true)}><Icon name="calendar" size={18} />{t('trips.book')}</button>
          ) : <span className="small muted grow">{t('trips.onlyTravellers')}</span>}
        </ActionBar>
      )}
      {isTourist && trip.isReadyMade && <BookTripSheet trip={trip} open={booking} onClose={() => setBooking(false)} />}
    </>
  )
}
