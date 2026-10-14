import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import { Avatar, Badge, Notice, Section, Segmented, SignInPrompt, Wordmark } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { useBookings, useGroups, useGuideBookings, useMyTrips, usePassport, useRewards } from '../api/hooks'
import useUpdates from '../hooks/useUpdates'

function MenuLink({ to, icon, label, meta }) {
  return (
    <Link to={to}>
      <Icon name={icon} size={20} style={{ color: 'var(--lapis)' }} />
      <span className="grow">{label}</span>
      {meta != null && meta !== '' && <span className="small muted">{meta}</span>}
      <Icon name="forward" size={16} className="flip-rtl faint" />
    </Link>
  )
}

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const { t, lang, setLang } = useI18n()
  const navigate = useNavigate()
  const passport = usePassport()
  const rewards = useRewards()
  const bookings = useBookings()
  const guideBookings = useGuideBookings()
  const myTrips = useMyTrips()
  const groups = useGroups()
  const { unread } = useUpdates()

  const language = (
    <Section title={t('profile.language')}>
      <Segmented tabs={false} label={t('profile.language')} value={lang} onChange={setLang}
        options={[{ value: 'en', label: 'English' }, { value: 'ar', label: 'العربية' }]} />
    </Section>
  )

  if (!user) {
    return (
      <div className="page">
        <Wordmark size={30} sub />
        <SignInPrompt icon="user" title={t('profile.guestTitle')} text={t('profile.guestText')} />
        {language}
      </div>
    )
  }

  const role = user.role
  const hosting = (groups.data || []).filter((g) => g.creatorId === user.id).length
  const joined = (groups.data || []).filter((g) => g.myStatus === 'Approved').length
  const waiting = (bookings.data || []).filter((b) => b.status === 'Pending').length
  const guideWaiting = (guideBookings.data || []).filter((b) => b.status === 'Pending').length

  return (
    <div className="page">
      <div className="row" style={{ '--gap': '16px' }}>
        <Avatar name={user.fullName} size={76} />
        <span className="stack" style={{ '--gap': '4px' }}>
          <h1 style={{ fontSize: 24 }}>{user.fullName}</h1>
          <span className="small muted">{user.email}</span>
          <span className="row" style={{ '--gap': '6px' }}><Badge tone="blue">{t(`role.${role}`)}</Badge>{user.country && <span className="small muted">{user.country}</span>}</span>
        </span>
      </div>

      {role === 'Tourist' && (
        <Link to="/passport" className="grid-3" style={{ textDecoration: 'none' }}>
          <span className="stat"><b className="num">{passport.data?.totalStamps ?? '–'}</b><span>{t('passport.stamps')}</span></span>
          <span className="stat"><b className="num">{(rewards.data || []).filter((r) => r.isUnlocked).length}</b><span>{t('passport.rewards')}</span></span>
          <span className="stat"><b className="num">{joined + hosting}</b><span>{t('profile.groups')}</span></span>
        </Link>
      )}

      <nav className="menu" aria-label={t('profile.menu')}>
        {role === 'Tourist' && (
          <>
            <MenuLink to="/passport" icon="stamp" label={t('nav.passport')} />
            <MenuLink to="/bookings" icon="ticket" label={t('bookings.title')} meta={waiting ? t('profile.waiting', { n: waiting }) : ''} />
            <MenuLink to="/trips" icon="route" label={t('profile.myTrips')} meta={myTrips.data?.length || ''} />
            <MenuLink to="/groups" icon="users" label={t('profile.myGroups')} meta={hosting ? t('profile.hosting', { n: hosting }) : ''} />
          </>
        )}
        {role === 'Guide' && (
          <>
            <MenuLink to="/guide/bookings" icon="ticket" label={t('inbox.title')} meta={guideWaiting ? t('profile.waiting', { n: guideWaiting }) : ''} />
            <MenuLink to={`/guides/${user.id}`} icon="eye" label={t('profile.publicProfile')} />
            <MenuLink to="/guides" icon="guide" label={t('nav.guides')} />
          </>
        )}
        {role === 'Agency' && (
          <>
            <MenuLink to="/groups" icon="users" label={t('profile.groupsHosted')} meta={hosting || ''} />
            <MenuLink to="/groups/new" icon="plus" label={t('groups.start')} />
          </>
        )}
        {role === 'Admin' && <MenuLink to="/admin/places/new" icon="admin" label={t('nav.addPlace')} />}
        <MenuLink to="/updates" icon="bell" label={t('nav.updates')} meta={unread ? t('updates.unread', { n: unread }) : ''} />
      </nav>

      {role === 'Guide' && <Notice tone="info">{t('profile.guideNote')}</Notice>}

      {language}

      <button type="button" className="btn btn-danger btn-lg" onClick={() => { logout(); navigate('/', { replace: true }) }}>
        <Icon name="logout" size={18} className="flip-rtl" />{t('auth.logout')}
      </button>
    </div>
  )
}
