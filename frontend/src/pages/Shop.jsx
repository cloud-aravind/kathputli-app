import { useEffect, useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Heart,
  ShoppingBag,
  SlidersHorizontal,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { artistsApi } from '../api/artists'
import { artworksApi, mapArtwork } from '../api/artworks'
import { keepValidArtworkRecords, uuidString } from '../api/ids'


// ============================================================
// DISPLAY FONT
// Same serif/display typography used by the Home page
// ============================================================

const displayFont = {
  fontFamily: "'Playfair Display', Georgia, serif",
}


// ============================================================
// STORAGE KEYS
// ============================================================

const WISHLIST_KEY = 'kathputli-wishlist'
const CART_KEY = 'kathputli-cart'
const ITEMS_UPDATED_EVENT = 'kathputli-items-updated'


// ============================================================
// HELPER
// ============================================================

function formatPrice(price, currency = 'INR') {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 0,
    }).format(Number(price) || 0)
  } catch {
    return `${currency || 'INR'} ${Number(price || 0).toLocaleString('en-IN')}`
  }
}

function shopCatalogue(liveArtworks = []) {
  return liveArtworks.filter(Boolean)
}


// ============================================================
// SHOP PAGE
// ============================================================

export default function Shop() {
  const [artworks, setArtworks] = useState(() => shopCatalogue())
  const [selectedCategory, setSelectedCategory] = useState('All Art')
  const [selectedArtists, setSelectedArtists] = useState([])
  const [sortBy, setSortBy] = useState('Featured')
  const [openFilter, setOpenFilter] = useState(null)

  useEffect(() => {
    let active = true
    artworksApi.list()
      .then(async (data) => {
        if (!active) return
        const rows = Array.isArray(data) ? data : (data.artworks || [])
        const mapped = rows.map((row, index) => mapArtwork(row, index))
        const artistIds = [
          ...new Set(mapped.map((item) => item.artist_id).filter(Boolean)),
        ]
        const profiles = await Promise.all(
          artistIds.map(async (artistId) => {
            try {
              const profile = await artistsApi.get(artistId)
              return [artistId, profile]
            } catch {
              return [artistId, null]
            }
          })
        )
        const profileById = Object.fromEntries(profiles)
        const withOwners = mapped.map((artwork) => {
          const profile = artwork.artist_id
            ? profileById[artwork.artist_id]
            : null
          const profileName =
            typeof profile?.name === 'string' ? profile.name.trim() : ''

          return {
            ...artwork,
            artist_id: artwork.artist_id,
            artist: profileName,
          }
        })
        if (active) setArtworks(shopCatalogue(withOwners))
      })
      .catch((error) => {
        if (!active) return
        setArtworks([])
        console.error('Unable to load Kathputli artworks:', error)
        toast.error('Could not load artworks. Please try again later.')
      })
    return () => { active = false }
  }, [])

  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(WISHLIST_KEY) || '[]'
      )
      return keepValidArtworkRecords(saved)
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]')
      const validItems = keepValidArtworkRecords(stored)
      if (Array.isArray(stored) && validItems.length !== stored.length) {
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(validItems))
        window.dispatchEvent(new Event(ITEMS_UPDATED_EVENT))
        toast.error('Unavailable demo artworks were removed from your wishlist.')
      }
    } catch (error) {
      console.error('Unable to normalize saved wishlist:', error)
    }
  }, [])


  // ==========================================================
  // FILTER ARTWORKS
  // ==========================================================

  const filteredArtworks = useMemo(() => {
    let result =
      selectedCategory === 'All Art'
        ? [...artworks]
        : artworks.filter(
            (artwork) => artwork.category === selectedCategory
          )

    if (selectedArtists.length > 0) {
      result = result.filter((artwork) =>
        selectedArtists.includes(artwork.artist_id)
      )
    }


    // ========================================================
    // SORT
    // ========================================================

    if (sortBy === 'Price: Low to High') {
      result.sort((a, b) => a.price - b.price)
    }

    if (sortBy === 'Price: High to Low') {
      result.sort((a, b) => b.price - a.price)
    }

    if (sortBy === 'Newest') {
      result.sort((a, b) => {
        const dateA = new Date(a.created_at || a.createdAt || 0).getTime()
        const dateB = new Date(b.created_at || b.createdAt || 0).getTime()
        return dateB - dateA
      })
    }

    return result
  }, [artworks, selectedCategory, selectedArtists, sortBy])

  const artistOptions = useMemo(() => {
    const seen = new Map()
    artworks.forEach((item) => {
      if (!item.artist_id || seen.has(item.artist_id)) return
      seen.set(item.artist_id, item.artist)
    })
    return [...seen.entries()]
      .filter(([, name]) => name)
      .map(([id, name]) => ({ id, name }))
  }, [artworks])

  const categories = useMemo(() => [
    'All Art',
    ...new Set(artworks.map((artwork) => artwork.category).filter(Boolean)),
  ], [artworks])

  const toggleArtist = (artist) => {
    setSelectedArtists((current) =>
      current.includes(artist)
        ? current.filter((value) => value !== artist)
        : [...current, artist]
    )
  }


  // ==========================================================
  // WISHLIST
  // ==========================================================

  const toggleWishlist = (artwork) => {
    const artworkId = uuidString(artwork?.id)
    const exists = wishlist.some((item) => item.id === artwork?.id)

    if (!exists && !artworkId) {
      toast.error('This demo artwork cannot be saved to your wishlist.')
      return
    }

    setWishlist((current) => {
      const validCurrent = keepValidArtworkRecords(current)
      const updatedWishlist = exists
        ? validCurrent.filter((item) => item.id !== artwork.id)
        : [
            ...validCurrent,
            {
              ...artwork,
              id: artworkId,
            },
          ]

      localStorage.setItem(
        WISHLIST_KEY,
        JSON.stringify(updatedWishlist)
      )
      window.dispatchEvent(new Event(ITEMS_UPDATED_EVENT))

      return updatedWishlist
    })
  }


  // ==========================================================
  // CART
  // ==========================================================

  const addToCart = (artwork) => {
    const artworkId = uuidString(artwork?.id)
    if (!artworkId) {
      toast.error('This demo artwork is not available for checkout.')
      return
    }

    try {
      const currentCart = keepValidArtworkRecords(
        JSON.parse(localStorage.getItem(CART_KEY) || '[]')
      )

      const existingItem = currentCart.find(
        (item) => item.id === artworkId
      )

      let updatedCart

      if (existingItem) {
        updatedCart = currentCart.map((item) =>
          item.id === artworkId
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        )
      } else {
        updatedCart = [
          ...currentCart,
          {
            ...artwork,
            id: artworkId,
            quantity: 1,
          },
        ]
      }

      localStorage.setItem(
        CART_KEY,
        JSON.stringify(updatedCart)
      )
      window.dispatchEvent(new Event(ITEMS_UPDATED_EVENT))

      toast.success(`${artwork.title} added to cart`)
    } catch (error) {
      console.error('Unable to add artwork to cart:', error)
      toast.error('Unable to add artwork to cart')
    }
  }


  // ==========================================================
  // FILTER TOGGLE
  // ==========================================================

  const toggleFilter = (filterName) => {
    setOpenFilter((current) =>
      current === filterName ? null : filterName
    )
  }


  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#201b18]">


      {/* ======================================================
          PAGE INTRODUCTION
          ====================================================== */}

      <section className="border-b border-[#e7ddd3] bg-[#faf9f6]">

        <div className="mx-auto max-w-[1500px] px-6 pb-12 pt-12 sm:px-10 lg:px-16">

          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">

            <div className="max-w-4xl">

              {/* Small label */}

              <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-[#a36d16]">
                Explore the collection
              </p>


              {/* Main Shop Heading */}

              <h1
                style={displayFont}
                className="text-5xl font-semibold leading-[1.05] tracking-[-0.025em] text-[#151515] sm:text-6xl"
              >
                Discover original art
              </h1>


              <p className="mt-5 max-w-3xl text-base leading-7 text-[#716860] sm:text-lg">
                Explore paintings, digital art, traditional works,
                sculptures and more from independent artists.
              </p>

            </div>


            {/* Artwork count */}

            <div className="shrink-0 pb-1 text-sm text-[#716860]">
              {filteredArtworks.length} artworks
            </div>

          </div>

        </div>

      </section>



      {/* ======================================================
          SHOP CONTENT
          ====================================================== */}

      <main className="mx-auto max-w-[1500px] px-6 py-10 sm:px-10 lg:px-16">

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[250px_minmax(0,1fr)]">


          {/* ==================================================
              LEFT SIDEBAR
              ================================================== */}

          <aside className="lg:sticky lg:top-6 lg:self-start">


            {/* Categories */}

            <section>

              <h2
                style={displayFont}
                className="text-2xl font-semibold text-[#201b18]"
              >
                Categories
              </h2>


              <div className="mt-5 space-y-1">

                {categories.map((category) => {

                  const active =
                    selectedCategory === category

                  return (

                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      className={[
                        'group flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left text-sm transition',
                        active
                          ? 'bg-[#f1e7d9] font-medium text-[#7d1e1e]'
                          : 'text-[#403833] hover:bg-[#f7f1ea]',
                      ].join(' ')}
                    >

                      <span>
                        {category}
                      </span>

                      {active && (
                        <ChevronRight
                          className="h-4 w-4"
                        />
                      )}

                    </button>

                  )
                })}

              </div>

            </section>


            {/* Divider */}

            <div className="my-8 h-px bg-[#e5dcd4]" />


            {/* Filters */}

            <section>

              <h2
                style={displayFont}
                className="text-2xl font-semibold text-[#201b18]"
              >
                Filter
              </h2>


              <div className="mt-5 divide-y divide-[#e5dcd4]">


                {/* Price */}

                <button
                  type="button"
                  onClick={() => toggleFilter('price')}
                  className="flex w-full items-center justify-between py-5 text-left"
                >

                  <span className="text-base text-[#403833]">
                    Price
                  </span>

                  <ChevronDown
                    className={[
                      'h-4 w-4 text-[#746961] transition-transform',
                      openFilter === 'price'
                        ? 'rotate-180'
                        : '',
                    ].join(' ')}
                  />

                </button>


                {openFilter === 'price' && (

                  <div className="pb-5 pt-1">

                    <div className="grid grid-cols-2 gap-3">

                      <div>
                        <label className="mb-2 block text-xs text-[#746961]">
                          Minimum
                        </label>

                        <input
                          type="text"
                          placeholder="₹0"
                          className="h-11 w-full rounded-xl border border-[#dfd4ca] bg-white px-3 text-sm outline-none focus:border-[#a51b1b]"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs text-[#746961]">
                          Maximum
                        </label>

                        <input
                          type="text"
                          placeholder="₹5,000+"
                          className="h-11 w-full rounded-xl border border-[#dfd4ca] bg-white px-3 text-sm outline-none focus:border-[#a51b1b]"
                        />
                      </div>

                    </div>

                  </div>

                )}


                {/* Medium */}

                <button
                  type="button"
                  onClick={() => toggleFilter('medium')}
                  className="flex w-full items-center justify-between py-5 text-left"
                >

                  <span className="text-base text-[#403833]">
                    Medium
                  </span>

                  <ChevronDown
                    className={[
                      'h-4 w-4 text-[#746961] transition-transform',
                      openFilter === 'medium'
                        ? 'rotate-180'
                        : '',
                    ].join(' ')}
                  />

                </button>


                {openFilter === 'medium' && (

                  <div className="space-y-3 pb-5 text-sm text-[#635b55]">

                    <label className="flex items-center gap-2">
                      <input type="checkbox" />
                      Oil on Canvas
                    </label>

                    <label className="flex items-center gap-2">
                      <input type="checkbox" />
                      Acrylic on Canvas
                    </label>

                    <label className="flex items-center gap-2">
                      <input type="checkbox" />
                      Watercolor
                    </label>

                  </div>

                )}


                {/* Artist */}

                <button
                  type="button"
                  onClick={() => toggleFilter('artist')}
                  className="flex w-full items-center justify-between py-5 text-left"
                >

                  <span className="text-base text-[#403833]">
                    Artist
                  </span>

                  <ChevronDown
                    className={[
                      'h-4 w-4 text-[#746961] transition-transform',
                      openFilter === 'artist'
                        ? 'rotate-180'
                        : '',
                    ].join(' ')}
                  />

                </button>


                {openFilter === 'artist' && (

                  <div className="space-y-3 pb-5 text-sm text-[#635b55]">

                    {artistOptions.map((artist) => (
                      <label key={artist.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedArtists.includes(artist.id)}
                          onChange={() => toggleArtist(artist.id)}
                        />
                        {artist.name}
                      </label>
                    ))}

                  </div>

                )}

              </div>

            </section>

          </aside>



          {/* ==================================================
              RIGHT — ARTWORK GRID
              ================================================== */}

          <section>


            {/* =================================================
                GRID HEADER
                ================================================= */}

            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

              <div>

                <h2
                  style={displayFont}
                  className="text-3xl font-semibold text-[#201b18]"
                >
                  {selectedCategory}
                </h2>

                <p className="mt-1 text-sm text-[#746961]">
                  {filteredArtworks.length} artworks
                </p>

              </div>


              {/* Sort */}

              <div className="flex items-center gap-3">

                <span className="text-sm text-[#746961]">
                  Sort by
                </span>


                <div className="relative">

                  <select
                    value={sortBy}
                    onChange={(event) =>
                      setSortBy(event.target.value)
                    }
                    className="h-12 min-w-[200px] appearance-none rounded-2xl border border-[#dfd4ca] bg-white px-4 pr-11 text-sm text-[#403833] outline-none transition focus:border-[#a51b1b]"
                  >

                    <option value="Featured">
                      Featured
                    </option>

                    <option value="Newest">
                      Newest
                    </option>

                    <option value="Price: Low to High">
                      Price: Low to High
                    </option>

                    <option value="Price: High to Low">
                      Price: High to Low
                    </option>

                  </select>


                  <ChevronDown
                    className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#746961]"
                  />

                </div>

              </div>

            </div>



            {/* =================================================
                ARTWORK GRID
                ================================================= */}

            {filteredArtworks.length > 0 ? (

              <div className="mt-8 grid grid-cols-1 gap-x-5 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">

                {filteredArtworks.map((artwork) => {

                  const isWishlisted = wishlist.some(
                    (item) => item.id === artwork.id
                  )


                  return (

                    <article
                      key={artwork.id}
                      className="group min-w-0"
                    >


                      {/* Image */}

                      <div className="relative aspect-[4/3] overflow-hidden rounded-[22px] bg-[#eee7df]">

                        <img
                          src={artwork.image}
                          alt={artwork.image_missing ? `Category preview for ${artwork.title}; artwork image unavailable` : artwork.title}
                          className={`h-full w-full object-cover transition duration-500 ${artwork.image_missing ? 'opacity-70' : 'group-hover:scale-[1.025]'}`}
                        />

                        {artwork.image_missing && (
                          <span className="absolute bottom-3 left-3 rounded-full bg-black/70 px-3 py-1.5 text-[11px] font-medium text-white">
                            Category preview · artwork image unavailable
                          </span>
                        )}

                        {/* Wishlist */}

                        <button
                          type="button"
                          aria-label={
                            isWishlisted
                              ? `Remove ${artwork.title} from wishlist`
                              : `Add ${artwork.title} to wishlist`
                          }
                          onClick={() =>
                            toggleWishlist(artwork)
                          }
                          className={[
                            'absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm transition hover:scale-105',
                            isWishlisted
                              ? 'text-[#a51b1b]'
                              : 'text-[#201b18]',
                          ].join(' ')}
                        >

                          <Heart
                            className="h-6 w-6"
                            fill={
                              isWishlisted
                                ? 'currentColor'
                                : 'none'
                            }
                            strokeWidth={1.7}
                          />

                        </button>

                      </div>



                      {/* Artwork information */}

                      <div className="px-1 pt-4">

                        <div className="flex items-start justify-between gap-4">

                          <h3
                            style={displayFont}
                            className="text-[22px] font-semibold leading-tight text-[#201b18]"
                          >
                            {artwork.title}
                          </h3>


                          <span className="shrink-0 text-base font-semibold text-[#171311]">
                            {formatPrice(artwork.price, artwork.currency)}
                          </span>

                        </div>


                        {artwork.credited_name && (
                          <p className="mt-2 text-base text-[#746961]">
                            Credited creator: {artwork.credited_name}
                          </p>
                        )}

                        {artwork.artist && (
                          <p className="mt-1 text-sm text-[#746961]">
                            Artist profile: {artwork.artist}
                          </p>
                        )}


                        <p className="mt-3 text-sm font-medium uppercase tracking-[0.16em] text-[#b17a22]">
                          {artwork.category}
                        </p>


                        {/* Add to Cart */}

                        <button
                          type="button"
                          onClick={() => addToCart(artwork)}
                          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#7d1e1e] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#681919]"
                        >
                          <ShoppingBag className="h-4 w-4" />
                          Add to cart
                        </button>

                      </div>

                    </article>

                  )

                })}

              </div>

            ) : (

              /* =================================================
                 EMPTY STATE
                 ================================================= */

              <div className="mt-10 rounded-3xl border border-[#e3d9cf] bg-white px-6 py-20 text-center">

                <SlidersHorizontal className="mx-auto h-8 w-8 text-[#a68c72]" />

                <h3
                  style={displayFont}
                  className="mt-4 text-2xl font-semibold"
                >
                  No artworks found
                </h3>

                <p className="mt-2 text-sm text-[#746961]">
                  Try selecting another category.
                </p>

              </div>

            )}

          </section>

        </div>

      </main>



      {/* ======================================================
          BOTTOM STORY SECTION
          ====================================================== */}

      <section className="mt-2 border-t border-[#e6d8ca] bg-[#f5e9dd]">

        <div className="mx-auto max-w-4xl px-6 py-16 text-center sm:py-20">

          <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#a36d16]">
            Discover something meaningful
          </p>


          <h2
            style={displayFont}
            className="mt-3 text-4xl font-semibold text-[#201b18] sm:text-5xl"
          >
            Every piece has a story.
          </h2>


          <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-[#746961] sm:text-lg">
            Find original works that bring creativity, culture and
            inspiration into your space.
          </p>

        </div>

      </section>

    </div>
  )
}
