import { Link, useParams } from 'react-router-dom'
import Icon from '../components/Icon'
import { BackButton, Skeleton } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { usePassport, useRewards } from '../api/hooks'
import { couponCode, formatDate } from '../utils/helpers'

export default function RewardPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { t } = useI18n()
  const rewards = useRewards()
  const passport = usePassport()
  const r = rewards.data?.find((x) => String(x.id) === String(id))
  const count = passport.data?.totalStamps ?? 0

  return (
    <div className="bricks" style={{ '--brick': 'var(--lapis-deep)', minHeight: '100dvh', color: '#fff' }}>
      <div className="bare-page">
        <div className="row-between">
          <BackButton fallback="/passport" variant="on-dark" />
          <span className="small" style={{ color: '#C9CEDD' }}>{t('reward.showStaff')}</span>
          <span style={{ width: 44 }} />
        </div>

        {rewards.loading && <Skeleton h={420} r={26} />}
        {!rewards.loading && !r && <p className="notice error">{t('reward.notFound')}</p>}

        {r && (
          <div style={{ borderRadius: 26, background: 'var(--paper)', color: 'var(--ink)', overflow: 'hidden' }}>
            <div className="bricks row-between" style={{ '--brick': 'var(--lapis)', padding: '22px 22px 18px', color: '#fff', alignItems: 'flex-end' }}>
              <span className="stack" style={{ '--gap': '2px' }}>
                <span className="hero-eyebrow">{t('reward.eyebrow')}</span>
                <b style={{ fontSize: 18 }}>{r.partnerName}</b>
                <span className="small" style={{ color: '#D7DEF2' }}>{t(`partner.${r.partnerType}`)}</span>
              </span>
              <span className="display num" style={{ fontWeight: 700, fontSize: 46, lineHeight: 1, color: 'var(--gold)' }}>{r.discountPercent}%</span>
            </div>
            <div style={{ borderTop: '2px dashed var(--line-3)', margin: '0 14px' }} />
            <div className="stack" style={{ padding: '20px 22px 24px', alignItems: 'center', textAlign: 'center', '--gap': '14px' }}>
              <b style={{ fontSize: 18 }}>{r.title}</b>
              {r.isUnlocked ? (
                <>
                  <span style={{ position: 'relative', width: 150, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="150" height="150" viewBox="0 0 150 150" aria-hidden="true" className="coupon-ring" style={{ position: 'absolute', inset: 0 }}>
                      <circle cx="75" cy="75" r="70" fill="none" stroke="#1D3A8C" strokeWidth="3" strokeDasharray="10 7" />
                    </svg>
                    <span className="stack" style={{ '--gap': '0px' }}>
                      <span className="xsmall muted">{t('reward.code')}</span>
                      <span className="display num" style={{ fontSize: 28, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--lapis)' }}>{couponCode(user.id, r.id)}</span>
                    </span>
                  </span>
                  <span className="small muted" style={{ maxWidth: 280 }}>{t('reward.liveHint')}</span>
                </>
              ) : (
                <div className="stack" style={{ '--gap': '8px', alignItems: 'center' }}>
                  <span style={{ width: 72, height: 72, borderRadius: 36, background: 'var(--paper-2)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="lock" size={30} /></span>
                  <b>{t('reward.locked', { n: Math.max(0, r.requiredStamps - count) })}</b>
                </div>
              )}
              <dl className="grid-2" style={{ width: '100%', margin: 0, textAlign: 'start' }}>
                <div className="stat"><dt className="small muted">{t('reward.unlockedBy')}</dt><dd style={{ margin: 0, fontWeight: 600 }}>{t('reward.stamps', { n: r.requiredStamps })}</dd></div>
                <div className="stat"><dt className="small muted">{t('reward.valid')}</dt><dd style={{ margin: 0, fontWeight: 600 }}>{r.expiresAt ? t('reward.until', { date: formatDate(r.expiresAt) }) : t('reward.noExpiry')}</dd></div>
              </dl>
            </div>
          </div>
        )}

        <Link to="/passport" className="btn btn-on-dark" style={{ marginTop: 'auto' }}>{t('reward.back')}</Link>
      </div>
    </div>
  )
}
