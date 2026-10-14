import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { Empty } from './ui'

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user } = useAuth()
  const { t } = useI18n()
  const location = useLocation()

  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="page">
        <Empty icon="lock" title={t('error.forbiddenTitle')}>{t('error.forbidden', { roles: roles.map((r) => t(`role.${r}`)).join(', ') })}</Empty>
      </div>
    )
  }
  return children
}
