import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { Empty, ErrorState, PageTitle, Segmented, SkeletonRows } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { useGovernorates, useMyTrips, usePassport, usePlaces, useTrips } from '../api/hooks'
import { formatPrice, govInk } from '../utils/helpers'

// eslint-disable-next-line react-refresh/only-export-components
export function tripPlaceIds(trip) {
  return trip.days.flatMap((d) => d.places.map((p) => p.placeId))
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTripCities(trip) {
  const places = usePlaces()
  const govs = useGovernorates()
  return useMemo(() => {
    if (!trip || !places.data || !govs.data) return []
    const ids = new Set(tripPlaceIds(trip).map((pid) => places.data.find((p) => p.id === pid)?.governorateId).filter(Boolean))
    return govs.data.filter((g) => ids.has(g.id))
  }, [trip, places.data, govs.data])
}

function TripCard({ trip, stamped, showStamps }) {
  const { t, loc } = useI18n()
  const cities = useTripCities(trip)
  const ids = tripPlaceIds(trip)
  const fresh = ids.filter((id) => !stamped.has(id)).length
  const ink = cities[0] ? govInk(cities[0].name, cities[0].id) : 'var(--lapis)'
  return (
    <Link to={`/trips/${trip.id}`} className="card card-link" style={{ overflow: 'hidden' }}>
      <span className="bricks row-between" style={{ '--brick': ink, height: 92, padding: '12px 14px', alignItems: 'flex-end', display: 'flex', color: '#fff' }}>
        <span className="hero-eyebrow">{cities.map((c) => loc(c, 'name')).join(' · ') || t('trips.custom')}</span>
        {showStamps && fresh > 0 && <span className="badge" style={{ background: 'rgba(255,255,255,0.92)', color: 'var(--ink)', alignSelf: 'flex-start' }}><Icon name="stamp" size={13} />{t('trips.newStamps', { n: fresh })}</span>}
      </span>
      <span className="card-pad stack" style={{ '--gap': '6px', display: 'flex' }}>
        <b style={{ fontSize: 16.5 }}>{trip.title}</b>
        {trip.description && <span className="small clamp-2" style={{ color: 'var(--ink-2)' }}>{trip.description}</span>}
        <span className="row-between" style={{ marginTop: 4 }}>
          <span className="small muted">{t('common.days', { n: trip.durationDays })} · {t('trips.stops', { n: ids.length })}</span>
          {trip.isReadyMade ? <b className="num" style={{ fontSize: 17 }}>{formatPrice(trip.price)}</b> : <span className="badge gold">{t('trips.yours')}</span>}
        </span>
      </span>
    </Link>
  )
}

export default function TripsPage() {
  const { user } = useAuth()
  const { t } = useI18n()
  const isTourist = user?.role === 'Tourist'
  const [tab, setTab] = useState('ready')
  const trips = useTrips()
  const mine = useMyTrips()
  const passport = usePassport()
  const stamped = useMemo(() => new Set((passport.data?.stamps || []).map((s) => s.placeId)), [passport.data])
  const list = tab === 'ready' ? trips : mine

  return (
    <div className="page">
      <PageTitle title={t('trips.title')} subtitle={t('trips.subtitle')}
        action={isTourist ? <Link to="/bookings" className="link-btn"><Icon name="ticket" size={16} />{t('trips.myBookings')}</Link> : null} />

      {isTourist && (
        <Segmented label={t('trips.title')} value={tab} onChange={setTab}
          options={[{ value: 'ready', label: t('trips.readyMade') }, { value: 'mine', label: t('trips.mine'), sub: mine.data ? mine.data.length : undefined }]} />
      )}

      <Link to={isTourist ? '/trips/new' : '/login'} state={isTourist ? undefined : { from: '/trips/new' }} className="card card-link card-pad row" style={{ '--gap': '14px', border: '1.5px dashed var(--lapis)' }}>
        <span style={{ width: 46, height: 46, flexShrink: 0, borderRadius: 23, background: 'var(--lapis)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="plus" /></span>
        <span className="grow stack" style={{ '--gap': '0px' }}><b>{t('trips.build')}</b><span className="small muted">{isTourist ? t('trips.buildText') : t('trips.buildGuest')}</span></span>
      </Link>

      {list.error && <ErrorState error={list.error} onRetry={list.reload} />}
      {list.loading ? <SkeletonRows n={3} h={190} /> : (list.data || []).length === 0 ? (
        <Empty icon="route" title={tab === 'ready' ? t('trips.noneReady') : t('trips.noneMine')}>{tab === 'mine' ? t('trips.noneMineText') : null}</Empty>
      ) : (
        <div className="cards">
          {(list.data || []).map((trip) => <TripCard key={trip.id} trip={trip} stamped={stamped} showStamps={isTourist} />)}
        </div>
      )}
    </div>
  )
}
