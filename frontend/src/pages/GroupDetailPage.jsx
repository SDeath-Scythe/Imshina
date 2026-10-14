import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api/client'
import Icon from '../components/Icon'
import { ActionBar, Avatar, Badge, BackButton, Empty, ErrorState, Notice, Progress, Section, Skeleton, SkeletonRows } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useI18n } from '../i18n/I18nContext'
import { useGroupMembers, useGroups } from '../api/hooks'
import { invalidate } from '../hooks/useQuery'
import { firstName, formatDate, formatShortDate } from '../utils/helpers'
import { GENDER_TONE, GroupStatus } from './GroupsPage'
import NotFoundPage from './NotFoundPage'

const HEAD = { WomenOnly: '#7A2350', MenOnly: '#1D3A8C', Mixed: '#2F6B4F' }

function HostPanel({ group }) {
  const { t, te } = useI18n()
  const toast = useToast()
  const members = useGroupMembers(group.id, true)
  const [busy, setBusy] = useState(null)
  const list = members.data || []
  const pending = list.filter((m) => m.status === 'Pending')
  const approved = list.filter((m) => m.status === 'Approved')
  const full = group.membersCount >= group.maxMembers

  const decide = async (m, status) => {
    setBusy(m.userId)
    try {
      await api.put(`/groups/${group.id}/members/${m.userId}`, { status })
      toast(status === 'Approved' ? t('host.approvedToast', { name: firstName(m.fullName) }) : t('host.rejectedToast', { name: firstName(m.fullName) }))
      members.reload()
      invalidate('groups')
    } catch (err) { toast(te(err), 'error') } finally { setBusy(null) }
  }

  const invite = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: group.name, url })
      else { await navigator.clipboard.writeText(url); toast(t('common.linkCopied')) }
    } catch { /* cancelled */ }
  }

  return (
    <>
      <Section title={t('host.requests', { n: pending.length })}>
        {members.error && <ErrorState error={members.error} onRetry={members.reload} />}
        {members.loading ? <SkeletonRows n={2} h={110} /> : pending.length === 0 ? (
          <p className="card card-pad small muted center">{t('host.noRequests')}</p>
        ) : pending.map((m) => (
          <article key={m.userId} className="card card-pad stack" style={{ '--gap': '10px' }}>
            <div className="row" style={{ '--gap': '12px' }}>
              <Avatar name={m.fullName} size={46} />
              <span className="grow stack" style={{ '--gap': '0px' }}><b>{m.fullName}</b><span className="small muted">{m.country} · {t('host.asked', { date: formatDate(m.joinedAt) })}</span></span>
            </div>
            <div className="row" style={{ '--gap': '8px' }}>
              <button type="button" className="btn btn-danger grow" onClick={() => decide(m, 'Rejected')} disabled={busy === m.userId}>{t('host.decline')}</button>
              <button type="button" className="btn grow" style={{ flex: 2 }} onClick={() => decide(m, 'Approved')} disabled={busy === m.userId || full}>{t('host.approve')}</button>
            </div>
          </article>
        ))}
        {full && pending.length > 0 && <Notice tone="warn">{t('host.fullNote')}</Notice>}
      </Section>

      <Section title={t('host.going', { n: approved.length + 1 })}>
        <div className="card card-pad stack" style={{ '--gap': '10px' }}>
          <div className="row" style={{ '--gap': '10px' }}><Avatar name={group.creatorName} size={36} ring="var(--lapis)" /><b className="grow">{group.creatorName}</b><Badge tone="blue">{t('host.you')}</Badge></div>
          {approved.map((m) => (
            <div key={m.userId} className="row" style={{ '--gap': '10px' }}><Avatar name={m.fullName} size={36} /><span className="grow">{m.fullName}</span><span className="small muted">{m.country}</span></div>
          ))}
        </div>
        <button type="button" className="btn btn-dashed" onClick={invite}><Icon name="share" size={18} />{t('host.invite')}</button>
      </Section>
    </>
  )
}

export default function GroupDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { t } = useI18n()
  const groups = useGroups()
  const group = groups.data?.find((g) => String(g.id) === String(id))

  if (!group && groups.loading) return <div className="page"><Skeleton h={220} r={24} /><Skeleton h={120} /></div>
  if (!group && groups.error) return <div className="page"><BackButton fallback="/groups" /><ErrorState error={groups.error} onRetry={groups.reload} /></div>
  if (!group) return <NotFoundPage />

  const isHost = user && group.creatorId === user.id
  const left = Math.max(0, group.maxMembers - group.membersCount)

  return (
    <>
      <header className="hero-top bricks" style={{ '--brick': HEAD[group.genderType] || 'var(--lapis)' }}>
        <div className="row-between">
          <BackButton fallback="/groups" variant="on-dark" />
          <Badge tone={GENDER_TONE[group.genderType]}>{t(`groups.${group.genderType}`)}</Badge>
        </div>
        <span className="hero-eyebrow">{formatShortDate(group.startDate)}</span>
        <h1 style={{ fontSize: 28 }}>{group.name}</h1>
        {group.description && <p className="muted" style={{ fontSize: 15 }}>{group.description}</p>}
      </header>

      <div className="page">
        {!isHost && <GroupStatus group={group} />}

        <div className="grid-2">
          <div className="stat"><span>{t('groups.host')}</span><b style={{ fontSize: 15 }}>{group.creatorName}</b></div>
          <div className="stat"><span>{t('groups.spots')}</span><b style={{ fontSize: 15 }}>{t('groups.spotsLeft', { n: left, max: group.maxMembers })}</b></div>
        </div>
        <Progress value={group.membersCount} max={group.maxMembers} large label={t('groups.going', { n: group.membersCount, max: group.maxMembers })} />

        {group.tripId && (
          <Link to={`/trips/${group.tripId}`} className="card card-link card-pad row" style={{ '--gap': '12px' }}>
            <Icon name="route" style={{ color: 'var(--lapis)' }} />
            <span className="grow stack" style={{ '--gap': '0px' }}>
              <span className="small muted">{t('groups.followsTrip')}</span><b>{group.tripTitle}</b>
              {(isHost || group.myStatus === 'Approved') && <span className="small" style={{ color: 'var(--ochre)' }}>{t('groups.bookTripHint', { date: formatShortDate(group.startDate) })}</span>}
            </span>
            <Icon name="forward" className="flip-rtl faint" />
          </Link>
        )}

        {isHost ? <HostPanel group={group} /> : (
          <Section title={t('groups.whoGoing')}>
            <p className="card card-pad small" style={{ color: 'var(--ink-2)' }}>{t('groups.privacy', { n: group.membersCount })}</p>
          </Section>
        )}

        {group.genderType !== 'Mixed' && <Notice tone="info" icon="shield">{t('groups.genderRule', { type: t(`groups.${group.genderType}`) })}</Notice>}
        {!user && <Empty icon="users" title={t('groups.guestTitle')}>{t('groups.guestText')}</Empty>}
      </div>

      {isHost && (
        <ActionBar>
          <Link to="/groups" className="btn btn-outline btn-lg grow">{t('host.allGroups')}</Link>
        </ActionBar>
      )}
    </>
  )
}
