/** The Ishtar Gate silhouette used as brand art. Decorative only. */
export function GateArt({ width = 200, tower = '#14306F', arch = '#0F1E4A', line = '#F2C66B', reliefs = false }) {
  const height = Math.round((width * 230) / 250)
  return (
    <svg width={width} height={height} viewBox="0 0 250 230" aria-hidden="true" focusable="false" style={{ display: 'block' }}>
      <path d="M20 230V40h18V22h16v18h16V22h16v18h18v190z" fill={tower} />
      <path d="M144 230V40h18V22h16v18h16V22h16v18h18v190z" fill={tower} />
      <path d="M86 230V120a39 39 0 0 1 78 0v110z" fill={arch} />
      <path d="M86 230V120a39 39 0 0 1 78 0v110" fill="none" stroke={line} strokeWidth="3.5" />
      {reliefs && (
        <g fill="none" stroke={line} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M38 86h28M38 150h28M184 86h28M184 150h28" />
          <path d="M42 112c4-6 12-6 16 0l4 6M188 112c4-6 12-6 16 0l4 6" />
          <path d="M42 176c4-6 12-6 16 0l4 6M188 176c4-6 12-6 16 0l4 6" />
        </g>
      )}
    </svg>
  )
}
