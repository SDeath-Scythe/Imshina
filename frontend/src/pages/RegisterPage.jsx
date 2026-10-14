import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import { BackButton, Notice, Segmented } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { homeFor, safeFrom } from './LoginPage'
import { GUIDE_LANGS } from '../utils/helpers'

const COUNTRIES = ['Iraq', 'United Kingdom', 'United States', 'Germany', 'France', 'Iran', 'Turkey', 'Lebanon', 'Kuwait', 'Saudi Arabia', 'Pakistan', 'India', 'Canada', 'Australia', 'Netherlands', 'Italy', 'Spain', 'Japan', 'China']

export default function RegisterPage() {
  const { t, tf, te, lang } = useI18n()
  const { register, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ role: 'Tourist', fullName: '', email: '', password: '', gender: '', country: '', bio: '', pricePerDay: 60, languages: ['English', 'Arabic'] })
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const isGuide = form.role === 'Guide'
  const from = location.state?.from

  if (isAuthenticated) return <Navigate to={safeFrom(from, user.role) || homeFor(user.role)} replace />

  const toggleLang = (l) => setForm((f) => ({ ...f, languages: f.languages.includes(l) ? f.languages.filter((x) => x !== l) : [...f.languages, l] }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.gender) { setError(t('register.needGender')); return }
    if (form.password.length < 8) { setError(t('register.shortPassword')); return }
    if (isGuide && form.languages.length === 0) { setError(t('register.needLanguage')); return }
    if (isGuide && !(Number(form.pricePerDay) > 0 && Number(form.pricePerDay) <= 10000)) { setError(t('register.needPrice')); return }
    const payload = {
      fullName: form.fullName.trim(), email: form.email.trim(), password: form.password, role: form.role,
      gender: form.gender, country: form.country.trim(), preferredLanguage: lang === 'ar' ? 'Arabic' : 'English',
    }
    if (isGuide) Object.assign(payload, { bio: form.bio.trim(), pricePerDay: Number(form.pricePerDay), languages: form.languages })
    setBusy(true)
    try {
      const u = await register(payload)
      // A new guide goes straight to their profile to pick the places they guide at.
      if (u.role === 'Guide') navigate('/guide/profile', { replace: true, state: { welcome: true } })
      else navigate(safeFrom(from, u.role) || homeFor(u.role), { replace: true })
    } catch (err) { setError(te(err)) } finally { setBusy(false) }
  }

  return (
    <div className="bare-page">
      <BackButton fallback="/welcome" />
      <div className="stack" style={{ '--gap': '4px' }}>
        <h1>{isGuide ? t('register.guideTitle') : t('register.title')}</h1>
        <p className="muted">{isGuide ? t('register.guideSubtitle') : t('register.subtitle')}</p>
      </div>

      <Segmented label={t('register.accountType')} value={form.role} onChange={(role) => setForm({ ...form, role })}
        options={[{ value: 'Tourist', label: t('register.traveller') }, { value: 'Guide', label: t('register.guide') }]} />

      <form className="form" onSubmit={submit}>
        <label className="field"><span className="req">{t('auth.fullName')}</span>
          <span className="hint">{t('register.nameHint')}</span>
          <input autoComplete="name" value={form.fullName} onChange={set('fullName')} required maxLength={120} />
        </label>
        <label className="field"><span className="req">{t('auth.email')}</span>
          <input type="email" autoComplete="email" inputMode="email" dir="ltr" value={form.email} onChange={set('email')} required maxLength={256} />
        </label>
        <label className="field"><span className="req">{t('auth.password')}</span>
          <span className="hint">{t('register.passwordHint')}</span>
          <span className="input-wrap">
            <input type={show ? 'text' : 'password'} autoComplete="new-password" value={form.password} onChange={set('password')} required minLength={8} maxLength={100} />
            <button type="button" className="link-btn" onClick={() => setShow(!show)} aria-pressed={show}>{show ? t('auth.hide') : t('auth.show')}</button>
          </span>
        </label>

        <fieldset className="stack" style={{ border: 0, margin: 0, padding: 0, '--gap': '8px' }}>
          <legend className="field" style={{ padding: 0, marginBottom: 8 }}><span className="req">{t('register.iAm')}</span></legend>
          <Segmented tabs={false} label={t('register.iAm')} value={form.gender} onChange={(gender) => setForm({ ...form, gender })}
            options={[{ value: 'Female', label: t('register.woman') }, { value: 'Male', label: t('register.man') }]} />
          <span className="row small muted" style={{ '--gap': '8px', alignItems: 'flex-start' }}>
            <Icon name="lock" size={16} style={{ flexShrink: 0, marginTop: 2 }} />{t('register.genderWhy')}
          </span>
        </fieldset>

        <label className="field"><span className="req">{t('auth.country')}</span>
          <input list="countries" autoComplete="country-name" value={form.country} onChange={set('country')} required maxLength={80} />
          <datalist id="countries">{COUNTRIES.map((c) => <option key={c} value={c} />)}</datalist>
        </label>

        {isGuide && (
          <>
            <label className="field">{t('register.bio')}
              <span className="hint">{t('register.bioHint')}</span>
              <textarea rows={4} value={form.bio} onChange={set('bio')} maxLength={2000} />
            </label>
            <label className="field">{t('register.price')}
              <span className="input-wrap">
                <input type="number" inputMode="numeric" min={0} max={10000} value={form.pricePerDay} onChange={set('pricePerDay')} dir="ltr" />
                <span className="link-btn" aria-hidden="true" style={{ color: 'var(--muted)' }}>USD</span>
              </span>
            </label>
            <fieldset className="stack" style={{ border: 0, margin: 0, padding: 0, '--gap': '8px' }}>
              <legend className="field" style={{ padding: 0, marginBottom: 8 }}>{t('register.languages')}</legend>
              <div className="row wrap" style={{ '--gap': '8px' }}>
                {GUIDE_LANGS.map((l) => (
                  <button key={l} type="button" className="chip" aria-pressed={form.languages.includes(l)} onClick={() => toggleLang(l)}>{tf(`language.${l}`, l)}</button>
                ))}
              </div>
            </fieldset>
          </>
        )}

        {error && <Notice tone="error">{error}</Notice>}
        <button className="btn btn-lg" disabled={busy}>{busy ? t('register.busy') : isGuide ? t('register.createGuide') : t('register.create')}</button>
        <span className="xsmall muted center">{t('register.terms')}</span>
      </form>

      <p className="center muted">{t('register.have')} <Link to="/login" state={location.state} style={{ fontWeight: 700 }}>{t('auth.login')}</Link></p>
    </div>
  )
}
