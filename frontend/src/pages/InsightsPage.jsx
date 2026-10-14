import { useState } from 'react'
import { useInsights } from '../api/hooks'
import { Empty, ErrorState, PageTitle, Section, Segmented, Skeleton, SkeletonRows } from '../components/ui'
import { useI18n } from '../i18n/I18nContext'
import { formatDate } from '../utils/helpers'

const fmt = (n) => new Intl.NumberFormat('en-US').format(n)

/** Horizontal bars with the value at the end: one hue, sorted by size, so it reads like a ranked table. */
function BarList({ rows, label, max: maxRows = 8 }) {
  const { t } = useI18n()
  const [all, setAll] = useState(false)
  const top = Math.max(1, ...rows.map((r) => r.value))
  const shown = all ? rows : rows.slice(0, maxRows)
  return (
    <div className="stack" style={{ '--gap': '6px' }}>
      <ul className="barlist" aria-label={label}>
        {shown.map((r) => (
          <li key={r.key} title={`${r.label}: ${fmt(r.value)}`}>
            <span className="barlist-label">{r.label}{r.sub && <span className="muted"> · {r.sub}</span>}</span>
            <span className="barlist-track"><span className="barlist-bar" style={{ width: `${(r.value / top) * 100}%` }} /></span>
            <span className="barlist-value num">{fmt(r.value)}</span>
          </li>
        ))}
      </ul>
      {rows.length > maxRows && (
        <button type="button" className="link-btn" style={{ alignSelf: 'flex-start' }} onClick={() => setAll((x) => !x)}>
          {all ? t('insights.showLess') : t('insights.showAll', { n: rows.length })}
        </button>
      )}
    </div>
  )
}

/** Vertical columns along a baseline, with a hover/focus readout and the peak labelled. */
function Columns({ data, label, tick }) {
  const [active, setActive] = useState(null)
  const top = Math.max(1, ...data.map((d) => d.value))
  const peak = data.reduce((best, d, i) => (d.value > (data[best]?.value ?? -1) ? i : best), 0)
  const shown = active ?? (data[peak]?.value ? peak : null)
  return (
    <figure className="columns" aria-label={label} style={{ '--n': data.length }}>
      <div className="columns-readout small" aria-live="polite">
        {shown != null ? <><b className="num">{fmt(data[shown].value)}</b> <span className="muted">· {data[shown].label}</span></> : ' '}
      </div>
      <div className="columns-plot" onMouseLeave={() => setActive(null)}>
        {data.map((d, i) => (
          <button type="button" key={d.key} className={`col ${i === shown ? 'on' : ''}`} aria-label={`${d.label}: ${fmt(d.value)}`}
            onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} onBlur={() => setActive(null)}>
            <span className="col-bar" style={{ height: `${d.value ? Math.max(3, (d.value / top) * 100) : 0}%` }} />
          </button>
        ))}
      </div>
      <div className="columns-axis small muted" aria-hidden="true">
        {data.map((d, i) => <span key={d.key}>{tick(d, i) || ''}</span>)}
      </div>
    </figure>
  )
}

export default function InsightsPage() {
  const { t, lang, loc, gov } = useI18n()
  const insights = useInsights()
  const [placeView, setPlaceView] = useState('places')
  const d = insights.data

  if (insights.error) return <div className="page"><PageTitle title={t('insights.title')} /><ErrorState error={insights.error} onRetry={insights.reload} /></div>
  if (insights.loading || !d) {
    return <div className="page"><PageTitle title={t('insights.title')} subtitle={t('insights.sub')} /><div className="grid-2"><Skeleton h={78} /><Skeleton h={78} /><Skeleton h={78} /><Skeleton h={78} /></div><SkeletonRows n={3} h={140} /></div>
  }

  const tt = d.totals
  const last30 = d.days.reduce((s, x) => s + x.count, 0)
  const dayFmt = (iso) => formatDate(iso, { day: 'numeric', month: 'short' })
  const weekdayNames = Array.from({ length: 7 }, (_, i) => new Date(Date.UTC(2026, 0, 4 + i)).toLocaleDateString(lang === 'ar' ? 'ar-IQ' : 'en-GB', { weekday: 'short', timeZone: 'UTC' }))
  // Saturday-first in Arabic, matching the local week.
  const weekOrder = lang === 'ar' ? [6, 0, 1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6, 0]

  return (
    <div className="page">
      <PageTitle eyebrow={t('insights.eyebrow')} title={t('insights.title')} subtitle={t('insights.sub')} />

      <div className="grid-2 insight-tiles">
        <div className="stat"><span>{t('insights.stamps')}</span><b className="display num">{fmt(tt.stamps)}</b><span className="small muted">{t('insights.last30', { n: fmt(last30) })}</span></div>
        <div className="stat"><span>{t('insights.travellers')}</span><b className="display num">{fmt(tt.travellers)}</b><span className="small muted">{t('insights.registered', { n: fmt(tt.registeredTravellers) })}</span></div>
        <div className="stat"><span>{t('insights.rewards')}</span><b className="display num">{fmt(tt.rewardsUnlocked)}</b><span className="small muted">{t('insights.rewardsNote')}</span></div>
        <div className="stat"><span>{t('insights.bookings')}</span><b className="display num">{fmt(tt.bookings)}</b><span className="small muted">{t('insights.bookingsNote', { c: fmt(tt.confirmedBookings), d: fmt(tt.completedBookings) })}</span></div>
      </div>

      {tt.stamps === 0 ? (
        <Empty icon="chart" title={t('insights.emptyTitle')}>{t('insights.emptyText')}</Empty>
      ) : (
        <>
          <Section title={t('insights.daily')}>
            <div className="card card-pad">
              <Columns label={t('insights.daily')}
                data={d.days.map((x) => ({ key: x.date, value: x.count, label: dayFmt(x.date) }))}
                tick={(x, i) => (i === 0 || i === d.days.length - 1 || i === Math.floor(d.days.length / 2) ? x.label : '')} />
            </div>
          </Section>

          <Section title={t('insights.where')}>
            <Segmented label={t('insights.where')} value={placeView} onChange={setPlaceView}
              options={[{ value: 'places', label: t('insights.bySite') }, { value: 'cities', label: t('insights.byCity') }]} />
            <div className="card card-pad">
              {placeView === 'places' ? (
                <BarList label={t('insights.bySite')} rows={d.places.map((p) => ({ key: p.placeId, label: loc(p, 'name'), sub: gov(p.governorate), value: p.stamps }))} />
              ) : (
                <BarList label={t('insights.byCity')} rows={d.governorates.map((g) => ({ key: g.name, label: loc(g, 'name'), value: g.count }))} />
              )}
            </div>
          </Section>

          <Section title={t('insights.from')}>
            <div className="card card-pad">
              <BarList label={t('insights.from')} rows={d.countries.map((c) => ({ key: c.name, label: c.name, value: c.count }))} />
            </div>
            <p className="small muted">{t('insights.fromNote')}</p>
          </Section>

          <Section title={t('insights.when')}>
            <div className="card card-pad">
              <Columns label={t('insights.when')}
                data={weekOrder.map((i) => ({ key: i, value: d.weekdays[i] || 0, label: weekdayNames[i] }))}
                tick={(x) => x.label} />
            </div>
          </Section>
        </>
      )}
      <p className="small muted">{t('insights.privacy')}</p>
    </div>
  )
}
