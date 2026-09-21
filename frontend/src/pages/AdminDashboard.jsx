import { motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  IndianRupee,
  Images,
  Package,
  Palette,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const stats = [
  {
    label: 'Total artists',
    value: '129',
    detail: 'Active artists',
    Icon: Palette,
  },
  {
    label: 'Total artworks',
    value: '486',
    detail: 'Across all categories',
    Icon: Images,
  },
  {
    label: 'Pending moderation',
    value: '12',
    detail: 'Need your review',
    Icon: Clock3,
    highlight: true,
  },
  {
    label: 'Total orders',
    value: '1,284',
    detail: 'All-time orders',
    Icon: ShoppingBag,
  },
  {
    label: 'Active orders',
    value: '37',
    detail: 'Currently in progress',
    Icon: Package,
  },
  {
    label: 'Revenue',
    value: '₹8.42L',
    detail: 'Total platform revenue',
    Icon: IndianRupee,
  },
]

const pendingArtworks = [
  {
    id: 1,
    title: 'Monsoon Memories',
    artist: 'Ananya Sharma',
    category: 'Paintings',
    price: '₹4,800',
    submitted: '2 hours ago',
    image: '/category-paintings.jpg',
  },
  {
    id: 2,
    title: 'Quiet Mountains',
    artist: 'Rahul Verma',
    category: 'Traditional Art',
    price: '₹6,200',
    submitted: '5 hours ago',
    image: '/category-traditional-art.jpg',
  },
  {
    id: 3,
    title: 'Urban Dreams',
    artist: 'Meera Nair',
    category: 'Digital Art',
    price: '₹3,900',
    submitted: 'Yesterday',
    image: '/category-digital-art.jpg',
  },
]

const recentOrders = [
  {
    id: 'KPT-7A42F91C',
    customer: 'Priya Menon',
    amount: '₹6,450',
    status: 'Artwork Processing',
  },
  {
    id: 'KPT-4D83B21A',
    customer: 'Arjun Kumar',
    amount: '₹2,150',
    status: 'Shipped',
  },
  {
    id: 'KPT-91FC638E',
    customer: 'Neha Rao',
    amount: '₹8,200',
    status: 'Delivered',
  },
  {
    id: 'KPT-52AE104D',
    customer: 'Vikram Shah',
    amount: '₹1,850',
    status: 'Payment Confirmed',
  },
]

const activity = [
  {
    Icon: CheckCircle2,
    title: 'Artwork approved',
    detail: 'Golden Reflections by Bhavya Rao',
    time: '1 hour ago',
  },
  {
    Icon: ShieldCheck,
    title: 'Artist profile verified',
    detail: 'Bhavya Rao',
    time: '3 hours ago',
  },
  {
    Icon: Package,
    title: 'Order shipped',
    detail: 'KPT-4D83B21A',
    time: '5 hours ago',
  },
  {
    Icon: AlertCircle,
    title: 'Artwork submitted',
    detail: 'Monsoon Memories by Ananya Sharma',
    time: '6 hours ago',
  },
]

function StatusBadge({ status }) {
  const styles = {
    'Artwork Processing': 'bg-amber-50 text-amber-700',
    Shipped: 'bg-blue-50 text-blue-700',
    Delivered: 'bg-emerald-50 text-emerald-700',
    'Payment Confirmed': 'bg-violet-50 text-violet-700',
  }

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        styles[status] || 'bg-stone-100 text-stone-600'
      }`}
    >
      {status}
    </span>
  )
}

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#8d2635]">
              Platform Administration
            </p>

            <h1 className="font-serif text-4xl font-medium tracking-tight text-stone-900 sm:text-5xl">
              Admin Dashboard
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-500">
              Monitor the Kathputli marketplace, review artwork submissions,
              and keep the platform running smoothly.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-600 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Platform operational
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {stats.map((stat, index) => {
            const Icon = stat.Icon

            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`rounded-2xl border p-5 shadow-sm ${
                  stat.highlight
                    ? 'border-[#d9a441]/40 bg-[#fffaf0]'
                    : 'border-stone-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`grid h-10 w-10 place-items-center rounded-xl ${
                      stat.highlight
                        ? 'bg-[#8d2635] text-white'
                        : 'bg-[#f5eeea] text-[#8d2635]'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  {stat.highlight && (
                    <span className="rounded-full bg-[#f6e5b5] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#795719]">
                      Action
                    </span>
                  )}
                </div>

                <p className="mt-4 font-serif text-2xl font-semibold text-stone-900">
                  {stat.value}
                </p>

                <p className="mt-1 text-sm font-medium text-stone-700">
                  {stat.label}
                </p>

                <p className="mt-1 text-xs text-stone-400">
                  {stat.detail}
                </p>
              </motion.div>
            )
          })}
        </div>

        {/* Moderation section */}
        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8d2635]">
                Requires attention
              </p>
              <h2 className="mt-1 font-serif text-2xl text-stone-900">
                Artwork moderation
              </h2>
            </div>

            <Link
              to="/admin/moderation"
              className="hidden items-center gap-1 text-sm font-medium text-[#8d2635] transition hover:text-[#6f1d2a] sm:flex"
            >
              Review all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {pendingArtworks.map((artwork, index) => (
              <motion.div
                key={artwork.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.06 }}
                className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                  <img
                    src={artwork.image}
                    alt={artwork.title}
                    className="h-full w-full object-cover"
                  />

                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-amber-700 shadow-sm">
                    Pending review
                  </span>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-serif text-lg text-stone-900">
                        {artwork.title}
                      </h3>
                      <p className="mt-1 text-sm text-stone-500">
                        {artwork.artist}
                      </p>
                    </div>

                    <p className="whitespace-nowrap text-sm font-semibold text-stone-900">
                      {artwork.price}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-stone-400">
                    <span>{artwork.category}</span>
                    <span>{artwork.submitted}</span>
                  </div>

                  <Link
                    to="/admin/moderation"
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#8d2635] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#741f2c]"
                  >
                    Review artwork
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          <Link
            to="/admin/moderation"
            className="mt-4 flex items-center justify-center gap-1 text-sm font-medium text-[#8d2635] sm:hidden"
          >
            Review all pending artworks
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        {/* Orders + activity */}
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {/* Recent orders */}
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
                  Marketplace
                </p>
                <h2 className="mt-1 font-serif text-2xl text-stone-900">
                  Recent orders
                </h2>
              </div>

              <Package className="h-5 w-5 text-[#8d2635]" />
            </div>

            <div className="divide-y divide-stone-100">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-stone-800">
                      {order.id}
                    </p>
                    <p className="mt-1 text-xs text-stone-400">
                      {order.customer}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="text-sm font-semibold text-stone-900">
                      {order.amount}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))}
            </div>

            <Link
              to="/orders"
              className="mt-5 flex items-center justify-center gap-1 border-t border-stone-100 pt-4 text-sm font-medium text-[#8d2635]"
            >
              View orders
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>

          {/* Activity */}
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
                  Platform activity
                </p>
                <h2 className="mt-1 font-serif text-2xl text-stone-900">
                  Recent activity
                </h2>
              </div>

              <TrendingUp className="h-5 w-5 text-[#8d2635]" />
            </div>

            <div className="space-y-5">
              {activity.map((item) => {
                const Icon = item.Icon

                return (
                  <div key={`${item.title}-${item.time}`} className="flex gap-4">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f5eeea] text-[#8d2635]">
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-medium text-stone-800">
                        {item.title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-stone-500">
                        {item.detail}
                      </p>
                      <p className="mt-1 text-[11px] text-stone-400">
                        {item.time}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        {/* Quick actions */}
        <section className="mt-10">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8d2635]">
              Administration
            </p>
            <h2 className="mt-1 font-serif text-2xl text-stone-900">
              Quick actions
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              to="/admin/moderation"
              className="group rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#d9a441]/50 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#f5eeea] text-[#8d2635]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-stone-300 transition group-hover:text-[#8d2635]" />
              </div>

              <h3 className="mt-4 font-medium text-stone-900">
                Review artworks
              </h3>
              <p className="mt-1 text-xs leading-5 text-stone-500">
                Review pending submissions and manage moderation.
              </p>
            </Link>

            <Link
              to="/artist/artworks"
              className="group rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#d9a441]/50 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#f5eeea] text-[#8d2635]">
                  <Images className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-stone-300 transition group-hover:text-[#8d2635]" />
              </div>

              <h3 className="mt-4 font-medium text-stone-900">
                Manage artworks
              </h3>
              <p className="mt-1 text-xs leading-5 text-stone-500">
                Browse artwork inventory and publication status.
              </p>
            </Link>

            <Link
              to="/artists"
              className="group rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#d9a441]/50 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#f5eeea] text-[#8d2635]">
                  <Users className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-stone-300 transition group-hover:text-[#8d2635]" />
              </div>

              <h3 className="mt-4 font-medium text-stone-900">
                View artists
              </h3>
              <p className="mt-1 text-xs leading-5 text-stone-500">
                Review artist profiles and marketplace participation.
              </p>
            </Link>

            <Link
              to="/orders"
              className="group rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#d9a441]/50 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#f5eeea] text-[#8d2635]">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-stone-300 transition group-hover:text-[#8d2635]" />
              </div>

              <h3 className="mt-4 font-medium text-stone-900">
                Monitor orders
              </h3>
              <p className="mt-1 text-xs leading-5 text-stone-500">
                Monitor customer orders and their current lifecycle.
              </p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}