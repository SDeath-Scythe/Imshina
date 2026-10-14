import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { Seal } from '../components/Seal'
import ShareCardSheet, { stampCard } from '../components/ShareCard'
import { Milestones, Trails } from '../components/Journey'
import PassportBook from '../components/PassportBook'
import { StoryCard } from '../components/PlaceStory'
import { Empty, ErrorState, Progress, Section, Segmented, Sheet, SignInPrompt, Skeleton, SkeletonRows } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { useGovernorates, usePassport, usePlaceStory, usePlaces, useRewards } from '../api/hooks'
import { formatDate, formatDistance, govInk, imageUrl } from '../utils/helpers'

const ROTATIONS = [-8, 6, -3, 9, -6, 4]

function StampSheet({ stamp, place, onClose, count, total, onShare }) {
  const { t, loc } = useI18n()
  // The place list doesn't say whether a story exists, so ask; a place without one returns 404 and shows nothing.
  const story = usePlaceStory(stamp?.placeId, !!stamp)
  return (
    <Sheet open={!!stamp} onClose={onClose} title={place ? loc(place, 'name') : ''}>
      {stamp && (
        <>
          <img src={imageUrl(stamp.photoUrl)} alt={t('passport.yourPhoto', { place: place ? loc(place, 'name') : '' })}
            style={{ width: '100%', maxHeight: 340, objectFit: 'cover', borderRadius: 18, background: 'var(--paper-2)' }} />
          <div className="grid-2">
            <div className="stat"><span>{t('passport.collected')}</span><b style={{ fontSize: 15 }}>{formatDate(stamp.createdAt)}</b></div>
            <div className="stat"><span>{t('passport.fromSite')}</span><b style={{ fontSize: 15 }} className="num">{formatDistance(stamp.distanceMeters)}</b></div>
          </div>
          {!story.error && <StoryCard story={story.data} loading={story.loading} compact />}
          <div className="row" style={{ '--gap': '8px' }}>
            <Link to={`/places/${stamp.placeId}`} className="btn btn-outline grow">{t('passport.openPlace')}</Link>
            {place && <button type="button" className="btn grow" onClick={() => onShare({ stamp, place, count, total })}><Icon name="share" size={18} />{t('share.short')}</button>}
          </div>
        </>
      )}
    </Sheet>
  )
}

