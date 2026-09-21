import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Package,
  Receipt,
  Truck,
} from 'lucide-react'

const ORDERS_KEY = 'kathputli-orders'
const LAST_ORDER_KEY = 'kathputli-last-order'

const STATUS_STEPS = [
  'Order Placed',
  'Payment Confirmed',
  'Artwork Processing',
  'Shipped',
  'Delivered',
]

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const storedOrders = JSON.parse(
        localStorage.getItem(ORDERS_KEY) || '[]'
      )

      const lastOrder = JSON.parse(
        localStorage.getItem(LAST_ORDER_KEY) || 'null'
      )

      let combinedOrders = Array.isArray(storedOrders)
        ? storedOrders
        : []

      if (lastOrder?.id) {
        const exists = combinedOrders.some(
          (order) => order.id === lastOrder.id
        )

        if (!exists) {
          combinedOrders = [lastOrder, ...combinedOrders]
        }
      }

      setOrders(combinedOrders)
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#f8f5ef]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        {/* HEADER */}

        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#a47b55]">
            Your purchases
          </p>

          <h1 className="mt-2 font-serif text-4xl text-stone-900 sm:text-5xl">
            Your orders
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-500">
            View your artwork purchases and follow each
            order from confirmation to delivery.
          </p>
        </div>

        {loading ? (
          <OrdersLoading />
        ) : orders.length === 0 ? (
          <EmptyOrders />
        ) : (
          <div className="space-y-5">
            {orders.map((order, index) => (
              <OrderCard
                key={order.id || index}
                order={order}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function OrderCard({ order, index }) {
  const items = Array.isArray(order.items)
    ? order.items
    : []

  const itemCount = items.reduce(
    (total, item) =>
      total + Number(item.quantity || 1),
    0
  )

  const createdAt =
    order.createdAt || order.created_at

  const status =
    order.status || 'Order Placed'

  const paymentStatus =
    order.paymentStatus || 'Confirmed'

  const firstItem = items[0]

  const additionalItems =
    items.length > 1
      ? items.length - 1
      : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: Math.min(index * 0.06, 0.3),
      }}
      className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-stone-200/70"
    >
      {/* ORDER HEADER */}

      <div className="flex flex-col gap-4 border-b border-stone-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div className="flex items-start gap-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#f2e5dc] text-[#7d1e1e]">
            <Receipt className="h-5 w-5" />
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-stone-400">
              Order
            </p>

            <h2 className="mt-1 text-sm font-semibold text-stone-900">
              #{order.id || 'KPT-ORDER'}
            </h2>

            {createdAt && (
              <p className="mt-1 text-xs text-stone-500">
                {formatDate(createdAt)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={status} />

          <Link
            to={`/orders/${order.id}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 px-4 py-2 text-xs font-medium text-stone-700 transition hover:border-[#7d1e1e] hover:text-[#7d1e1e]"
          >
            View order
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* ORDER CONTENT */}

      <div className="grid gap-6 px-5 py-6 sm:px-7 lg:grid-cols-[1fr_250px]">
        {/* ITEMS */}

        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-stone-400">
              Artwork
            </p>

            <p className="text-xs text-stone-400">
              {itemCount}{' '}
              {itemCount === 1
                ? 'item'
                : 'items'}
            </p>
          </div>

          <div className="space-y-4">
            {items.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="flex gap-4"
              >
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-stone-100">
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
                      <Package className="h-6 w-6" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-stone-900">
                    {item.title ||
                      item.name ||
                      'Artwork'}
                  </p>

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

                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-xs text-stone-400">
                      Qty {item.quantity || 1}
                    </span>

                    <span className="text-sm font-medium text-stone-800">
                      ₹
                      {(
                        Number(item.price || 0) *
                        Number(
                          item.quantity || 1
                        )
                      ).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {additionalItems > 0 && (
              <p className="text-xs text-stone-400">
                + {additionalItems} more{' '}
                {additionalItems === 1
                  ? 'artwork'
                  : 'artworks'}
              </p>
            )}

            {items.length === 0 && (
              <div className="flex items-center gap-3 rounded-2xl bg-[#faf8f4] p-4">
                <Package className="h-5 w-5 text-stone-400" />
                <p className="text-sm text-stone-500">
                  Artwork details unavailable.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* SUMMARY */}

        <div className="rounded-2xl bg-[#faf8f4] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-stone-400">
            Order total
          </p>

          <p className="mt-2 font-serif text-2xl text-stone-900">
            ₹
            {Number(
              order.total || 0
            ).toLocaleString('en-IN')}
          </p>

          <div className="mt-4 space-y-2 border-t border-stone-200 pt-4 text-xs">
            <div className="flex justify-between text-stone-500">
              <span>Subtotal</span>
              <span>
                ₹
                {Number(
                  order.subtotal || 0
                ).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex justify-between text-stone-500">
              <span>Shipping</span>
              <span>
                {Number(order.shipping || 0) ===
                0
                  ? 'Free'
                  : `₹${Number(
                      order.shipping
                    ).toLocaleString(
                      'en-IN'
                    )}`}
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 border-t border-stone-200 pt-4">
            <CheckCircle2
              className={`h-4 w-4 ${
                paymentStatus === 'Confirmed'
                  ? 'text-[#7d1e1e]'
                  : 'text-stone-400'
              }`}
            />

            <span className="text-xs text-stone-500">
              Payment{' '}
              <span className="font-medium text-stone-700">
                {paymentStatus}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* PROGRESS */}

      <div className="border-t border-stone-100 bg-[#fcfaf7] px-5 py-5 sm:px-7">
        <OrderProgress status={status} />
      </div>
    </motion.div>
  )
}

function OrderProgress({ status }) {
  const currentIndex = Math.max(
    STATUS_STEPS.indexOf(status),
    0
  )

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-stone-400">
          Order progress
        </p>

        <span className="text-xs text-stone-500">
          {status}
        </span>
      </div>

      <div className="hidden items-start sm:flex">
        {STATUS_STEPS.map((step, index) => {
          const completed =
            index <= currentIndex

          const isLast =
            index === STATUS_STEPS.length - 1

          return (
            <div
              key={step}
              className="flex flex-1 items-start"
            >
              <div className="flex flex-col items-center">
                <div
                  className={`grid h-8 w-8 place-items-center rounded-full border ${
                    completed
                      ? 'border-[#7d1e1e] bg-[#7d1e1e] text-white'
                      : 'border-stone-200 bg-white text-stone-300'
                  }`}
                >
                  {index === 0 ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : index === 3 ? (
                    <Truck className="h-4 w-4" />
                  ) : index === 4 ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Package className="h-4 w-4" />
                  )}
                </div>

                <p
                  className={`mt-2 max-w-[90px] text-center text-[10px] leading-4 ${
                    completed
                      ? 'font-medium text-stone-800'
                      : 'text-stone-400'
                  }`}
                >
                  {step}
                </p>
              </div>

              {!isLast && (
                <div
                  className={`mt-4 h-px flex-1 ${
                    index < currentIndex
                      ? 'bg-[#7d1e1e]'
                      : 'bg-stone-200'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* MOBILE PROGRESS */}

      <div className="space-y-3 sm:hidden">
        {STATUS_STEPS.map((step, index) => {
          const completed =
            index <= currentIndex

          return (
            <div
              key={step}
              className="flex items-center gap-3"
            >
              <div
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border ${
                  completed
                    ? 'border-[#7d1e1e] bg-[#7d1e1e] text-white'
                    : 'border-stone-200 bg-white text-stone-300'
                }`}
              >
                {completed ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Clock3 className="h-3.5 w-3.5" />
                )}
              </div>

              <p
                className={`text-xs ${
                  completed
                    ? 'font-medium text-stone-800'
                    : 'text-stone-400'
                }`}
              >
                {step}
              </p>
            </div>
          )
        })}
      </div>
    </div>
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
      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium ${
        styles[status] ||
        'bg-stone-100 text-stone-600'
      }`}
    >
      {status}
    </span>
  )
}

function EmptyOrders() {
  return (
    <div className="rounded-3xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-stone-200/70">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#f2e5dc] text-[#7d1e1e]">
        <Receipt className="h-7 w-7" />
      </div>

      <h2 className="mt-6 font-serif text-2xl text-stone-900">
        No orders yet
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-500">
        Your artwork purchases will appear here
        once you place your first order.
      </p>

      <Link
        to="/shop"
        className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#7d1e1e] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#681919]"
      >
        Explore artworks
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}

function OrdersLoading() {
  return (
    <div className="space-y-5">
      {[1, 2].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-3xl bg-white p-7 shadow-sm ring-1 ring-stone-200/70"
        >
          <div className="h-4 w-32 rounded bg-stone-200" />
          <div className="mt-3 h-3 w-48 rounded bg-stone-100" />

          <div className="mt-7 flex gap-4">
            <div className="h-20 w-20 rounded-2xl bg-stone-100" />

            <div className="flex-1">
              <div className="h-4 w-40 rounded bg-stone-100" />
              <div className="mt-3 h-3 w-24 rounded bg-stone-100" />
              <div className="mt-3 h-3 w-16 rounded bg-stone-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function formatDate(value) {
  try {
    return new Date(value).toLocaleDateString(
      'en-IN',
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }
    )
  } catch {
    return ''
  }
}