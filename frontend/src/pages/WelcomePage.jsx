import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import { GateArt } from '../components/Art'
import { useI18n } from '../i18n/I18nContext'
import { usePlaces } from '../api/hooks'

// eslint-disable-next-line react-refresh/only-export-components
export const WELCOMED_KEY = 'imshina_welcomed'

export default function WelcomePage() {
  const { t, lang, setLang } = useI18n()
  const navigate = useNavigate()
  const places = usePlaces()
  const count = places.data?.length
  const done = () => localStorage.setItem(WELCOMED_KEY, '1')

  const steps = [
    { icon: 'walk', title: t('welcome.step1'), text: t('welcome.step1Text') },
    { icon: 'stamp', title: t('welcome.step2'), text: t('welcome.step2Text') },
    { icon: 'gift', title: t('welcome.step3'), text: t('welcome.step3Text') },
  ]

  return (
    <div className="bricks" style={{ '--brick': 'var(--lapis)', minHeight: '100dvh', color: '#fff' }}>
      <div className="bare-page">
        <div role="group" aria-label={t('a11y.language')} className="row" style={{ alignSelf: 'flex-end', padding: 4, borderRadius: 22, background: 'rgba(255,255,255,0.14)', '--gap': '4px' }}>
          {[['en', 'English'], ['ar', 'العربية']].map(([code, label]) => (
            <button key={code} type="button" lang={code} aria-pressed={lang === code} onClick={() => setLang(code)}
              style={{ minHeight: 40, padding: '0 14px', borderRadius: 20, border: 0, fontWeight: 600, fontSize: 14, background: lang === code ? '#fff' : 'transparent', color: lang === code ? 'var(--ink)' : '#fff' }}>
              {label}
            </button>
          ))}
        </div>

        <div className="stack center" style={{ alignItems: 'center', '--gap': '14px', marginTop: 8 }}>
          <GateArt width={140} />
          <span className="wordmark" lang="ar" style={{ fontSize: 60, color: 'var(--gold)' }}>امشينا</span>
          <h1 style={{ color: '#fff', fontSize: 26 }}>{t('welcome.title')}</h1>
          <p style={{ color: '#D7DEF2', maxWidth: 330 }}>{t('welcome.text', { n: count || 18 })}</p>
        </div>

        <ol className="stack" style={{ listStyle: 'none', margin: 0, padding: 0, '--gap': '10px' }}>
          {steps.map((s, i) => (
            <li key={s.icon} className="row" style={{ padding: '12px 14px', borderRadius: 16, background: 'rgba(255,255,255,0.08)', '--gap': '14px' }}>
              <span style={{ width: 40, height: 40, borderRadius: 20, background: i === 1 ? 'var(--gold)' : 'rgba(255,255,255,0.14)', color: i === 1 ? 'var(--ink)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={s.icon} size={20} />
              </span>
              <span className="stack" style={{ '--gap': '0px' }}>
                <b>{s.title}</b>
                <span className="small" style={{ color: '#D7DEF2' }}>{s.text}</span>
              </span>
            </li>
          ))}
        </ol>

        <div className="stack" style={{ marginTop: 'auto', '--gap': '10px' }}>
          <Link to="/register" onClick={done} className="btn btn-gold btn-lg">{t('auth.getPassport')}</Link>
          <Link to="/login" onClick={done} className="btn btn-on-dark">{t('auth.haveAccount')}</Link>
          <button type="button" className="link-btn" style={{ color: '#D7DEF2', justifyContent: 'center', textDecoration: 'underline' }}
            onClick={() => { done(); navigate('/', { replace: true }) }}>
            {t('welcome.browse')}
          </button>
        </div>
      </div>
    </div>
  )
}
