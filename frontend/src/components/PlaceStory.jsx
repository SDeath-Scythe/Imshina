import Icon from './Icon'
import { Skeleton } from './ui'
import { useI18n } from '../i18n/I18nContext'

/** The story a stamp unlocked: a hook, two or three sentences, and one thing to look for on site. */
export function StoryCard({ story, loading, compact }) {
  const { t, loc } = useI18n()
  if (loading) return <Skeleton h={compact ? 120 : 170} r={20} />
  if (!story) return null
  return (
    <article className={`story ${compact ? 'compact' : ''}`}>
      <span className="story-eyebrow"><Icon name="sparkle" size={15} />{t('story.unlocked')}</span>
      <b className="display story-title">{loc(story, 'title')}</b>
      <p>{loc(story, 'text')}</p>
      <div className="story-look">
        <Icon name="eye" size={18} />
        <span><b>{t('story.lookFor')}</b> {loc(story, 'lookFor')}</span>
      </div>
    </article>
  )
}

/** Shown on a place page before the stamp: there's a story here, and going there is how to read it. */
export function StoryTeaser() {
  const { t } = useI18n()
  return (
    <div className="story locked" role="note">
      <span className="story-lock" aria-hidden="true"><Icon name="lock" size={20} /></span>
      <span className="stack" style={{ '--gap': '2px' }}>
        <b>{t('story.lockedTitle')}</b>
        <span className="small">{t('story.lockedText')}</span>
      </span>
    </div>
  )
}
