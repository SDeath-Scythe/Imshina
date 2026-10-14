import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { BackButton, Notice, Wordmark } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { problem } from '../utils/helpers'

const SHOW_DEMO = import.meta.env.DEV || import.meta.env.VITE_DEMO === 'true'

export function homeFor(role) {
  if (role === 'Admin') return '/admin/insights'
  if (role === 'Guide') return '/guide/bookings'
  return '/'
}

export default function LoginPage() {
  const { t, te } = useI18n()
  const { login, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const from = location.state?.from

  if (isAuthenticated) return <Navigate to={from || homeFor(user.role)} replace />

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      const u = await login(email.trim(), password)
      navigate(from || homeFor(u.role), { replace: true })
    } catch (err) {
      setError(problem(err).status === 401 ? t('login.wrong') : te(err))
    } finally { setBusy(false) }
  }

  return (
    <div className="bare-page">
      <BackButton fallback="/welcome" />
      <div className="stack" style={{ '--gap': '6px' }}>
        <Wordmark size={30} />
        <h1 style={{ marginTop: 8 }}>{t('login.title')}</h1>
        <p className="muted">{t('login.subtitle')}</p>
      </div>

      <form className="form" onSubmit={submit}>
        <label className="field">{t('auth.email')}
          <input type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" dir="ltr" />
        </label>
        <label className="field">{t('auth.password')}
          <span className="input-wrap">
            <input type={show ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required aria-invalid={!!error} />
            <button type="button" className="link-btn" onClick={() => setShow(!show)} aria-pressed={show}>{show ? t('auth.hide') : t('auth.show')}</button>
          </span>
        </label>
        {error && <Notice tone="error">{error}</Notice>}
        <button className="btn btn-lg" disabled={busy || !email || !password}>{busy ? t('login.busy') : t('auth.login')}</button>
      </form>

      <div className="stack" style={{ marginTop: 'auto', '--gap': '10px' }}>
        {SHOW_DEMO && (
          <div className="row" style={{ '--gap': '8px' }}>
            <button type="button" className="btn btn-dashed grow" onClick={() => { setEmail('tourist@touriraq.demo'); setPassword('Demo@1234') }}>
              {t('login.demo')}
            </button>
            <button type="button" className="btn btn-dashed grow" onClick={() => { setEmail('guide.omar@touriraq.demo'); setPassword('Demo@1234') }}>
              {t('login.demoGuide')}
            </button>
          </div>
        )}
        <p className="center muted">{t('login.new')} <Link to="/register" state={location.state} style={{ fontWeight: 700 }}>{t('auth.getPassport')}</Link></p>
      </div>
    </div>
  )
}
