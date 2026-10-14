import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import MapView from '../components/MapView'
import { PlaceArt } from '../components/PlaceCard'
import { BackButton, ErrorState } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useGeo } from '../context/GeoContext'
import { useI18n } from '../i18n/I18nContext'
import { usePassport, usePlaces } from '../api/hooks'
import { distanceMeters, formatDistance, placePoint, walkMinutes } from '../utils/helpers'

export default function MapPage() {
  const { user } = useAuth()
  const { t, loc, gov } = useI18n()
  const { position, locate, status } = useGeo()
  const places = usePlaces()
  const passport = usePassport()
  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState(null)
  const [focus, setFocus] = useState(null)
  const stamped = useMemo(() => new Set((passport.data?.stamps || []).map((s) => s.placeId)), [passport.data])
  const isTourist = user?.role === 'Tourist'

  const shown = useMemo(() => (places.data || []).filter((p) => {
    if (filter === 'todo') return !stamped.has(p.id)
    if (filter === 'all') return true
    return p.category === filter
  }), [places.data, filter, stamped])
  const selected = shown.find((p) => p.id === selectedId)
  const d = selected && position ? distanceMeters(position, placePoint(selected)) : null
  const mins = walkMinutes(d)

  const recenter = () => {
    if (position) setFocus({ ...position, zoom: 15, n: Date.now() })
    else locate().then((p) => setFocus({ ...p, zoom: 15, n: Date.now() })).catch(() => {})
  }
  const filters = [
    { value: 'all', label: t('common.all') },
    ...(isTourist ? [{ value: 'todo', label: t('home.notStamped') }] : []),
    { value: 'Archaeological', label: t('category.Archaeological') },
    { value: 'Religious', label: t('category.Religious') },
    { value: 'Heritage', label: t('category.Heritage') },
  ]

  return (
    <div className="map-page">
      {places.error ? <div className="page"><ErrorState error={places.error} onRetry={places.reload} /></div> : (
        <MapView className="map-full" places={shown} stamped={stamped} selectedId={selectedId} onSelect={setSelectedId}
          me={position} focus={focus} fit={!focus} label={t('map.label')} maxZoom={13} />
      )}

      <div className="map-overlay map-top stack" style={{ '--gap': '10px' }}>
        <div className="row" style={{ '--gap': '8px' }}>
          <BackButton variant="glass" />
          <Link to="/search" className="input row grow" style={{ '--gap': '10px', textDecoration: 'none', color: 'var(--muted)', borderRadius: 25, border: 0, boxShadow: 'var(--shadow-1)' }}>
            <Icon name="search" size={18} />{t('search.placeholder')}
          </Link>
        </div>
        <div className="scroll-x" role="group" aria-label={t('home.filter')}>
          {filters.map((f) => (
            <button key={f.value} type="button" className="chip" aria-pressed={filter === f.value} onClick={() => { setFilter(f.value); setSelectedId(null) }}
              style={{ border: filter === f.value ? undefined : 0, boxShadow: 'var(--shadow-1)' }}>{f.label}</button>
          ))}
        </div>
      </div>

      <div className="map-overlay map-bottom stack" style={{ '--gap': '10px' }}>
        {status !== 'unavailable' && (
          <button type="button" className="icon-btn glass" onClick={recenter} aria-label={t('map.centre')} style={{ alignSelf: 'flex-end', width: 48, height: 48, borderRadius: 24, boxShadow: 'var(--shadow-1)', color: 'var(--lapis)' }}>
            <Icon name="locate" />
          </button>
        )}
        {selected ? (
          <section className="card card-pad stack" style={{ '--gap': '12px', boxShadow: 'var(--shadow-2)', border: 0 }} aria-live="polite">
            <div className="row" style={{ '--gap': '12px' }}>
              <PlaceArt place={selected} className="tile lg" />
              <span className="grow stack" style={{ '--gap': '1px' }}>
                <b style={{ fontSize: 16 }}>{loc(selected, 'name')}</b>
                <span className="small muted">{t(`category.${selected.category}`)} · {gov(selected.governorateName)}</span>
                {d != null && <span className="small num">{formatDistance(d)}{mins ? ` · ${t('common.minutesWalk', { n: mins })}` : ''}</span>}
              </span>
              {stamped.has(selected.id) && <span className="badge green">{t('passport.stamped')}</span>}
            </div>
            <div className="row" style={{ '--gap': '8px' }}>
              <Link to={`/places/${selected.id}`} className="btn grow">{t('home.openPlace')}</Link>
              <a className="btn btn-outline grow" target="_blank" rel="noreferrer"
                href={`https://www.google.com/maps/dir/?api=1&destination=${selected.latitude},${selected.longitude}&travelmode=walking`}>
                <Icon name="navigate" size={16} />{t('place.directions')}
              </a>
            </div>
          </section>
        ) : (
          <p className="card card-pad small muted center" style={{ boxShadow: 'var(--shadow-1)', border: 0 }}>{t('map.tapPin', { n: shown.length })}</p>
        )}
      </div>
    </div>
  )
}
