import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import Icon from '../components/Icon'
import { useI18n } from '../i18n/I18nContext'

const ToastContext = createContext(() => { })

export function ToastProvider({ children }) {
  const { t } = useI18n()
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => setToasts((l) => l.filter((x) => x.id !== id)), [])
  const toast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((l) => [...l.slice(-2), { id, message, type }])
    setTimeout(() => dismiss(id), 4500)
  }, [dismiss])
  const value = useMemo(() => toast, [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((x) => (
          <div key={x.id} className={`toast ${x.type}`}>
            <Icon name={x.type === 'error' ? 'alert' : 'check'} size={18} />
            <span>{x.message}</span>
            <button type="button" onClick={() => dismiss(x.id)} aria-label={t('common.close')}><Icon name="close" size={16} /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext)