export default function PassportPage() {
  const { user } = useAuth()
  const { t, loc, isRtl } = useI18n()
  const passport = usePassport()
  const rewards = useRewards()
  const places = usePlaces()
  const govs = useGovernorates()
  const [tab, setTab] = useState(null)
  const [open, setOpen] = useState(null)
  const [sharing, setSharing] = useState(null) // props for the share sheet: { card, fileName, shareTitle, shareText }
  const i18n = useI18n()

  const stamps = useMemo(() => passport.data?.stamps || [], [passport.data])
  const byPlace = useMemo(() => new Map(stamps.map((s) => [s.placeId, s])), [stamps])
  const latestGovId = useMemo(() => {
    const latest = [...stamps].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0]
    return latest ? places.data?.find((p) => p.id === latest.placeId)?.governorateId : null
  }, [stamps, places.data])

  if (!user) {
    return (
      <div className="page">
        <SignInPrompt title={t('passport.guestTitle')} text={t('passport.guestText')} />
      </div>
    )
  }
  if (user.role !== 'Tourist') {
    return <div className="page"><Empty icon="stamp" title={t('passport.onlyTravellers')}>{t('passport.onlyTravellersText')}</Empty></div>
  }

  const total = places.data?.length || 0
  const activeGov = tab ?? latestGovId ?? govs.data?.[0]?.id
  const g = govs.data?.find((x) => x.id === activeGov)
  const govPlaces = (places.data || []).filter((p) => p.governorateId === activeGov)
  const citiesVisited = new Set(stamps.map((s) => places.data?.find((p) => p.id === s.placeId)?.governorateId).filter(Boolean)).size
  const unlocked = (rewards.data || []).filter((r) => r.isUnlocked).length
  const count = passport.data?.totalStamps ?? 0
  const latestId = [...stamps].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0]?.stampId

  return (
    <>
      <div className="page">
        {passport.error && <ErrorState error={passport.error} onRetry={passport.reload} />}
        {(passport.loading || places.loading || govs.loading) ? <Skeleton h={560} r={18} /> : (
          <>
            <h1 className="sr-only">{t('nav.passport')}</h1>
            <PassportBook user={user} stamps={stamps} places={places.data || []} total={total} cities={citiesVisited} rewards={unlocked} onOpenStamp={setOpen} />

            <h2 style={{ marginTop: 8 }}>{t('passport.allPlaces')}</h2>
            {count === 0 && (
              <div className="notice info">
                <Icon name="stamp" size={20} />
                <span><b>{t('passport.emptyTitle')}</b><br />{t('passport.emptyText')} <Link to="/">{t('passport.emptyLink')}</Link></span>
              </div>
            )}
            <Segmented label={t('passport.citiesTabs')} value={activeGov} onChange={setTab}
              options={(govs.data || []).map((x) => ({
                value: x.id, label: loc(x, 'name'),
                sub: `${(places.data || []).filter((p) => p.governorateId === x.id && byPlace.has(p.id)).length}/${x.placesCount}`,
              }))} />

            {g && (
              <div className="row-between" style={{ alignItems: 'baseline' }}>
                <h2>{loc(g, 'name')}</h2>
                <span className="small muted">
                  {govPlaces.every((p) => byPlace.has(p.id)) ? t('passport.cityComplete') : t('passport.leftToFind', { n: govPlaces.filter((p) => !byPlace.has(p.id)).length })}
                </span>
              </div>
            )}

            <div className="seal-grid" role="list">
              {govPlaces.map((p, i) => {
                const s = byPlace.get(p.id)
                return (
                  <div role="listitem" key={p.id}>
                    {s ? (
                      <button type="button" className="seal-slot" onClick={() => setOpen(s)} aria-label={t('passport.stampLabel', { place: loc(p, 'name'), date: formatDate(s.createdAt) })}>
                        <Seal name={loc(p, 'name')} date={formatDate(s.createdAt, { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                          ink={govInk(p.governorateName, p.governorateId)} rotate={ROTATIONS[i % ROTATIONS.length]} rtl={isRtl} />
                        <span style={{ fontWeight: 600 }}>{loc(p, 'name')}</span>
                        {s.stampId === latestId && <span className="badge blue" style={{ fontSize: 10.5 }}>{t('passport.latest')}</span>}
                      </button>
                    ) : (
                      <Link to={`/places/${p.id}`} className="seal-slot empty-slot">
                        <span className="seal-empty"><Icon name="pin" size={24} /></span>
                        <span>{loc(p, 'name')}</span>
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>

            <Milestones count={count} total={total} userName={user.fullName} onShare={setSharing} />
            <Trails places={places.data || []} stampedIds={new Set(byPlace.keys())} onShare={setSharing} />
          </>
        )}

        <Section title={t('passport.rewardsTitle')}>
          {rewards.loading ? <SkeletonRows n={3} h={74} /> : rewards.error ? <ErrorState error={rewards.error} onRetry={rewards.reload} /> : (
            <div className="stack" style={{ '--gap': '10px' }}>
              {(rewards.data || []).length === 0 && <Empty icon="gift" title={t('passport.noRewards')} />}
              {[...(rewards.data || [])].sort((a, b) => Number(b.isUnlocked) - Number(a.isUnlocked) || a.requiredStamps - b.requiredStamps).map((r) => {
                const inner = (
                  <>
                    <span style={{ width: 52, height: 52, flexShrink: 0, borderRadius: 14, background: r.isUnlocked ? 'var(--gold)' : 'var(--paper-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 17 }} className="display num">
                      {r.discountPercent}%
                    </span>
                    <span className="grow stack" style={{ '--gap': '4px' }}>
                      <b>{r.title}</b>
                      <span className="small muted">{r.partnerName} · {t(`partner.${r.partnerType}`)}</span>
                      {!r.isUnlocked && <Progress value={count} max={r.requiredStamps} label={t('passport.needs', { n: r.requiredStamps })} />}
                    </span>
                    {r.isUnlocked ? <span className="btn btn-dark btn-sm">{t('passport.show')}</span> : <span className="small bold" style={{ color: 'var(--ochre)', whiteSpace: 'nowrap' }}>{t('passport.more', { n: r.requiredStamps - count })}</span>}
                  </>
                )
                return r.isUnlocked ? (
                  <Link key={r.id} to={`/rewards/${r.id}`} className="card card-link card-pad row" style={{ '--gap': '12px' }}>{inner}</Link>
                ) : (
                  <div key={r.id} className="card card-pad row" style={{ '--gap': '12px' }}>{inner}</div>
                )
              })}
            </div>
          )}
        </Section>
      </div>

      <StampSheet stamp={open} place={open ? places.data?.find((p) => p.id === open.placeId) : null} onClose={() => setOpen(null)}
        total={total} count={open ? [...stamps].sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)).indexOf(open) + 1 : 0}
        onShare={(x) => { setOpen(null); setSharing(stampCard({ ...x, date: new Date(x.stamp.createdAt), i18n })) }} />
      {sharing && <ShareCardSheet open onClose={() => setSharing(null)} {...sharing} />}
    </>
  )
}
