import client from './client'

export const deliveriesApi = {
  getByOrder: (orderId) => client.get(`/api/deliveries/order/${orderId}`).then((r) => r.data),
}
