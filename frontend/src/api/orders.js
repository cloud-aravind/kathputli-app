import client from './client'

export const ordersApi = {
  list: async () => {
    const data = (await client.get('/api/orders')).data
    return Array.isArray(data) ? data : (data.orders || [])
  },
  get: (id) => client.get(`/api/orders/${id}`).then((r) => r.data),
  create: (items) => client.post('/api/orders', { items }).then((r) => r.data),
}
