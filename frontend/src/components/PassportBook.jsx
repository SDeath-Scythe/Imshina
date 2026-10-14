import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon'
import { Seal } from './Seal'
import { useI18n } from '../i18n/I18nContext'
import { formatDate, formatDistance, govInk, imageUrl, initials } from '../utils/helpers'
import { playPageTurn } from '../utils/pageSound'

const TURN_MS = 820 // keep in step with the turn animations in index.css
const SOUND_KEY = 'imshina_page_sound'
const readSound = () => { try { return localStorage.getItem(SOUND_KEY) !== 'off' } catch { return true } }
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * The passport as an open notebook. The holder's page never moves; stamp pages turn like paper.
 *
 * How a turn is drawn: a two-sided sheet swings about the middle of the spine.
 * - Turning forward, its front is the page you're leaving and the page you're going to lies
 *   underneath, so both are on screen at once. It lands face-down on the holder's page, and its
 *   back is a copy of that page, so the landing matches exactly and nothing has to fade.
 * - Turning back is the same movement in reverse: the sheet lifts off the holder's page and brings
 *   the earlier stamp down on top of the current one.
 * In Arabic the spread is mirrored and pages turn from the right.
 */
export default function PassportBook({ user, stamps, places, total, cities, rewards, onOpenStamp }) {
  const { t, isRtl } = useI18n()
  const byId = useMemo(() => new Map(places.map((p) => [p.id, p])), [places])
  // Oldest first, like a real passport filling up; then one blank page for the next stamp.
  const pages = useMemo(() => {
    const list = [...stamps].sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)).map((s, i) => ({ kind: 'stamp', stamp: s, place: byId.get(s.placeId), n: i + 1 }))
    if (total === 0 || list.length < total) list.push({ kind: 'next', n: list.length + 1 })
    return list
  }, [stamps, byId, total])
  const stampCount = stamps.length

  // Open on the newest stamp.
  const [index, setIndex] = useState(() => Math.max(0, stampCount - 1))
  const [turn, setTurn] = useState(null) // { from, to, dir: 'next' | 'prev' }
  const [sound, setSound] = useState(readSound)
  const timer = useRef(null)
  const toggleSound = () => setSound((on) => {
    try { localStorage.setItem(SOUND_KEY, on ? 'off' : 'on') } catch { /* private mode */ }
    return !on
  })

  useEffect(() => { setIndex((i) => Math.min(i, pages.length - 1)) }, [pages.length])
  useEffect(() => () => clearTimeout(timer.current), [])

  const turnRef = useRef(null)
  const finish = useCallback(() => {
    clearTimeout(timer.current)
    const tr = turnRef.current
    if (!tr) return
    turnRef.current = null
    setIndex(tr.to)
    setTurn(null)
  }, [])

  const go = useCallback((to) => {
    if (turnRef.current || to < 0 || to >= pages.length || to === index) return
    if (reducedMotion()) { setIndex(to); return }
    const tr = { from: index, to, dir: to > index ? 'next' : 'prev' }
    turnRef.current = tr
    setTurn(tr)
    if (sound) playPageTurn(TURN_MS / 1000)
    timer.current = setTimeout(finish, TURN_MS + 150) // in case animationend never fires
  }, [pages.length, index, finish, sound])

  const next = () => go(index + 1)
  const prev = () => go(index - 1)

  // ---- Drag to turn ------------------------------------------------------------
  // Grab the stamp page and pull it toward the spine to turn forward, or grab the holder's page
  // and pull it away to bring the previous stamp back. While dragging, the sheet's angle comes from
  // the pointer: the point you grabbed stays under your finger (its distance from the spine's
  // middle is cos(angle) × the grab distance). On release it finishes or springs back from there.
  const bookRef = useRef(null)
  const spineRef = useRef(null)
  const sheetRef = useRef(null)
  const drag = useRef(null)
  const dragged = useRef(false)
  const raf = useRef(0)
  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const applyAngle = (deg) => {
    if (drag.current) drag.current.angle = deg
    if (sheetRef.current) sheetRef.current.style.transform = `rotateY(${isRtl ? deg : -deg}deg)`
    bookRef.current?.style.setProperty('--p', String(deg / 180))
  }
  // The sheet mounts on the render after a drag starts: put it at the drag's angle straight away.
  useLayoutEffect(() => { if (turn?.manual && drag.current) applyAngle(drag.current.angle) })

  const onPointerDown = (e) => {
    dragged.current = false // a fresh press: only a drag that starts now may swallow the next click
    if (turnRef.current || (e.pointerType === 'mouse' && e.button !== 0)) return
    const onStamp = e.target.closest('.leaf-stack')
    const onHolder = !onStamp && e.target.closest('.book > .identity')
    const dir = onStamp ? 'next' : onHolder ? 'prev' : null
    if (!dir || (dir === 'next' && index >= pages.length - 1) || (dir === 'prev' && index === 0)) return
    drag.current = { phase: 'pending', dir, id: e.pointerId, x0: e.clientX, y0: e.clientY, lastX: e.clientX, lastT: e.timeStamp, v: 0, angle: dir === 'next' ? 0 : 180 }
  }

  const onPointerMove = (e) => {
    const d = drag.current
    if (!d || e.pointerId !== d.id) return
    if (d.phase === 'pending') {
      const dx = e.clientX - d.x0
      const dy = e.clientY - d.y0
      if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { drag.current = null; return } // scrolling, not turning
      if (Math.abs(dx) < 8) return
      const towardSpine = isRtl ? dx > 0 : dx < 0
      if ((d.dir === 'next') !== towardSpine) { drag.current = null; return }
      const spine = spineRef.current.getBoundingClientRect()
      d.pivot = spine.left + spine.width / 2
      d.grab = Math.max(30, Math.abs(d.x0 - d.pivot))
      d.phase = 'active'
      dragged.current = true
      try { bookRef.current.setPointerCapture(e.pointerId) } catch { /* not supported */ }
      const tr = { from: index, to: d.dir === 'next' ? index + 1 : index - 1, dir: d.dir, manual: true }
      turnRef.current = tr
      setTurn(tr)
    }
    // Signed distance from the spine's middle, toward the stamp page.
    const along = isRtl ? d.pivot - e.clientX : e.clientX - d.pivot
    const cos = Math.max(-1, Math.min(1, along / d.grab))
    applyAngle((Math.acos(cos) * 180) / Math.PI)
    const dt = Math.max(1, e.timeStamp - d.lastT)
    d.v = 0.7 * d.v + 0.3 * ((e.clientX - d.lastX) / dt) // px per ms, smoothed
    d.lastX = e.clientX
    d.lastT = e.timeStamp
  }

  const onPointerUp = (e) => {
    const d = drag.current
    if (!d || e.pointerId !== d.id) return
    drag.current = null
    if (d.phase !== 'active') return
    // A quick flick toward the other side turns the page even before it's halfway, but only if the
    // finger is still moving when it lets go (a pause before release means "put it back").
    const v = e.timeStamp - d.lastT > 90 ? 0 : d.v
    const speed = isRtl ? -v : v // positive = moving toward the stamp page
    const complete = d.dir === 'next' ? (d.angle > 90 || speed < -0.3) : (d.angle < 90 || speed > 0.3)
    const target = (d.dir === 'next') === complete ? 180 : 0
    const from = d.angle
    const ms = 140 + (380 * Math.abs(target - from)) / 180
    if (complete && sound) playPageTurn(Math.max(0.25, ms / 1000))
    const t0 = performance.now()
    const step = (now) => {
      const k = Math.min(1, (now - t0) / ms)
      const ease = 1 - Math.pow(1 - k, 3)
      applyAngle(from + (target - from) * ease)
      if (k < 1) { raf.current = requestAnimationFrame(step); return }
      const tr = turnRef.current
      turnRef.current = null
      if (complete && tr) setIndex(tr.to)
      setTurn(null)
      bookRef.current?.style.removeProperty('--p')
    }
    raf.current = requestAnimationFrame(step)
  }

  // A drag ends with a click on whatever was under the finger; don't let it open a stamp.
  const onClickCapture = (e) => {
    if (dragged.current) { e.preventDefault(); e.stopPropagation(); dragged.current = false }
  }
  const onKeyDown = (e) => {
    const fwd = isRtl ? 'ArrowLeft' : 'ArrowRight'
    const back = isRtl ? 'ArrowRight' : 'ArrowLeft'
    if (e.key === fwd || e.key === 'PageDown') { e.preventDefault(); next() }
    if (e.key === back || e.key === 'PageUp') { e.preventDefault(); prev() }
  }

  const shownIndex = turn ? (turn.dir === 'next' ? turn.to : turn.from) : index
  const turningIndex = turn ? (turn.dir === 'next' ? turn.from : turn.to) : null
  const current = pages[turn ? turn.to : index]

  const render = (i) => {
    const p = pages[i]
    if (!p) return null
    return p.kind === 'stamp'
      ? <StampPage key={`s${p.stamp.stampId}`} page={p} count={stampCount} onOpen={() => onOpenStamp(p.stamp)} />
      : <NextPage key="next" first={stampCount === 0} left={total - stampCount} />
  }

  return (
    <div className="book-wrap">
      <div ref={bookRef} className={`book ${turn ? `is-turning turning-${turn.dir}` : ''} ${turn?.manual ? 'manual' : ''} ${index > 0 ? 'can-prev' : ''} ${index < pages.length - 1 ? 'can-next' : ''}`}
        role="region" aria-roledescription={t('book.role')} aria-label={t('book.label')} tabIndex={0} onKeyDown={onKeyDown}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onClickCapture={onClickCapture}>
        <IdentityPage user={user} count={stampCount} total={total} cities={cities} rewards={rewards} />
        <div ref={spineRef} className="book-spine" aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <span key={i} className="ring" />)}</div>
        <div className="leaf-stack">
          <div className="leaf base">{render(shownIndex)}</div>
          {turn && (
            <div ref={sheetRef} className={`leaf turning turn-${turn.dir} ${turn.manual ? 'manual' : ''}`} onAnimationEnd={(e) => { if (!turn.manual && e.target === e.currentTarget) finish() }} aria-hidden="true">
              <div className="face front">{render(turningIndex)}</div>
              <div className="face back"><IdentityPage user={user} count={stampCount} total={total} cities={cities} rewards={rewards} /></div>
            </div>
          )}
        </div>
      </div>

      <div className="book-controls">
        <button type="button" className="icon-btn" onClick={prev} disabled={index === 0 || !!turn} aria-label={t('book.prev')}><Icon name="back" className="flip-rtl" /></button>
        <span className="small" aria-live="polite">
          {current?.kind === 'stamp' ? t('book.pageOf', { n: current.n, total: stampCount }) : stampCount === 0 ? t('book.emptyShort') : t('book.nextShort')}
        </span>
        <button type="button" className="icon-btn" onClick={next} disabled={index >= pages.length - 1 || !!turn} aria-label={t('book.next')}><Icon name="forward" className="flip-rtl" /></button>
        <button type="button" className="icon-btn book-sound" onClick={toggleSound} aria-pressed={sound} aria-label={sound ? t('book.soundOff') : t('book.soundOn')}>
          <Icon name={sound ? 'volume' : 'mute'} size={18} />
        </button>
      </div>
      {pages.length > 1 && <p className="small muted center book-hint">{t('book.hint')}</p>}
    </div>
  )
}

