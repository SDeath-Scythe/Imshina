import { useEffect, useState } from 'react'
import Icon from './Icon'
import { Notice, Sheet, Spinner } from './ui'
import { useI18n } from '../i18n/I18nContext'
import { useToast } from '../context/ToastContext'
import { renderShareCard, saveImage, shareImage } from '../utils/shareCard'
import { sealLines } from './Seal'
import { formatDate, govInk } from '../utils/helpers'

const canShareFiles = () => {
  try {
    return !!navigator.canShare?.({ files: [new File([new Blob(['x'])], 'x.png', { type: 'image/png' })] })
  } catch {
    return false
  }
}

/**
 * A sheet that draws a story-sized card and lets the traveller share or save it.
 * card: options for renderShareCard · fileName · shareTitle · shareText
 */
export default function ShareCardSheet({ open, onClose, card, fileName, shareTitle, shareText }) {
  const { t } = useI18n()
  const toast = useToast()
  const [blob, setBlob] = useState(null)
  const [url, setUrl] = useState(null)
  const [failed, setFailed] = useState(false)
  const key = open ? JSON.stringify(card) : null

  useEffect(() => {
    if (!key) return undefined
    let alive = true
    let made = null
    setBlob(null); setUrl(null); setFailed(false)
    renderShareCard(JSON.parse(key))
      .then((b) => {
        if (!alive) return
        made = URL.createObjectURL(b)
        setBlob(b); setUrl(made)
      })
      .catch(() => { if (alive) setFailed(true) })
    return () => { alive = false; if (made) URL.revokeObjectURL(made) }
  }, [key])

  const share = async () => {
    const r = await shareImage(blob, { fileName, title: shareTitle, text: shareText })
    if (r === 'unsupported') { saveImage(blob, fileName); toast(t('share.saved')) }
  }

  return (
    <Sheet open={open} onClose={onClose} title={t('share.title')}
      footer={(
        <div className="row" style={{ '--gap': '8px' }}>
          <button type="button" className="btn btn-outline grow" disabled={!blob} onClick={() => { saveImage(blob, fileName); toast(t('share.saved')) }}>
            <Icon name="download" size={18} />{t('share.save')}
          </button>
          {canShareFiles() && (
            <button type="button" className="btn grow" disabled={!blob} onClick={share}><Icon name="share" size={18} />{t('share.share')}</button>
          )}
        </div>
      )}>
      <div className="share-preview">
        {url ? <img src={url} alt={shareText} /> : failed ? null : <Spinner label={t('share.making')} />}
      </div>
      {failed ? <Notice tone="error">{t('share.failed')}</Notice> : <p className="small muted center">{t('share.hint')}</p>}
    </Sheet>
  )
}

const slug = (s) => String(s || 'stamp').toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** Props for ShareCardSheet showing one stamp. `count` is the passport total once this stamp is in. */
// eslint-disable-next-line react-refresh/only-export-components
export function stampCard({ place, count, total, date, i18n }) {
  const { t, loc, gov, isRtl } = i18n
  const name = loc(place, 'name')
  const when = formatDate(date, { day: '2-digit', month: 'short', year: 'numeric' })
  return {
    card: {
      ink: govInk(place.governorateName, place.governorateId),
      ring: `${place.name.replace(/\(.*?\)/g, '').trim()} · ${place.governorateName} · IRAQ ·`.toUpperCase(),
      lines: sealLines(name),
      date: isRtl ? when : when.toUpperCase(),
      headline: total ? t('card.headline', { n: count, total }) : t('card.headlineNoTotal', { n: count }),
      line1: name,
      line2: t('card.collected', { city: gov(place.governorateName), date: formatDate(date) }),
      count, total, rtl: isRtl,
      tagline: t('card.tagline'),
      brand: t('card.brand'),
    },
    fileName: `imshina-${slug(place.name)}.png`,
    shareTitle: name,
    shareText: total ? t('share.text', { place: name, n: count, total }) : t('share.textNoTotal', { place: name }),
  }
}
