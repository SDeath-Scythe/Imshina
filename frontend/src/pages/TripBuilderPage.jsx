import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import Icon from '../components/Icon'
import { PlaceArt } from '../components/PlaceCard'
import { ActionBar, BackButton, Empty, Notice, Section, Sheet, SkeletonRows } from '../components/ui'
import { useI18n } from '../i18n/I18nContext'
import { useGovernorates, usePassport, usePlaces } from '../api/hooks'
import { invalidate } from '../hooks/useQuery'

function AddPlacesSheet({ open, onClose, dayIndex, days, onToggle }) {
  const { t, loc } = useI18n()
  const places = usePlaces()
  const govs = useGovernorates()
  const passport = usePassport()
  const [q, setQ] = useState('')
  const stamped = useMemo(() => new Set((passport.data?.stamps || []).map((s) => s.placeId)), [passport.data])
  const dayOf = useMemo(() => {
    const m = new Map()
    days.forEach((d, i) => d.forEach((pid) => m.set(pid, i)))
    return m
  }, [days])
  const n = q.trim().toLowerCase()
  const filtered = (places.data || []).filter((p) => !n || p.name.toLowerCase().includes(n) || p.nameAr.includes(q.trim()))

  return (
    <Sheet open={open} onClose={onClose} title={t('builder.addTo', { n: dayIndex + 1 })}
      footer={<button type="button" className="btn btn-lg" onClick={onClose}>{t('common.done')}</button>}>
      <label className="field">
        <span className="sr-only">{t('search.label')}</span>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search.placeholder')} />
      </label>
      {places.loading ? <SkeletonRows n={4} h={60} /> : (govs.data || []).map((g) => {
        const list = filtered.filter((p) => p.governorateId === g.id)
        if (!list.length) return null
        return (
          <div key={g.id} className="stack" style={{ '--gap': '4px' }}>
            <span className="eyebrow">{loc(g, 'name')}</span>
            {list.map((p) => {
              const at = dayOf.get(p.id)
              const here = at === dayIndex
              const elsewhere = at != null && !here
              return (
                <button key={p.id} type="button" className="list-row" onClick={() => onToggle(p.id)} aria-pressed={here}
                  style={{ background: 'none', border: 0, borderBottom: '1px solid var(--line)', width: '100%', textAlign: 'start' }}>
                  <PlaceArt place={p} />
                  <span className="grow stack" style={{ '--gap': '0px' }}>
                    <b style={{ fontWeight: 600 }}>{loc(p, 'name')}</b>
                    <span className="small muted">{elsewhere ? t('builder.onDay', { n: at + 1 }) : stamped.has(p.id) ? t('trips.inPassport') : t(`category.${p.category}`)}</span>
                  </span>
                  <span className={`badge ${here ? 'blue' : 'plain'}`}>{here ? <><Icon name="check" size={14} stroke={2.6} />{t('builder.added')}</> : elsewhere ? t('builder.move') : t('builder.add')}</span>
                </button>
              )
            })}
          </div>
        )
      })}
    </Sheet>
  )
}

