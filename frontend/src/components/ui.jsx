import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Icon from './Icon'
import { useI18n } from '../i18n/I18nContext'
import { avatarTint, initials } from '../utils/helpers'

export function Wordmark({ size = 28, sub = false }) {
  return (
    <span className="row" style={{ '--gap': '8px', alignItems: 'baseline' }}>
      <span className="wordmark" style={{ fontSize: size }} lang="ar">امشينا</span>
      {sub && <span className="display muted wordmark-sub" style={{ fontSize: Math.round(size / 2) }}>Imshina</span>}
    </span>
  )
}

/** Goes back in history when the user came from inside the app, otherwise to `fallback`. */
export function BackButton({ fallback = '/', variant = '', label }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useI18n()
  // The browser router numbers in-app history entries: idx 0 means this page was opened directly
  // (or reached through a redirect), so going back would leave the app or do nothing. Use the fallback then.
  const canGoBack = location.key !== 'default' && (window.history.state?.idx ?? 1) > 0
  return (
    <button type="button" className={`icon-btn ${variant}`} aria-label={label || t('common.back')}
      onClick={() => (canGoBack ? navigate(-1) : navigate(fallback))}>
      <Icon name="back" className="flip-rtl" />
    </button>
  )
}

export function PageHeader({ title, back, actions, children }) {
  return (
    <header className="page-header">
      {back && <BackButton fallback={back} />}
      <div className="grow">{title && <h1>{title}</h1>}{children}</div>
      {actions}
    </header>
  )
}

export function PageTitle({ eyebrow, title, subtitle, action }) {
  return (
    <div className="row-between" style={{ alignItems: 'flex-end' }}>
      <div className="page-title">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function Section({ title, action, children, label }) {
  return (
    <section className="stack" style={{ '--gap': '12px' }} aria-label={label}>
      {(title || action) && <div className="row-between"><h2>{title}</h2>{action}</div>}
      {children}
    </section>
  )
}

export function Avatar({ name = '?', size = 44, ring }) {
  return (
    <span className="avatar" aria-hidden="true"
      style={{ '--s': `${size}px`, background: avatarTint(name), boxShadow: ring ? `0 0 0 3px ${ring}` : undefined }}>
      {initials(name)}
    </span>
  )
}

export function Stars({ value = 0, label }) {
  const { t } = useI18n()
  const full = Math.round(value)
  return (
    <span className="stars" role="img" aria-label={label || t('guide.ratingOf', { n: value.toFixed ? value.toFixed(1) : value })}>
      {'★★★★★'.slice(0, full)}<span style={{ color: 'var(--line-3)' }}>{'★★★★★'.slice(full)}</span>
    </span>
  )
}

export function Progress({ value, max = 100, dark, large, label }) {
  const pct = Math.max(0, Math.min(100, max ? (value / max) * 100 : 0))
  return (
    <div className={`progress ${dark ? 'on-dark' : ''} ${large ? 'lg' : ''}`} role="progressbar"
      aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={label}>
      <span style={{ width: `${pct}%` }} />
    </div>
  )
}

/** options: [{ value, label, sub }]. role="tablist" when used to switch views. */
export function Segmented({ options, value, onChange, label, tabs = true }) {
  return (
    <div className="segmented" role={tabs ? 'tablist' : 'group'} aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role={tabs ? 'tab' : undefined}
          aria-selected={tabs ? value === o.value : undefined} aria-pressed={tabs ? undefined : value === o.value}
          onClick={() => onChange(o.value)}>
          {o.label}{o.sub != null && <small>{o.sub}</small>}
        </button>
      ))}
    </div>
  )
}

