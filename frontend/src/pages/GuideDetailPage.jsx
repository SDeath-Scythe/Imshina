import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../components/Icon'
import { ActionBar, Avatar, BackButton, Empty, ErrorState, Notice, Section, Skeleton, Stars } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { useBookings, useGovernorates, useGuide, usePassport } from '../api/hooks'
import { formatDate, formatPrice } from '../utils/helpers'
import { guideCities } from './GuidesPage'

export default function GuideDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { t, tf, loc } = useI18n()
  const guide = useGuide(id)
  const govs = useGovernorates()
  const passport = usePassport()
  const bookings = useBookings()
  const stamped = useMemo(() => new Set((passport.data?.stamps || []).map((s) => s.placeId)), [passport.data])
  const g = guide.data

  if (guide.error) return <div className="page"><BackButton fallback="/guides" /><ErrorState error={guide.error} onRetry={guide.reload} /></div>
  if (!g) return <div className="page"><Skeleton h={200} r={24} /><Skeleton h={120} /></div>

  const isTourist = user?.role === 'Tourist'
  const isMe = user && String(user.id) === String(id)
  const cities = guideCities(g, govs.data)
  const reviewable = (bookings.data || []).find((b) => b.canReview && String(b.guideUserId) === String(id))
  const pastWithGuide = (bookings.data || []).filter((b) => String(b.guideUserId) === String(id))

  return (
    <>
      <header className="hero-top" style={{ background: 'var(--ink)' }}>
        <BackButton fallback="/guides" variant="on-dark" />
        <div className="row" style={{ '--gap': '16px' }}>
          <Avatar name={g.fullName} size={84} ring="var(--gold)" />
          <span className="stack" style={{ '--gap': '4px' }}>
            <h1 style={{ fontSize: 28 }}>{g.fullName}</h1>
            <span className="small" style={{ color: '#C9CEDD' }}>{t('guide.guideIn', { cities: cities.map((c) => loc(c, 'name')).join(' · ') || g.country })}</span>
            {g.reviewsCount > 0 ? (
              <span className="small"><Stars value={g.avgRating} /> <span className="num" style={{ color: '#C9CEDD' }}>{g.avgRating.toFixed(1)} · {t('guides.reviews', { n: g.reviewsCount })}</span></span>
            ) : <span className="badge gold" style={{ alignSelf: 'flex-start' }}>{t('guides.new')}</span>}
          </span>
        </div>
        <div className="grid-3">
          <div className="stat on-dark"><b className="num">{formatPrice(g.pricePerDay)}</b><span>{t('guides.perDay')}</span></div>
          <div className="stat on-dark"><b className="num">{g.destinations.length}</b><span>{t('guide.places')}</span></div>
          <div className="stat on-dark"><b>{g.languages.length}</b><span>{t('guide.languages')}</span></div>
        </div>
      </header>

      <div className="page">
        {isMe && <Notice tone="info" icon="eye">{t('guide.yourProfile')} <Link to="/guide/profile">{t('guideEdit.title')}</Link></Notice>}

        <Section title={t('guide.about', { name: g.fullName.split(' ')[0] })}>
          <p style={{ fontSize: 15.5, lineHeight: 1.65, color: 'var(--ink-2)' }}>{g.bio || t('guide.noBio')}</p>
          <div className="row wrap" style={{ '--gap': '6px' }}>
            {g.languages.map((l) => <span key={l} className="badge plain">{tf(`language.${l}`, l)}</span>)}
          </div>
        </Section>

        {g.destinations.length > 0 && (
          <Section title={t('guide.placesTitle')}>
            <div className="row wrap" style={{ '--gap': '8px' }}>
              {g.destinations.map((d) => (
                <Link key={d.id} to={`/places/${d.id}`} className="chip" style={stamped.has(d.id) ? { borderColor: '#9CC5AE' } : undefined}>
                  {stamped.has(d.id) && <Icon name="check" size={14} stroke={2.8} style={{ color: 'var(--green)' }} />}{loc(d, 'name')}
                </Link>
              ))}
            </div>
            {isTourist && stamped.size > 0 && <span className="small muted">{t('guide.tickedHint')}</span>}
          </Section>
        )}

        <Section title={t('guide.howBooking')}>
          <p className="card card-pad small" style={{ color: 'var(--ink-2)', lineHeight: 1.6 }}>{t('guide.howBookingText', { name: g.fullName.split(' ')[0], price: formatPrice(g.pricePerDay) })}</p>
        </Section>

        <Section title={t('guide.reviews')}>
          {reviewable && (
            <div className="card-dashed stack" style={{ '--gap': '10px' }}>
              <b>{t('guide.reviewPromptTitle')}</b>
              <span className="small" style={{ color: 'var(--ink-2)' }}>{t('guide.reviewPromptText', { dates: `${formatDate(reviewable.startDate)}` })}</span>
              <Link to={`/bookings/${reviewable.id}/review`} className="btn btn-gold btn-sm" style={{ alignSelf: 'flex-start' }}>{t('guide.writeReview')}</Link>
            </div>
          )}
          {g.reviews.length === 0 && !reviewable && <Empty icon="star" title={t('guide.noReviews')}>{t('guide.noReviewsText')}</Empty>}
          {g.reviews.map((r) => (
            <article key={r.id} className="card card-pad stack" style={{ '--gap': '8px' }}>
              <div className="row" style={{ '--gap': '10px' }}>
                <Avatar name={r.touristName} size={36} />
                <span className="grow stack" style={{ '--gap': '0px' }}><b>{r.touristName}</b><span className="xsmall muted">{formatDate(r.createdAt)}</span></span>
                <Stars value={r.rating} />
              </div>
              {r.comment && <p style={{ color: 'var(--ink-2)' }}>{r.comment}</p>}
            </article>
          ))}
        </Section>

        {isTourist && pastWithGuide.length > 0 && (
          <Link to="/bookings" className="link-btn">{t('guide.yourBookings', { n: pastWithGuide.length })}</Link>
        )}
      </div>

      {isMe && (
        <ActionBar>
          <Link to="/guide/profile" className="btn btn-lg grow"><Icon name="edit" size={18} />{t('guideEdit.title')}</Link>
        </ActionBar>
      )}
      {!isMe && (
        <ActionBar>
          <span className="stack" style={{ '--gap': '0px' }}><b className="num" style={{ fontSize: 18 }}>{formatPrice(g.pricePerDay)}</b><span className="xsmall muted">{t('guides.perDay')}</span></span>
          {!user ? (
            <Link to="/login" state={{ from: `/guides/${id}/book` }} className="btn btn-lg grow">{t('guide.loginToBook')}</Link>
          ) : isTourist ? (
            <Link to={`/guides/${id}/book`} className="btn btn-lg grow"><Icon name="calendar" size={18} />{t('guide.chooseDates')}</Link>
          ) : (
            <span className="small muted grow">{t('guide.onlyTravellers')}</span>
          )}
        </ActionBar>
      )}
    </>
  )
}