export default function TripBuilderPage() {
  const { t, te, loc } = useI18n()
  const navigate = useNavigate()
  const places = usePlaces()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [days, setDays] = useState([[]])
  const [current, setCurrent] = useState(0)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const byId = useMemo(() => new Map((places.data || []).map((p) => [p.id, p])), [places.data])

  const toggle = (pid) => setDays((ds) => {
    const at = ds.findIndex((d) => d.includes(pid))
    const next = ds.map((d) => d.filter((x) => x !== pid))
    if (at !== current) {
      if (next[current].length >= 12) { setError(t('builder.max12')); return ds }
      next[current] = [...next[current], pid]
    }
    setError('')
    return next
  })
  const move = (i, dir) => setDays((ds) => ds.map((d, k) => {
    if (k !== current) return d
    const out = [...d]
    const j = i + dir
    if (j < 0 || j >= out.length) return d
    ;[out[i], out[j]] = [out[j], out[i]]
    return out
  }))
  const addDay = () => { setDays((ds) => [...ds, []]); setCurrent(days.length) }
  const removeDay = (i) => {
    setDays((ds) => ds.filter((_, k) => k !== i))
    setCurrent((c) => Math.max(0, c >= i ? c - 1 : c))
  }

  const total = days.reduce((s, d) => s + d.length, 0)
  const save = async () => {
    setError('')
    if (!title.trim()) { setError(t('builder.needTitle')); return }
    const payload = days.filter((d) => d.length).map((d, i) => ({ dayNumber: i + 1, placeIds: d }))
    if (!payload.length) { setError(t('builder.needPlace')); return }
    setBusy(true)
    try {
      const { data } = await api.post('/trips/custom', { title: title.trim(), description: description.trim(), days: payload })
      invalidate('mytrips')
      navigate(`/trips/${data.id}`, { replace: true })
    } catch (err) { setError(te(err)) } finally { setBusy(false) }
  }
  const day = days[current] || []

  return (
    <>
      <div className="page">
        <header className="row" style={{ '--gap': '12px' }}>
          <BackButton fallback="/trips" />
          <h1 className="grow" style={{ fontSize: 22 }}>{t('builder.title')}</h1>
        </header>

        <div className="form">
          <label className="field"><span className="req">{t('builder.name')}</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder={t('builder.namePlaceholder')} />
          </label>
          <label className="field">{t('builder.notes')} <span className="hint">{t('common.optional')}</span>
            <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} placeholder={t('builder.notesPlaceholder')} />
          </label>
        </div>

        <Section title={t('builder.days')} action={<button type="button" className="link-btn" onClick={addDay} disabled={days.length >= 30}><Icon name="plus" size={16} />{t('builder.addDay')}</button>}>
          <div className="scroll-x" role="tablist" aria-label={t('builder.days')}>
            {days.map((d, i) => (
              <button key={i} type="button" role="tab" className="chip" aria-selected={i === current} aria-pressed={i === current} onClick={() => setCurrent(i)}>
                {t('trips.day', { n: i + 1 })}<span className="count">{d.length}</span>
              </button>
            ))}
          </div>

          {day.length === 0 ? (
            <Empty icon="pin" title={t('builder.emptyDay', { n: current + 1 })}>{t('builder.emptyDayText')}</Empty>
          ) : (
            <ol className="stops">
              {day.map((pid, i) => {
                const p = byId.get(pid)
                return (
                  <li key={pid} className="stop">
                    <span className="stop-rail"><span className="stop-num">{i + 1}</span><span className="stop-line" /></span>
                    <div className="stop-body row" style={{ '--gap': '6px', flexDirection: 'row', alignItems: 'flex-start' }}>
                      <span className="grow stack" style={{ '--gap': '0px' }}>
                        <b style={{ fontWeight: 600 }}>{p ? loc(p, 'name') : '…'}</b>
                        <span className="small muted">{p ? t(`category.${p.category}`) : ''}</span>
                      </span>
                      <button type="button" className="icon-btn" style={{ width: 40, height: 40 }} onClick={() => move(i, -1)} disabled={i === 0} aria-label={t('builder.up')}><Icon name="down" size={16} style={{ transform: 'rotate(180deg)' }} /></button>
                      <button type="button" className="icon-btn" style={{ width: 40, height: 40 }} onClick={() => move(i, 1)} disabled={i === day.length - 1} aria-label={t('builder.down')}><Icon name="down" size={16} /></button>
                      <button type="button" className="icon-btn" style={{ width: 40, height: 40, color: 'var(--clay)' }} onClick={() => toggle(pid)} aria-label={t('builder.remove', { place: p ? loc(p, 'name') : '' })}><Icon name="trash" size={16} /></button>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
          <div className="row wrap" style={{ '--gap': '8px' }}>
            <button type="button" className="btn btn-dashed grow" onClick={() => setAdding(true)}><Icon name="plus" size={18} />{t('builder.addPlaces')}</button>
            {days.length > 1 && <button type="button" className="btn btn-danger" onClick={() => removeDay(current)}>{t('builder.removeDay')}</button>}
          </div>
        </Section>

        {error && <Notice tone="error">{error}</Notice>}
      </div>

      <ActionBar>
        <span className="stack grow" style={{ '--gap': '0px' }}>
          <b>{t('common.placesCount', { n: total })} · {t('common.days', { n: days.filter((d) => d.length).length || 1 })}</b>
          <span className="xsmall muted">{t('builder.private')}</span>
        </span>
        <button type="button" className="btn btn-lg" onClick={save} disabled={busy}>{busy ? t('common.saving') : t('builder.save')}</button>
      </ActionBar>

      <AddPlacesSheet open={adding} onClose={() => setAdding(false)} dayIndex={current} days={days} onToggle={toggle} />
    </>
  )
}
