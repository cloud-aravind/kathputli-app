import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  Filter,
  Image as ImageIcon,
  Palette,
  Search,
  ShieldCheck,
  X,
  XCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'

const initialArtworks = [
  {
    id: 1,
    title: 'Golden Reflections',
    artist: 'Bhavya Rao',
    category: 'Paintings',
    medium: 'Acrylic on Canvas',
    price: 650,
    submitted: '2 hours ago',
    submittedDate: 'Sep 3, 2026',
    status: 'Under Review',
    image: '/bhavya-pic-1.png',
    description:
      'A contemporary painting exploring warm golden light, reflections, and the quiet beauty found in everyday moments.',
  },
  {
    id: 2,
    title: 'Blooming Peonies',
    artist: 'Bhavya Rao',
    category: 'Paintings',
    medium: 'Acrylic on Canvas',
    price: 600,
    submitted: '5 hours ago',
    submittedDate: 'Sep 3, 2026',
    status: 'Under Review',
    image: '/bhavya-pic-2.png',
    description:
      'A floral composition celebrating the softness, colour, and natural rhythm of blooming peonies.',
  },
  {
    id: 3,
    title: 'Mountain Serenity',
    artist: 'Bhavya Rao',
    category: 'Paintings',
    medium: 'Acrylic on Canvas',
    price: 580,
    submitted: 'Yesterday',
    submittedDate: 'Sep 2, 2026',
    status: 'Under Review',
    image: '/bhavya-pic-3.png',
    description:
      'A peaceful landscape inspired by mountain forms, open skies, and the stillness of nature.',
  },
  {
    id: 4,
    title: 'City Lights',
    artist: 'Bhavya Rao',
    category: 'Paintings',
    medium: 'Acrylic on Canvas',
    price: 540,
    submitted: 'Yesterday',
    submittedDate: 'Sep 2, 2026',
    status: 'Under Review',
    image: '/bhavya-pic-4.png',
    description:
      'A contemporary urban composition capturing the atmosphere, movement, and glow of a city after sunset.',
  },
  {
    id: 5,
    title: 'Sunset Hues',
    artist: 'Bhavya Rao',
    category: 'Paintings',
    medium: 'Acrylic on Canvas',
    price: 480,
    submitted: '2 days ago',
    submittedDate: 'Sep 1, 2026',
    status: 'Under Review',
    image: '/bhavya-pic-5.png',
    description:
      'A warm landscape study built around the changing colours and light of a peaceful sunset.',
  },
  {
    id: 6,
    title: 'Wildflowers',
    artist: 'Bhavya Rao',
    category: 'Paintings',
    medium: 'Acrylic on Canvas',
    price: 490,
    submitted: '2 days ago',
    submittedDate: 'Sep 1, 2026',
    status: 'Under Review',
    image: '/bhavya-pic-6.png',
    description:
      'A vibrant floral artwork inspired by the organic forms and colours of wildflowers.',
  },
]

const statusStyles = {
  'Under Review': 'bg-amber-50 text-amber-700 border-amber-200',
  Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejected: 'bg-red-50 text-red-700 border-red-200',
}

