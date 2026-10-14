import axios from 'axios'

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
// Uploaded images are served by the backend (e.g. /uploads/abc.jpg)
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, '')

export const TOKEN_KEY = 'touriraq_token'
export const USER_KEY = 'touriraq_user'

const api = axios.create({ baseURL: API_URL })

// Attach the JWT to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// A 401 on a request that carried a token means it is expired/invalid: log out gracefully.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const hadToken = !!error.config?.headers?.Authorization
    if (error.response?.status === 401 && hadToken) {
      window.dispatchEvent(new Event('auth:expired'))
    }
    return Promise.reject(error)
  },
)

export default api
