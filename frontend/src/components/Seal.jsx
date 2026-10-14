import { useId } from 'react'

// Splits a place name into at most two short lines for the inside of a stamp.
// eslint-disable-next-line react-refresh/only-export-components
export function sealLines(name = '') {
  const clean = name.replace(/\(.*?\)/g, '').trim()
  const words = clean.split(/\s+/)
  if (clean.length <= 12 || words.length === 1) return [clean.slice(0, 16)]
  let first = ''
  let i = 0
  while (i < words.length && (first + ' ' + words[i]).trim().length <= 13) { first = (first + ' ' + words[i]).trim(); i += 1 }
  if (!first) { first = words[0]; i = 1 }
  const rest = words.slice(i).join(' ')
  return [first, rest.length > 15 ? `${rest.slice(0, 14)}…` : rest]
}

/** Small passport stamp: ink rings, the place name and the date. */
export function Seal({ name, date, ink = '#1D3A8C', rotate = -6, size = 92, label, rtl }) {
  const [l1, l2] = sealLines(name)
  const upper = !rtl
  // Shrink the text so the longest line always fits inside the inner ring (~62px wide).
  const longest = Math.max(l1.length, (l2 || '').length)
  const fs = Math.min(l2 ? 10.5 : 11.5, 62 / (longest * (upper ? 0.68 : 0.55)))
  // The date sits low in the ring where it's narrower (~50px), so it shrinks too.
  const dfs = date ? Math.min(8, 50 / (String(date).length * (rtl ? 0.5 : 0.7))) : 8
  return (
    <svg width={size} height={size} viewBox="0 0 92 92" role="img" aria-label={label || name} style={{ transform: `rotate(${rotate}deg)`, display: 'block' }}>
      <circle cx="46" cy="46" r="42" fill="none" stroke={ink} strokeWidth="3.5" opacity="0.88" />
      <circle cx="46" cy="46" r="35" fill="none" stroke={ink} strokeWidth="1" opacity="0.88" />
      <g fill={ink} opacity="0.92" fontFamily="Reem Kufi, IBM Plex Sans Arabic, sans-serif" fontWeight="700" textAnchor="middle">
        {l2 ? (
          <>
            <text x="46" y="41" fontSize={fs}>{upper ? l1.toUpperCase() : l1}</text>
            <text x="46" y="54" fontSize={fs}>{upper ? l2.toUpperCase() : l2}</text>
          </>
        ) : (
          <text x="46" y="50" fontSize={fs}>{upper ? l1.toUpperCase() : l1}</text>
        )}
        {date && <text x="46" y="69" fontSize={dfs} fontFamily="IBM Plex Sans Arabic, sans-serif" letterSpacing={rtl ? 0 : 0.4}>{date}</text>}
      </g>
    </svg>
  )
}

/** The large stamp shown the moment a stamp is collected. */
export function BigSeal({ name, ring, date, ink = '#1D3A8C', size = 250, animate, rtl }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [l1, l2] = sealLines(name)
  return (
    <svg width={size} height={size} viewBox="0 0 260 260" role="img" aria-label={`${name} · ${date}`} className={animate ? 'seal-anim' : ''} style={{ display: 'block', transform: animate ? undefined : 'rotate(-9deg)' }}>
      <defs><path id={`ring-${id}`} d="M130 130m-96 0a96 96 0 1 1 192 0a96 96 0 1 1-192 0" /></defs>
      <circle cx="130" cy="130" r="122" fill="none" stroke={ink} strokeWidth="5" opacity="0.9" />
      <circle cx="130" cy="130" r="112" fill="none" stroke={ink} strokeWidth="1.5" opacity="0.9" />
      <circle cx="130" cy="130" r="74" fill="none" stroke={ink} strokeWidth="1.5" opacity="0.9" />
      <text fontFamily="Reem Kufi, IBM Plex Sans Arabic, sans-serif" fontSize="17" fontWeight="700" letterSpacing={rtl ? 0 : 3} fill={ink} opacity="0.92">
        <textPath href={`#ring-${id}`}>{ring}</textPath>
      </text>
      <g fill={ink} opacity="0.92" fontFamily="Reem Kufi, IBM Plex Sans Arabic, sans-serif" fontWeight="700" textAnchor="middle">
        <text x="130" y={l2 ? 122 : 136} fontSize="24">{rtl ? l1 : l1.toUpperCase()}</text>
        {l2 && <text x="130" y="152" fontSize="24">{rtl ? l2 : l2.toUpperCase()}</text>}
        <text x="130" y="182" fontSize="14" fontFamily="IBM Plex Sans Arabic, sans-serif" letterSpacing={rtl ? 0 : 2}>{date}</text>
      </g>
    </svg>
  )
}
