import { useEffect, useMemo, useState } from 'react'
import {
  ChevronRight,
  Edit3,
  Eye,
  Image as ImageIcon,
  MoreHorizontal,
  Plus,
  Upload,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { artistsApi } from '../api/artists'
import { artworksApi, mapArtwork } from '../api/artworks'
import { isUuid } from '../api/ids'

function responseRows(data, key) {
  if (Array.isArray(data)) return data
  return Array.isArray(data?.[key]) ? data[key] : []
}

function formatPrice(price, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency || 'INR',
    maximumFractionDigits: 0,
  }).format(Number(price) || 0)
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_8px_30px_rgba(58,28,20,0.04)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-stone-500">{label}</p>
          <h3 className="mt-2 font-serif text-2xl text-stone-900">{value}</h3>
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
        <img src={artwork.image} alt={artwork.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-medium text-stone-900">{artwork.title}</h4>
        <p className="mt-1 truncate text-xs text-stone-500">{artwork.category || 'Uncategorized'}</p>
      </div>
      <div className="hidden w-28 text-right sm:block">
        <p className="text-sm font-medium text-stone-900">{formatPrice(artwork.price, artwork.currency)}</p>
        <span className={`mt-1 inline-block text-[10px] ${artwork.is_active ? 'text-green-700' : 'text-stone-500'}`}>
          {artwork.is_active ? 'Published' : 'Inactive'}
        </span>
      </div>
      <Link
        to={`/artist/artworks/${artwork.id}/edit`}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
        aria-label={`Edit ${artwork.title}`}
      >
        <MoreHorizontal size={18} />
      </Link>
    </div>
  )
}

export default function ArtistDashboard() {
  const [artist, setArtist] = useState(null)
  const [artworks, setArtworks] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      setLoading(true)
      setLoadError('')
      try {
        const currentArtist = await artistsApi.me()
        const artworkData = await artworksApi.listByArtist(currentArtist.id)
        if (!active) return

        const records = responseRows(artworkData, 'artworks')
          .map((record, index) => mapArtwork(record, index))
          .filter((record) => isUuid(record.id))
        setArtist(currentArtist)
        setArtworks(records)
      } catch (error) {
        if (active) {
          setLoadError(error?.response?.data?.error || 'Could not load your artist profile and artworks.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadDashboard()
    return () => { active = false }
  }, [])

  const publishedCount = useMemo(
    () => artworks.filter((artwork) => artwork.is_active).length,
    [artworks]
  )
  const inactiveCount = artworks.length - publishedCount
  const recentArtworks = artworks.slice(0, 5)
  const initials = (artist?.name || 'Artist')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-900">
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="mb-7 flex items-center gap-2 text-xs text-stone-400">
          <Link to="/" className="transition hover:text-[#741f2b]">Home</Link>
          <ChevronRight size={13} />
          <span className="text-stone-600">Artist Dashboard</span>
        </div>

        <section className="mb-8 flex flex-col gap-5 rounded-3xl border border-[#e8ddd7] bg-[#f5ece7] p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-white bg-[#ead8ce] font-serif text-2xl text-[#741f2b] shadow-sm" aria-hidden="true">
              {initials}
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-[0.18em] text-[#8b5960]">Artist Studio</p>
              <h1 className="font-serif text-3xl text-[#3b2020] sm:text-4xl">
                {artist?.name ? `Welcome back, ${artist.name}` : 'Artist Dashboard'}
              </h1>
              <p className="mt-2 text-sm text-stone-600">Manage your profile and artwork catalogue.</p>
            </div>
          </div>
          <Link to="/artist/artworks/upload" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#741f2b] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#5f1823]">
            <Plus size={17} /> Upload Artwork
          </Link>
        </section>

        {loadError && (
          <div role="alert" className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
            {loadError}
          </div>
        )}

        <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Total artworks" value={loading ? '…' : artworks.length} icon={ImageIcon} />
          <StatCard label="Published" value={loading ? '…' : publishedCount} icon={Eye} />
          <StatCard label="Inactive" value={loading ? '…' : inactiveCount} icon={ImageIcon} />
        </section>

        <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
          <div>
            <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_8px_30px_rgba(58,28,20,0.04)] sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-[#9b6a5d]">Your Studio</p>
                  <h2 className="mt-1 font-serif text-2xl text-stone-900">Recent artworks</h2>
                </div>
                <Link to="/artist/artworks" className="hidden items-center gap-1 text-sm text-[#741f2b] transition hover:underline sm:flex">
                  View all <ChevronRight size={15} />
                </Link>
              </div>

              {loading ? (
                <p className="py-8 text-center text-sm text-stone-500">Loading your artworks…</p>
              ) : loadError ? (
                <p className="py-8 text-center text-sm text-stone-500">Your artwork list is unavailable.</p>
              ) : recentArtworks.length > 0 ? (
                recentArtworks.map((artwork) => <ArtworkRow key={artwork.id} artwork={artwork} />)
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-stone-500">You haven’t uploaded any artworks yet.</p>
                  <Link to="/artist/artworks/upload" className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[#741f2b] hover:underline">
                    <Upload size={15} /> Upload your first artwork
                  </Link>
                </div>
              )}

              <Link to="/artist/artworks" className="mt-4 flex items-center justify-center gap-1 rounded-xl border border-stone-200 py-3 text-sm text-stone-600 transition hover:border-[#cbb2aa] hover:text-[#741f2b] sm:hidden">
                View all artworks <ChevronRight size={15} />
              </Link>
            </section>
          </div>

          <aside>
            <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_8px_30px_rgba(58,28,20,0.04)]">
              <p className="text-xs uppercase tracking-[0.15em] text-[#9b6a5d]">Manage</p>
              <h2 className="mt-1 font-serif text-2xl text-stone-900">Quick actions</h2>
              <div className="mt-5 space-y-2">
                <QuickAction to="/artist/artworks/upload" icon={Upload} title="Upload artwork" description="Add a new piece to your studio" />
                <QuickAction to="/profile" icon={Edit3} title="Edit profile" description="Update your artist information" />
                <QuickAction to="/artists" icon={Eye} title="View public profiles" description="Browse the public artist directory" />
              </div>
            </section>
            <section className="mt-8 rounded-2xl border border-[#e8ddd7] bg-[#f5ece7] p-5">
              <p className="text-xs uppercase tracking-[0.15em] text-[#9b6a5d]">Insights</p>
              <h2 className="mt-1 font-serif text-xl text-[#3b2020]">Catalogue overview</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Sales, views, followers, reviews, and activity are not available from the connected services yet.
              </p>
            </section>
          </aside>
        </div>
      </main>
    </div>
  )
}

function QuickAction({ to, icon: Icon, title, description }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-xl border border-stone-100 p-3 transition hover:border-[#ddc7bf] hover:bg-[#fcf8f6]">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f7eee9] text-[#741f2b]">
        <Icon size={17} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-stone-800">{title}</p>
        <p className="text-xs text-stone-400">{description}</p>
      </div>
      <ChevronRight size={15} className="text-stone-400" />
    </Link>
  )
}
