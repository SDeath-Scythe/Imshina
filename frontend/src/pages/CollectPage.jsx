import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../api/client'
import Icon from '../components/Icon'
import MapView from '../components/MapView'
import { BigSeal } from '../components/Seal'
import ShareCardSheet, { stampCard } from '../components/ShareCard'
import { StoryCard } from '../components/PlaceStory'
import { Skeleton } from '../components/ui'
import { useGeo } from '../context/GeoContext'
import { useI18n } from '../i18n/I18nContext'
import { usePlace, usePlaceStory, usePlaces } from '../api/hooks'
import { invalidate } from '../hooks/useQuery'
import { distanceMeters, formatDate, formatDistance, govInk, placePoint, problem, walkMinutes } from '../utils/helpers'

/*
  The stamp flow: 1) check location  2) take a live photo  3) the server verifies and stamps.
  Every failure has its own screen with a clear way forward.
*/

function Steps({ step }) {
  const { t } = useI18n()
  const labels = [t('collect.stepHere'), t('collect.stepPhoto'), t('collect.stepStamp')]
  return (
    <ol className="steps" aria-label={t('collect.progress')}>
      {labels.map((l, i) => (
        <li key={l} className={i < step ? 'done' : i === step ? 'now' : ''} aria-current={i === step ? 'step' : undefined}>
          {i < step && <Icon name="check" size={14} stroke={2.6} />}{l}
        </li>
      ))}
    </ol>
  )
}

function TopBar({ title, onClose, dark }) {
  const { t } = useI18n()
  return (
    <div className="row-between">
      <button type="button" className={`icon-btn ${dark ? 'on-dark' : ''}`} onClick={onClose} aria-label={t('common.close')}><Icon name="close" /></button>
      <b className="display" style={{ fontSize: 18 }}>{title}</b>
      <span style={{ width: 44 }} />
    </div>
  )
}

function useCamera(active) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [state, setState] = useState('idle') // idle | starting | live | failed

  useEffect(() => {
    if (!active) return undefined
    if (!navigator.mediaDevices?.getUserMedia) { setState('failed'); return undefined }
    let cancelled = false
    setState('starting')
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1600 } }, audio: false })
      .then((stream) => {
        if (cancelled) { stream.getTracks().forEach((tr) => tr.stop()); return }
        streamRef.current = stream
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}) }
        setState('live')
      })
      .catch(() => { if (!cancelled) setState('failed') })
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((tr) => tr.stop())
      streamRef.current = null
    }
  }, [active])

  const capture = useCallback(() => new Promise((resolve) => {
    const v = videoRef.current
    if (!v || !v.videoWidth) { resolve(null); return }
    const canvas = document.createElement('canvas')
    const scale = Math.min(1, 1600 / v.videoWidth)
    canvas.width = Math.round(v.videoWidth * scale)
    canvas.height = Math.round(v.videoHeight * scale)
    canvas.getContext('2d').drawImage(v, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => resolve(blob ? new File([blob], 'stamp.jpg', { type: 'image/jpeg' }) : null), 'image/jpeg', 0.85)
  }), [])

  return { videoRef, state, capture }
}

