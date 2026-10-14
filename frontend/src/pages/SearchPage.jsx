import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Icon from '../components/Icon'
import { PlaceRow } from '../components/PlaceCard'
import { BackButton, Empty, ErrorState, Section, SkeletonRows } from '../components/ui'
import { useGeo } from '../context/GeoContext'
import { useI18n } from '../i18n/I18nContext'
import { useGovernorates, usePassport, usePlaces } from '../api/hooks'
import { distanceMeters, placePoint } from '../utils/helpers'

const CATEGORIES = ['Archaeological', 'Religious', 'Heritage', 'Nature']
// Strip Arabic diacritics and unify alef/ya/ta-marbuta forms so "مسجد الكوفه" finds "مسجد الكوفة".
const norm = (s = '') => s.toLowerCase().normalize('NFKD').replace(/[ً-ٰٟ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[^\p{L}\p{N}\s]/gu, ' ').trim()

export default function SearchPage() {
  const { t, loc, gov } = useI18n()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const cat = params.get('cat') || ''
  const places = usePlaces()
  const govs = useGovernorates()
  const passport = usePassport()
  const { position } = useGeo()
  const stamped = useMemo(() => new Set((passport.data?.stamps || []).map((s) => s.placeId)), [passport.data])

  const set = (next) => setParams((p) => {
    const out = new URLSearchParams(p)
    Object.entries(next).forEach(([k, v]) => (v ? out.set(k, v) : out.delete(k)))
    return out
  }, { replace: true })

  const results = useMemo(() => {
    const n = norm(q)
    return (places.data || []).filter((p) => {
      if (cat && p.category !== cat) return false
      if (!n) return true
      return [p.name, p.nameAr, p.governorateName, gov(p.governorateName), t(`category.${p.category}`)].some((s) => norm(s).includes(n))
    }).map((p) => ({ p, d: position ? distanceMeters(position, placePoint(p)) : null }))
      .sort((a, b) => (a.d != null ? a.d - b.d : 0))
  }, [places.data, q, cat, position, gov, t])
  const searching = q || cat

  return (
    <div className="page">
      <div className="row" style={{ '--gap': '10px' }}>
        <BackButton />
        <label className="grow" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span className="sr-only">{t('search.label')}</span>
          <Icon name="search" size={18} style={{ position: 'absolute', insetInlineStart: 14, color: 'var(--muted)' }} />
          <input className="input" type="search" autoFocus value={q} onChange={(e) => set({ q: e.target.value })}
            placeholder={t('search.placeholder')} style={{ paddingInlineStart: 42, borderRadius: 25 }} enterKeyHint="search" />
        </label>
      </div>

      <div className="scroll-x" role="group" aria-label={t('a11y.category')}>
        {CATEGORIES.map((c) => (
          <button key={c} type="button" className="chip" aria-pressed={cat === c} onClick={() => set({ cat: cat === c ? '' : c })}>{t(`category.${c}`)}</button>
        ))}
      </div>

      {places.error && <ErrorState error={places.error} onRetry={places.reload} />}
      {places.loading && <SkeletonRows n={5} h={64} />}

      {!places.loading && !searching && (
        <Section title={t('search.cities')}>
          <div className="grid-2">
            {(govs.data || []).map((g) => (
              <Link key={g.id} to={`/cities/${g.id}`} className="card card-link card-pad">
                <b style={{ display: 'block' }}>{loc(g, 'name')}</b>
                <span className="small muted">{t('common.placesCount', { n: g.placesCount })}</span>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {!places.loading && (
        <Section title={searching ? t('search.results', { n: results.length }) : t('search.allPlaces')}>
          {results.length === 0 ? (
            <Empty icon="search" title={t('search.noneTitle', { q })}>{t('search.noneText')}</Empty>
          ) : (
            <div className="list" aria-live="polite">
              {results.map(({ p, d }) => <PlaceRow key={p.id} place={p} distance={d} stamped={stamped.has(p.id)} />)}
            </div>
          )}
        </Section>
      )}
    </div>
  )
}
