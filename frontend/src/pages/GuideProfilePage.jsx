import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import api from '../api/client'
import Icon from '../components/Icon'
import { ActionBar, BackButton, ErrorState, Notice, Skeleton } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useI18n } from '../i18n/I18nContext'
import { useGovernorates, useGuide, usePlaces } from '../api/hooks'
import { invalidate } from '../hooks/useQuery'
import { GUIDE_LANGS } from '../utils/helpers'

/** A guide's own profile: bio, price, languages and the places they take visitors to. */
export default function GuideProfilePage() {
  const { user } = useAuth()
  const { t, tf, te, loc } = useI18n()
  const toast = useToast()
  const location = useLocation()
  const guide = useGuide(user.id)
  const places = usePlaces()
  const govs = useGovernorates()
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const welcome = location.state?.welcome // just registered

  // Fill the form once, from the saved profile.
  useEffect(() => {
    if (guide.data && !form) {
      const g = guide.data
      setForm({ bio: g.bio || '', pricePerDay: g.pricePerDay, languages: g.languages, placeIds: g.destinations.map((d) => d.id) })
    }
  }, [guide.data, form])

  if (guide.error) return <div className="page"><BackButton fallback="/profile" /><ErrorState error={guide.error} onRetry={guide.reload} /></div>
  if (!form || places.loading || govs.loading) return <div className="page"><Skeleton h={60} /><Skeleton h={420} r={20} /></div>

  const toggle = (key, value) => setForm((f) => ({ ...f, [key]: f[key].includes(value) ? f[key].filter((x) => x !== value) : [...f[key], value] }))
  const langs = [...new Set([...GUIDE_LANGS, ...form.languages])]

  const save = async (e) => {
    e?.preventDefault()
    setError('')
    const price = Number(form.pricePerDay)
    if (!(price > 0) || price > 10000) { setError(t('register.needPrice')); return }
    if (form.languages.length === 0) { setError(t('register.needLanguage')); return }
    setBusy(true)
    try {
      await api.put('/guides/me', { bio: form.bio.trim(), pricePerDay: price, languages: form.languages, placeIds: form.placeIds })
      invalidate(`guide:${user.id}`)
      invalidate('guides')
      toast(t('guideEdit.saved'))
    } catch (err) { setError(te(err)) } finally { setBusy(false) }
  }

  return (
    <>
      <form className="page" onSubmit={save} noValidate>
        <header className="row" style={{ '--gap': '12px' }}>
          <BackButton fallback="/profile" />
          <h1 className="grow" style={{ fontSize: 24 }}>{t('guideEdit.title')}</h1>
          <Link to={`/guides/${user.id}`} className="link-btn"><Icon name="eye" size={16} />{t('guideEdit.preview')}</Link>
        </header>
        {welcome && <Notice tone="success" icon="check">{t('guideEdit.welcome')}</Notice>}

        <label className="field">{t('register.bio')}
          <span className="hint">{t('register.bioHint')}</span>
          <textarea rows={5} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} maxLength={2000} />
        </label>

        <label className="field"><span className="req">{t('register.price')}</span>
          <span className="input-wrap">
            <input type="number" inputMode="numeric" min={1} max={10000} value={form.pricePerDay} onChange={(e) => setForm({ ...form, pricePerDay: e.target.value })} dir="ltr" />
            <span className="link-btn" aria-hidden="true" style={{ color: 'var(--muted)' }}>USD</span>
          </span>
        </label>

        <fieldset className="stack" style={{ border: 0, margin: 0, padding: 0, '--gap': '8px' }}>
          <legend className="field" style={{ padding: 0, marginBottom: 8 }}><span className="req">{t('register.languages')}</span></legend>
          <div className="row wrap" style={{ '--gap': '8px' }}>
            {langs.map((l) => (
              <button key={l} type="button" className="chip" aria-pressed={form.languages.includes(l)} onClick={() => toggle('languages', l)}>{tf(`language.${l}`, l)}</button>
            ))}
          </div>
        </fieldset>

        <fieldset className="stack" style={{ border: 0, margin: 0, padding: 0, '--gap': '10px' }}>
          <legend className="field" style={{ padding: 0, marginBottom: 4 }}>{t('guideEdit.places')}</legend>
          <span className="small muted">{t('guideEdit.placesHint')}</span>
          {(govs.data || []).map((g) => {
            const list = (places.data || []).filter((p) => p.governorateId === g.id)
            if (!list.length) return null
            return (
              <div key={g.id} className="stack" style={{ '--gap': '6px' }}>
                <span className="eyebrow">{loc(g, 'name')}</span>
                <div className="row wrap" style={{ '--gap': '8px' }}>
                  {list.map((p) => (
                    <button key={p.id} type="button" className="chip" aria-pressed={form.placeIds.includes(p.id)} onClick={() => toggle('placeIds', p.id)}>
                      {form.placeIds.includes(p.id) && <Icon name="check" size={14} stroke={2.8} />}{loc(p, 'name')}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
          {form.placeIds.length === 0 && <Notice tone="warn">{t('guideEdit.noPlaces')}</Notice>}
        </fieldset>

        {error && <Notice tone="error">{error}</Notice>}
      </form>
      <ActionBar>
        <button type="button" className="btn btn-lg grow" onClick={save} disabled={busy}>{busy ? t('common.saving') : t('guideEdit.save')}</button>
      </ActionBar>
    </>
  )
}
