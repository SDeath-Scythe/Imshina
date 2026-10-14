// One self-contained stroke icon set, so every icon shares the same weight and none depends
// on an icon-library version. Strings are <path d>, {c:[cx,cy,r]} circles, {r:[x,y,w,h,rx]} rects.
const ICONS = {
  compass: [{ c: [12, 12, 9] }, 'M15.5 8.5l-2 5-5 2 2-5z'],
  users: [{ c: [9, 8, 3.2] }, 'M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6', 'M16 4.5a3.2 3.2 0 0 1 0 6.3', 'M18 14.3c1.8.9 3 2.9 3 5.2'],
  stamp: ['M5 21h14', 'M6 17h12v-3a2 2 0 0 0-2-2h-2.5l.8-5.2a2.3 2.3 0 1 0-4.6 0l.8 5.2H8a2 2 0 0 0-2 2z'],
  guide: [{ c: [10, 8, 3.5] }, 'M3.5 20c0-3.6 2.9-6.5 6.5-6.5 1.4 0 2.6.4 3.6 1.1', 'M15 18l2 2 4-4'],
  route: [{ c: [6, 19, 2] }, { c: [18, 5, 2] }, 'M8 19h7.5a3.5 3.5 0 0 0 0-7h-7a3.5 3.5 0 0 1 0-7H16'],
  search: [{ c: [11, 11, 6.5] }, 'M20 20l-4.2-4.2'],
  map: ['M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z', 'M9 4v14M15 6v14'],
  pin: ['M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z', { c: [12, 10, 2.5] }],
  back: ['M15 5l-7 7 7 7'],
  forward: ['M9 5l7 7-7 7'],
  down: ['M6 9l6 6 6-6'],
  close: ['M6 6l12 12M18 6L6 18'],
  bell: ['M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z', 'M10 20a2 2 0 0 0 4 0'],
  plus: ['M12 5v14M5 12h14'],
  minus: ['M5 12h14'],
  check: ['M5 12l5 5L20 7'],
  locate: [{ c: [12, 12, 3] }, { c: [12, 12, 7.5] }, 'M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22'],
  camera: ['M4 8h3l2-3h6l2 3h3v11H4z', { c: [12, 13, 3.5] }],
  play: { fill: ['M7 4.5v15l12.5-7.5z'] },
  pause: ['M8 5v14M16 5v14'],
  stop: [{ r: [6, 6, 12, 12, 2] }],
  star: { fill: ['M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z'] },
  clock: [{ c: [12, 12, 9] }, 'M12 7v5l3 2'],
  calendar: [{ r: [4, 5, 16, 15, 2] }, 'M4 10h16M9 3v4M15 3v4'],
  shield: ['M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z', 'M9 12l2 2 4-4'],
  gift: [{ r: [4, 8, 16, 4, 1] }, 'M5 12v8h14v-8', 'M12 8v12', 'M12 8C10 5 6 5 6 7s3 1 6 1 6 1 6-1-4-2-6 1'],
  globe: [{ c: [12, 12, 9] }, 'M3 12h18', 'M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z'],
  logout: ['M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3', 'M10 8l-4 4 4 4', 'M6 12h10'],
  login: ['M10 4h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-8', 'M14 12H4', 'M10 8l4 4-4 4'],
  user: [{ c: [12, 8, 3.5] }, 'M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7'],
  eye: ['M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z', { c: [12, 12, 3] }],
  eyeOff: ['M3 3l18 18', 'M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1', 'M6.6 6.6C3.9 8.3 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6', 'M9.9 9.9a3 3 0 0 0 4.2 4.2'],
  info: [{ c: [12, 12, 9] }, 'M12 11v5', 'M12 8h.01'],
  alert: ['M12 3.5l9.5 16.5h-19z', 'M12 10v4', 'M12 17h.01'],
  lock: [{ r: [5, 11, 14, 10, 2] }, 'M8 11V8a4 4 0 0 1 8 0v3'],
  bookmark: ['M6 3h12v18l-6-4-6 4z'],
  share: [{ c: [18, 5, 2.5] }, { c: [6, 12, 2.5] }, { c: [18, 19, 2.5] }, 'M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4'],
  download: ['M12 4v11', 'M7 10l5 5 5-5', 'M5 20h14'],
  phone: ['M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2'],
  wallet: ['M3 7h18v12H3z', 'M3 7l2-3h12l2 3', 'M16 13h2'],
  chart: ['M4 20V10', 'M10 20V4', 'M16 20v-7', 'M3 20h18'],
  trash: ['M4 7h16', 'M10 11v6M14 11v6', 'M6 7l1 13h10l1-13', 'M9 7V4h6v3'],
  image: [{ r: [3, 5, 18, 14, 2] }, { c: [8.5, 10, 1.5] }, 'M21 16l-5-5-8 8'],
  ticket: ['M4 6h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4z', 'M14 7v2M14 11v2M14 15v2'],
  landmark: ['M3 21h18', 'M5 21V10M19 21V10M9.5 21V10M14.5 21V10', 'M3 10l9-6 9 6z'],
  dome: ['M4 21h16', 'M6 21v-7a6 6 0 0 1 12 0v7', 'M12 4v4', 'M10 21v-4a2 2 0 0 1 4 0v4'],
  castle: ['M4 21V9l2-1 2 1v2h2V8h4v3h2V9l2-1 2 1v12z', 'M10 21v-4a2 2 0 0 1 4 0v4'],
  tree: ['M12 22v-6', 'M12 3l6 9h-3l4 5H5l4-5H6z'],
  walk: [{ c: [13, 4.5, 1.8] }, 'M10 21l2-6 3 3v3', 'M7 12l3-3 3 1 2 3 2 1', 'M12 15l1-5'],
  navigate: ['M12 2.5l7.5 18.5-7.5-4-7.5 4z'],
  refresh: ['M20 11a8 8 0 1 0-2.3 5.7', 'M20 4v7h-7'],
  edit: ['M4 20h4L19 9l-4-4L4 16z', 'M13.5 6.5l4 4'],
  inbox: ['M4 13l3-8h10l3 8v6H4z', 'M4 13h5l1 2h4l1-2h5'],
  home: ['M4 11l8-7 8 7', 'M6 9.5V20h12V9.5'],
  sparkle: ['M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z'],
  headphones: ['M4 15v-3a8 8 0 0 1 16 0v3', { r: [3, 14, 4, 6, 1.5] }, { r: [17, 14, 4, 6, 1.5] }],
  upload: ['M12 16V4', 'M7 9l5-5 5 5', 'M4 20h16'],
  admin: ['M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z', { c: [12, 10.5, 2.2] }, 'M8.5 16c.8-1.6 2-2.4 3.5-2.4s2.7.8 3.5 2.4'],
}

export default function Icon({ name, size = 20, stroke = 1.9, className, label, style }) {
  const spec = ICONS[name] || ICONS.info
  const filled = !Array.isArray(spec)
  const parts = filled ? spec.fill : spec
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} focusable="false"
      fill={filled ? 'currentColor' : 'none'} stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" {...a11y}>
      {parts.map((p, i) => {
        if (typeof p === 'string') return <path key={i} d={p} />
        if (p.c) return <circle key={i} cx={p.c[0]} cy={p.c[1]} r={p.c[2]} />
        return <rect key={i} x={p.r[0]} y={p.r[1]} width={p.r[2]} height={p.r[3]} rx={p.r[4]} />
      })}
    </svg>
  )
}

export const CATEGORY_ICON = { Archaeological: 'landmark', Religious: 'dome', Heritage: 'castle', Nature: 'tree', Other: 'pin' }
