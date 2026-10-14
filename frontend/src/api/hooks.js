import api from './client'
import useQuery from '../hooks/useQuery'
import { useAuth } from '../context/AuthContext'

// Pages that ask for the same data share one cache entry, so moving between them is instant.

async function fetchAll(path, params = {}) {
  const pageSize = 50
  let page = 1
  let items = []
  for (;;) {
    const { data } = await api.get(path, { params: { ...params, page, pageSize } })
    items = items.concat(data.items)
    if (items.length >= data.totalCount || data.items.length === 0) return items
    page += 1
  }
}

export const usePlaces = () => useQuery('places', () => fetchAll('/places'))
export const useGovernorates = () => useQuery('governorates', async () => (await api.get('/governorates')).data)
export const usePlace = (id) => useQuery(id ? `place:${id}` : null, async () => (await api.get(`/places/${id}`)).data)
export const useGovernoratePlaces = (id) => useQuery(id ? `gov-places:${id}` : null, () => fetchAll(`/governorates/${id}/places`))

export function useGuides({ language, governorateId } = {}) {
  const params = {}
  if (language) params.language = language
  if (governorateId) params.governorateId = governorateId
  return useQuery(`guides:${language || ''}:${governorateId || ''}`, () => fetchAll('/guides', params))
}
export const useGuide = (id) => useQuery(id ? `guide:${id}` : null, async () => (await api.get(`/guides/${id}`)).data)

export const useTrips = () => useQuery('trips', () => fetchAll('/trips'))

function useUserQuery(name, role, fetcher) {
  const { user } = useAuth()
  const ok = !!user && (!role || role.includes(user.role))
  return useQuery(ok ? `${name}:${user.id}` : null, fetcher)
}
export const useMyTrips = () => useUserQuery('mytrips', ['Tourist'], async () => (await api.get('/trips/mine')).data)
export const useBookings = () => useUserQuery('bookings', ['Tourist'], async () => (await api.get('/bookings/me')).data)
export const usePassport = () => useUserQuery('passport', ['Tourist'], async () => (await api.get('/passport/me')).data)
export const useRewards = () => useUserQuery('rewards', ['Tourist'], async () => (await api.get('/rewards')).data)

// Groups carry `myStatus` when a token is sent, so the key includes the user.
export function useGroups() {
  const { user } = useAuth()
  return useQuery(`groups:${user?.id ?? 'guest'}`, () => fetchAll('/groups'))
}
export function useGroupMembers(groupId, enabled) {
  const { user } = useAuth()
  return useQuery(enabled && user ? `members:${groupId}:${user.id}` : null, async () => (await api.get(`/groups/${groupId}/members`)).data)
}

export const useAdminSetupStatus = () => useQuery('admin-setup', async () => (await api.get('/admin-setup/status')).data)

// A guide's booking inbox (requests travellers sent them).
export const useGuideBookings = () => useUserQuery('guide-bookings', ['Guide'], async () => (await api.get('/guide/bookings')).data)

// Visitor numbers for admins (aggregates only).
export const useInsights = () => useUserQuery('insights', ['Admin'], async () => (await api.get('/admin/insights')).data)
