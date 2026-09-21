import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Heart,
  ShoppingBag,
  Trash2,
} from 'lucide-react'

const WISHLIST_KEY = 'kathputli-wishlist'

export default function Wishlist() {
  const [wishlist, setWishlist] = useState([])

  useEffect(() => {
    try {
      const savedWishlist = localStorage.getItem(WISHLIST_KEY)

      if (savedWishlist) {
        setWishlist(JSON.parse(savedWishlist))
      }
    } catch (error) {
      console.error('Unable to load wishlist:', error)
      setWishlist([])
    }
  }, [])

  const removeFromWishlist = (id) => {
    const updatedWishlist = wishlist.filter(
      (artwork) => artwork.id !== id
    )

    setWishlist(updatedWishlist)
    localStorage.setItem(
      WISHLIST_KEY,
      JSON.stringify(updatedWishlist)
    )
  }

  const moveToCart = (artwork) => {
    try {
      const existingCart = JSON.parse(
        localStorage.getItem('kathputli-cart') || '[]'
      )

      const alreadyInCart = existingCart.some(
        (item) => item.id === artwork.id
      )

      if (!alreadyInCart) {
        const updatedCart = [
          ...existingCart,
          {
            ...artwork,
            quantity: 1,
          },
        ]

        localStorage.setItem(
          'kathputli-cart',
          JSON.stringify(updatedCart)
        )
      }

      removeFromWishlist(artwork.id)
    } catch (error) {
      console.error('Unable to move artwork to cart:', error)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f5ef]">
      {/* Header */}
      <section className="border-b border-stone-200 bg-[#f8f5ef]">
        <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8 lg:px-10">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-sm text-stone-500 transition hover:text-stone-900"
          >
            <ArrowLeft size={16} />
            Continue shopping
          </Link>

          <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-stone-400">
                Your collection
              </p>

              <h1 className="mt-2 font-serif text-4xl text-stone-900 sm:text-5xl">
                Wishlist
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-stone-500">
                Keep the artworks that inspire you close and return to
                them whenever you are ready.
              </p>
            </div>

            {wishlist.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-stone-500">
                <Heart size={16} />
                {wishlist.length}{' '}
                {wishlist.length === 1 ? 'artwork' : 'artworks'}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Wishlist */}
      <main className="mx-auto max-w-7xl px-6 py-10 sm:px-8 lg:px-10 lg:py-14">
        {wishlist.length === 0 ? (
          <section className="flex min-h-[50vh] items-center justify-center">
            <div className="max-w-md text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-stone-400 shadow-sm">
                <Heart size={30} strokeWidth={1.4} />
              </div>

              <h2 className="mt-7 font-serif text-3xl text-stone-900">
                Your wishlist is waiting
              </h2>

              <p className="mt-3 text-sm leading-6 text-stone-500">
                Save artworks you love by clicking the heart icon. Your
                selections will appear here.
              </p>

              <Link
                to="/shop"
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#6f1d2f] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#5b1727]"
              >
                <ShoppingBag size={16} />
                Explore artworks
              </Link>
            </div>
          </section>
        ) : (
          <section>
            <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {wishlist.map((artwork) => (
                <article
                  key={artwork.id}
                  className="group"
                >
                  {/* Image */}
                  <div className="relative overflow-hidden rounded-2xl bg-stone-100">
                    <div className="aspect-[4/3]">
                      <img
                        src={artwork.image}
                        alt={artwork.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        removeFromWishlist(artwork.id)
                      }
                      aria-label={`Remove ${artwork.title} from wishlist`}
                      className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-[#6f1d2f] shadow-sm backdrop-blur transition hover:bg-white"
                    >
                      <Heart
                        size={18}
                        fill="currentColor"
                      />
                    </button>
                  </div>

                  {/* Details */}
                  <div className="mt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="font-serif text-xl text-stone-900">
                          {artwork.title}
                        </h2>

                        <p className="mt-1 text-sm text-stone-500">
                          {artwork.artist}
                        </p>
                      </div>

                      <p className="shrink-0 text-sm font-medium text-stone-900">
                        ₹{Number(artwork.price).toLocaleString('en-IN')}
                      </p>
                    </div>

                    {artwork.category && (
                      <p className="mt-3 text-xs uppercase tracking-[0.16em] text-stone-400">
                        {artwork.category}
                      </p>
                    )}

                    <div className="mt-5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => moveToCart(artwork)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-stone-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-800"
                      >
                        <ShoppingBag size={16} />
                        Move to cart
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          removeFromWishlist(artwork.id)
                        }
                        aria-label={`Remove ${artwork.title}`}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-stone-300 text-stone-500 transition hover:border-stone-400 hover:bg-white hover:text-[#6f1d2f]"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}