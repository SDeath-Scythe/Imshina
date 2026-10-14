import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import Icon from '../components/Icon'
import { Badge, ChipGroup, Empty, ErrorState, PageTitle, Progress, Section, SkeletonRows } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useI18n } from '../i18n/I18nContext'
import { useGroups } from '../api/hooks'
import { invalidate } from '../hooks/useQuery'
import { formatShortDate, todayISO } from '../utils/helpers'

export const GENDER_TONE = { WomenOnly: 'rose', MenOnly: 'blue', Mixed: 'green' }

// eslint-disable-next-line react-refresh/only-export-components
export function eligibility(group, user) {
  if (!user) return 'guest'
  if (group.creatorId === user.id) return 'host'
  if (user.role !== 'Tourist') return 'role'
  if (group.myStatus) return group.myStatus.toLowerCase()
  if (group.startDate < todayISO()) return 'past'
  if ((group.genderType === 'WomenOnly' && user.gender !== 'Female') || (group.genderType === 'MenOnly' && user.gender !== 'Male')) return 'gender'
  if (group.membersCount >= group.maxMembers) return 'full'
  return 'open'
}

// eslint-disable-next-line react-refresh/only-export-components
export function useJoin() {
  const toast = useToast()
  const { t, te } = useI18n()
  const [busy, setBusy] = useState(null)
  const join = async (group) => {
    setBusy(group.id)
    try {
      await api.post(`/groups/${group.id}/join`)
      toast(t('groups.requestSent'))
      invalidate('groups')
    } catch (err) { toast(te(err), 'error') } finally { setBusy(null) }
  }
  return { join, busy }
}

export function GroupStatus({ group, compact }) {
  const { user } = useAuth()
  const { t } = useI18n()
  const { join, busy } = useJoin()
  const state = eligibility(group, user)
  const gender = t(`groups.${group.genderType}`)
  switch (state) {
    case 'guest': return <Link to="/login" state={{ from: `/groups/${group.id}` }} className="btn btn-outline">{t('groups.loginToJoin')}</Link>
    case 'host': return <Link to={`/groups/${group.id}`} className="btn btn-dark">{t('groups.manage')}</Link>
    case 'pending': return <span className="notice warn" style={{ padding: '10px 14px' }}><Icon name="clock" size={18} />{t('groups.pending')}</span>
    case 'approved': return <span className="notice success" style={{ padding: '10px 14px' }}><Icon name="check" size={18} />{t('groups.approved')}</span>
    case 'rejected': return <span className="notice error" style={{ padding: '10px 14px' }}>{t('groups.rejected')}</span>
    case 'gender': return <span className="small muted center" style={{ padding: '10px 0' }}>{t('groups.notOpen', { type: gender })}</span>
    case 'full': return <span className="small muted center" style={{ padding: '10px 0' }}>{t('groups.full')}</span>
    case 'past': return <span className="small muted center" style={{ padding: '10px 0' }}>{t('groups.past')}</span>
    case 'role': return compact ? null : <span className="small muted">{t('groups.travellersOnly')}</span>
    default: return (
      <button type="button" className="btn" onClick={(e) => { e.preventDefault(); join(group) }} disabled={busy === group.id}>
        {busy === group.id ? t('common.sending') : t('groups.join')}
      </button>
    )
  }
}

