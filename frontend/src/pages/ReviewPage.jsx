import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api/client'
import Icon from '../components/Icon'
import { ActionBar, Avatar, BackButton, Empty, Notice, Skeleton } from '../components/ui'
import { useI18n } from '../i18n/I18nContext'
import { useBookings } from '../api/hooks'
import { invalidate } from '../hooks/useQuery'
import { formatRange } from '../utils/helpers'

export default function ReviewPage() {
  const { id } = useParams()
  const { t, te } = useI18n()
  const bookings = useBookings()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const b = bookings.data?.find((x) => String(x.id) === String(id))
  const words = ['', t('review.r1'), t('review.r2'), t('review.r3'), t('review.r4'), t('review.r5')]

  if (bookings.loading && !b) return <div className="page"><Skeleton h={300} r={20} /></div>
  if (!b) return <div className="page"><BackButton fallback="/bookings" /><Empty icon="ticket" title={t('review.notFound')} /></div>
  const first = (b.guideName || '').split(' ')[0]

  if (done) {
    return (
      <div className="page" style={{ minHeight: '80dvh', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <span className="stars" style={{ fontSize: 44 }} aria-hidden="true">{'★★★★★'.slice(0, rating)}</span>
        <h1>{t('review.thanks')}</h1>
        <p className="muted" style={{ maxWidth: 340 }}>{t('review.thanksText', { name: first })}</p>
        <Link to={`/guides/${b.guideUserId}`} replace className="btn btn-lg">{t('review.seeProfile', { name: first })}</Link>
      </div>
    )
  }
  if (!b.canReview) {
    return (
      <div className="page">
        <BackButton fallback="/bookings" />
        <Empty icon="star" title={t('review.cannotTitle')}>{b.status === 'Completed' ? t('review.already') : t('review.notYet')}</Empty>
      </div>
    )
  }

  const submit = async () => {
    setBusy(true); setError('')
    try {
      await api.post(`/guides/${b.guideUserId}/reviews`, { bookingId: b.id, rating, comment: comment.trim() })
      invalidate('bookings')
      invalidate(`guide:${b.guideUserId}`)
      setDone(true)
    } catch (err) { setError(te(err)) } finally { setBusy(false) }
  }

  return (
    <>
      <div className="page">
        <BackButton fallback="/bookings" />
        <div className="stack center" style={{ alignItems: 'center', '--gap': '8px' }}>
          <Avatar name={b.guideName || '?'} size={72} />
          <h1 style={{ fontSize: 24 }}>{t('review.how', { name: first })}</h1>
          <span className="small muted">{formatRange(b.startDate, b.endDate)}</span>
        </div>

        <div className="stack" style={{ alignItems: 'center', '--gap': '4px' }}>
          <div role="radiogroup" aria-label={t('review.rating')} className="row" style={{ '--gap': '2px' }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={t('review.stars', { n })}
                className={`star-btn ${n <= rating ? 'on' : ''}`} onClick={() => setRating(n)}>★</button>
            ))}
          </div>
          <span aria-live="polite" className="bold" style={{ color: 'var(--ochre)', minHeight: 22 }}>{words[rating]}</span>
        </div>

        <label className="field">{t('review.tell')}
          <textarea rows={5} value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} placeholder={t('review.placeholder')} />
          <span className="hint" style={{ textAlign: 'end' }}>{comment.length}/1000</span>
        </label>
        <Notice tone="info" icon="eye">{t('review.public')}</Notice>
        {error && <Notice tone="error">{error}</Notice>}
      </div>
      <ActionBar>
        <button type="button" className="btn btn-lg grow" onClick={submit} disabled={!rating || busy}>
          <Icon name="star" size={18} />{busy ? t('common.sending') : rating ? t('review.post') : t('review.pickStars')}
        </button>
      </ActionBar>
    </>
  )
}
