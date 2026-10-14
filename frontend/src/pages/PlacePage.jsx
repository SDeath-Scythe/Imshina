import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon, { CATEGORY_ICON } from '../components/Icon'
import MapView from '../components/MapView'
import { StoryCard, StoryTeaser } from '../components/PlaceStory'
import { CATEGORY_TINT } from '../components/PlaceCard'
import { ActionBar, Avatar, BackButton, ErrorState, Section, Skeleton } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useGeo } from '../context/GeoContext'
import { useToast } from '../context/ToastContext'
import { useI18n } from '../i18n/I18nContext'
import { useGuides, usePassport, usePlace, usePlaceStory } from '../api/hooks'
import { distanceMeters, formatDate, formatDistance, imageUrl, placePoint, walkMinutes } from '../utils/helpers'

function yearLabel(e, t) {
  if (e.year == null) return e.era || ''
  const y = e.year < 0 ? t('time.bce', { n: Math.abs(e.year) }) : t('time.ce', { n: e.year })
  return e.era ? `${y} · ${e.era}` : y
}

// Reads the place's stories aloud with the browser's own voice, in the current language.
function AudioStory({ place }) {
  const { t, isRtl } = useI18n()
  const [state, setState] = useState('idle')
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
  useEffect(() => () => { if (supported) window.speechSynthesis.cancel() }, [supported, place.id, isRtl])
  if (!supported || !place.historicalEvents.length) return null

  const play = () => {
    const ar = isRtl && place.historicalEvents.every((e) => e.titleAr && e.summaryAr)
    const text = [ar ? place.descriptionAr || place.description : place.description,
      ...place.historicalEvents.map((e) => [ar ? e.titleAr : e.title, ar ? e.summaryAr : e.summary, ar ? e.detailsAr || e.details : e.details].filter(Boolean).join('. '))].join('\n\n')
    const u = new SpeechSynthesisUtterance(text)
    u.lang = ar ? 'ar-IQ' : 'en-GB'
    const voices = window.speechSynthesis.getVoices()
    u.voice = voices.find((v) => v.lang.toLowerCase().startsWith(ar ? 'ar' : 'en')) || null
    u.onend = () => setState('idle')
    u.onerror = () => setState('idle')
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
    setState('playing')
  }
  const toggle = () => {
    if (state === 'playing') { window.speechSynthesis.pause(); setState('paused') }
    else if (state === 'paused') { window.speechSynthesis.resume(); setState('playing') }
    else play()
  }
  const stop = () => { window.speechSynthesis.cancel(); setState('idle') }

  return (
    <section className="card-dark row" style={{ '--gap': '14px' }} aria-label={t('place.audio')}>
      <button type="button" onClick={toggle} className="btn btn-gold" style={{ width: 48, height: 48, minHeight: 48, padding: 0, flexShrink: 0 }}
        aria-label={state === 'playing' ? t('place.audioPause') : t('place.audioPlay')}>
        <Icon name={state === 'playing' ? 'pause' : 'play'} size={20} stroke={2.4} />
      </button>
      <span className="grow stack" style={{ '--gap': '2px' }}>
        <b>{t('place.audioTitle')}</b>
        <span className="small muted" aria-live="polite">{state === 'playing' ? t('place.audioPlaying') : state === 'paused' ? t('place.audioPaused') : t('place.audioHint')}</span>
      </span>
      {state !== 'idle' && <button type="button" className="icon-btn on-dark" onClick={stop} aria-label={t('place.audioStop')}><Icon name="stop" size={18} /></button>}
    </section>
  )
}

