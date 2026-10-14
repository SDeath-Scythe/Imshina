import Icon from './Icon'
import { Badge, Progress, Section } from './ui'
import { sealLines } from './Seal'
import { useI18n } from '../i18n/I18nContext'
import { formatDate, govInk } from '../utils/helpers'
import { milestoneProgress, trailProgress } from '../data/trails'

/** Trails: themed sets of places, each with a progress bar and one dot per place. */
export function Trails({ places, stampedIds, onShare }) {
  const { t, loc } = useI18n()
  const trails = trailProgress(places, stampedIds)
  if (trails.length === 0) return null
  return (
    <Section title={t('trails.title')} action={<span className="small muted">{t('trails.done', { n: trails.filter((x) => x.complete).length, total: trails.length })}</span>}>
      <div className="stack" style={{ '--gap': '10px' }}>
        {trails.map((tr) => (
          <article key={tr.id} className={`card card-pad stack trail ${tr.complete ? 'complete' : ''}`} style={{ '--gap': '10px' }}>
            <div className="row-between" style={{ alignItems: 'flex-start', '--gap': '10px' }}>
              <span className="stack" style={{ '--gap': '2px', minWidth: 0 }}>
                <b style={{ fontSize: 15.5 }}>{loc(tr, 'name')}</b>
                <span className="small muted">{loc(tr, 'text')}</span>
              </span>
              {tr.complete ? <Badge tone="green">{t('trails.complete')}</Badge> : <span className="small bold num" style={{ whiteSpace: 'nowrap' }}>{tr.done}/{tr.list.length}</span>}
            </div>
            <ol className="trail-stops" aria-label={t('trails.stops')}>
              {tr.list.map((p) => {
                const done = stampedIds.has(p.id)
                return (
                  <li key={p.id} className={done ? 'done' : ''} style={{ '--stop-ink': govInk(p.governorateName, p.governorateId) }}>
                    <span className="trail-dot" aria-hidden="true">{done ? <Icon name="check" size={14} stroke={3} /> : null}</span>
                    <span className="small">{loc(p, 'name')}</span>
                    <span className="sr-only">{done ? t('trails.stamped') : t('trails.notYet')}</span>
                  </li>
                )
              })}
            </ol>
            {tr.complete ? (
              <button type="button" className="btn btn-outline btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => onShare(trailCard(tr, t, loc))}>
                <Icon name="share" size={16} />{t('trails.share')}
              </button>
            ) : (
              <Progress value={tr.done} max={tr.list.length} label={t('trails.progress', { n: tr.done, total: tr.list.length })} />
            )}
          </article>
        ))}
      </div>
    </Section>
  )
}

/** Milestones by stamp count, ending with the completion certificate. */
export function Milestones({ count, total, userName, onShare }) {
  const { t } = useI18n()
  const list = milestoneProgress(count, total)
  if (list.length === 0) return null
  const next = list.find((m) => !m.reached)
  const done = total > 0 && count >= total
  return (
    <Section title={t('milestones.title')}>
      <ol className="milestones" aria-label={t('milestones.title')}>
        {list.map((m) => (
          <li key={m.id} className={m.reached ? 'reached' : ''}>
            <span className="medal display num" aria-hidden="true">{m.id === 'all' ? <Icon name="stamp" size={22} /> : m.at}</span>
            <span className="small">{t(`milestones.${m.id}`)}</span>
            <span className="sr-only">{m.reached ? t('milestones.reached') : t('milestones.locked', { n: m.at })}</span>
          </li>
        ))}
      </ol>
      {done ? (
        <div className="card-dark stack certificate" style={{ '--gap': '10px' }}>
          <span className="hero-eyebrow">{t('certificate.eyebrow')}</span>
          <b className="display" style={{ fontSize: 22 }}>{t('certificate.title')}</b>
          <span className="small" style={{ color: '#D4D8E6' }}>{t('certificate.text', { total })}</span>
          <button type="button" className="btn btn-gold" onClick={() => onShare(certificateCard(userName, total, t))}><Icon name="share" size={18} />{t('certificate.share')}</button>
        </div>
      ) : next && (
        <p className="small muted">{t('milestones.next', { n: next.at - count, name: t(`milestones.${next.id}`) })}</p>
      )}
    </Section>
  )
}

function today(isRtl) {
  const d = formatDate(new Date(), { day: '2-digit', month: 'short', year: 'numeric' })
  return isRtl ? d : d.toUpperCase()
}

function trailCard(tr, t, loc) {
  const rtl = document.documentElement.dir === 'rtl'
  const name = loc(tr, 'name')
  return {
    card: {
      ink: govInk(tr.list[0]?.governorateName, tr.list[0]?.governorateId),
      ring: `TRAIL COMPLETE · ${tr.name} · IRAQ ·`.toUpperCase(),
      lines: sealLines(name), date: today(rtl),
      headline: t('card.trailHeadline'), line1: name, line2: t('card.trailLine', { n: tr.list.length }),
      count: tr.list.length, total: tr.list.length, rtl,
      tagline: t('card.tagline'), brand: t('card.brand'),
    },
    fileName: `imshina-trail-${tr.id}.png`,
    shareTitle: name,
    shareText: t('share.trailText', { trail: name }),
  }
}

function certificateCard(userName, total, t) {
  const rtl = document.documentElement.dir === 'rtl'
  return {
    card: {
      ink: '#8A5A12',
      ring: 'HERITAGE PASSPORT · COMPLETE · IRAQ · IMSHINA ·',
      lines: [`${total}/${total}`], date: today(rtl),
      headline: t('certificate.title'), line1: userName, line2: t('certificate.text', { total }),
      count: total, total, rtl,
      tagline: t('card.tagline'), brand: t('card.brand'),
    },
    fileName: 'imshina-passport-complete.png',
    shareTitle: t('certificate.title'),
    shareText: t('share.certificateText', { total }),
  }
}
