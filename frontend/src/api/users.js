import client from './client'

// The current User Service supports only the authenticated user's profile.
export const usersApi = {
  getProfile: () => client.get('/api/users/me').then((r) => r.data),
  updateProfile: (payload) =>
    client.put('/api/users/me', { name: payload.name }).then((r) => r.data),
}