export default function CollectPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, loc, gov, isRtl } = useI18n()
  const { locate } = useGeo()
  const { data: place, error: placeError } = usePlace(id)
  const places = usePlaces()
  const [phase, setPhase] = useState('locating') // locating | far | denied | geo-error | camera | review | sending | done | already | failed
  const [pos, setPos] = useState(null)
  const [far, setFar] = useState(null)
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [failure, setFailure] = useState('')
  const [sharing, setSharing] = useState(false)
  const story = usePlaceStory(id, phase === 'done' && !!place?.hasStory)
  const fileRef = useRef(null)
  const cam = useCamera(phase === 'camera')
  const close = () => navigate(`/places/${id}`, { replace: true })

  const check = useCallback(async () => {
    if (!place) return
    setPhase('locating')
    try {
      const p = await locate()
      setPos(p)
      const d = distanceMeters(p, placePoint(place))
      if (d > place.stampRadiusMeters) { setFar({ distance: d, radius: place.stampRadiusMeters, accuracy: p.accuracy }); setPhase('far') }
      else setPhase('camera')
    } catch (e) {
      setPhase(e?.code === 1 ? 'denied' : 'geo-error')
    }
  }, [place, locate])

  // Check once when the place first loads (a background refresh of the place must not restart the flow).
  const started = useRef(false)
  useEffect(() => {
    if (place && !started.current) { started.current = true; check() }
  }, [place, check])
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  const acceptPhoto = (file) => {
    if (!file) return
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
    setPhase('review')
  }
  const shoot = async () => acceptPhoto(await cam.capture())

  const submit = async () => {
    setPhase('sending')
    const fd = new FormData()
    fd.append('placeId', id)
    fd.append('lat', pos.lat)
    fd.append('lng', pos.lng)
    fd.append('photo', photo)
    try {
      const { data } = await api.post('/stamps', fd)
      setResult(data)
      setPhase('done')
      invalidate('passport')
      invalidate('rewards')
      if (navigator.vibrate) navigator.vibrate([30, 60, 40])
    } catch (err) {
      const pb = problem(err)
      if (pb.status === 409) setPhase('already')
      else if (pb.distanceMeters != null) { setFar({ distance: pb.distanceMeters, radius: pb.allowedRadiusMeters, accuracy: pos.accuracy }); setPhase('far') }
      else { setFailure(t(pb.status ? 'collect.failedText' : 'error.network')); setPhase('failed') }
    }
  }

  if (placeError) return <div className="bare-page"><TopBar title="" onClose={() => navigate(-1)} /><p className="notice error">{t('error.title')}</p></div>
  if (!place) return <div className="bare-page"><Skeleton h={44} w={44} r={22} /><Skeleton h={400} r={24} /></div>
  const name = loc(place, 'name')

  // ---------- camera & review (dark) ----------
  if (phase === 'camera' || phase === 'review' || phase === 'sending') {
    return (
      <div className="camera">
        <TopBar title={name} onClose={close} dark />
        <Steps step={phase === 'camera' ? 1 : 2} />
        <div className="viewfinder">
          {phase === 'camera' && cam.state !== 'failed' && <video ref={cam.videoRef} playsInline muted aria-label={t('collect.viewfinder')} />}
          {phase !== 'camera' && preview && <img src={preview} alt={t('collect.yourPhoto')} />}
          {phase === 'camera' && cam.state === 'failed' && (
            <div className="stack center" style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', padding: 24, '--gap': '12px' }}>
              <Icon name="camera" size={40} />
              <p>{t('collect.noCamera')}</p>
              <button type="button" className="btn btn-gold" onClick={() => fileRef.current?.click()}>{t('collect.openCamera')}</button>
            </div>
          )}
          {phase === 'camera' && cam.state !== 'failed' && (<><span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" /></>)}
          {phase === 'camera' && cam.state === 'live' && (
            <span style={{ position: 'absolute', top: 24, insetInline: 0, textAlign: 'center', fontSize: 14, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>{t('collect.frameIt', { place: name })}</span>
          )}
          {phase === 'sending' && (
            <div className="stack center" role="status" style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', background: 'rgba(11,16,34,0.55)', '--gap': '12px' }}>
              <span className="spinner" style={{ width: 36, height: 36 }} /><b>{t('collect.verifying')}</b>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => acceptPhoto(e.target.files?.[0])} />

        {phase === 'camera' ? (
          <div className="stack" style={{ alignItems: 'center', '--gap': '10px' }}>
            {cam.state === 'failed' ? null : (
              <button type="button" className="shutter" onClick={shoot} disabled={cam.state !== 'live'} aria-label={t('collect.shutter')}><span /></button>
            )}
            <span className="small center" style={{ color: '#B9BFD3' }}>{t('collect.liveOnly')}</span>
          </div>
        ) : (
          <div className="row" style={{ '--gap': '10px' }}>
            <button type="button" className="btn btn-on-dark grow" onClick={() => { setPhoto(null); setPhase('camera') }} disabled={phase === 'sending'}>{t('collect.retake')}</button>
            <button type="button" className="btn btn-gold grow" onClick={submit} disabled={phase === 'sending'}><Icon name="stamp" size={18} />{t('collect.stampIt')}</button>
          </div>
        )}
      </div>
    )
  }

  // ---------- success ----------
  if (phase === 'done' && result) {
    const total = places.data?.length
    const date = formatDate(new Date(), { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
    const ring = isRtl ? `${name} · ${gov(place.governorateName)} · العراق ·` : `${place.name.replace(/\(.*?\)/g, '').trim()} · ${place.governorateName} · IRAQ ·`
    return (
      <div className="bare-page fade-in" style={{ alignItems: 'center', textAlign: 'center' }}>
        <span className="eyebrow" style={{ color: 'var(--green)', marginTop: 12 }}>{t('collect.collected')}</span>
        <BigSeal name={name} ring={ring} date={date} ink={govInk(place.governorateName, place.governorateId)} animate rtl={isRtl} size={240} />
        <div className="stack" style={{ '--gap': '4px' }}>
          <h1>{total ? t('collect.countOf', { n: result.totalStamps, total }) : t('collect.count', { n: result.totalStamps })}</h1>
          <p className="muted">{t('collect.distance', { d: formatDistance(result.distanceMeters) })}</p>
        </div>
        {place.hasStory && <div style={{ width: '100%' }}><StoryCard story={story.data} loading={story.loading} /></div>}
        {result.newlyUnlockedRewards.map((r) => (
          <Link key={r.rewardId} to={`/rewards/${r.rewardId}`} className="card-dark row" style={{ width: '100%', textDecoration: 'none', textAlign: 'start', '--gap': '14px' }}>
            <span style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--gold)', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="gift" size={24} /></span>
            <span className="grow stack" style={{ '--gap': '0px' }}>
              <span className="hero-eyebrow">{t('collect.rewardUnlocked')}</span>
              <b>{r.title}</b>
              <span className="small muted">{r.partnerName}</span>
            </span>
            <Icon name="forward" className="flip-rtl" />
          </Link>
        ))}
        <div className="stack" style={{ width: '100%', marginTop: 'auto', '--gap': '10px' }}>
          <button type="button" className="btn btn-gold btn-lg" onClick={() => setSharing(true)}><Icon name="share" size={20} />{t('share.button')}</button>
          <Link to="/passport" replace className="btn btn-outline btn-lg">{t('place.openPassport')}</Link>
          <Link to="/" replace className="btn btn-ghost">{t('collect.findNext')}</Link>
        </div>
        <ShareCardSheet open={sharing} onClose={() => setSharing(false)}
          {...stampCard({ place, count: result.totalStamps, total, date: new Date(), i18n: { t, loc, gov, isRtl } })} />
      </div>
    )
  }

  // ---------- location checks & problems (light) ----------
  return (
    <div className="bare-page">
      <TopBar title={name} onClose={close} />

      {phase === 'locating' && (
        <div className="stack center" role="status" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', '--gap': '16px' }}>
          <span style={{ width: 96, height: 96, borderRadius: 48, background: 'var(--lapis-soft)', color: 'var(--lapis)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="spinner" style={{ width: 40, height: 40 }} />
          </span>
          <h1 style={{ fontSize: 24 }}>{t('collect.checking')}</h1>
          <p className="muted" style={{ maxWidth: 300 }}>{t('collect.checkingText')}</p>
        </div>
      )}

      {phase === 'far' && far && (
        <>
          <MapView places={[place]} zone={{ lat: place.latitude, lng: place.longitude, radius: far.radius }} me={pos} height={260} label={t('collect.farMap')} />
          <div className="stack" style={{ '--gap': '6px' }}>
            <h1 style={{ fontSize: 26 }}>{t('collect.farTitle', { d: formatDistance(Math.max(0, far.distance - far.radius)) })}</h1>
            <p className="muted">{t('collect.farText', { d: formatDistance(far.distance), r: far.radius })}</p>
          </div>
          {far.accuracy > 60 && <p className="notice warn">{t('collect.lowAccuracy', { acc: Math.round(far.accuracy) })}</p>}
          <p className="notice info">{t('collect.farTip')}</p>
          <div className="stack" style={{ marginTop: 'auto', '--gap': '10px' }}>
            <a className="btn btn-lg" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}&travelmode=walking`}>
              <Icon name="navigate" size={18} />{walkMinutes(far.distance) ? t('place.walkThere', { n: walkMinutes(far.distance) }) : t('place.directions')}
            </a>
            <button type="button" className="btn btn-outline" onClick={check}><Icon name="refresh" size={18} />{t('collect.checkAgain')}</button>
          </div>
        </>
      )}

      {(phase === 'denied' || phase === 'geo-error') && (
        <>
          <span style={{ width: 88, height: 88, borderRadius: 44, background: 'var(--ochre-soft)', color: 'var(--ochre)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 24 }}><Icon name="locate" size={40} /></span>
          <div className="stack" style={{ '--gap': '6px' }}>
            <h1 style={{ fontSize: 26 }}>{phase === 'denied' ? t('collect.deniedTitle') : t('collect.geoErrorTitle')}</h1>
            <p className="muted">{t('collect.whyLocation')}</p>
          </div>
          {phase === 'denied' && (
            <ol className="card card-pad" style={{ margin: 0, paddingInlineStart: 36, lineHeight: 1.9, color: 'var(--ink-2)' }}>
              <li>{t('collect.deniedStep1')}</li>
              <li>{t('collect.deniedStep2')}</li>
              <li>{t('collect.deniedStep3')}</li>
            </ol>
          )}
          {phase === 'geo-error' && <p className="notice info">{t('collect.geoErrorText')}</p>}
          <div className="stack" style={{ marginTop: 'auto', '--gap': '10px' }}>
            <button type="button" className="btn btn-lg" onClick={check}>{t('collect.tryAgain')}</button>
            <button type="button" className="btn btn-ghost" onClick={close}>{t('common.notNow')}</button>
          </div>
        </>
      )}

      {phase === 'already' && (
        <div className="stack center" style={{ flex: 1, alignItems: 'center', '--gap': '16px' }}>
          <div style={{ opacity: 0.55, marginTop: 24 }}><BigSeal name={name} ring={name} date="" size={170} ink={govInk(place.governorateName, place.governorateId)} rtl={isRtl} /></div>
          <h1 style={{ fontSize: 26 }}>{t('collect.alreadyTitle')}</h1>
          <p className="muted">{t('collect.alreadyText')}</p>
          <div className="stack" style={{ width: '100%', marginTop: 'auto', '--gap': '10px' }}>
            <Link to="/passport" replace className="btn btn-lg">{t('place.openPassport')}</Link>
            <Link to="/" replace className="btn btn-ghost">{t('collect.findNext')}</Link>
          </div>
        </div>
      )}

      {phase === 'failed' && (
        <div className="stack" style={{ flex: 1, '--gap': '16px' }}>
          <p className="notice error">{failure}</p>
          <div className="stack" style={{ marginTop: 'auto', '--gap': '10px' }}>
            <button type="button" className="btn btn-lg" onClick={() => setPhase('review')}>{t('common.retry')}</button>
            <button type="button" className="btn btn-ghost" onClick={close}>{t('common.notNow')}</button>
          </div>
        </div>
      )}
    </div>
  )
}
