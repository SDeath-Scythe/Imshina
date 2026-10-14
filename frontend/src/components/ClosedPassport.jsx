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
          <span className="pp-cover-top">
            <span className="pp-cover-ar" lang="ar">جمهورية العراق</span>
            <span className="pp-cover-en">REPUBLIC OF IRAQ</span>
          </span>
          <span className="pp-cover-emblem" aria-hidden="true"><GateArt width={96} tower="rgba(232, 196, 106, 0.2)" arch="rgba(14, 29, 76, 0.6)" line="#E8C46A" reliefs /></span>
          <span className="pp-cover-title" lang="ar">جواز امشينا</span>
          <span className="pp-cover-sub">HERITAGE PASSPORT</span>
          <span className="pp-cover-chip" aria-hidden="true">
            <svg viewBox="0 0 40 26"><rect x="1" y="1" width="38" height="24" rx="4" fill="none" stroke="#E8C46A" strokeWidth="2" /><circle cx="20" cy="13" r="6" fill="none" stroke="#E8C46A" strokeWidth="2" /><path d="M1 13h13M26 13h13" stroke="#E8C46A" strokeWidth="2" /></svg>
          </span>
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
