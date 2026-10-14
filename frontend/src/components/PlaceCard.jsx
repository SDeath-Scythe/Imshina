import { Link } from 'react-router-dom'
import Icon, { CATEGORY_ICON } from './Icon'
import { useI18n } from '../i18n/I18nContext'
import { formatDistance, imageUrl } from '../utils/helpers'

export const CATEGORY_TINT = { Archaeological: '#2A4DA6', Religious: '#0F5E54', Heritage: '#7A2E1F', Nature: '#2F6B4F', Other: '#5E3D0B' }

/** A place's photo, or a glazed-brick tile in its category colour when there is none. */
export function PlaceArt({ place, className = 'tile', iconSize = 22, children }) {
  const img = imageUrl(place?.coverImageUrl)
  return (
    <span className={`${className} bricks-sm`} style={{ '--brick': CATEGORY_TINT[place?.category] || '#2A4DA6' }}>
      {img ? <img src={img} alt="" loading="lazy" /> : <Icon name={CATEGORY_ICON[place?.category] || 'pin'} size={iconSize} stroke={1.6} />}
      {children}
    </span>
  )
}

/** List row: art, name, a second line and a status on the trailing edge. */
export function PlaceRow({ place, distance, stamped, meta, to }) {
  const { t, loc, gov } = useI18n()
  const second = meta ?? `${t(`category.${place.category}`)}${place.governorateName ? ` · ${gov(place.governorateName)}` : ''}`
  return (
    <Link to={to || `/places/${place.id}`} className="list-row">
      <PlaceArt place={place} />
      <span className="grow stack" style={{ '--gap': '1px' }}>
        <b style={{ fontWeight: 600 }}>{loc(place, 'name')}</b>
        <span className="small muted">{second}</span>
      </span>
      {stamped ? (
        <span className="badge green"><Icon name="check" size={14} stroke={2.6} />{t('passport.stamped')}</span>
      ) : distance != null ? (
        <b className="small num">{formatDistance(distance)}</b>
      ) : (
        <Icon name="forward" size={18} className="flip-rtl faint" />
      )}
    </Link>
  )
}

/** Card for grids: art on top, short description below. */
export function PlaceCard({ place, distance, stamped }) {
  const { t, loc } = useI18n()
  return (
    <Link to={`/places/${place.id}`} className="card card-link" style={{ overflow: 'hidden' }}>
      <PlaceArt place={place} className="tile cover-tile" iconSize={40}>
        {stamped && <span className="badge green" style={{ position: 'absolute', top: 10, insetInlineEnd: 10 }}><Icon name="check" size={14} stroke={2.6} />{t('passport.stamped')}</span>}
      </PlaceArt>
      <span className="stack card-pad" style={{ '--gap': '4px', display: 'flex' }}>
        <span className="row-between"><b>{loc(place, 'name')}</b>{distance != null && <span className="small num muted">{formatDistance(distance)}</span>}</span>
        <span className="small muted clamp-2">{loc(place, 'shortDescription')}</span>
      </span>
    </Link>
  )
}
