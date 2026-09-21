import { useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Edit3,
  Eye,
  Filter,
  Grid3X3,
  Heart,
  List,
  MoreHorizontal,
  Plus,
  Search,
  Upload,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const artworks = [
  {
    id: 1,
    title: 'Golden Reflections',
    category: 'Paintings',
    collection: 'Nature & Light',
    medium: 'Oil on Canvas',
    price: 650,
    status: 'Published',
    views: 1248,
    likes: 186,
    image: '/bhavya-pic-1.png',
    updated: '2 days ago',
  },
  {
    id: 2,
    title: 'Blooming Peonies',
    category: 'Paintings',
    collection: 'Nature & Light',
    medium: 'Oil on Canvas',
    price: 600,
    status: 'Published',
    views: 982,
    likes: 142,
    image: '/bhavya-pic-2.png',
    updated: '4 days ago',
  },
  {
    id: 3,
    title: 'Mountain Serenity',
    category: 'Paintings',
    collection: 'Nature & Light',
    medium: 'Oil on Canvas',
    price: 580,
    status: 'Published',
    views: 864,
    likes: 119,
    image: '/bhavya-pic-3.png',
    updated: '1 week ago',
  },
  {
    id: 4,
    title: 'City Lights',
    category: 'Paintings',
    collection: 'Contemporary Expressions',
    medium: 'Acrylic on Canvas',
    price: 540,
    status: 'Draft',
    views: 0,
    likes: 0,
    image: '/bhavya-pic-4.png',
    updated: 'Today',
  },
  {
    id: 5,
    title: 'Sunset Hues',
    category: 'Paintings',
    collection: 'Everyday Moments',
    medium: 'Oil on Canvas',
    price: 480,
    status: 'Under Review',
    views: 0,
    likes: 0,
    image: '/bhavya-pic-5.png',
    updated: 'Yesterday',
  },
  {
    id: 6,
    title: 'Wildflowers',
    category: 'Paintings',
    collection: 'Nature & Light',
    medium: 'Oil on Canvas',
    price: 490,
    status: 'Sold',
    views: 1560,
    likes: 218,
    image: '/bhavya-pic-6.png',
    updated: '2 weeks ago',
  },
]

const categories = [
  'All Categories',
  'Paintings',
  'Digital Art',
  'Traditional Art',
  'Famous Artworks',
  'Sculptures',
  'Photography',
]

const statuses = [
  'All Status',
  'Published',
  'Draft',
  'Under Review',
  'Sold',
]

function formatPrice(price) {
  return `₹${price.toLocaleString('en-IN')}`
}

function StatusBadge({ status }) {
  const styles = {
    Published: 'bg-green-50 text-green-700 border-green-200',
    Draft: 'bg-stone-100 text-stone-600 border-stone-200',
    'Under Review': 'bg-amber-50 text-amber-700 border-amber-200',
    Sold: 'bg-[#f7eee9] text-[#741f2b] border-[#ead7cf]',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium ${
        styles[status] || styles.Draft
      }`}
    >
      {status}
    </span>
  )
}

function ArtworkCard({ artwork }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_8px_30px_rgba(58,28,20,0.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_12px_35px_rgba(58,28,20,0.09)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
        <img
          src={artwork.image}
          alt={artwork.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />

        <div className="absolute left-3 top-3">
          <StatusBadge status={artwork.status} />
        </div>

        <button
          type="button"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-stone-500 shadow-sm transition hover:text-[#741f2b]"
          aria-label={`More options for ${artwork.title}`}
        >
          <MoreHorizontal size={17} />
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-stone-900">
              {artwork.title}
            </h3>

            <p className="mt-1 text-xs text-stone-500">
              {artwork.medium}
            </p>
          </div>

          <p className="shrink-0 text-sm font-semibold text-[#741f2b]">
            {formatPrice(artwork.price)}
          </p>
        </div>

        <div className="mt-4 flex items-center gap-4 border-t border-stone-100 pt-3 text-xs text-stone-400">
          <span className="flex items-center gap-1.5">
            <Eye size={14} />
            {artwork.views.toLocaleString('en-IN')}
          </span>

          <span className="flex items-center gap-1.5">
            <Heart size={14} />
            {artwork.likes.toLocaleString('en-IN')}
          </span>

          <span className="ml-auto">
            Updated {artwork.updated}
          </span>
        </div>

        <Link
          to={`/artist/artworks/${artwork.id}/edit`}
          className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-stone-200 py-2.5 text-xs font-medium text-stone-600 transition hover:border-[#cbb2aa] hover:text-[#741f2b]"
        >
          <Edit3 size={14} />
          Edit Artwork
        </Link>
      </div>
    </article>
  )
}

function ArtworkRow({ artwork }) {
  return (
    <div className="group flex items-center gap-4 border-b border-stone-100 px-4 py-4 last:border-b-0 sm:px-5">
      <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-stone-100">
        <img
          src={artwork.image}
          alt={artwork.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-medium text-stone-900">
          {artwork.title}
        </h3>

        <p className="mt-1 text-xs text-stone-500">
          {artwork.category}
          <span className="mx-1.5">•</span>
          {artwork.medium}
        </p>
      </div>

      <div className="hidden w-24 lg:block">
        <StatusBadge status={artwork.status} />
      </div>

      <div className="hidden w-20 text-center lg:block">
        <p className="text-xs text-stone-400">Views</p>
        <p className="mt-1 text-sm text-stone-700">
          {artwork.views.toLocaleString('en-IN')}
        </p>
      </div>

      <div className="hidden w-20 text-center xl:block">
        <p className="text-xs text-stone-400">Likes</p>
        <p className="mt-1 text-sm text-stone-700">
          {artwork.likes.toLocaleString('en-IN')}
        </p>
      </div>

      <div className="w-20 text-right">
        <p className="text-sm font-semibold text-stone-900">
          {formatPrice(artwork.price)}
        </p>
      </div>

      <Link
        to={`/artist/artworks/${artwork.id}/edit`}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone-400 transition hover:bg-[#f7eee9] hover:text-[#741f2b]"
        aria-label={`Edit ${artwork.title}`}
      >
        <Edit3 size={15} />
      </Link>
    </div>
  )
}

export default function ArtworkManagement() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All Categories')
  const [status, setStatus] = useState('All Status')
  const [sortBy, setSortBy] = useState('Recently Updated')
  const [viewMode, setViewMode] = useState('grid')

  const filteredArtworks = useMemo(() => {
    let result = artworks.filter((artwork) => {
      const matchesSearch =
        artwork.title
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        artwork.medium
          .toLowerCase()
          .includes(search.toLowerCase())

      const matchesCategory =
        category === 'All Categories' ||
        artwork.category === category

      const matchesStatus =
        status === 'All Status' ||
        artwork.status === status

      return matchesSearch && matchesCategory && matchesStatus
    })

    if (sortBy === 'Price: Low to High') {
      result = [...result].sort((a, b) => a.price - b.price)
    }

    if (sortBy === 'Price: High to Low') {
      result = [...result].sort((a, b) => b.price - a.price)
    }

    if (sortBy === 'Most Viewed') {
      result = [...result].sort((a, b) => b.views - a.views)
    }

    if (sortBy === 'Most Liked') {
      result = [...result].sort((a, b) => b.likes - a.likes)
    }

    return result
  }, [search, category, status, sortBy])

  return (
    <main className="min-h-screen bg-[#faf8f5] px-4 py-5 text-stone-900 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-7xl">
        {/* Breadcrumb */}
        <div className="mb-7 flex items-center gap-2 text-xs text-stone-400">
          <Link
            to="/"
            className="transition hover:text-[#741f2b]"
          >
            Home
          </Link>

          <ChevronRight size={13} />

          <Link
            to="/artist/dashboard"
            className="transition hover:text-[#741f2b]"
          >
            Artist Dashboard
          </Link>

          <ChevronRight size={13} />

          <span className="text-stone-600">
            My Artworks
          </span>
        </div>

        {/* Header */}
        <section className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#9b6a5d]">
              Artist Studio
            </p>

            <h1 className="mt-2 font-serif text-3xl text-[#3b2020] sm:text-4xl">
              My artworks
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
              Manage your artwork collection, track performance, and
              keep your studio up to date.
            </p>
          </div>

          <Link
            to="/artist/artworks/upload"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#741f2b] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#5f1823]"
          >
            <Plus size={17} />
            Upload Artwork
          </Link>
        </section>

        {/* Summary */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Total Artworks"
            value="129"
            description="Across all collections"
          />

          <SummaryCard
            label="Published"
            value="118"
            description="Currently visible"
          />

          <SummaryCard
            label="Under Review"
            value="4"
            description="Awaiting approval"
          />

          <SummaryCard
            label="Drafts"
            value="7"
            description="Work in progress"
          />
        </section>

        {/* Management Panel */}
        <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_8px_30px_rgba(58,28,20,0.04)]">
          {/* Toolbar */}
          <div className="border-b border-stone-200 p-4 sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              {/* Search */}
              <div className="relative w-full xl:max-w-sm">
                <Search
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search your artworks..."
                  className="w-full rounded-xl border border-stone-200 bg-[#faf8f5] py-3 pl-11 pr-4 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-[#9f6b61] focus:bg-white"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <select
                    value={category}
                    onChange={(event) =>
                      setCategory(event.target.value)
                    }
                    className="appearance-none rounded-xl border border-stone-200 bg-white py-2.5 pl-4 pr-9 text-xs text-stone-600 outline-none transition focus:border-[#9f6b61]"
                  >
                    {categories.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"
                  />
                </div>

                <div className="relative">
                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value)
                    }
                    className="appearance-none rounded-xl border border-stone-200 bg-white py-2.5 pl-4 pr-9 text-xs text-stone-600 outline-none transition focus:border-[#9f6b61]"
                  >
                    {statuses.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"
                  />
                </div>

                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(event) =>
                      setSortBy(event.target.value)
                    }
                    className="appearance-none rounded-xl border border-stone-200 bg-white py-2.5 pl-4 pr-9 text-xs text-stone-600 outline-none transition focus:border-[#9f6b61]"
                  >
                    <option>Recently Updated</option>
                    <option>Price: Low to High</option>
                    <option>Price: High to Low</option>
                    <option>Most Viewed</option>
                    <option>Most Liked</option>
                  </select>

                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"
                  />
                </div>

                <button
                  type="button"
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-stone-200 px-3 text-xs text-stone-600 transition hover:border-[#cbb2aa] hover:text-[#741f2b]"
                >
                  <Filter size={14} />
                  <span className="hidden sm:inline">
                    More Filters
                  </span>
                </button>

                {/* View Toggle */}
                <div className="ml-auto flex rounded-xl border border-stone-200 bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                      viewMode === 'grid'
                        ? 'bg-[#f7eee9] text-[#741f2b]'
                        : 'text-stone-400 hover:text-stone-700'
                    }`}
                    aria-label="Grid view"
                  >
                    <Grid3X3 size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                      viewMode === 'list'
                        ? 'bg-[#f7eee9] text-[#741f2b]'
                        : 'text-stone-400 hover:text-stone-700'
                    }`}
                    aria-label="List view"
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Result Header */}
          <div className="flex items-center justify-between border-b border-stone-100 px-4 py-4 sm:px-5">
            <div>
              <p className="text-sm font-medium text-stone-800">
                {filteredArtworks.length} artworks
              </p>

              {search || category !== 'All Categories' || status !== 'All Status' ? (
                <p className="mt-0.5 text-xs text-stone-400">
                  Filtered results
                </p>
              ) : (
                <p className="mt-0.5 text-xs text-stone-400">
                  Your latest artwork activity
                </p>
              )}
            </div>

            <span className="hidden items-center gap-2 text-xs text-stone-400 sm:flex">
              <span className="h-2 w-2 rounded-full bg-green-600" />
              Studio active
            </span>
          </div>

          {/* Results */}
          {filteredArtworks.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid gap-5 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
                {filteredArtworks.map((artwork) => (
                  <ArtworkCard
                    key={artwork.id}
                    artwork={artwork}
                  />
                ))}
              </div>
            ) : (
              <div>
                {filteredArtworks.map((artwork) => (
                  <ArtworkRow
                    key={artwork.id}
                    artwork={artwork}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f7eee9] text-[#741f2b]">
                <Search size={22} />
              </div>

              <h3 className="mt-4 font-serif text-xl text-stone-800">
                No artworks found
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-6 text-stone-500">
                Try changing your search or filters to find the
                artwork you are looking for.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setCategory('All Categories')
                  setStatus('All Status')
                }}
                className="mt-5 rounded-full border border-stone-200 px-5 py-2.5 text-xs font-medium text-stone-600 transition hover:border-[#741f2b] hover:text-[#741f2b]"
              >
                Clear filters
              </button>
            </div>
          )}
        </section>

        {/* Bottom Note */}
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#e8ddd7] bg-[#f5ece7] px-4 py-4">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[#741f2b]">
            <Upload size={14} />
          </div>

          <div>
            <p className="text-xs font-medium text-[#3b2020]">
              Keep your studio fresh
            </p>

            <p className="mt-1 text-xs leading-5 text-[#75635d]">
              Add new work regularly and keep artwork information
              accurate so collectors can discover and purchase your
              art with confidence.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}


// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({ label, value, description }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_8px_30px_rgba(58,28,20,0.04)]">
      <p className="text-xs text-stone-500">{label}</p>

      <div className="mt-2 flex items-end gap-2">
        <h2 className="font-serif text-2xl text-stone-900">
          {value}
        </h2>
      </div>

      <p className="mt-1 text-[11px] text-stone-400">
        {description}
      </p>
    </div>
  )
}