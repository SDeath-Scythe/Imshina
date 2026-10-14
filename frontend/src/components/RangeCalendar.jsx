import { useMemo, useState } from 'react'
import Icon from './Icon'
import { useI18n } from '../i18n/I18nContext'
import { parseISODate, todayISO, toISODate } from '../utils/helpers'

/**
 * Tap the first day, then the last. `single` picks one day.
 * value: { start, end } as YYYY-MM-DD · onChange(value) · maxSpan: max days in a range
 */
export default function RangeCalendar({ value, onChange, single = false, maxSpan = 30, min = todayISO() }) {
  const { t, lang } = useI18n()
  const first = value?.start ? parseISODate(value.start) : parseISODate(min)
  const [view, setView] = useState({ y: first.getFullYear(), m: first.getMonth() })
  const weekStart = lang === 'ar' ? 6 : 0 // Iraq's week starts on Saturday
  const locale = lang === 'ar' ? 'ar-IQ-u-nu-latn' : 'en-GB'

  const cells = useMemo(() => {
    const firstDay = new Date(view.y, view.m, 1)
    const lead = (firstDay.getDay() - weekStart + 7) % 7
    const days = new Date(view.y, view.m + 1, 0).getDate()
    const out = Array.from({ length: lead }, () => null)
    for (let d = 1; d <= days; d += 1) out.push(toISODate(new Date(view.y, view.m, d)))
    return out
  }, [view, weekStart])

  const dows = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2026, 1, 1 + ((weekStart + i) % 7)) // 1 Feb 2026 is a Sunday
    return d.toLocaleDateString(locale, { weekday: 'short' })
  }), [weekStart, locale])

  const title = new Date(view.y, view.m, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' })
  const today = todayISO()
  const { start, end } = value || {}
  const last = end || start
  const minMonth = parseISODate(min)
  const canPrev = view.y > minMonth.getFullYear() || (view.y === minMonth.getFullYear() && view.m > minMonth.getMonth())

  const pick = (iso) => {
    if (single) return onChange({ start: iso, end: iso })
    if (!start || end) return onChange({ start: iso, end: null })
    if (iso < start) return onChange({ start: iso, end: null })
    const span = Math.round((parseISODate(iso) - parseISODate(start)) / 86400000) + 1
    if (span > maxSpan) return onChange({ start: iso, end: null })
    return onChange({ start, end: iso })
  }
  const shift = (n) => setView(({ y, m }) => { const d = new Date(y, m + n, 1); return { y: d.getFullYear(), m: d.getMonth() } })

  return (
    <div className="cal">
      <div className="row-between">
        <button type="button" className="icon-btn" onClick={() => shift(-1)} disabled={!canPrev} aria-label={t('cal.prev')}><Icon name="back" className="flip-rtl" size={18} /></button>
        <b aria-live="polite">{title}</b>
        <button type="button" className="icon-btn" onClick={() => shift(1)} aria-label={t('cal.next')}><Icon name="forward" className="flip-rtl" size={18} /></button>
      </div>
      <div className="cal-grid">
        {dows.map((d, i) => <span key={i} className="cal-dow" aria-hidden="true">{d}</span>)}
        {cells.map((iso, i) => {
          if (!iso) return <span key={`e${i}`} />
          const disabled = iso < min
          const inRange = start && iso >= start && iso <= last
          const isStart = iso === start
          const isEnd = iso === last
          const cls = ['cal-day', inRange ? 'in-range' : '', isStart || isEnd ? 'edge' : '', isStart ? 'start' : '', isEnd ? 'end' : '', iso === today ? 'today' : ''].join(' ')
          return (
            <button key={iso} type="button" className={cls} disabled={disabled} onClick={() => pick(iso)}
              aria-pressed={!!inRange} aria-label={parseISODate(iso).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}>
              {parseISODate(iso).getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
