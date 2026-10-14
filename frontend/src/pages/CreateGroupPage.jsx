import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api/client'
import Icon from '../components/Icon'
import { ActionBar, BackButton, Notice, NumberStepper } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { useTrips } from '../api/hooks'
import { invalidate } from '../hooks/useQuery'
import { addDaysISO, todayISO } from '../utils/helpers'

export default function CreateGroupPage() {
  const { user } = useAuth()
  const { t, te } = useI18n()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const trips = useTrips()
  const ownType = user.gender === 'Female' ? 'WomenOnly' : 'MenOnly'
  const isAgency = user.role === 'Agency'
  const [form, setForm] = useState({
    name: '', description: '', genderType: 'Mixed', maxMembers: 8,
    startDate: addDaysISO(todayISO(), 7), tripId: params.get('trip') || '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const types = [
    { value: 'Mixed', label: t('groups.Mixed'), hint: t('create.mixedHint') },
    { value: 'WomenOnly', label: t('groups.WomenOnly'), hint: t('create.womenHint') },
    { value: 'MenOnly', label: t('groups.MenOnly'), hint: t('create.menHint') },
  ].map((x) => ({ ...x, disabled: !isAgency && x.value !== 'Mixed' && x.value !== ownType }))

  const submit = async (e) => {
    e?.preventDefault()
    setError('')
    if (!form.name.trim()) { setError(t('create.needName')); return }
    if (!form.startDate || form.startDate < todayISO()) { setError(t('create.needDate')); return }
    setBusy(true)
    try {
      const { data } = await api.post('/groups', {
        name: form.name.trim(), description: form.description.trim(), genderType: form.genderType,
        maxMembers: form.maxMembers, startDate: form.startDate, tripId: form.tripId ? Number(form.tripId) : null,
      })
      invalidate('groups')
      navigate(`/groups/${data.id}`, { replace: true })
    } catch (err) { setError(te(err)) } finally { setBusy(false) }
  }

  return (
    <>
      <form className="page" onSubmit={submit} noValidate>
        <header className="row" style={{ '--gap': '12px' }}>
          <BackButton fallback="/groups" />
          <h1 className="grow" style={{ fontSize: 24 }}>{t('create.title')}</h1>
        </header>

        <label className="field"><span className="req">{t('create.name')}</span>
          <input value={form.name} onChange={set('name')} maxLength={120} placeholder={t('create.namePlaceholder')} aria-invalid={!!error && !form.name.trim()} />
        </label>
        <label className="field">{t('create.plan')} <span className="hint">{t('create.planHint')}</span>
          <textarea rows={3} value={form.description} onChange={set('description')} maxLength={2000} />
        </label>

        <label className="field">{t('create.trip')} <span className="hint">{t('common.optional')}</span>
          <select value={form.tripId} onChange={set('tripId')}>
            <option value="">{t('create.noTrip')}</option>
            {(trips.data || []).map((tr) => <option key={tr.id} value={tr.id}>{tr.title}</option>)}
          </select>
        </label>

        <fieldset className="stack" style={{ border: 0, margin: 0, padding: 0, '--gap': '8px' }}>
          <legend className="field" style={{ marginBottom: 8, padding: 0 }}>{t('create.who')}</legend>
          <div role="radiogroup" className="stack" style={{ '--gap': '8px' }}>
            {types.map((x) => (
              <button key={x.value} type="button" role="radio" aria-checked={form.genderType === x.value} className="radio-card"
                disabled={x.disabled} onClick={() => setForm({ ...form, genderType: x.value })}>
                <span className="radio-dot" />
                <span className="stack" style={{ '--gap': '0px' }}>
                  <b>{x.label}</b>
                  <span className="small muted">{x.disabled ? t('create.notForYou') : x.hint}</span>
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="form-row">
          <label className="field"><span className="req">{t('create.start')}</span>
            <input type="date" min={todayISO()} value={form.startDate} onChange={set('startDate')} />
          </label>
          <div className="field">
            <span id="size-label">{t('create.size')}</span>
            <NumberStepper value={form.maxMembers} min={2} max={100} onChange={(n) => setForm({ ...form, maxMembers: n })} label={t('create.size')} />
            <span className="hint">{t('create.sizeHint')}</span>
          </div>
        </div>

        <Notice tone="info" icon="shield">{t('create.approveNote')}</Notice>
        {error && <Notice tone="error">{error}</Notice>}
      </form>
      <ActionBar>
        <button type="button" className="btn btn-lg grow" onClick={submit} disabled={busy}>
          <Icon name="users" size={18} style={{ color: 'var(--gold)' }} />{busy ? t('common.saving') : t('create.publish')}
        </button>
      </ActionBar>
    </>
  )
}