function formatPrice(value) {
  return `₹${Number(value).toLocaleString('en-IN')}`
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
        statusStyles[status] || 'border-stone-200 bg-stone-50 text-stone-600'
      }`}
    >
      {status === 'Under Review' && <Clock3 className="h-3.5 w-3.5" />}
      {status === 'Approved' && <CheckCircle2 className="h-3.5 w-3.5" />}
      {status === 'Rejected' && <XCircle className="h-3.5 w-3.5" />}
      {status}
    </span>
  )
}

export default function ArtworkModeration() {
  const [artworks, setArtworks] = useState(initialArtworks)
  const [selectedArtwork, setSelectedArtwork] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [rejecting, setRejecting] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const categories = useMemo(
    () => ['All', ...new Set(artworks.map((artwork) => artwork.category))],
    [artworks]
  )

  const filteredArtworks = useMemo(() => {
    const query = search.trim().toLowerCase()

    return artworks.filter((artwork) => {
      const matchesSearch =
        !query ||
        artwork.title.toLowerCase().includes(query) ||
        artwork.artist.toLowerCase().includes(query)

      const matchesStatus =
        statusFilter === 'All' || artwork.status === statusFilter

      const matchesCategory =
        categoryFilter === 'All' || artwork.category === categoryFilter

      return matchesSearch && matchesStatus && matchesCategory
    })
  }, [artworks, search, statusFilter, categoryFilter])

  const pendingCount = artworks.filter(
    (artwork) => artwork.status === 'Under Review'
  ).length

  function approveArtwork(id) {
    setArtworks((current) =>
      current.map((artwork) =>
        artwork.id === id ? { ...artwork, status: 'Approved' } : artwork
      )
    )

    setSelectedArtwork(null)
    toast.success('Artwork approved successfully')
  }

  function rejectArtwork(id) {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    setArtworks((current) =>
      current.map((artwork) =>
        artwork.id === id
          ? {
              ...artwork,
              status: 'Rejected',
              rejectionReason: rejectionReason.trim(),
            }
          : artwork
      )
    )

    setSelectedArtwork(null)
    setRejecting(false)
    setRejectionReason('')
    toast.success('Artwork rejected')
  }

  function openReview(artwork) {
    setSelectedArtwork(artwork)
    setRejecting(false)
    setRejectionReason('')
  }

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/admin"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-stone-500 transition hover:text-[#8d2635]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to admin dashboard
          </Link>

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#8d2635]">
                Content moderation
              </p>

              <h1 className="font-serif text-4xl font-medium tracking-tight text-stone-900 sm:text-5xl">
                Artwork Moderation
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-500">
                Review artist submissions before they become available in the
                Kathputli marketplace.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-[#d9a441]/40 bg-[#fffaf0] px-4 py-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#8d2635] text-white">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs text-stone-500">Awaiting review</p>

                <p className="text-lg font-semibold text-stone-900">
                  {pendingCount} artworks
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
            <div className="flex items-center gap-3">
              <Clock3 className="h-5 w-5 text-amber-700" />

              <div>
                <p className="text-2xl font-semibold text-stone-900">
                  {pendingCount}
                </p>

                <p className="text-sm text-stone-500">
                  Pending review
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-700" />

              <div>
                <p className="text-2xl font-semibold text-stone-900">
                  {
                    artworks.filter(
                      (artwork) => artwork.status === 'Approved'
                    ).length
                  }
                </p>

                <p className="text-sm text-stone-500">
                  Approved
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50/70 p-5">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-700" />

              <div>
                <p className="text-2xl font-semibold text-stone-900">
                  {
                    artworks.filter(
                      (artwork) => artwork.status === 'Rejected'
                    ).length
                  }
                </p>

                <p className="text-sm text-stone-500">
                  Rejected
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search artwork or artist..."
                className="h-11 w-full rounded-xl border border-stone-200 bg-[#faf8f5] pl-10 pr-4 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-[#8d2635] focus:ring-2 focus:ring-[#8d2635]/10"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="h-11 min-w-[170px] appearance-none rounded-xl border border-stone-200 bg-white pl-10 pr-9 text-sm text-stone-700 outline-none focus:border-[#8d2635]"
                >
                  <option value="All">All statuses</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="h-11 min-w-[170px] rounded-xl border border-stone-200 bg-white px-4 text-sm text-stone-700 outline-none focus:border-[#8d2635]"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === 'All' ? 'All categories' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Artwork list */}
        {filteredArtworks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#f5eeea] text-[#8d2635]">
              <ImageIcon className="h-6 w-6" />
            </div>

            <h2 className="mt-4 font-serif text-2xl text-stone-900">
              No artworks found
            </h2>

            <p className="mt-2 text-sm text-stone-500">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredArtworks.map((artwork, index) => (
              <motion.article
                key={artwork.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                  <img
                    src={artwork.image}
                    alt={artwork.title}
                    className="h-full w-full object-cover transition duration-500 hover:scale-[1.02]"
                  />

                  <div className="absolute left-3 top-3">
                    <StatusBadge status={artwork.status} />
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="truncate font-serif text-xl text-stone-900">
                        {artwork.title}
                      </h2>

                      <p className="mt-1 text-sm text-stone-500">
                        by {artwork.artist}
                      </p>
                    </div>

                    <p className="whitespace-nowrap text-sm font-semibold text-stone-900">
                      {formatPrice(artwork.price)}
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl bg-[#faf8f5] p-3">
                      <p className="text-stone-400">
                        Category
                      </p>

                      <p className="mt-1 font-medium text-stone-700">
                        {artwork.category}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#faf8f5] p-3">
                      <p className="text-stone-400">
                        Medium
                      </p>

                      <p className="mt-1 truncate font-medium text-stone-700">
                        {artwork.medium}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-stone-400">
                    <span>
                      Submitted {artwork.submitted}
                    </span>

                    {artwork.status === 'Under Review' && (
                      <span className="font-medium text-amber-700">
                        Needs review
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => openReview(artwork)}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:border-[#8d2635] hover:text-[#8d2635]"
                  >
                    <Eye className="h-4 w-4" />
                    Review artwork
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        )}

        {/* Review modal */}
        {selectedArtwork && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 p-4 backdrop-blur-sm">
            <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-[#faf8f5] shadow-2xl">
              {/* Modal header */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-[#faf8f5]/95 px-5 py-4 backdrop-blur sm:px-7">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d2635]">
                    Artwork review
                  </p>

                  <h2 className="mt-1 font-serif text-2xl text-stone-900">
                    {selectedArtwork.title}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedArtwork(null)}
                  className="grid h-10 w-10 place-items-center rounded-full border border-stone-200 bg-white text-stone-500 transition hover:text-stone-900"
                  aria-label="Close review"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid gap-7 p-5 sm:p-7 lg:grid-cols-[1.05fr_0.95fr]">
                {/* Artwork preview */}
                <div>
                  <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
                    <div className="aspect-[4/3] overflow-hidden bg-stone-100">
                      <img
                        src={selectedArtwork.image}
                        alt={selectedArtwork.title}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.15em] text-stone-400">
                            Artwork
                          </p>

                          <h3 className="mt-1 font-serif text-2xl text-stone-900">
                            {selectedArtwork.title}
                          </h3>
                        </div>

                        <StatusBadge status={selectedArtwork.status} />
                      </div>

                      <p className="mt-4 text-sm leading-6 text-stone-600">
                        {selectedArtwork.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Review details */}
                <div>
                  <div className="rounded-2xl border border-stone-200 bg-white p-5">
                    <div className="flex items-center gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-full bg-[#f5eeea] text-[#8d2635]">
                        <Palette className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-xs text-stone-400">
                          Artist
                        </p>

                        <p className="font-medium text-stone-900">
                          {selectedArtwork.artist}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-[#faf8f5] p-3">
                        <p className="text-xs text-stone-400">
                          Category
                        </p>

                        <p className="mt-1 text-sm font-medium text-stone-800">
                          {selectedArtwork.category}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#faf8f5] p-3">
                        <p className="text-xs text-stone-400">
                          Medium
                        </p>

                        <p className="mt-1 text-sm font-medium text-stone-800">
                          {selectedArtwork.medium}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#faf8f5] p-3">
                        <p className="text-xs text-stone-400">
                          Price
                        </p>

                        <p className="mt-1 text-sm font-medium text-stone-800">
                          {formatPrice(selectedArtwork.price)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#faf8f5] p-3">
                        <p className="text-xs text-stone-400">
                          Submitted
                        </p>

                        <p className="mt-1 text-sm font-medium text-stone-800">
                          {selectedArtwork.submittedDate}
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedArtwork.status === 'Under Review' ? (
                    <div className="mt-5 rounded-2xl border border-stone-200 bg-white p-5">
                      {!rejecting ? (
                        <>
                          <div>
                            <h3 className="font-serif text-xl text-stone-900">
                              Moderation decision
                            </h3>

                            <p className="mt-1 text-sm leading-6 text-stone-500">
                              Approve the artwork to publish it in the
                              marketplace, or reject it with a reason for the
                              artist.
                            </p>
                          </div>

                          <div className="mt-5 grid gap-3 sm:grid-cols-2">
                            <button
                              type="button"
                              onClick={() =>
                                approveArtwork(selectedArtwork.id)
                              }
                              className="flex items-center justify-center gap-2 rounded-xl bg-[#8d2635] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#741f2c]"
                            >
                              <Check className="h-4 w-4" />
                              Approve artwork
                            </button>

                            <button
                              type="button"
                              onClick={() => setRejecting(true)}
                              className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 transition hover:bg-red-100"
                            >
                              <X className="h-4 w-4" />
                              Reject artwork
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <h3 className="font-serif text-xl text-stone-900">
                            Reject artwork
                          </h3>

                          <p className="mt-1 text-sm leading-6 text-stone-500">
                            Provide a reason that can be shared with the
                            artist.
                          </p>

                          <textarea
                            value={rejectionReason}
                            onChange={(event) =>
                              setRejectionReason(event.target.value)
                            }
                            rows={5}
                            placeholder="Enter the reason for rejection..."
                            className="mt-4 w-full resize-none rounded-xl border border-stone-200 bg-[#faf8f5] px-4 py-3 text-sm text-stone-800 outline-none placeholder:text-stone-400 focus:border-[#8d2635] focus:ring-2 focus:ring-[#8d2635]/10"
                          />

                          <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setRejecting(false)
                                setRejectionReason('')
                              }}
                              className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-600 transition hover:text-stone-900"
                            >
                              Cancel
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                rejectArtwork(selectedArtwork.id)
                              }
                              className="flex items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-800"
                            >
                              <X className="h-4 w-4" />
                              Confirm rejection
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="mt-5 rounded-2xl border border-stone-200 bg-white p-5">
                      <div className="flex items-center gap-3">
                        {selectedArtwork.status === 'Approved' ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}

                        <div>
                          <p className="text-sm font-medium text-stone-900">
                            This artwork has already been{' '}
                            {selectedArtwork.status.toLowerCase()}.
                          </p>

                          {selectedArtwork.rejectionReason && (
                            <p className="mt-2 text-sm leading-6 text-stone-500">
                              Reason: {selectedArtwork.rejectionReason}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-5 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setSelectedArtwork(null)}
                      className="text-sm font-medium text-stone-500 transition hover:text-stone-900"
                    >
                      Close review
                    </button>

                    <Link
                      to="/artists"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-[#8d2635]"
                    >
                      View artists
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}