import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Avatar, ChipGroup, Empty, ErrorState, PageTitle, SkeletonRows, Stars } from '../components/ui'
import { useI18n } from '../i18n/I18nContext'
import { useGovernorates, useGuides } from '../api/hooks'
import { formatPrice } from '../utils/helpers'

// eslint-disable-next-line react-refresh/only-export-components
export function guideCities(guide, govs) {
  const ids = [...new Set((guide?.destinations || []).map((d) => d.governorateId))]
  return ids.map((id) => govs?.find((g) => g.id === id)).filter(Boolean)
}

function GuideCard({ guide, govs }) {
  const { t, tf, loc } = useI18n()
  const cities = guideCities(guide, govs)
  return (
    <Link to={`/guides/${guide.userId}`} className="card card-link card-pad stack" style={{ '--gap': '10px' }}>
      <span className="row" style={{ '--gap': '12px' }}>
        <Avatar name={guide.fullName} size={56} />
        <span className="grow stack" style={{ '--gap': '0px' }}>
          <b style={{ fontSize: 16 }}>{guide.fullName}</b>
          <span className="small muted">{cities.map((c) => loc(c, 'name')).join(' · ') || guide.country}</span>
        </span>
        <span className="stack" style={{ '--gap': '0px', alignItems: 'flex-end' }}>
          <b className="num" style={{ fontSize: 17 }}>{formatPrice(guide.pricePerDay)}</b>
          <span className="xsmall muted">{t('guides.perDay')}</span>
        </span>
      </span>
      <span className="small clamp-2" style={{ color: 'var(--ink-2)' }}>{guide.bio}</span>
      <span className="row wrap" style={{ '--gap': '6px' }}>
        {guide.languages.map((l) => <span key={l} className="badge plain">{tf(`language.${l}`, l)}</span>)}
        <span style={{ marginInlineStart: 'auto' }} className="small">
          {guide.reviewsCount ? <><Stars value={guide.avgRating} /> <span className="num muted">{guide.avgRating.toFixed(1)} · {t('guides.reviews', { n: guide.reviewsCount })}</span></> : <span className="muted">{t('guides.new')}</span>}
        </span>
      </span>
    </Link>
  )
}

export default function GuidesPage() {
  const { t, tf, loc } = useI18n()
  const [params, setParams] = useSearchParams()
  const language = params.get('lang') || ''
  const gov = params.get('gov') || ''
  const govs = useGovernorates()
  const all = useGuides()
  const guides = useGuides({ language, governorateId: gov })

  const languages = useMemo(() => {
    const set = new Set((all.data || []).flatMap((g) => g.languages))
    return [...set].filter((l) => l !== 'Arabic' && l !== 'English').sort()
  }, [all.data])

  const set = (k, v) => setParams((p) => { const out = new URLSearchParams(p); if (v) out.set(k, v); else out.delete(k); return out }, { replace: true })

  return (
    <div className="page">
      <PageTitle title={t('guides.title')} subtitle={t('guides.subtitle')} />

      <div className="stack" style={{ '--gap': '10px' }}>
        <ChipGroup label={t('guides.city')} value={gov} onChange={(v) => set('gov', v)}
          options={[{ value: '', label: t('guides.anyCity') }, ...(govs.data || []).map((g) => ({ value: String(g.id), label: loc(g, 'name') }))]} />
        <ChipGroup label={t('guides.speaks')} value={language} onChange={(v) => set('lang', v)}
          options={[{ value: '', label: t('guides.anyLanguage') }, ...languages.map((l) => ({ value: l, label: tf(`language.${l}`, l) }))]} />
        <span className="small muted">{t('guides.allSpeak')}</span>
      </div>

      {guides.error && <ErrorState error={guides.error} onRetry={guides.reload} />}
      {guides.loading ? <SkeletonRows n={3} h={150} /> : guides.data?.length === 0 ? (
        <Empty icon="guide" title={t('guides.noneTitle')} action={<button type="button" className="btn btn-outline btn-sm" onClick={() => setParams({}, { replace: true })}>{t('common.clearFilters')}</button>}>
          {t('guides.noneText')}
        </Empty>
      ) : (
        <div className="cards" aria-live="polite">
          {(guides.data || []).map((g) => <GuideCard key={g.userId} guide={g} govs={govs.data} />)}
        </div>
      )}
    </div>
  )
}
