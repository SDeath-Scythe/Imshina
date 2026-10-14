import Icon from '../components/Icon'
import { BackButton } from '../components/ui'
import { useI18n } from '../i18n/I18nContext'
import { formatDate } from '../utils/helpers'
import { CHECKED_ON, EMERGENCY, EMERGENCY_SOURCE, SECTIONS } from '../data/practical'

/** "Before you go": visa, safety advice, money, SIM cards, shrine etiquette, busy dates, emergency numbers. */
export default function PracticalPage() {
  const { t, lang } = useI18n()
  const ar = lang === 'ar'
  return (
    <div className="page">
      <header className="row" style={{ '--gap': '12px' }}>
        <BackButton />
        <h1 className="grow">{t('practical.title')}</h1>
      </header>
      <p className="muted">{t('practical.sub')}</p>

      <section className="card-dark stack" style={{ '--gap': '10px' }} aria-labelledby="sos">
        <h2 id="sos" className="row" style={{ '--gap': '8px', fontSize: 17, color: '#fff' }}><Icon name="phone" size={20} />{t('practical.emergency')}</h2>
        <div className="grid-3">
          {EMERGENCY.map((e) => (
            <a key={e.id} href={`tel:${e.number}`} className="sos">
              <b className="display num">{e.number}</b>
              <span className="small">{t(`practical.${e.id}`)}</span>
            </a>
          ))}
        </div>
        <a href={EMERGENCY_SOURCE[1]} target="_blank" rel="noreferrer" className="small" style={{ color: '#B9BFD3' }}>{t('practical.source', { name: EMERGENCY_SOURCE[0] })}</a>
      </section>

      <div className="stack" style={{ '--gap': '10px' }}>
        {SECTIONS.map((s, i) => (
          <details key={s.id} className="card practical" open={i < 2}>
            <summary className="row" style={{ '--gap': '12px' }}>
              <span className="practical-icon"><Icon name={s.icon} size={20} /></span>
              <b className="grow">{ar ? s.titleAr : s.title}</b>
              <Icon name="down" size={18} className="practical-chev" />
            </summary>
            <div className="stack" style={{ '--gap': '10px', padding: '0 16px 16px' }}>
              <ul className="practical-points">
                {s.points.map(([en, arText]) => <li key={en}>{ar ? arText : en}</li>)}
              </ul>
              <p className="small muted">
                {t('practical.sources')}{' '}
                {s.sources.map(([name, url], j) => (
                  <span key={url}>{j > 0 && ' · '}<a href={url} target="_blank" rel="noreferrer" dir="ltr">{name}</a></span>
                ))}
              </p>
            </div>
          </details>
        ))}
      </div>

      <p className="small muted">{t('practical.checked', { date: formatDate(CHECKED_ON) })}</p>
    </div>
  )
}
