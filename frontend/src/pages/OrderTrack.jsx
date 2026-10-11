import { useEffect, useState } from 'react'
import { ordersApi } from '../api/orders'
import { deliveriesApi } from '../api/deliveries'
import { normalizeOrder } from '../api/orderFormat'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  MapPin,
  Package,
  ShieldCheck,
  Truck,
} from 'lucide-react'

const LAST_ORDER_KEY = 'kathputli-last-order'
const ORDERS_KEY = 'kathputli-orders'

const STATUS_STEPS = [
  {
    key: 'Order Placed',
    label: 'Order Placed',
    description: 'Your order has been received.',
    Icon: CheckCircle2,
  },
  {
    key: 'Payment Confirmed',
    label: 'Payment Confirmed',
    description: 'Your payment has been confirmed.',
    Icon: ShieldCheck,
  },
  {
    key: 'Artwork Processing',
    label: 'Artwork Processing',
    description: 'The artist and our team are preparing your artwork.',
    Icon: Package,
  },
  {
    key: 'Shipped',
    label: 'Shipped',
    description: 'Your artwork is on its way to you.',
    Icon: Truck,
  },
  {
    key: 'Delivered',
    label: 'Delivered',
    description: 'Your artwork has arrived.',
    Icon: CheckCircle2,
  },
]

