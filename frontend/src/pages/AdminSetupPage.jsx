import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client'
import Icon from '../components/Icon'
import { Empty, ErrorState, Notice, Skeleton, Wordmark } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { useAdminSetupStatus } from '../api/hooks'

export default function AdminSetupPage() {
  const { t, te } = useI18n()
  const { login } = useAuth()
  const navigate = useNavigate()
  const status = useAdminSetupStatus()
  const [f, setF] = useState({ setupToken: '', fullName: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (f.password.length < 12) { setError(t('admin.passwordLength')); return }
    if (f.password !== f.confirm) { setError(t('admin.passwordMatch')); return }
    setBusy(true)
    try {
      await api.post('/admin-setup', { setupToken: f.setupToken, fullName: f.fullName.trim(), email: f.email.trim(), password: f.password })
      await login(f.email.trim(), f.password)
      navigate('/admin/places/new', { replace: true })
    } catch (err) { setError(te(err)) } finally { setBusy(false) }
  }

  const steps = [t('admin.step1'), t('admin.step2'), t('admin.step3')]

  return (
    <div className="page wide">
      <div className="row wrap" style={{ alignItems: 'stretch', '--gap': '20px' }}>
        <aside className="bricks stack" style={{ '--brick': 'var(--lapis-deep)', flex: '1 1 320px', color: '#fff', borderRadius: 24, padding: 32, '--gap': '24px' }}>
          <span style={{ color: 'var(--gold)' }}><Wordmark size={32} /></span>
          <h1 style={{ color: '#fff', fontSize: 30 }}>{t('admin.setupTitle')}</h1>
          <ol className="stack" style={{ listStyle: 'none', margin: 0, padding: 0, '--gap': '16px' }}>
            {steps.map((s, i) => (
              <li key={s} className="row" style={{ '--gap': '14px', alignItems: 'flex-start' }}>
                <b style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 16, background: i === 0 ? 'var(--gold)' : 'rgba(255,255,255,0.18)', color: i === 0 ? 'var(--ink)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</b>
                <span style={{ color: '#E3E8F6' }}>{s}</span>
              </li>
            ))}
          </ol>
        </aside>

        <section className="card" style={{ flex: '999 1 420px', padding: 28, minWidth: 0 }}>
          {status.loading ? <Skeleton h={300} /> : status.error ? <ErrorState error={status.error} onRetry={status.reload} /> : !status.data?.available ? (
            <Empty icon="lock" title={t('admin.closedTitle')} action={<Link to="/login" className="btn btn-sm">{t('auth.login')}</Link>}>{t('admin.closedText')}</Empty>
          ) : (
            <form className="form" onSubmit={submit} style={{ maxWidth: 480 }}>
              <h2>{t('admin.create')}</h2>
              <label className="field"><span className="req">{t('admin.token')}</span>
                <span className="hint">{t('admin.tokenHint')}</span>
                <input type="password" autoComplete="off" value={f.setupToken} onChange={set('setupToken')} required style={{ fontFamily: 'ui-monospace, monospace' }} />
              </label>
              <label className="field"><span className="req">{t('auth.fullName')}</span><input autoComplete="name" value={f.fullName} onChange={set('fullName')} required maxLength={120} /></label>
              <label className="field"><span className="req">{t('auth.email')}</span><input type="email" dir="ltr" autoComplete="email" value={f.email} onChange={set('email')} required maxLength={256} /></label>
              <div className="form-row">
                <label className="field"><span className="req">{t('auth.password')}</span><span className="hint">{t('admin.passwordHint')}</span><input type="password" autoComplete="new-password" value={f.password} onChange={set('password')} required minLength={12} maxLength={100} /></label>
                <label className="field"><span className="req">{t('admin.confirm')}</span><span className="hint">&nbsp;</span><input type="password" autoComplete="new-password" value={f.confirm} onChange={set('confirm')} required /></label>
              </div>
              <Notice tone="warn">{t('admin.onlyOnce')}</Notice>
              {error && <Notice tone="error">{error}</Notice>}
              <button className="btn btn-lg" disabled={busy}><Icon name="shield" size={18} />{busy ? t('common.saving') : t('admin.create')}</button>
            </form>
          )}
        </section>
      </div>
    </div>
  )
}
