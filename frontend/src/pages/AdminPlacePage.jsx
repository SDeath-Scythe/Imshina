import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import Icon from '../components/Icon'
import MapView from '../components/MapView'
import { ErrorState, Notice, PageTitle, Skeleton } from '../components/ui'
import { useToast } from '../context/ToastContext'
import { useI18n } from '../i18n/I18nContext'
import { useGovernorates } from '../api/hooks'
import { invalidate } from '../hooks/useQuery'

const CATEGORIES = ['Archaeological', 'Religious', 'Heritage', 'Nature', 'Other']
const EVENT_TYPES = ['Story', 'Construction', 'Battle', 'Other']
const emptyEvent = () => ({ title: '', titleAr: '', eventType: 'Story', year: '', era: '', summary: '', summaryAr: '', details: '', detailsAr: '' })
const emptyForm = () => ({
  governorateId: '', category: 'Archaeological', name: '', nameAr: '', shortDescription: '', shortDescriptionAr: '',
  description: '', descriptionAr: '', latitude: '', longitude: '', stampRadiusMeters: 150,
  safetyNotes: '', safetyNotesAr: '', culturalTips: '', culturalTipsAr: '',
})

/** English and Arabic versions of one field, side by side (stacked on phones). */
function Pair({ label, en, ar, required, arOptional, rows }) {
  const { t } = useI18n()
  const Field = rows ? 'textarea' : 'input'
  const arRequired = required && !arOptional
  return (
    <div className="form-row">
      <label className="field"><span className={required ? 'req' : ''}>{label} · {t('admin.en')}</span><Field rows={rows} required={required} {...en} /></label>
      <label className="field" dir="rtl" lang="ar"><span className={arRequired ? 'req' : ''}>{label} · العربية</span><Field rows={rows} required={arRequired} {...ar} /></label>
    </div>
  )
}

function Card({ title, hint, children }) {
  return (
    <section className="card stack" style={{ padding: 24, '--gap': '16px' }}>
      <div className="stack" style={{ '--gap': '2px' }}><h2 style={{ fontFamily: 'var(--font-body)', fontSize: 17, fontWeight: 700 }}>{title}</h2>{hint && <span className="small muted">{hint}</span>}</div>
      {children}
    </section>
  )
}

function Thumb({ file, onRemove, label }) {
  const url = useMemo(() => URL.createObjectURL(file), [file])
  useEffect(() => () => URL.revokeObjectURL(url), [url])
  return (
    <span style={{ position: 'relative', width: 150, height: 110, flexShrink: 0 }}>
      <img src={url} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 14 }} />
      <button type="button" className="icon-btn glass" onClick={onRemove} aria-label={label} style={{ position: 'absolute', top: 6, insetInlineEnd: 6, width: 34, height: 34 }}><Icon name="close" size={16} /></button>
    </span>
  )
}

