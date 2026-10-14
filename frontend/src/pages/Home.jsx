import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { PlaceRow } from '../components/PlaceCard'
import { Avatar, ChipGroup, ErrorState, Progress, Section, Skeleton, SkeletonRows, Wordmark } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useGeo } from '../context/GeoContext'
import { useI18n } from '../i18n/I18nContext'
import { useGovernorates, usePassport, usePlaces, useRewards } from '../api/hooks'
import useUpdates from '../hooks/useUpdates'
import { distanceMeters, firstName, formatDistance, placePoint, walkMinutes } from '../utils/helpers'

function Header() {
  const { user } = useAuth()
  const { t, lang, toggleLang } = useI18n()
  const { unread } = useUpdates()
  return (
    <header className="row-between">
      <Link to="/" aria-label={t('brand')} style={{ textDecoration: 'none' }}><Wordmark size={28} sub /></Link>
      <div className="row" style={{ '--gap': '8px' }}>
        <button type="button" className="icon-btn display" onClick={toggleLang} aria-label={t('a11y.switchLanguage')} lang={lang === 'en' ? 'ar' : 'en'} style={{ fontSize: 16 }}>
          {lang === 'en' ? 'ع' : 'EN'}
        </button>
        <Link to="/search" className="icon-btn" aria-label={t('search.title')}><Icon name="search" /></Link>
        {user ? (
          <>
            <Link to="/updates" className="icon-btn" aria-label={unread ? t('updates.unread', { n: unread }) : t('nav.updates')}>
              <Icon name="bell" />{unread > 0 && <span className="dot" />}
            </Link>
            <Link to="/profile" aria-label={t('nav.me')} style={{ textDecoration: 'none', borderRadius: 22 }}><Avatar name={user.fullName} size={44} /></Link>
          </>
        ) : (
          <Link to="/login" className="btn btn-outline btn-sm">{t('auth.login')}</Link>
        )}
      </div>
    </header>
  )
}

function NextStampCard({ place, distance, loading, onLocate, geoStatus }) {
  const { t, loc } = useI18n()
  if (loading) return <Skeleton h={196} r={24} />
  if (!place) return null
  const mins = walkMinutes(distance)
  return (
    <section className="hero bricks" aria-label={t('home.nextStamp')}>
      <span className="hero-eyebrow">{distance != null ? t('home.nextStampNear') : t('home.nextStamp')}</span>
      <div className="stack" style={{ '--gap': '2px' }}>
        <span className="display" style={{ fontSize: 26, fontWeight: 600, lineHeight: 1.2 }}>{loc(place, 'name')}</span>
        <span className="muted">{loc(place, 'shortDescription')}</span>
      </div>
      {distance != null && (
        <div className="row wrap small" style={{ color: '#E3E8F6', '--gap': '14px' }}>
          <span><b className="num" style={{ color: '#fff' }}>{formatDistance(distance)}</b> {t('home.away')}</span>
          {mins && <span><b className="num" style={{ color: '#fff' }}>{t('common.minutes', { n: mins })}</b> {t('home.walk')}</span>}
        </div>
      )}
      <div className="row" style={{ '--gap': '10px' }}>
        <Link to={`/places/${place.id}`} className="btn btn-gold grow">{t('home.openPlace')}</Link>
        {distance == null && geoStatus !== 'denied' && geoStatus !== 'unavailable' && (
          <button type="button" className="btn btn-on-dark grow" onClick={onLocate} disabled={geoStatus === 'locating'}>
            <Icon name="locate" size={18} />{geoStatus === 'locating' ? t('geo.locating') : t('home.findNearest')}
          </button>
        )}
      </div>
    </section>
  )
}

