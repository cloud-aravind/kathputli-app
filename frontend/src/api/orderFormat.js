export function normalizeShippingAddress(addr) {
  if (!addr || typeof addr !== 'object') return null
  return {
    fullName: addr.fullName || addr.full_name || '',
    phone: addr.phone || '',
    address: addr.address || '',
    city: addr.city || '',
    state: addr.state || '',
    pincode: addr.pincode || '',
  }
}

export function normalizePaymentStatus(status, orderStatus) {
  const normalizedOrderStatus = String(orderStatus || '').toLowerCase()
  if (normalizedOrderStatus === 'payment_failed') return 'Failed'
  const s = String(status || '').toLowerCase()
  if (s === 'completed' || s === 'confirmed' || s === 'paid') return 'Confirmed'
  if (s === 'failed') return 'Failed'
  if (s === 'pending') return 'Pending'
  if (
    ['confirmed', 'processing', 'shipped', 'delivered'].includes(
      normalizedOrderStatus
    )
  ) {
    return 'Confirmed'
  }
  return 'Pending'
}

export function normalizeOrder(order) {
  if (!order) return null
  const statusMap = {
    pending_payment: 'Order Placed',
    confirmed: 'Payment Confirmed',
    payment_failed: 'Payment Failed',
    processing: 'Artwork Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  }
  return {
    ...order,
    id: order.id,
    createdAt: order.created_at || order.createdAt,
    status: statusMap[String(order.status || '').toLowerCase()] || order.status || 'Order Placed',
    paymentStatus: normalizePaymentStatus(order.paymentStatus || order.payment_status, order.status),
    shippingAddress: normalizeShippingAddress(order.shipping_address || order.shippingAddress),
    items: (order.items || []).map((item) => ({
      ...item,
      id: item.artwork_id || item.id,
      artwork_id: item.artwork_id || item.id,
      title: item.title || 'Artwork',
      quantity: Number(item.quantity || 1),
      price: Number(item.unit_price ?? item.price ?? 0),
      subtotal: Number(item.subtotal || 0),
      artist: item.artist_name || item.artist || 'Independent Artist',
      image: item.image_url || item.image || '/category-traditional-art.jpg',
    })),
    total: Number(order.total_price ?? order.total ?? 0),
    subtotal: Number(order.subtotal ?? order.total_price ?? order.total ?? 0),
    shipping: Number(order.shipping_amount ?? order.shipping ?? 0),
  }
}
