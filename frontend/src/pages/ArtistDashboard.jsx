import {
  BarChart3,
  Bell,
  ChevronRight,
  Edit3,
  Eye,
  Heart,
  Image as ImageIcon,
  IndianRupee,
  MoreHorizontal,
  Plus,
  ShoppingBag,
  Star,
  Upload,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const stats = [
  {
    label: 'Total Artworks',
    value: '129',
    change: '+8 this month',
    icon: ImageIcon,
  },
  {
    label: 'Profile Views',
    value: '12.4K',
    change: '+18.6%',
    icon: Eye,
  },
  {
    label: 'Total Sales',
    value: '₹48,650',
    change: '+12.4%',
    icon: IndianRupee,
  },
  {
    label: 'Followers',
    value: '2.5K',
    change: '+124 this month',
    icon: Users,
  },
]

const artworks = [
  {
    id: 1,
    title: 'Golden Reflections',
    category: 'Paintings',
    price: '₹650',
    status: 'Published',
    views: '1,248',
    likes: '186',
    image: '/bhavya-pic-1.png',
  },
  {
    id: 2,
    title: 'Blooming Peonies',
    category: 'Paintings',
    price: '₹600',
    status: 'Published',
    views: '982',
    likes: '142',
    image: '/bhavya-pic-2.png',
  },
  {
    id: 3,
    title: 'Mountain Serenity',
    category: 'Paintings',
    price: '₹580',
    status: 'Published',
    views: '864',
    likes: '119',
    image: '/bhavya-pic-3.png',
  },
  {
    id: 4,
    title: 'City Lights',
    category: 'Paintings',
    price: '₹540',
    status: 'Draft',
    views: '—',
    likes: '—',
    image: '/bhavya-pic-4.png',
  },
]

const recentActivity = [
  {
    icon: ShoppingBag,
    title: 'New artwork order',
    description: 'Golden Reflections was purchased',
    time: '2 hours ago',
  },
  {
    icon: Heart,
    title: 'Artwork liked',
    description: 'Blooming Peonies received 12 new likes',
    time: '5 hours ago',
  },
  {
    icon: Users,
    title: 'New followers',
    description: '18 people started following you',
    time: 'Yesterday',
  },
  {
    icon: Star,
    title: 'New review',
    description: 'Your artwork received a 5-star review',
    time: 'Yesterday',
  },
]

function StatCard({ stat }) {
  const Icon = stat.icon

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_8px_30px_rgba(58,28,20,0.04)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-stone-500">{stat.label}</p>
          <h3 className="mt-2 font-serif text-2xl text-stone-900">
            {stat.value}
          </h3>
          <p className="mt-1 text-xs text-green-700">{stat.change}</p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f7eee9] text-[#741f2b]">
          <Icon size={19} strokeWidth={1.7} />
        </div>
      </div>
    </div>
  )
}

