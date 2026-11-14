import client from './client'
import { uuidString } from './ids'

export const artistsApi = {
  list: () => client.get('/api/artists').then((r) => r.data),
  me: () => client.get('/api/artists/me').then((r) => r.data),
  get: (id) => {
    const artistId = uuidString(id)
    if (!artistId) return Promise.reject(new Error('invalid artist id'))
    return client.get(`/api/artists/${artistId}`).then((r) => r.data)
  },
  create: (payload) => client.post('/api/artists', payload).then((r) => r.data),
  update: (id, payload) => client.put(`/api/artists/${id}`, payload).then((r) => r.data),
}