export default function AdminPlacePage() {
  const { t, te, loc } = useI18n()
  const toast = useToast()
  const govs = useGovernorates()
  const [form, setForm] = useState(emptyForm)
  const [events, setEvents] = useState([emptyEvent()])
  const [cover, setCover] = useState(null)
  const [gallery, setGallery] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState(null)

  const bind = (k) => ({ value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) })
  const bindEv = (i, k) => ({ value: events[i][k], onChange: (e) => setEvents(events.map((ev, j) => (j === i ? { ...ev, [k]: e.target.value } : ev))) })
  const lat = parseFloat(form.latitude)
  const lng = parseFloat(form.longitude)
  const hasPoint = Number.isFinite(lat) && Number.isFinite(lng)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!cover) { setError(t('admin.needCover')); return }
    if (!hasPoint) { setError(t('admin.needPoint')); return }
    const data = new FormData()
    Object.entries(form).forEach(([k, v]) => { if (v !== '' && v != null) data.append(k, v) })
    data.append('coverImage', cover)
    gallery.forEach((f) => data.append('images', f))
    events.forEach((ev, i) => Object.entries(ev).forEach(([k, v]) => { if (v !== '' && v != null) data.append(`historicalEvents[${i}].${k}`, v) }))
    setBusy(true)
    try {
      const res = await api.post('/admin/places', data)
      setCreated(res.data)
      toast(t('admin.created'))
      invalidate('places')
      invalidate('governorates')
      setForm(emptyForm()); setEvents([emptyEvent()]); setCover(null); setGallery([])
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) { setError(te(err)); window.scrollTo({ top: 0, behavior: 'smooth' }) } finally { setBusy(false) }
  }

  if (govs.loading) return <div className="page wide"><Skeleton h={400} r={20} /></div>
  if (govs.error) return <div className="page wide"><ErrorState error={govs.error} onRetry={govs.reload} /></div>

  return (
    <form className="page wide" onSubmit={submit}>
      <PageTitle eyebrow={t('admin.eyebrow')} title={t('admin.addTitle')} subtitle={t('admin.addSubtitle')} />
      {created && <Notice tone="success">{t('admin.created')} <Link to={`/places/${created.id}`}>{t('admin.openIt')}</Link></Notice>}
      {error && <Notice tone="error">{error}</Notice>}

      <Card title={t('admin.basics')}>
        <div className="form-row">
          <label className="field"><span className="req">{t('admin.city')}</span>
            <select {...bind('governorateId')} required>
              <option value="">{t('admin.chooseCity')}</option>
              {govs.data.map((g) => <option key={g.id} value={g.id}>{loc(g, 'name')}</option>)}
            </select>
          </label>
          <label className="field"><span className="req">{t('admin.category')}</span>
            <select {...bind('category')}>{CATEGORIES.map((c) => <option key={c} value={c}>{t(`category.${c}`)}</option>)}</select>
          </label>
        </div>
        <Pair label={t('admin.name')} required en={{ ...bind('name'), maxLength: 160 }} ar={{ ...bind('nameAr'), maxLength: 160 }} />
        <Pair label={t('admin.hook')} required rows={2} en={{ ...bind('shortDescription'), maxLength: 500, placeholder: t('admin.hookHint') }} ar={{ ...bind('shortDescriptionAr'), maxLength: 500 }} />
        <Pair label={t('admin.description')} required rows={5} en={{ ...bind('description'), maxLength: 8000 }} ar={{ ...bind('descriptionAr'), maxLength: 8000 }} />
      </Card>

      <Card title={t('admin.zone')} hint={t('admin.zoneHint')}>
        <MapView places={[]} zone={hasPoint ? { lat, lng, radius: Number(form.stampRadiusMeters) || 150 } : null}
          onPick={(p) => setForm((f) => ({ ...f, latitude: p.lat.toFixed(6), longitude: p.lng.toFixed(6) }))} height={320} label={t('admin.mapLabel')} />
        <div className="form-row">
          <label className="field"><span className="req">{t('admin.lat')}</span><input type="number" step="any" min={-90} max={90} dir="ltr" {...bind('latitude')} required /></label>
          <label className="field"><span className="req">{t('admin.lng')}</span><input type="number" step="any" min={-180} max={180} dir="ltr" {...bind('longitude')} required /></label>
        </div>
        <label className="field">{t('admin.radius', { m: form.stampRadiusMeters })}
          <input type="range" min={25} max={2000} step={25} {...bind('stampRadiusMeters')} />
          <span className="hint">{t('admin.radiusHint')}</span>
        </label>
      </Card>

      <Card title={t('admin.photos')} hint={t('admin.photosHint')}>
        <div className="row wrap" style={{ '--gap': '12px', alignItems: 'flex-start' }}>
          {cover ? <Thumb file={cover} onRemove={() => setCover(null)} label={t('admin.removePhoto')} /> : (
            <label className="btn btn-dashed" style={{ width: 150, height: 110, borderRadius: 14, flexDirection: 'column', gap: 4 }}>
              <Icon name="image" /> {t('admin.cover')}
              <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => setCover(e.target.files?.[0] || null)} />
            </label>
          )}
          {gallery.map((f, i) => <Thumb key={`${f.name}-${i}`} file={f} onRemove={() => setGallery(gallery.filter((_, j) => j !== i))} label={t('admin.removePhoto')} />)}
          {gallery.length < 5 && (
            <label className="btn btn-outline" style={{ width: 150, height: 110, borderRadius: 14, flexDirection: 'column', gap: 4 }}>
              <Icon name="plus" /> {t('admin.gallery', { n: 5 - gallery.length })}
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => setGallery([...gallery, ...Array.from(e.target.files || [])].slice(0, 5))} />
            </label>
          )}
        </div>
      </Card>

      <Card title={t('admin.stories')} hint={t('admin.storiesHint')}>
        {events.map((ev, i) => (
          <fieldset key={i} className="stack" style={{ border: '1px solid var(--line)', borderRadius: 16, padding: 16, margin: 0, '--gap': '12px' }}>
            <legend className="eyebrow" style={{ padding: '0 6px' }}>{t('admin.story', { n: i + 1 })}</legend>
            <Pair label={t('admin.storyTitle')} required arOptional en={{ ...bindEv(i, 'title'), maxLength: 180 }} ar={{ ...bindEv(i, 'titleAr'), maxLength: 180 }} />
            <div className="form-row">
              <label className="field">{t('admin.type')}<select {...bindEv(i, 'eventType')}>{EVENT_TYPES.map((x) => <option key={x} value={x}>{t(`event.${x}`)}</option>)}</select></label>
              <label className="field">{t('admin.year')}<span className="hint">{t('admin.yearHint')}</span><input type="number" dir="ltr" {...bindEv(i, 'year')} /></label>
              <label className="field">{t('admin.era')}<span className="hint">&nbsp;</span><input {...bindEv(i, 'era')} maxLength={100} /></label>
            </div>
            <Pair label={t('admin.summary')} required arOptional rows={2} en={{ ...bindEv(i, 'summary'), maxLength: 1000 }} ar={{ ...bindEv(i, 'summaryAr'), maxLength: 1000 }} />
            <Pair label={t('admin.details')} required arOptional rows={4} en={{ ...bindEv(i, 'details'), maxLength: 8000 }} ar={{ ...bindEv(i, 'detailsAr'), maxLength: 8000 }} />
            {events.length > 1 && <button type="button" className="btn btn-danger btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setEvents(events.filter((_, j) => j !== i))}><Icon name="trash" size={16} />{t('admin.removeStory')}</button>}
          </fieldset>
        ))}
        <button type="button" className="btn btn-dashed" style={{ alignSelf: 'flex-start' }} onClick={() => setEvents([...events, emptyEvent()])}><Icon name="plus" size={18} />{t('admin.addStory')}</button>
      </Card>

      <Card title={t('admin.guidance')}>
        <Pair label={t('admin.safety')} rows={3} en={{ ...bind('safetyNotes'), maxLength: 4000 }} ar={{ ...bind('safetyNotesAr'), maxLength: 4000 }} />
        <Pair label={t('admin.tips')} rows={3} en={{ ...bind('culturalTips'), maxLength: 4000, placeholder: t('admin.tipsHint') }} ar={{ ...bind('culturalTipsAr'), maxLength: 4000 }} />
      </Card>

      <div className="row" style={{ justifyContent: 'flex-end', paddingBottom: 24 }}>
        <button className="btn btn-lg" disabled={busy}><Icon name="upload" size={18} />{busy ? t('common.saving') : t('admin.publish')}</button>
      </div>
    </form>
  )
}
