import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api, { TOKEN_KEY, USER_KEY } from '../api/client'
import { clearCache } from '../hooks/useQuery'

// SECURITY NOTE: localStorage is readable by any script running on the page, so an XSS bug
// could steal the token. Acceptable for a hackathon MVP; production should prefer
// httpOnly cookies + refresh tokens. Passwords are never stored client-side.

const AuthContext = createContext(null)

function tokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return !payload.exp || payload.exp * 1000 <= Date.now()
  } catch {
    return true
  }
}

function loadSession() {
  const token = localStorage.getItem(TOKEN_KEY)
  const user = localStorage.getItem(USER_KEY)
  if (!token || !user || tokenExpired(token)) {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    return { token: null, user: null }
  }
  try {
    return { token, user: JSON.parse(user) }
  } catch {
    return { token: null, user: null }
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadSession)

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    clearCache()
    setSession({ token: null, user: null })
  }, [])

  const saveSession = useCallback((data) => {
    clearCache()
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    setSession({ token: data.token, user: data.user })
    return data.user
  }, [])

  const login = useCallback(
    async (email, password) => saveSession((await api.post('/auth/login', { email, password })).data),
    [saveSession],
  )

  const register = useCallback(
    async (payload) => saveSession((await api.post('/auth/register', payload)).data),
    [saveSession],
  )

  // Expired/invalid token detected by the Axios interceptor.
  useEffect(() => {
    window.addEventListener('auth:expired', logout)
    return () => window.removeEventListener('auth:expired', logout)
  }, [logout])

  const value = useMemo(
    () => ({ user: session.user, token: session.token, isAuthenticated: !!session.token, login, register, logout }),
    [session, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
