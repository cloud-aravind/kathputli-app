import client from './client'

export const paymentsApi = {
  create: (orderId, method = 'mock') =>
    client.post('/api/payments', { order_id: orderId, method }).then((r) => r.data),
  get: (id) => client.get(`/api/payments/${id}`).then((r) => r.data),
  getByOrder: (orderId) => client.get(`/api/orders/${orderId}/payment`).then((r) => r.data),
  completeMock: (id) => client.post(`/api/payments/${id}/complete`).then((r) => r.data),
}