export function ChipGroup({ options, value, onChange, label }) {
  return (
    <div className="scroll-x" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" className="chip" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}{o.count != null && <span className="count">{o.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function NumberStepper({ value, min = 1, max = 99, onChange, label }) {
  const { t } = useI18n()
  return (
    <span className="stepper" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={t('common.decrease')}>−</button>
      <output aria-live="polite">{value}</output>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={t('common.increase')}>+</button>
    </span>
  )
}

export function Notice({ tone = 'info', icon, children, role }) {
  const fallback = { info: 'info', success: 'check', warn: 'alert', error: 'alert' }[tone]
  return (
    <div className={`notice ${tone}`} role={role || (tone === 'error' ? 'alert' : undefined)}>
      <Icon name={icon || fallback} size={20} />
      <div className="grow">{children}</div>
    </div>
  )
}

export function Empty({ icon = 'compass', title, children, action }) {
  return (
    <div className="empty">
      <span className="empty-icon"><Icon name={icon} size={28} /></span>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  )
}

export function ErrorState({ error, onRetry }) {
  const { t, te } = useI18n()
  return (
    <div className="empty" role="alert">
      <span className="empty-icon" style={{ background: 'var(--clay-soft)', color: 'var(--clay)' }}><Icon name="alert" size={28} /></span>
      <h3>{t('error.title')}</h3>
      <p>{te(error)}</p>
      {onRetry && <button type="button" className="btn btn-outline btn-sm" onClick={onRetry}><Icon name="refresh" size={16} />{t('common.retry')}</button>}
    </div>
  )
}

export function Skeleton({ h = 16, w = '100%', r = 12, style }) {
  return <span className="skeleton" aria-hidden="true" style={{ display: 'block', height: h, width: w, borderRadius: r, ...style }} />
}

export function SkeletonRows({ n = 3, h = 76 }) {
  const { t } = useI18n()
  return (
    <div className="stack" style={{ '--gap': '10px' }} aria-busy="true" aria-label={t('common.loading')}>
      {Array.from({ length: n }, (_, i) => <Skeleton key={i} h={h} r={18} />)}
    </div>
  )
}

export function Spinner({ label }) {
  return <span className="spinner" role="status" aria-label={label} />
}

/** Bottom sheet on phones, centred dialog on wider screens. */
export function Sheet({ open, onClose, title, children, footer }) {
  const ref = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const titleId = useId()
  const { t } = useI18n()
  useEffect(() => {
    if (!open) return undefined
    const prev = document.activeElement
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusable = ref.current?.querySelector('input, select, textarea, button:not([data-close])')
    ;(focusable || ref.current)?.focus()
    const onKey = (e) => { if (e.key === 'Escape') closeRef.current() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKey)
      prev?.focus?.()
    }
  }, [open])
  if (!open) return null
  // Rendered at the end of <body> so no page container can stack it under the tab bar.
  return createPortal(
    <div className="backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={ref} tabIndex={-1}>
        <span className="sheet-handle" aria-hidden="true" />
        <div className="row-between">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="icon-btn" data-close onClick={onClose} aria-label={t('common.close')}><Icon name="close" size={18} /></button>
        </div>
        {children}
        {footer}
      </div>
    </div>,
    document.body,
  )
}

/** A "are you sure?" sheet for actions that can't be undone. */
export function ConfirmSheet({ open, onClose, title, children, confirmLabel, keepLabel, onConfirm, busy }) {
  return (
    <Sheet open={open} onClose={busy ? () => {} : onClose} title={title}
      footer={(
        <div className="row" style={{ '--gap': '8px' }}>
          <button type="button" className="btn btn-outline grow" onClick={onClose} disabled={busy}>{keepLabel}</button>
          <button type="button" className="btn btn-danger grow" onClick={onConfirm} disabled={busy}>{busy ? <Spinner /> : confirmLabel}</button>
        </div>
      )}>
      <p className="muted">{children}</p>
    </Sheet>
  )
}

export function ActionBar({ children }) {
  return <div className="action-bar"><div className="action-bar-inner">{children}</div></div>
}

/** Shown to guests in place of a feature that needs an account. */
export function SignInPrompt({ icon = 'stamp', title, text, from }) {
  const { t } = useI18n()
  const location = useLocation()
  const state = { from: from || location.pathname }
  return (
    <div className="card card-pad stack" style={{ '--gap': '12px', alignItems: 'center', textAlign: 'center', padding: 28 }}>
      <span className="empty-icon" style={{ width: 64, height: 64, borderRadius: 32, background: 'var(--lapis-soft)', color: 'var(--lapis)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={28} />
      </span>
      <h2>{title}</h2>
      {text && <p className="muted" style={{ maxWidth: 340 }}>{text}</p>}
      <div className="row wrap" style={{ justifyContent: 'center' }}>
        <Link to="/register" state={state} className="btn">{t('auth.getPassport')}</Link>
        <Link to="/login" state={state} className="btn btn-outline">{t('auth.login')}</Link>
      </div>
    </div>
  )
}

export function Badge({ tone = 'plain', children }) {
  return <span className={`badge ${tone}`}>{children}</span>
}
