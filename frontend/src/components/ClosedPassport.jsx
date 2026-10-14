import { Link, useLocation } from 'react-router-dom'
import { GateArt } from './Art'
import { useI18n } from '../i18n/I18nContext'

/** The passport, closed: what a guest sees before they have one. Tapping the cover leads to sign-up. */
export default function ClosedPassport() {
  const { t } = useI18n()
  const location = useLocation()
  const state = { from: location.pathname }
  return (
    <div className="closed-wrap">
      <Link to="/register" state={state} className="closed-book" aria-label={t('closed.open')}>
        <span className="pp-cover-pages" aria-hidden="true" />
        <span className="pp-cover">
          <span className="pp-cover-frame" aria-hidden="true" />
          {/* Brand only: no state names or official passport marks, so nobody mistakes this for a government document. */}
          <span className="pp-cover-emblem" aria-hidden="true"><GateArt width={96} tower="rgba(232, 196, 106, 0.2)" arch="rgba(14, 29, 76, 0.6)" line="#E8C46A" reliefs /></span>
          <span className="pp-cover-title" lang="ar">جواز امشينا</span>
          <span className="pp-cover-sub">HERITAGE PASSPORT</span>
          <span className="pp-cover-brand">IMSHINA</span>
        </span>
        <span className="closed-rings" aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <span key={i} className="ring" />)}</span>
      </Link>
      <div className="closed-text">
        <h1>{t('passport.guestTitle')}</h1>
        <p className="muted">{t('passport.guestText')}</p>
        <div className="row wrap" style={{ justifyContent: 'center', '--gap': '10px' }}>
          <Link to="/register" state={state} className="btn">{t('auth.getPassport')}</Link>
          <Link to="/login" state={state} className="btn btn-outline">{t('auth.login')}</Link>
        </div>
      </div>
    </div>
  )
}