export default function OrderTrack() {
  const { id } = useParams()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function loadOrder() {
      try {
        const data = await ordersApi.get(id)
        let normalized = normalizeOrder(data)
        try {
          const delivery = await deliveriesApi.getByOrder(id)
          const deliveryStatus = String(delivery.status || '').toLowerCase()
          const deliveryMap = { assigned: 'Artwork Processing', picked_up: 'Shipped', in_transit: 'Shipped', delivered: 'Delivered' }
          if (deliveryMap[deliveryStatus]) normalized = { ...normalized, status: deliveryMap[deliveryStatus], delivery }
        } catch (deliveryError) {
          // Delivery may not exist until the asynchronous order/payment events are processed.
          if (deliveryError?.response?.status !== 404) console.warn('Delivery status is not available yet.')
        }
        if (active) setOrder(normalized)
      } catch (error) {
        if (!active) return
        setError(error?.response?.status === 404 ? 'We could not find this order.' : 'Unable to load this order.')
      } finally {
        if (active) setLoading(false)
      }
    }
    loadOrder()
    return () => { active = false }
  }, [id])

  if (loading) {
    return <LoadingState />
  }

  if (error || !order) {
    return <NotFoundState message={error} />
  }

  const status = order.status || 'Order Placed'
  const currentIndex = getStatusIndex(status)
  const paymentStatus =
    order.paymentStatus ||
    (currentIndex >= 1 ? 'Confirmed' : 'Pending')

  const items = Array.isArray(order.items)
    ? order.items
    : []

  const itemCount = items.reduce(
    (total, item) =>
      total + Number(item.quantity || 1),
    0
  )

  const shippingAddress = order.shippingAddress || {}

  return (
    <div className="min-h-screen bg-[#f8f5ef]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* BACK */}

        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-sm text-stone-500 transition hover:text-[#7d1e1e]"
        >
          <ArrowLeft className="h-4 w-4" />
          All orders
        </Link>

        {/* HEADER */}

        <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#a47b55]">
              Order tracking
            </p>

            <h1 className="mt-2 font-serif text-4xl text-stone-900 sm:text-5xl">
              Order #{String(id).slice(-8)}
            </h1>

            {order.createdAt && (
              <p className="mt-3 text-sm text-stone-500">
                Placed on {formatDate(order.createdAt)}
              </p>
            )}
          </div>

          <StatusBadge status={status} />
        </div>

        <div className="mt-10 grid gap-7 lg:grid-cols-[1fr_360px]">
          {/* MAIN */}

          <main className="space-y-6">
            {/* TRACKING */}

            <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200/70 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-stone-400">
                    Your artwork journey
                  </p>

                  <h2 className="mt-2 font-serif text-2xl text-stone-900">
                    Order progress
                  </h2>
                </div>

                {currentIndex < STATUS_STEPS.length - 1 && (
                  <div className="flex items-center gap-2 text-xs font-medium text-[#7d1e1e]">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#a47b55] opacity-50" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#7d1e1e]" />
                    </span>
                    In progress
                  </div>
                )}
              </div>

              <div className="mt-8">
                <div className="space-y-0">
                  {STATUS_STEPS.map(
                    (step, index) => {
                      const completed =
                        index < currentIndex

                      const active =
                        index === currentIndex

                      const upcoming =
                        index > currentIndex

                      const { Icon } = step

                      return (
                        <div
                          key={step.key}
                          className="relative flex gap-4"
                        >
                          {/* CONNECTOR */}

                          {!(
                            index ===
                            STATUS_STEPS.length - 1
                          ) && (
                            <div
                              className={`absolute left-[19px] top-10 h-[calc(100%-4px)] w-px ${
                                index <
                                currentIndex
                                  ? 'bg-[#7d1e1e]'
                                  : 'bg-stone-200'
                              }`}
                            />
                          )}

                          {/* ICON */}

                          <div className="relative z-10 shrink-0">
                            <div
                              className={`grid h-10 w-10 place-items-center rounded-full border-2 transition ${
                                completed ||
                                active
                                  ? 'border-[#7d1e1e] bg-[#7d1e1e] text-white'
                                  : 'border-stone-200 bg-white text-stone-300'
                              } ${
                                active
                                  ? 'ring-4 ring-[#f2e5dc]'
                                  : ''
                              }`}
                            >
                              {completed ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Icon className="h-4 w-4" />
                              )}
                            </div>
                          </div>

                          {/* CONTENT */}

                          <div
                            className={`min-w-0 flex-1 pb-8 ${
                              index ===
                              STATUS_STEPS.length -
                                1
                                ? 'pb-0'
                                : ''
                            }`}
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <h3
                                className={`text-sm font-medium ${
                                  upcoming
                                    ? 'text-stone-400'
                                    : 'text-stone-900'
                                }`}
                              >
                                {step.label}
                              </h3>

                              {active && (
                                <span className="rounded-full bg-[#f2e5dc] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#7d1e1e]">
                                  Current
                                </span>
                              )}
                            </div>

                            <p
                              className={`mt-1 text-xs leading-5 ${
                                upcoming
                                  ? 'text-stone-300'
                                  : 'text-stone-500'
                              }`}
                            >
                              {step.description}
                            </p>
                          </div>
                        </div>
                      )
                    }
                  )}
                </div>
              </div>

              {currentIndex ===
                STATUS_STEPS.length - 1 && (
                <div className="mt-8 rounded-2xl bg-[#f5eee7] px-5 py-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#7d1e1e]" />

                    <div>
                      <p className="text-sm font-medium text-stone-900">
                        Your artwork has been delivered
                      </p>

                      <p className="mt-1 text-xs leading-5 text-stone-500">
                        We hope your new piece brings
                        something special to your space.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {currentIndex <
                STATUS_STEPS.length - 1 && (
                <div className="mt-8 rounded-2xl bg-[#faf8f4] px-5 py-4">
                  <div className="flex items-start gap-3">
                    <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-[#a47b55]" />

                    <div>
                      <p className="text-sm font-medium text-stone-900">
                        Estimated delivery
                      </p>

                      <p className="mt-1 text-xs leading-5 text-stone-500">
                        Your artwork is expected to
                        arrive within 7–10 business days.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* ARTWORKS */}

            <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200/70 sm:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-stone-400">
                    Purchased artwork
                  </p>

                  <h2 className="mt-2 font-serif text-2xl text-stone-900">
                    Your collection
                  </h2>
                </div>

                <span className="text-xs text-stone-400">
                  {itemCount}{' '}
                  {itemCount === 1
                    ? 'item'
                    : 'items'}
                </span>
              </div>

              <div className="mt-6 space-y-5">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4"
                  >
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-stone-100">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={
                            item.title ||
                            item.name ||
                            'Artwork'
                          }
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-stone-300">
                          <Package className="h-7 w-7" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium text-stone-900">
                        {item.title ||
                          item.name ||
                          'Artwork'}
                      </h3>

                      {item.artist && (
                        <p className="mt-1 text-xs text-stone-500">
                          {item.artist}
                        </p>
                      )}

                      {item.category && (
                        <p className="mt-1 text-xs text-stone-400">
                          {item.category}
                        </p>
                      )}

                      <div className="mt-3 flex items-center justify-between gap-4">
                        <p className="text-xs text-stone-400">
                          Quantity{' '}
                          {item.quantity || 1}
                        </p>

                        <p className="text-sm font-medium text-stone-800">
                          ₹
                          {(
                            Number(
                              item.price || 0
                            ) *
                            Number(
                              item.quantity || 1
                            )
                          ).toLocaleString(
                            'en-IN'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {items.length === 0 && (
                  <p className="text-sm text-stone-500">
                    No artwork details are available
                    for this order.
                  </p>
                )}
              </div>
            </section>
          </main>

          {/* SIDEBAR */}

          <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
            {/* ORDER SUMMARY */}

            <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200/70">
              <h2 className="font-serif text-2xl text-stone-900">
                Order summary
              </h2>

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between text-stone-500">
                  <span>Subtotal</span>

                  <span>
                    ₹
                    {Number(
                      order.subtotal || 0
                    ).toLocaleString(
                      'en-IN'
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-stone-500">
                  <span>Shipping</span>

                  <span>
                    {Number(
                      order.shipping || 0
                    ) === 0
                      ? 'Free'
                      : `₹${Number(
                          order.shipping
                        ).toLocaleString(
                          'en-IN'
                        )}`}
                  </span>
                </div>
              </div>

              <div className="my-5 border-t border-stone-200" />

              <div className="flex items-end justify-between">
                <p className="text-sm text-stone-500">
                  Total
                </p>

                <p className="font-serif text-2xl font-semibold text-stone-900">
                  ₹
                  {Number(
                    order.total || 0
                  ).toLocaleString('en-IN')}
                </p>
              </div>

              <div className="mt-5 rounded-2xl bg-[#faf8f4] p-4">
                <p className="text-xs text-stone-400">
                  Payment status
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <CheckCircle2
                    className={`h-4 w-4 ${
                      paymentStatus ===
                      'Confirmed'
                        ? 'text-green-600'
                        : 'text-stone-400'
                    }`}
                  />

                  <span className="text-sm font-medium text-stone-800">
                    {paymentStatus}
                  </span>
                </div>

                {order.paymentMethod && (
                  <p className="mt-1 text-xs capitalize text-stone-400">
                    {formatPaymentMethod(
                      order.paymentMethod
                    )}
                  </p>
                )}
              </div>
            </section>

            {/* SHIPPING ADDRESS */}

            <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200/70">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#f2e5dc] text-[#7d1e1e]">
                  <MapPin className="h-5 w-5" />
                </div>

                <h2 className="font-serif text-xl text-stone-900">
                  Delivery address
                </h2>
              </div>

              <div className="mt-5 rounded-2xl bg-[#faf8f4] p-4">
                {shippingAddress.fullName && (
                  <p className="text-sm font-medium text-stone-900">
                    {shippingAddress.fullName}
                  </p>
                )}

                {shippingAddress.phone && (
                  <p className="mt-1 text-xs text-stone-500">
                    {shippingAddress.phone}
                  </p>
                )}

                <p className="mt-3 text-sm leading-6 text-stone-600">
                  {shippingAddress.address ||
                    'Address not available'}
                  {shippingAddress.city && (
                    <>
                      <br />
                      {shippingAddress.city}
                    </>
                  )}
                  {shippingAddress.state && (
                    <>
                      , {shippingAddress.state}
                    </>
                  )}
                  {shippingAddress.pincode && (
                    <>
                      <br />
                      {shippingAddress.pincode}
                    </>
                  )}
                </p>
              </div>
            </section>

            {/* HELP */}

            <section className="rounded-3xl border border-stone-200 bg-white/70 p-6">
              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-[#a47b55]" />

                <div>
                  <p className="text-sm font-medium text-stone-900">
                    Need help?
                  </p>

                  <p className="mt-1 text-xs leading-5 text-stone-500">
                    Keep your order number handy if
                    you need assistance with your
                    purchase.
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}

function getStatusIndex(status) {
  const index = STATUS_STEPS.findIndex(
    (step) =>
      step.key.toLowerCase() ===
      String(status).toLowerCase()
  )

  return index === -1 ? 0 : index
}

function formatDate(value) {
  try {
    return new Date(value).toLocaleDateString(
      'en-IN',
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }
    )
  } catch {
    return ''
  }
}

function formatPaymentMethod(method) {
  const labels = {
    card: 'Credit / Debit Card',
    upi: 'UPI',
    cod: 'Cash on Delivery',
  }

  return (
    labels[String(method).toLowerCase()] ||
    method
  )
}

function StatusBadge({ status }) {
  const styles = {
    'Order Placed':
      'bg-stone-100 text-stone-700',
    'Payment Confirmed':
      'bg-[#f2e5dc] text-[#7d1e1e]',
    'Artwork Processing':
      'bg-amber-50 text-amber-700',
    Shipped:
      'bg-blue-50 text-blue-700',
    Delivered:
      'bg-green-50 text-green-700',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-4 py-2 text-xs font-medium ${
        styles[status] ||
        'bg-stone-100 text-stone-600'
      }`}
    >
      {status}
    </span>
  )
}

function LoadingState() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-[#f8f5ef]">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-[#7d1e1e]" />

        <p className="mt-4 text-sm text-stone-500">
          Loading your order…
        </p>
      </div>
    </div>
  )
}

function NotFoundState({ message }) {
  return (
    <div className="min-h-[70vh] bg-[#f8f5ef] px-4 py-16">
      <div className="mx-auto max-w-xl rounded-3xl bg-white px-6 py-14 text-center shadow-sm ring-1 ring-stone-200/70">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#f2e5dc] text-[#7d1e1e]">
          <Package className="h-7 w-7" />
        </div>

        <h1 className="mt-6 font-serif text-2xl text-stone-900">
          Order not found
        </h1>

        <p className="mt-2 text-sm leading-6 text-stone-500">
          {message ||
            'We could not find the order you are looking for.'}
        </p>

        <Link
          to="/orders"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#7d1e1e] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#681919]"
        >
          Back to orders
        </Link>
      </div>
    </div>
  )
}