/** The holder's page: details on one side, photo on the other, like the sketch. Never turns. */
function IdentityPage({ user, count, total, cities, rewards }) {
  const { t } = useI18n()
  const photo = imageUrl(user.profilePhotoUrl)
  return (
    <section className="leaf-page identity" aria-label={t('book.holder')}>
      <div className="id-head">
        <span className="id-eyebrow">{t('passport.cover')}</span>
        <span className="id-title" lang="ar">جواز امشينا</span>
      </div>
      <div className="id-body">
        <dl className="id-fields">
          <div><dt>{t('book.name')}</dt><dd>{user.fullName}</dd></div>
          <div><dt>{t('book.nationality')}</dt><dd>{user.country || '–'}</dd></div>
          <div><dt>{t('book.number')}</dt><dd className="num">IMS-{String(user.id).padStart(6, '0')}</dd></div>
          <div className="id-stats">
            <span><b className="num">{count}<small>/{total}</small></b>{t('passport.stamps')}</span>
            <span><b className="num">{cities}</b>{t('passport.cities')}</span>
            <span><b className="num">{rewards}</b>{t('passport.rewards')}</span>
          </div>
        </dl>
        <div className="id-photo">
          {photo ? <img src={photo} alt="" /> : <span className="display" aria-hidden="true">{initials(user.fullName)}</span>}
        </div>
      </div>
      <div className="id-signature" aria-hidden="true">
        <span className="id-sign">{user.fullName}</span>
        <span className="id-sign-label">{t('book.signature')}</span>
      </div>
    </section>
  )
}

