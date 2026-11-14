import client from './client'
import { uuidString } from './ids'

export const ordersApi = {
  list: async () => {
    const data = (await client.get('/api/orders')).data
    return Array.isArray(data) ? data : (data.orders || [])
  },
  get: (id) => client.get(`/api/orders/${id}`).then((r) => r.data),
  create: (items, shippingAddress) => {
    const payload = Array.isArray(items)
      ? { items, shipping_address: shippingAddress }
      : items
    const orderItems = Array.isArray(payload?.items) ? payload.items : []
    const normalizedItems = []

    for (const item of orderItems) {
      const artworkId = uuidString(item?.artwork_id ?? item?.id)
      if (!artworkId) {
        return Promise.reject(new Error('invalid artwork id'))
      }
      normalizedItems.push({
        ...item,
        artwork_id: artworkId,
      })
    }

    return client
      .post('/api/orders', { ...payload, items: normalizedItems })
      .then((r) => r.data)
  },
}
