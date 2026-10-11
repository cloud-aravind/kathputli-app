import client from './client'

export const artistsApi = {
  get: (id) => client.get(`/api/artists/${id}`).then((r) => r.data),
  create: (payload) => client.post('/api/artists', payload).then((r) => r.data),
  update: (id, payload) => client.put(`/api/artists/${id}`, payload).then((r) => r.data),
}
