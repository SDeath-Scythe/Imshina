import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { useI18n } from '../i18n/I18nContext'

const STAMP_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 21h14"/><path d="M6 17h12v-3a2 2 0 0 0-2-2h-2.5l.8-5.2a2.3 2.3 0 1 0-4.6 0l.8 5.2H8a2 2 0 0 0-2 2z"/></svg>'
const icons = {}
function pinIcon(kind) {
  if (!icons[kind]) {
    icons[kind] = L.divIcon({
      className: '',
      html: `<div class="map-pin ${kind}"><span>${STAMP_SVG}</span></div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    })
  }
  return icons[kind]
}
const meIcon = L.divIcon({ className: '', html: '<div class="me-dot"></div>', iconSize: [18, 18], iconAnchor: [9, 9] })

function Fit({ points, padding = 48, maxZoom = 15 }) {
  const map = useMap()
  const key = points.map((p) => p.join(',')).join('|')
  useEffect(() => {
    if (points.length > 1) map.fitBounds(points, { padding: [padding, padding], maxZoom })
    else if (points.length === 1) map.setView(points[0], maxZoom)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key])
  return null
}

function FlyTo({ focus }) {
  const map = useMap()
  useEffect(() => {
    if (focus) map.flyTo([focus.lat, focus.lng], focus.zoom || Math.max(map.getZoom(), 14), { duration: 0.6 })
  }, [map, focus])
  return null
}

function Picker({ onPick }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) })
  return null
}

/**
 * places: [{ id, name, nameAr, latitude, longitude }]
 * stamped: Set of place ids · selectedId · onSelect(id)
 * me: { lat, lng } · zone: { lat, lng, radius } · focus: { lat, lng, zoom } (fly there when it changes)
 * onPick({lat,lng}): click-to-place mode (admin)
 */
export default function MapView({ places = [], stamped, selectedId, onSelect, me, zone, focus, onPick, height = 300, className = '', fit = true, label, maxZoom }) {
  const { t, loc } = useI18n()
  const points = useMemo(() => {
    const pts = places.map((p) => [p.latitude, p.longitude])
    if (zone) pts.push([zone.lat, zone.lng])
    if (me && zone) pts.push([me.lat, me.lng])
    return pts
  }, [places, zone, me])
  const center = points[0] || (me ? [me.lat, me.lng] : [32.6, 44.2])

  return (
    <div className={`map-wrap ${className}`} style={className.includes('map-full') ? undefined : { height }} role="region" aria-label={label || t('map.label')}>
      <MapContainer center={center} zoom={points.length ? 14 : 7} scrollWheelZoom={!!className.includes('map-full')} zoomControl={false} attributionControl style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {fit && <Fit points={points} maxZoom={maxZoom || (zone ? 16 : 15)} />}
        <FlyTo focus={focus} />
        {onPick && <Picker onPick={onPick} />}
        {zone && <Circle center={[zone.lat, zone.lng]} radius={zone.radius} pathOptions={{ color: '#1D3A8C', weight: 2, dashArray: '6 6', fillColor: '#1D3A8C', fillOpacity: 0.1 }} />}
        {places.map((p) => {
          const kind = p.id === selectedId ? 'sel' : stamped?.has(p.id) ? 'done' : ''
          return (
            <Marker key={p.id} position={[p.latitude, p.longitude]} icon={pinIcon(kind)} title={loc(p, 'name')} alt={loc(p, 'name')} keyboard
              eventHandlers={onSelect ? { click: () => onSelect(p.id) } : undefined} />
          )
        })}
        {me && <Marker position={[me.lat, me.lng]} icon={meIcon} title={t('map.you')} alt={t('map.you')} interactive={false} />}
      </MapContainer>
    </div>
  )
}