// Calligraphy needs room: shrink long names so they stay inside the photo.
const nameSize = (n) => (n.length > 22 ? 'xl' : n.length > 13 ? 'l' : '')

/** One stamp: the photo the traveller took on site to verify it (never a profile photo), framed as a postage stamp, the name in script, a postmark, then the details. */
function StampPage({ page, count, onOpen }) {
  const { t, loc, gov, isRtl } = useI18n()
  const { stamp, place, n } = page
  const name = place ? loc(place, 'name') : loc(stamp, 'placeName')
  const stampName = name.replace(/\s*\(.*?\)/g, '') // "Ishtar Gate (Reconstruction)" → "Ishtar Gate" on the stamp
  const city = gov(place?.governorateName || stamp.governorateName)
  const ink = govInk(place?.governorateName || stamp.governorateName, place?.governorateId)
  const src = imageUrl(stamp.photoUrl)
  const [failed, setFailed] = useState(false)
  const photo = src && !failed ? src : null
  const date = formatDate(stamp.createdAt, { day: '2-digit', month: 'short', year: 'numeric' })
  return (
    <article className="leaf-page stamp-page">
      <div className="leaf-head small"><span className="num">{t('book.pageOf', { n, total: count })}</span><span>{city}</span></div>

      <button type="button" className="postage-wrap" onClick={onOpen} aria-label={t('book.openStamp', { place: name })}>
        <span className="postage">
          <span className="postage-photo" style={{ '--ink': ink }}>
            {photo ? <img src={photo} alt="" draggable="false" onError={() => setFailed(true)} /> : <Icon name="image" size={40} />}
            <span className={`postage-name ${nameSize(stampName)}`} lang={isRtl ? 'ar' : 'en'}>{stampName}</span>
          </span>
          <span className="postage-foot"><span>IRAQ · العراق</span><span className="num">№ {n}</span></span>
        </span>
        <span className="postmark" aria-hidden="true">
          <svg className="cancel-lines" viewBox="0 0 120 40"><path d="M0 8 q10 -6 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 M0 20 q10 -6 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 M0 32 q10 -6 20 0 t20 0 t20 0 t20 0 t20 0 t20 0" fill="none" stroke={ink} strokeWidth="2.4" /></svg>
          <Seal name={name} date={isRtl ? date : date.toUpperCase()} ink={ink} rotate={-14} size={92} rtl={isRtl} />
        </span>
      </button>

      <div className="stamp-info">
        <b className="stamp-info-name">{name}</b>
        <span className="small muted">{city} · {date} · {t('book.verified', { d: formatDistance(stamp.distanceMeters) })}</span>
        {place && <p className="small clamp-2">{loc(place, 'shortDescription')}</p>}
      </div>
    </article>
  )
}

/** The blank page after the last stamp: a dashed outline waiting to be filled. */
function NextPage({ first, left }) {
  const { t } = useI18n()
  return (
    <article className="leaf-page stamp-page next-page">
      <div className="leaf-head small"><span>{first ? t('book.firstPage') : t('book.nextPage')}</span><span /></div>
      <div className="postage-empty"><Icon name="stamp" size={40} /><span>{first ? t('book.emptyText') : t('book.nextText', { n: left })}</span></div>
      <Link to="/map" className="btn btn-sm" style={{ alignSelf: 'center' }}><Icon name="map" size={16} />{t('book.find')}</Link>
    </article>
  )
}