function ArtworkRow({ artwork }) {
  return (
    <div className="group flex items-center gap-4 border-b border-stone-100 py-4 last:border-b-0">
      <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-stone-100">
        <img
          src={artwork.image}
          alt={artwork.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>

      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-medium text-stone-900">
          {artwork.title}
        </h4>
        <p className="mt-1 text-xs text-stone-500">{artwork.category}</p>
      </div>

      <div className="hidden w-20 text-center sm:block">
        <p className="text-xs text-stone-400">Views</p>
        <p className="mt-1 text-sm text-stone-700">{artwork.views}</p>
      </div>

      <div className="hidden w-20 text-center md:block">
        <p className="text-xs text-stone-400">Likes</p>
        <p className="mt-1 text-sm text-stone-700">{artwork.likes}</p>
      </div>

      <div className="w-20 text-right">
        <p className="text-sm font-medium text-stone-900">{artwork.price}</p>
        <span
          className={`mt-1 inline-block text-[10px] ${
            artwork.status === 'Published'
              ? 'text-green-700'
              : 'text-amber-700'
          }`}
        >
          {artwork.status}
        </span>
      </div>

      <button
        type="button"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
        aria-label={`More options for ${artwork.title}`}
      >
        <MoreHorizontal size={18} />
      </button>
    </div>
  )
}

export default function ArtistDashboard() {
  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-900">
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        {/* Breadcrumb */}
        <div className="mb-7 flex items-center gap-2 text-xs text-stone-400">
          <Link to="/" className="transition hover:text-[#741f2b]">
            Home
          </Link>
          <ChevronRight size={13} />
          <span className="text-stone-600">Artist Dashboard</span>
        </div>

        {/* Welcome Header */}
        <section className="mb-8 flex flex-col gap-5 rounded-3xl border border-[#e8ddd7] bg-[#f5ece7] p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-white shadow-sm">
              <img
                src="/bhavya-rao-profile.png"
                alt="Bhavya Rao"
                className="h-full w-full object-cover"
              />
            </div>

            <div>
              <p className="mb-1 text-xs uppercase tracking-[0.18em] text-[#8b5960]">
                Artist Studio
              </p>
              <h1 className="font-serif text-3xl text-[#3b2020] sm:text-4xl">
                Welcome back, Bhavya
              </h1>
              <p className="mt-2 text-sm text-stone-600">
                Here's what's happening with your art today.
              </p>
            </div>
          </div>

          <Link
            to="/artist/artworks/upload"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#741f2b] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#5f1823]"
          >
            <Plus size={17} />
            Upload Artwork
          </Link>
        </section>

        {/* Stats */}
        <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </section>

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Artwork Management */}
            <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_8px_30px_rgba(58,28,20,0.04)] sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-[#9b6a5d]">
                    Your Studio
                  </p>
                  <h2 className="mt-1 font-serif text-2xl text-stone-900">
                    Recent artworks
                  </h2>
                </div>

                <Link
                  to="/artist/artworks"
                  className="hidden items-center gap-1 text-sm text-[#741f2b] transition hover:underline sm:flex"
                >
                  View all
                  <ChevronRight size={15} />
                </Link>
              </div>

              <div>
                {artworks.map((artwork) => (
                  <ArtworkRow key={artwork.id} artwork={artwork} />
                ))}
              </div>

              <Link
                to="/artist/artworks"
                className="mt-4 flex items-center justify-center gap-1 rounded-xl border border-stone-200 py-3 text-sm text-stone-600 transition hover:border-[#cbb2aa] hover:text-[#741f2b] sm:hidden"
              >
                View all artworks
                <ChevronRight size={15} />
              </Link>
            </section>

            {/* Performance */}
            <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_8px_30px_rgba(58,28,20,0.04)] sm:p-6">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-[#9b6a5d]">
                    Overview
                  </p>
                  <h2 className="mt-1 font-serif text-2xl text-stone-900">
                    Artwork performance
                  </h2>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f7eee9] text-[#741f2b]">
                  <BarChart3 size={19} strokeWidth={1.7} />
                </div>
              </div>

              <div className="flex h-52 items-end gap-3 border-b border-stone-100 px-2">
                {[38, 55, 48, 72, 61, 82, 68, 91, 76, 96, 84, 100].map(
                  (height, index) => (
                    <div
                      key={index}
                      className="flex flex-1 items-end justify-center"
                    >
                      <div
                        className="w-full max-w-9 rounded-t-md bg-[#d8b7ac] transition hover:bg-[#741f2b]"
                        style={{ height: `${height}%` }}
                        title={`Week ${index + 1}`}
                      />
                    </div>
                  ),
                )}
              </div>

              <div className="mt-3 flex justify-between px-1 text-[10px] text-stone-400">
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
                <span>Jul</span>
                <span>Aug</span>
              </div>
            </section>
          </div>

          {/* Right Column */}
          <aside className="space-y-8">
            {/* Quick Actions */}
            <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_8px_30px_rgba(58,28,20,0.04)]">
              <p className="text-xs uppercase tracking-[0.15em] text-[#9b6a5d]">
                Manage
              </p>

              <h2 className="mt-1 font-serif text-2xl text-stone-900">
                Quick actions
              </h2>

              <div className="mt-5 space-y-2">
                <Link
                  to="/artist/artworks/upload"
                  className="flex items-center gap-3 rounded-xl border border-stone-100 p-3 transition hover:border-[#ddc7bf] hover:bg-[#fcf8f6]"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f7eee9] text-[#741f2b]">
                    <Upload size={17} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-stone-800">
                      Upload artwork
                    </p>
                    <p className="text-xs text-stone-400">
                      Add a new piece to your studio
                    </p>
                  </div>
                  <ChevronRight size={15} className="text-stone-400" />
                </Link>

                <Link
                  to="/profile"
                  className="flex items-center gap-3 rounded-xl border border-stone-100 p-3 transition hover:border-[#ddc7bf] hover:bg-[#fcf8f6]"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f7eee9] text-[#741f2b]">
                    <Edit3 size={17} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-stone-800">
                      Edit profile
                    </p>
                    <p className="text-xs text-stone-400">
                      Update your artist information
                    </p>
                  </div>
                  <ChevronRight size={15} className="text-stone-400" />
                </Link>

                <Link
                  to="/artists"
                  className="flex items-center gap-3 rounded-xl border border-stone-100 p-3 transition hover:border-[#ddc7bf] hover:bg-[#fcf8f6]"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f7eee9] text-[#741f2b]">
                    <Eye size={17} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-stone-800">
                      View public profile
                    </p>
                    <p className="text-xs text-stone-400">
                      See how visitors view your profile
                    </p>
                  </div>
                  <ChevronRight size={15} className="text-stone-400" />
                </Link>
              </div>
            </section>

            {/* Recent Activity */}
            <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_8px_30px_rgba(58,28,20,0.04)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-[#9b6a5d]">
                    Activity
                  </p>
                  <h2 className="mt-1 font-serif text-2xl text-stone-900">
                    Recent updates
                  </h2>
                </div>

                <Bell size={18} className="text-stone-400" />
              </div>

              <div className="mt-5 space-y-5">
                {recentActivity.map((activity, index) => {
                  const Icon = activity.icon

                  return (
                    <div key={index} className="flex gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f7eee9] text-[#741f2b]">
                        <Icon size={16} strokeWidth={1.7} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-medium text-stone-800">
                          {activity.title}
                        </p>
                        <p className="mt-0.5 text-xs leading-5 text-stone-500">
                          {activity.description}
                        </p>
                        <p className="mt-1 text-[10px] text-stone-400">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Artist Rating */}
            <section className="rounded-2xl bg-[#3b2020] p-6 text-white shadow-[0_12px_35px_rgba(59,32,32,0.12)]">
              <div className="flex items-center gap-2">
                <Star
                  size={18}
                  fill="currentColor"
                  className="text-[#d8b58d]"
                />
                <span className="text-sm text-[#ead8ce]">Artist rating</span>
              </div>

              <div className="mt-3 flex items-end gap-2">
                <span className="font-serif text-4xl">4.9</span>
                <span className="mb-1 text-sm text-[#cdb9b1]">
                  / 5.0
                </span>
              </div>

              <p className="mt-2 text-xs leading-5 text-[#cdb9b1]">
                Based on 128 reviews from collectors and art lovers.
              </p>

              <Link
                to="/artists"
                className="mt-5 inline-flex items-center gap-1 text-sm text-[#ead8ce] transition hover:text-white"
              >
                View reviews
                <ChevronRight size={15} />
              </Link>
            </section>
          </aside>
        </div>
      </main>
    </div>
  )
}