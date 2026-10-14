import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigationType } from 'react-router-dom'
import Icon from '../components/Icon'
import { Wordmark } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import useUpdates from '../hooks/useUpdates'
import { useGuideBookings } from '../api/hooks'

// Bottom tab bar on phones, a left rail on desktop. Items depend on the account type.
function navFor(role) {
  if (role === 'Guide') return [
    { to: '/', icon: 'compass', label: 'nav.discover', end: true },
    { to: '/guide/bookings', icon: 'ticket', label: 'nav.inbox', badge: 'requests' },
    { to: '/guides', icon: 'guide', label: 'nav.guides' },
    { to: '/trips', icon: 'route', label: 'nav.trips' },
    { to: '/profile', icon: 'user', label: 'nav.me' },
  ]
  if (role === 'Agency') return [
    { to: '/', icon: 'compass', label: 'nav.discover', end: true },
    { to: '/groups', icon: 'users', label: 'nav.groups' },
    { to: '/trips', icon: 'route', label: 'nav.trips' },
    { to: '/profile', icon: 'user', label: 'nav.me' },
  ]
  if (role === 'Admin') return [
    { to: '/', icon: 'compass', label: 'nav.discover', end: true },
    { to: '/admin/places/new', icon: 'admin', label: 'nav.addPlace' },
    { to: '/guides', icon: 'guide', label: 'nav.guides' },
    { to: '/profile', icon: 'user', label: 'nav.me' },
  ]
  return [
    { to: '/', icon: 'compass', label: 'nav.discover', end: true },
    { to: '/groups', icon: 'users', label: 'nav.tagAlong' },
    { to: '/passport', icon: 'stamp', label: 'nav.passport', hero: true },
    { to: '/guides', icon: 'guide', label: 'nav.guides' },
    { to: '/trips', icon: 'route', label: 'nav.trips' },
  ]
}

function TabBar({ hideOnMobile }) {
  const { user } = useAuth()
  const { t, lang, toggleLang } = useI18n()
  const { unread } = useUpdates()
  const guideBookings = useGuideBookings()
  const requests = (guideBookings.data || []).filter((b) => b.status === 'Pending').length
  const items = navFor(user?.role)
  const isTourist = !user || user.role === 'Tourist'

  return (
    <nav className={`tabbar ${hideOnMobile ? 'mobile-hidden' : ''}`} aria-label={t('nav.main')} style={{ '--tabs': items.length }}>
      <Link to="/" className="rail-brand" aria-label={t('brand')}><Wordmark size={30} sub /></Link>
      {items.map((it) => (
        <NavLink key={it.to} to={it.to} end={it.end} className={({ isActive }) => `${it.hero ? 'tab-hero' : 'tab'} ${isActive ? 'active' : ''}`}
          aria-label={it.hero ? t(it.label) : undefined}>
          <Icon name={it.icon} size={it.hero ? 26 : 22} />
          {it.hero ? <span className="tab-label-hero">{t(it.label)}</span> : <span>{t(it.label)}</span>}
          {it.badge === 'requests' && requests > 0 && <span className="tab-dot" aria-label={t('inbox.waiting', { n: requests })} />}
        </NavLink>
      ))}
      {user && (
        <NavLink to="/updates" className={({ isActive }) => `tab rail-only ${isActive ? 'active' : ''}`}>
          <Icon name="bell" size={22} /><span>{t('nav.updates')}</span>{unread > 0 && <span className="tab-dot" aria-label={t('updates.unread', { n: unread })} />}
        </NavLink>
      )}
      {isTourist && (
        <NavLink to="/profile" className={({ isActive }) => `tab rail-only ${isActive ? 'active' : ''}`}>
          <Icon name="user" size={22} /><span>{user ? t('nav.me') : t('auth.login')}</span>
        </NavLink>
      )}
      <div className="rail-foot">
        <button type="button" className="btn btn-outline btn-sm btn-block" onClick={toggleLang} lang={lang === 'en' ? 'ar' : 'en'}>
          <Icon name="globe" size={16} />{lang === 'en' ? 'العربية' : 'English'}
        </button>
      </div>
    </nav>
  )
}

function useScrollTop() {
  const { pathname } = useLocation()
  const type = useNavigationType()
  useEffect(() => { if (type !== 'POP') window.scrollTo(0, 0) }, [pathname, type])
}

/** App pages. `tabs={false}` hides the phone tab bar for focused screens with their own action bar. */
export default function MainLayout({ tabs = true }) {
  const { t } = useI18n()
  useScrollTop()
  return (
    <div className="shell">
      <a href="#main" className="skip-link">{t('a11y.skip')}</a>
      <TabBar hideOnMobile={!tabs} />
      <main id="main" className={`shell-main ${tabs ? '' : 'no-tabs'}`} tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  )
}