function GroupCard({ group }) {
  const { user } = useAuth()
  const { t } = useI18n()
  const left = Math.max(0, group.maxMembers - group.membersCount)
  const muted = ['gender', 'full', 'rejected'].includes(eligibility(group, user))
  return (
    <article className="card card-pad stack" style={{ '--gap': '10px', opacity: muted ? 0.75 : 1 }}>
      <div className="row-between" style={{ alignItems: 'flex-start' }}>
        <span className="stack" style={{ '--gap': '2px' }}>
          <span className="eyebrow">{formatShortDate(group.startDate)}{group.tripTitle ? ` · ${group.tripTitle}` : ''}</span>
          <h2 style={{ fontFamily: 'var(--font-body)', fontSize: 17, lineHeight: 1.35 }}>
            <Link to={`/groups/${group.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>{group.name}</Link>
          </h2>
        </span>
        <Badge tone={GENDER_TONE[group.genderType]}>{t(`groups.${group.genderType}`)}</Badge>
      </div>
      {group.description && <p className="small clamp-2" style={{ color: 'var(--ink-2)' }}>{group.description}</p>}
      <div className="row" style={{ '--gap': '10px' }}>
        <div className="grow"><Progress value={group.membersCount} max={group.maxMembers} label={t('groups.spotsLeft', { n: left, max: group.maxMembers })} /></div>
        <span className="small muted" style={{ whiteSpace: 'nowrap' }}>{t('groups.spotsLeft', { n: left, max: group.maxMembers })}</span>
      </div>
      <div className="row-between" style={{ '--gap': '10px' }}>
        <span className="small muted">{t('groups.hostedBy', { name: group.creatorName })}</span>
        <Link to={`/groups/${group.id}`} className="link-btn">{t('common.details')}</Link>
      </div>
      <GroupStatus group={group} compact />
    </article>
  )
}

export default function GroupsPage() {
  const { user } = useAuth()
  const { t } = useI18n()
  const groups = useGroups()
  const [filter, setFilter] = useState(user?.role === 'Tourist' ? 'forYou' : 'all')
  const today = todayISO()
  const all = (groups.data || []).filter((g) => g.startDate >= today)
  const hosting = user ? all.filter((g) => g.creatorId === user.id) : []
  const others = all.filter((g) => !user || g.creatorId !== user.id)
  const shown = others.filter((g) => {
    if (filter === 'forYou') return ['open', 'pending', 'approved'].includes(eligibility(g, user))
    if (filter === 'all') return true
    return g.genderType === filter
  })
  const canHost = user && (user.role === 'Tourist' || user.role === 'Agency')

  return (
    <div className="page">
      <PageTitle eyebrow={<span lang="ar" className="display" style={{ fontSize: 15, letterSpacing: 0, textTransform: 'none' }}>امشي ويانا</span>}
        title={t('groups.title')} subtitle={t('groups.subtitle')} />

      {hosting.length > 0 && (
        <Section title={t('groups.hosting')}>
          {hosting.map((g) => (
            <Link key={g.id} to={`/groups/${g.id}`} className="card-dark row" style={{ textDecoration: 'none', '--gap': '12px' }}>
              <Icon name="users" style={{ color: 'var(--gold)' }} />
              <span className="grow stack" style={{ '--gap': '0px' }}><b>{g.name}</b><span className="small muted">{formatShortDate(g.startDate)} · {t('groups.going', { n: g.membersCount, max: g.maxMembers })}</span></span>
              <span className="small" style={{ color: 'var(--gold)', fontWeight: 600 }}>{t('groups.manage')}</span>
            </Link>
          ))}
        </Section>
      )}

      <ChipGroup label={t('home.filter')} value={filter} onChange={setFilter} options={[
        ...(user?.role === 'Tourist' ? [{ value: 'forYou', label: t('groups.forYou') }] : []),
        { value: 'all', label: t('common.all') },
        { value: 'WomenOnly', label: t('groups.WomenOnly') },
        { value: 'Mixed', label: t('groups.Mixed') },
        { value: 'MenOnly', label: t('groups.MenOnly') },
      ]} />

      {groups.error && <ErrorState error={groups.error} onRetry={groups.reload} />}
      {groups.loading ? <SkeletonRows n={3} h={200} /> : shown.length === 0 ? (
        <Empty icon="users" title={t('groups.noneTitle')} action={canHost ? <Link to="/groups/new" className="btn btn-sm">{t('groups.start')}</Link> : null}>
          {t('groups.noneText')}
        </Empty>
      ) : (
        <div className="cards">{shown.map((g) => <GroupCard key={g.id} group={g} />)}</div>
      )}

      {canHost && (
        <Link to="/groups/new" className="btn btn-lg" style={{ position: 'fixed', insetInlineEnd: 20, bottom: 'calc(var(--tabbar-h) + 18px + var(--safe-b))', zIndex: 35, boxShadow: 'var(--shadow-2)' }}>
          <Icon name="plus" style={{ color: 'var(--gold)' }} />{t('groups.start')}
        </Link>
      )}
    </div>
  )
}
