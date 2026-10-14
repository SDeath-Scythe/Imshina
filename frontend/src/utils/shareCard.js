// Draws a story-sized (1080 × 1920) share image of a passport stamp, a milestone or the
// completion certificate. Everything is drawn on a canvas in the app's fonts, so it works offline
// and needs no server.

const W = 1080
const H = 1920
const C = {
  deep: '#0F1E4A', lapis: '#1D3A8C', gold: '#F2C66B', paper: '#F5F2EA',
  ink: '#14182B', muted: '#5A5F73', line: '#CFC6B2', soft: '#B9BFD3',
}
const DISPLAY = '"Reem Kufi", "IBM Plex Sans Arabic", sans-serif'
const TEXT = '"IBM Plex Sans Arabic", system-ui, sans-serif'

async function fontsReady() {
  if (!document.fonts?.load) return
  try {
    await Promise.all([
      document.fonts.load(`700 64px ${DISPLAY}`, 'امشينا Imshina'),
      document.fonts.load(`600 64px ${DISPLAY}`, 'Stamp'),
      document.fonts.load(`400 40px ${TEXT}`, 'Walk Iraq امشي'),
      document.fonts.load(`600 40px ${TEXT}`, 'Walk Iraq امشي'),
    ])
  } catch { /* fall back to system fonts */ }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// Glazed-brick wall, like the Ishtar Gate: offset rows of faint outlines.
function bricks(ctx) {
  ctx.fillStyle = C.deep
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = 'rgba(70, 105, 200, 0.22)'
  ctx.lineWidth = 2
  const bw = 120
  const bh = 60
  for (let row = 0; row * bh < H; row++) {
    const off = row % 2 ? bw / 2 : 0
    for (let x = -bw; x < W + bw; x += bw) ctx.strokeRect(x + off, row * bh, bw, bh)
  }
}

/** Fits `text` on one line no wider than `max` by shrinking from `size`. */
function fit(ctx, text, weightFamily, size, max) {
  let s = size
  ctx.font = `${weightFamily.replace('{s}', s)}`
  while (s > 18 && ctx.measureText(text).width > max) {
    s -= 2
    ctx.font = `${weightFamily.replace('{s}', s)}`
  }
  return s
}

function text(ctx, raw, x, y, { font, color, rtl, letter = 0 }) {
  const str = String(raw).replace(/[\u2066-\u2069]/g, '') // bidi isolates from t() would show as boxes
  ctx.font = font
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.direction = rtl ? 'rtl' : 'ltr'
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${letter}px`
  ctx.fillText(str, x, y)
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px'
}

// The stamp: two outer rings, text running round the band, an inner ring and the name in the middle.
function stamp(ctx, { cx, cy, ink, ring, lines, date, rtl }) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate((-7 * Math.PI) / 180)
  ctx.strokeStyle = ink
  ctx.fillStyle = ink
  ctx.globalAlpha = 0.92
  ctx.lineWidth = 14
  ctx.beginPath(); ctx.arc(0, 0, 300, 0, Math.PI * 2); ctx.stroke()
  ctx.lineWidth = 4
  ctx.beginPath(); ctx.arc(0, 0, 272, 0, Math.PI * 2); ctx.stroke()
  ctx.beginPath(); ctx.arc(0, 0, 186, 0, Math.PI * 2); ctx.stroke()

  // Ring text, one letter at a time round the band (Latin only: Arabic letters must stay joined).
  const band = 229
  ctx.font = `700 34px ${DISPLAY}`
  ctx.textAlign = 'center'
  ctx.direction = 'ltr'
  const chars = [...ring]
  const widths = chars.map((ch) => ctx.measureText(ch).width + 5)
  const total = widths.reduce((a, b) => a + b, 0)
  const scale = Math.min(1, (2 * Math.PI * band * 0.98) / total)
  let angle = -Math.PI / 2 - (total * scale) / band / 2
  chars.forEach((ch, i) => {
    const a = angle + (widths[i] * scale) / band / 2
    ctx.save()
    ctx.rotate(a)
    ctx.translate(0, -band)
    ctx.fillText(ch, 0, 12)
    ctx.restore()
    angle += (widths[i] * scale) / band
  })

  // Name in the middle, one or two lines, shrunk to fit inside the inner ring.
  const [l1, l2] = lines
  const fam = `700 {s}px ${DISPLAY}`
  const size = Math.min(fit(ctx, l1, fam, 60, 310), l2 ? fit(ctx, l2, fam, 60, 310) : 60)
  const show = (s) => (rtl ? s : s.toUpperCase())
  if (l2) {
    text(ctx, show(l1), 0, -14, { font: fam.replace('{s}', size), color: ink, rtl })
    text(ctx, show(l2), 0, -14 + size + 8, { font: fam.replace('{s}', size), color: ink, rtl })
  } else {
    text(ctx, show(l1), 0, size / 3, { font: fam.replace('{s}', size), color: ink, rtl })
  }
  if (date) text(ctx, date, 0, 130, { font: `600 30px ${TEXT}`, color: ink, rtl, letter: rtl ? 0 : 4 })
  ctx.restore()
}

/**
 * Renders the card and resolves to a PNG Blob.
 * { ink, ring, lines: [l1, l2?], date, headline, line1, line2, count, total, tagline, brand, rtl }
 */
export async function renderShareCard(o) {
  await fontsReady()
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  bricks(ctx)

  // Wordmark
  text(ctx, 'امشينا', W / 2, 230, { font: `700 112px ${DISPLAY}`, color: C.gold, rtl: true })
  text(ctx, o.brand, W / 2, 300, { font: `600 30px ${TEXT}`, color: C.soft, letter: o.rtl ? 0 : 8, rtl: o.rtl })

  // Paper card
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.35)'
  ctx.shadowBlur = 40
  ctx.shadowOffsetY = 16
  roundRect(ctx, 90, 370, 900, 1200, 52)
  ctx.fillStyle = C.paper
  ctx.fill()
  ctx.restore()

  stamp(ctx, { cx: W / 2, cy: 760, ink: o.ink, ring: o.ring, lines: o.lines, date: o.date, rtl: o.rtl })

  const hs = fit(ctx, o.headline, `600 {s}px ${DISPLAY}`, 76, 800)
  text(ctx, o.headline, W / 2, 1200, { font: `600 ${hs}px ${DISPLAY}`, color: C.ink, rtl: o.rtl })
  if (o.line1) {
    const s1 = fit(ctx, o.line1, `600 {s}px ${TEXT}`, 42, 800)
    text(ctx, o.line1, W / 2, 1275, { font: `600 ${s1}px ${TEXT}`, color: C.ink, rtl: o.rtl })
  }
  if (o.line2) {
    const s2 = fit(ctx, o.line2, `400 {s}px ${TEXT}`, 34, 800)
    text(ctx, o.line2, W / 2, 1330, { font: `400 ${s2}px ${TEXT}`, color: C.muted, rtl: o.rtl })
  }

  // One dot per place: filled for each stamp collected.
  if (o.total) {
    const n = Math.min(o.total, 30)
    const gap = Math.min(44, 760 / n)
    const r = Math.min(13, gap / 2 - 3)
    const start = W / 2 - ((n - 1) * gap) / 2
    for (let i = 0; i < n; i++) {
      const x = o.rtl ? W - (start + i * gap) : start + i * gap
      ctx.beginPath()
      ctx.arc(x, 1450, r, 0, Math.PI * 2)
      if (i < o.count) { ctx.fillStyle = C.lapis; ctx.fill() } else { ctx.strokeStyle = C.line; ctx.lineWidth = 3; ctx.stroke() }
    }
  }

  text(ctx, o.tagline, W / 2, 1690, { font: `600 46px ${TEXT}`, color: '#FFFFFF', rtl: o.rtl })
  text(ctx, 'Imshina · امشينا', W / 2, 1765, { font: `600 32px ${TEXT}`, color: C.gold })

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not draw the card'))), 'image/png'))
}

/** Opens the phone's share sheet with the image when possible. Resolves to 'shared', 'cancelled' or 'unsupported'. */
export async function shareImage(blob, { fileName, title, text: body }) {
  const file = new File([blob], fileName, { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title, text: body })
      return 'shared'
    } catch (err) {
      return err?.name === 'AbortError' ? 'cancelled' : 'unsupported'
    }
  }
  return 'unsupported'
}

/** Saves the image as a file download. */
export function saveImage(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}