function PassportCard({ total, count, next }) {
  const { t } = useI18n()
  return (
    <Link to="/passport" className="card card-link card-pad row" style={{ '--gap': '14px' }}>
      <span style={{ width: 48, height: 48, flexShrink: 0, borderRadius: 24, border: '2px dashed var(--lapis)', color: 'var(--lapis)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="stamp" size={22} />
      </span>
      <span className="grow stack" style={{ '--gap': '6px' }}>
        <span className="row-between"><b>{t('home.stampsOf', { n: count, total })}</b><span className="small muted">{t('nav.passport')}</span></span>
        <Progress value={count} max={total || 1} label={t('home.stampsOf', { n: count, total })} />
        <span className="small muted">
          {next ? t('home.nextReward', { n: Math.max(0, next.requiredStamps - count), reward: next.title, partner: next.partnerName }) : t('home.allRewards')}
        </span>
      </span>
    </Link>
  )
}

export default function Home() {
  const { user } = useAuth()
  const { t, loc } = useI18n()
  const { position, status: geoStatus, locate } = useGeo()
  const places = usePlaces()
  const govs = useGovernorates()
  const passport = usePassport()
  const rewards = useRewards()
  const [filter, setFilter] = useState('all')
  const isTourist = user?.role === 'Tourist'
  const stamped = useMemo(() => new Set((passport.data?.stamps || []).map((s) => s.placeId)), [passport.data])

  const sorted = useMemo(() => {
    const list = (places.data || []).map((p) => ({ place: p, d: position ? distanceMeters(position, placePoint(p)) : null }))
    if (position) list.sort((a, b) => a.d - b.d)
    return list
  }, [places.data, position])
  const next = sorted.find((x) => !stamped.has(x.place.id))
  const shown = sorted.filter((x) => filter === 'all' || !stamped.has(x.place.id)).slice(0, 6)
  const nextReward = rewards.data?.find((r) => !r.isUnlocked)

  const greeting = user ? t('home.hello', { name: firstName(user.fullName) }) : t('home.helloGuest')

  return (
    <div className="page">
      <Header />

      <div className="stack" style={{ '--gap': '2px' }}>
        <span className="row small muted" style={{ '--gap': '6px' }}>
          <Icon name="pin" size={14} />
          {position ? t('home.usingLocation') : t('home.iraq')}
        </span>
        <h1 style={{ fontSize: 28 }}>{greeting}</h1>
      </div>

      {places.error ? <ErrorState error={places.error} onRetry={places.reload} /> : (
        <NextStampCard place={next?.place} distance={next?.d} loading={places.loading} onLocate={() => locate().catch(() => {})} geoStatus={geoStatus} />
      )}

      {isTourist && passport.data && <PassportCard total={places.data?.length || 0} count={passport.data.totalStamps} next={nextReward} />}
      {!user && (
        <Link to="/register" className="card card-link card-pad row" style={{ '--gap': '14px' }}>
          <span style={{ width: 48, height: 48, flexShrink: 0, borderRadius: 24, background: 'var(--ochre-soft)', color: 'var(--ochre)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="gift" size={22} /></span>
          <span className="grow stack" style={{ '--gap': '2px' }}><b>{t('home.guestCardTitle')}</b><span className="small muted">{t('home.guestCardText')}</span></span>
          <Icon name="forward" className="flip-rtl faint" />
        </Link>
      )}
      {user?.role === 'Guide' && (
        <Link to={`/guides/${user.id}`} className="card card-link card-pad row" style={{ '--gap': '14px' }}>
          <Icon name="guide" size={26} style={{ color: 'var(--lapis)' }} />
          <span className="grow stack" style={{ '--gap': '2px' }}><b>{t('home.guideCardTitle')}</b><span className="small muted">{t('home.guideCardText')}</span></span>
          <Icon name="forward" className="flip-rtl faint" />
        </Link>
      )}
      {user?.role === 'Admin' && (
        <Link to="/admin/places/new" className="card card-link card-pad row" style={{ '--gap': '14px' }}>
          <Icon name="admin" size={26} style={{ color: 'var(--lapis)' }} />
          <span className="grow stack" style={{ '--gap': '2px' }}><b>{t('nav.addPlace')}</b><span className="small muted">{t('home.adminCardText')}</span></span>
          <Icon name="forward" className="flip-rtl faint" />
        </Link>
      )}

      <Section title={t('home.cities')}>
        {govs.loading ? <Skeleton h={40} /> : (
          <div className="scroll-x">
            {(govs.data || []).map((g) => {
              const done = isTourist ? (places.data || []).filter((p) => p.governorateId === g.id && stamped.has(p.id)).length : null
              return (
                <Link key={g.id} to={`/cities/${g.id}`} className="chip">
                  {loc(g, 'name')}<span className="count num">{done != null ? `${done}/${g.placesCount}` : g.placesCount}</span>
                </Link>
              )
            })}
          </div>
        )}
      </Section>

      <Section title={position ? t('home.aroundYou') : t('home.places')} action={<Link to="/map" className="link-btn"><Icon name="map" size={16} />{t('home.mapView')}</Link>}>
        {isTourist && stamped.size > 0 && (
          <ChipGroup label={t('home.filter')} value={filter} onChange={setFilter}
            options={[{ value: 'all', label: t('common.all') }, { value: 'todo', label: t('home.notStamped') }]} />
        )}
        {places.loading ? <SkeletonRows n={4} h={64} /> : (
          <div className="list">
            {shown.map(({ place, d }) => <PlaceRow key={place.id} place={place} distance={d} stamped={stamped.has(place.id)} />)}
          </div>
        )}
        {!places.loading && sorted.length > shown.length && (
          <Link to="/search" className="btn btn-outline">{t('home.seeAll', { n: sorted.length })}</Link>
        )}
      </Section>
    </div>
  )
}
