export function normalizeOrder(order) {
  if (!order) return null
  const statusMap = {
    pending_payment: 'Order Placed',
    confirmed: 'Payment Confirmed',
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
    paymentStatus: order.paymentStatus || (order.status === 'pending_payment' ? 'Pending' : 'Confirmed'),
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
    subtotal: Number(order.total_price ?? order.subtotal ?? order.total ?? 0),
    shipping: 0,
  }
}