function ZoneStatus({ place, stamp }) {
  const { t } = useI18n()
  const { user } = useAuth()
  const { position, status, locate } = useGeo()
  if (!user || user.role !== 'Tourist') return null
  if (stamp) {
    return (
      <Link to="/passport" className="notice success card-link" style={{ textDecoration: 'none' }}>
        <Icon name="check" size={20} />
        <span className="grow"><b>{t('place.inPassport')}</b><br /><span className="small">{t('place.collectedOn', { date: formatDate(stamp.createdAt) })}</span></span>
      </Link>
    )
  }
  if (!position) {
    return (
      <div className="card card-pad row" style={{ '--gap': '12px' }}>
        <span style={{ width: 44, height: 44, borderRadius: 22, border: '2px dashed var(--line-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', flexShrink: 0 }}><Icon name="locate" /></span>
        <span className="grow small">{status === 'denied' ? t('geo.deniedShort') : t('place.zoneUnknown', { m: place.stampRadiusMeters })}</span>
        {status !== 'denied' && status !== 'unavailable' && (
          <button type="button" className="btn btn-outline btn-sm" onClick={() => locate().catch(() => {})} disabled={status === 'locating'}>
            {status === 'locating' ? t('geo.locating') : t('place.check')}
          </button>
        )}
      </div>
    )
  }
  const d = distanceMeters(position, placePoint(place))
  const inside = d <= place.stampRadiusMeters
  return inside ? (
    <div className="notice success" role="status">
      <Icon name="locate" size={20} />
      <span><b>{t('place.inside')}</b><br /><span className="small">{t('place.insideText', { d: formatDistance(d), acc: Math.round(position.accuracy || 0) })}</span></span>
    </div>
  ) : (
    <div className="card card-pad row" role="status" style={{ '--gap': '12px', borderStyle: 'dashed', borderColor: 'var(--line-3)' }}>
      <span style={{ width: 44, height: 44, borderRadius: 22, border: '2px dashed var(--ochre)', color: 'var(--ochre)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="walk" /></span>
      <span className="grow">
        <b>{t('place.toGo', { d: formatDistance(d - place.stampRadiusMeters) })}</b><br />
        <span className="small muted">{t('place.zoneRule', { m: place.stampRadiusMeters })}</span>
      </span>
    </div>
  )
}

export default function PlacePage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { t, loc, gov, isRtl } = useI18n()
  const toast = useToast()
  const { position } = useGeo()
  const { data: place, loading, error, reload } = usePlace(id)
  const passport = usePassport()
  const guides = useGuides({ governorateId: place?.governorateId })
  const [more, setMore] = useState(false)
  const [coverFailed, setCoverFailed] = useState(null) // a photo URL that didn't load; the brick tile shows instead
  const isTourist = user?.role === 'Tourist'
  const stamp = passport.data?.stamps.find((s) => String(s.placeId) === String(id))
  const story = usePlaceStory(id, !!stamp && !!place?.hasStory)
  const placeGuides = useMemo(() => (guides.data || []).filter((g) => g.destinations.some((d) => String(d.id) === String(id))), [guides.data, id])

  if (error) return <div className="page"><BackButton /><ErrorState error={error} onRetry={reload} /></div>
  if (loading || !place) {
    return <div className="page"><Skeleton h={260} r={24} /><Skeleton h={34} w="60%" /><Skeleton h={90} /></div>
  }

  const coverSrc = imageUrl(place.coverImageUrl)
  const cover = coverSrc && coverFailed !== coverSrc ? coverSrc : null
  const d = position ? distanceMeters(position, placePoint(place)) : null
  const outside = d != null && d > place.stampRadiusMeters
  const mins = walkMinutes(d)
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}&travelmode=walking`
  const description = loc(place, 'description')
  const long = description.length > 260
  const tips = loc(place, 'culturalTips')
  const safety = loc(place, 'safetyNotes')

  const share = async () => {
    const data = { title: loc(place, 'name'), text: loc(place, 'shortDescription'), url: window.location.href }
    try {
      if (navigator.share) await navigator.share(data)
      else { await navigator.clipboard.writeText(data.url); toast(t('common.linkCopied')) }
    } catch { /* cancelled */ }
  }

  return (
    <>
      <div className="cover bricks" style={{ '--brick': CATEGORY_TINT[place.category] }}>
        {cover ? <img src={cover} alt={loc(place, 'name')} onError={() => setCoverFailed(coverSrc)} /> : <span style={{ color: 'rgba(255,255,255,0.35)', marginBottom: 60 }}><Icon name={CATEGORY_ICON[place.category] || 'pin'} size={120} stroke={1.2} /></span>}
        <div className="cover-actions">
          <BackButton variant="glass" fallback={`/cities/${place.governorateId}`} />
          <button type="button" className="icon-btn glass" onClick={share} aria-label={t('common.share')}><Icon name="share" size={18} /></button>
        </div>
      </div>

      <div className="sheet-top">
        <div className="page" style={{ paddingTop: 0 }}>
          <div className="stack" style={{ '--gap': '6px' }}>
            <Link to={`/cities/${place.governorateId}`} className="eyebrow" style={{ textDecoration: 'none' }}>{t(`category.${place.category}`)} · {gov(place.governorateName)}</Link>
            <div className="row-between wrap" style={{ alignItems: 'baseline' }}>
              <h1>{loc(place, 'name')}</h1>
              <span className="display muted" lang={isRtl ? 'en' : 'ar'} style={{ fontSize: 19 }}>{isRtl ? place.name : place.nameAr}</span>
            </div>
          </div>

          <ZoneStatus place={place} stamp={stamp} />

          {place.images.length > 0 && (
            <div className="scroll-x" aria-label={t('place.photos')}>
              {place.images.map((img) => (
                <img key={img.id} src={imageUrl(img.url)} alt={img.caption || loc(place, 'name')} loading="lazy"
                  style={{ width: 220, height: 150, objectFit: 'cover', borderRadius: 16, flexShrink: 0 }} />
              ))}
            </div>
          )}

          <div className="stack" style={{ '--gap': '6px' }}>
            <p style={{ fontSize: 15.5, lineHeight: 1.65, color: 'var(--ink-2)' }}>{long && !more ? `${description.slice(0, 260).trim()}…` : description}</p>
            {long && <button type="button" className="link-btn" style={{ alignSelf: 'flex-start' }} onClick={() => setMore(!more)} aria-expanded={more}>{more ? t('common.showLess') : t('common.readMore')}</button>}
          </div>

          {place.hasStory && (isTourist && stamp ? <StoryCard story={story.data} loading={story.loading} /> : <StoryTeaser />)}

          <AudioStory place={place} />

          {place.historicalEvents.length > 0 && (
            <Section title={t('place.history')}>
              <div className="timeline">
                {place.historicalEvents.map((e, i) => (
                  <div key={e.id} className={`t-item ${i === 0 ? 'first' : ''}`}>
                    <span className="t-when">{yearLabel(e, t)}</span>
                    <h3 style={{ margin: '2px 0 4px' }}>{loc(e, 'title')}</h3>
                    <p style={{ color: 'var(--ink-2)' }}>{loc(e, 'summary')}</p>
                    {loc(e, 'details') && (
                      <details>
                        <summary>{t('common.readMore')}</summary>
                        <p style={{ color: 'var(--ink-2)' }}>{loc(e, 'details')}</p>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {tips && (
            <section className="notice warn" style={{ background: 'var(--ochre-soft)' }} aria-label={t('place.spotIt')}>
              <Icon name="search" size={22} />
              <span><b>{t('place.spotIt')}</b><br />{tips}</span>
            </section>
          )}

          {safety && (
            <Section title={t('place.beforeYouGo')}>
              <p className="card card-pad" style={{ color: 'var(--ink-2)' }}>{safety}</p>
            </Section>
          )}

          <Section title={t('place.whereTitle')} action={<a href={directions} target="_blank" rel="noreferrer" className="link-btn"><Icon name="navigate" size={16} />{t('place.directions')}</a>}>
            <MapView places={[place]} zone={{ lat: place.latitude, lng: place.longitude, radius: place.stampRadiusMeters }} me={position} height={240} label={t('place.mapLabel')} />
            <span className="small muted">{t('place.zoneRule', { m: place.stampRadiusMeters })}</span>
          </Section>

          {placeGuides.length > 0 && (
            <Link to={placeGuides.length === 1 ? `/guides/${placeGuides[0].userId}` : `/guides?gov=${place.governorateId}`} className="card card-link card-pad row" style={{ '--gap': '12px' }}>
              <span className="avatar-stack">{placeGuides.slice(0, 3).map((g) => <Avatar key={g.userId} name={g.fullName} size={38} />)}</span>
              <span className="grow stack" style={{ '--gap': '0px' }}>
                <b>{t('place.guidesHere', { n: placeGuides.length })}</b>
                <span className="small muted">{t('place.guidesFrom', { price: `$${Math.min(...placeGuides.map((g) => g.pricePerDay))}` })}</span>
              </span>
              <Icon name="forward" className="flip-rtl faint" />
            </Link>
          )}
        </div>
      </div>

      <ActionBar>
        {!user ? (
          <Link to="/login" state={{ from: `/places/${id}` }} className="btn btn-lg grow">{t('place.loginToCollect')}</Link>
        ) : !isTourist ? (
          <a href={directions} target="_blank" rel="noreferrer" className="btn btn-lg grow"><Icon name="navigate" size={18} />{t('place.directions')}</a>
        ) : stamp ? (
          <Link to="/passport" className="btn btn-dark btn-lg grow">{t('place.openPassport')}</Link>
        ) : outside ? (
          <>
            <a href={directions} target="_blank" rel="noreferrer" className="btn btn-lg grow"><Icon name="navigate" size={18} />{mins ? t('place.walkThere', { n: mins }) : t('place.directions')}</a>
            <Link to={`/places/${id}/collect`} className="btn btn-outline btn-lg">{t('place.collectShort')}</Link>
          </>
        ) : (
          <>
            <Link to={`/places/${id}/collect`} className="btn btn-lg grow"><Icon name="stamp" size={20} style={{ color: 'var(--gold)' }} />{t('place.collect')}</Link>
            <a href={directions} target="_blank" rel="noreferrer" className="icon-btn" style={{ width: 54, height: 54, borderRadius: 27 }} aria-label={t('place.directions')}><Icon name="navigate" /></a>
          </>
        )}
      </ActionBar>
    </>
  )
}
