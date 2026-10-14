import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../components/Icon'
import { PlaceRow } from '../components/PlaceCard'
import { BackButton, ChipGroup, Empty, ErrorState, Progress, SkeletonRows } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useGeo } from '../context/GeoContext'
import { useI18n } from '../i18n/I18nContext'
import { useGovernoratePlaces, useGovernorates, usePassport } from '../api/hooks'
import { distanceMeters, govInk, placePoint } from '../utils/helpers'
import NotFoundPage from './NotFoundPage'

export default function GovernoratePage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { t, loc, isRtl } = useI18n()
  const { position } = useGeo()
  const govs = useGovernorates()
  const places = useGovernoratePlaces(id)
  const passport = usePassport()
  const [filter, setFilter] = useState('all')
  const isTourist = user?.role === 'Tourist'
  const stamped = useMemo(() => new Set((passport.data?.stamps || []).map((s) => s.placeId)), [passport.data])
  const g = govs.data?.find((x) => String(x.id) === String(id))

  const list = useMemo(() => {
    const rows = (places.data || []).map((p) => ({ p, d: position ? distanceMeters(position, placePoint(p)) : null }))
    if (position) rows.sort((a, b) => a.d - b.d)
    return rows.filter(({ p }) => filter === 'all' || (filter === 'todo' ? !stamped.has(p.id) : p.category === filter))
  }, [places.data, position, filter, stamped])

  if (govs.data && !g) return <NotFoundPage />
  const total = places.data?.length || g?.placesCount || 0
  const done = (places.data || []).filter((p) => stamped.has(p.id)).length
  const categories = [...new Set((places.data || []).map((p) => p.category))]

  return (
    <>
      <header className="hero-top bricks" style={{ '--brick': g ? govInk(g.name, g.id) : 'var(--lapis)' }}>
        <div className="row-between">
          <BackButton variant="on-dark" />
          <Link to="/map" className="btn btn-on-dark btn-sm"><Icon name="map" size={16} />{t('home.mapView')}</Link>
        </div>
        <div className="row-between" style={{ alignItems: 'baseline' }}>
          <h1 style={{ fontSize: 34 }}>{g ? loc(g, 'name') : '…'}</h1>
          {g && <span className="display" lang={isRtl ? 'en' : 'ar'} style={{ fontSize: 22, color: 'var(--gold)' }}>{isRtl ? g.name : g.nameAr}</span>}
        </div>
        {g && <p className="muted" style={{ fontSize: 15, maxWidth: 640 }}>{loc(g, 'description')}</p>}
        {isTourist && total > 0 && (
          <div className="row" style={{ '--gap': '12px' }}>
            <div className="grow"><Progress dark large value={done} max={total} label={t('city.progress', { n: done, total })} /></div>
            <span className="small" style={{ fontWeight: 600 }}>{t('city.progress', { n: done, total })}</span>
          </div>
        )}
      </header>

      <div className="page">
        {(isTourist || categories.length > 1) && (
          <ChipGroup label={t('home.filter')} value={filter} onChange={setFilter} options={[
            { value: 'all', label: t('common.all'), count: total },
            ...(isTourist ? [{ value: 'todo', label: t('home.notStamped') }] : []),
            ...(categories.length > 1 ? categories.map((c) => ({ value: c, label: t(`category.${c}`) })) : []),
          ]} />
        )}

        {places.error && <ErrorState error={places.error} onRetry={places.reload} />}
        {places.loading ? <SkeletonRows n={5} h={64} /> : list.length === 0 ? (
          <Empty icon="stamp" title={filter === 'todo' ? t('city.allDoneTitle') : t('city.emptyTitle')}>{filter === 'todo' ? t('city.allDoneText') : null}</Empty>
        ) : (
          <div className="list">
            {list.map(({ p, d }) => <PlaceRow key={p.id} place={p} distance={d} stamped={stamped.has(p.id)} meta={t(`category.${p.category}`)} />)}
          </div>
        )}

        <div className="grid-2">
          <Link to={`/guides?gov=${id}`} className="card card-link card-pad stack" style={{ '--gap': '4px' }}>
            <Icon name="guide" style={{ color: 'var(--lapis)' }} />
            <b>{t('city.guides')}</b><span className="small muted">{t('city.guidesText')}</span>
          </Link>
          <Link to="/trips" className="card card-link card-pad stack" style={{ '--gap': '4px' }}>
            <Icon name="route" style={{ color: 'var(--lapis)' }} />
            <b>{t('city.trips')}</b><span className="small muted">{t('city.tripsText')}</span>
          </Link>
        </div>
      </div>
    </>
  )
}
