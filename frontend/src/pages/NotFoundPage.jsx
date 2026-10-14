import { Link } from 'react-router-dom'
import { GateArt } from '../components/Art'
import { useI18n } from '../i18n/I18nContext'

export default function NotFoundPage() {
  const { t } = useI18n()
  return (
    <div className="page" style={{ minHeight: '70dvh', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
      <GateArt width={150} tower="#C9D3EE" arch="#ECE6D8" line="#D9A440" />
      <h1>{t('notFound.title')}</h1>
      <p className="muted" style={{ maxWidth: 320 }}>{t('notFound.text')}</p>
      <div className="row wrap" style={{ justifyContent: 'center' }}>
        <Link to="/" className="btn">{t('notFound.home')}</Link>
        <Link to="/search" className="btn btn-outline">{t('search.title')}</Link>
      </div>
    </div>
  )
}
