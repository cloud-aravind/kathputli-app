import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
} from 'lucide-react'


// ============================================================
// STORAGE
// ============================================================

const CART_KEY = 'kathputli-cart'


// ============================================================
// SHIPPING
// ============================================================

const SHIPPING_FEE = 50
const FREE_SHIPPING_THRESHOLD = 2000


// ============================================================
// DISPLAY FONT
// ============================================================

const displayFont = {
  fontFamily: "'Playfair Display', Georgia, serif",
}


// ============================================================
// HELPERS
// ============================================================

function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(price) || 0)
}


// ============================================================
// CART PAGE
// ============================================================

export default function Cart() {
  const navigate = useNavigate()

  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem(CART_KEY) || '[]'
      )
    } catch {
      return []
    }
  })


  // ==========================================================
  // KEEP LOCAL STORAGE IN SYNC
  // ==========================================================

  useEffect(() => {
    localStorage.setItem(
      CART_KEY,
      JSON.stringify(cart)
    )
  }, [cart])


  // ==========================================================
  // CART CALCULATIONS
  // ==========================================================

  const itemCount = useMemo(
    () =>
      cart.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0
      ),
    [cart]
  )

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (total, item) =>
          total +
          Number(item.price || 0) *
            Number(item.quantity || 0),
        0
      ),
    [cart]
  )

  const shipping =
    subtotal >= FREE_SHIPPING_THRESHOLD
      ? 0
      : SHIPPING_FEE

  const total = subtotal + shipping

  const amountForFreeShipping = Math.max(
    FREE_SHIPPING_THRESHOLD - subtotal,
    0
  )

  const shippingProgress = Math.min(
    (subtotal / FREE_SHIPPING_THRESHOLD) * 100,
    100
  )


  // ==========================================================
  // QUANTITY
  // ==========================================================

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(id)
      return
    }

    setCart((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: newQuantity,
            }
          : item
      )
    )
  }


  // ==========================================================
  // REMOVE ITEM
  // ==========================================================

  const removeItem = (id) => {
    const removedItem = cart.find(
      (item) => item.id === id
    )

    setCart((current) =>
      current.filter((item) => item.id !== id)
    )

    if (removedItem) {
      toast.success(
        `${removedItem.title} removed from cart`
      )
    }
  }


  // ==========================================================
  // CLEAR CART
  // ==========================================================

  const clearCart = () => {
    setCart([])
    localStorage.removeItem(CART_KEY)
    toast.success('Cart cleared')
  }


  // ==========================================================
  // EMPTY CART
  // ==========================================================

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#faf9f6] text-[#201b18]">
        <main className="mx-auto flex min-h-[75vh] max-w-4xl items-center justify-center px-6 py-16 sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#f1e7d9] text-[#7d1e1e]">
              <ShoppingBag
                className="h-9 w-9"
                strokeWidth={1.5}
              />
            </div>

            <p className="mt-7 text-sm font-medium uppercase tracking-[0.22em] text-[#a36d16]">
              Your collection
            </p>

            <h1
              style={displayFont}
              className="mt-3 text-4xl font-semibold text-[#201b18] sm:text-5xl"
            >
              Your cart is empty
            </h1>

            <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#746961]">
              Discover original artworks and add the pieces
              that speak to you.
            </p>

            <Link
              to="/shop"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#7d1e1e] px-7 py-3.5 text-sm font-medium text-white transition hover:bg-[#681919]"
            >
              <ShoppingBag className="h-4 w-4" />
              Explore artworks
            </Link>
          </div>
        </main>
      </div>
    )
  }


  // ==========================================================
  // CART
  // ==========================================================

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#201b18]">

      {/* ======================================================
          PAGE HEADER
          ====================================================== */}

      <section className="border-b border-[#e7ddd3] bg-[#faf9f6]">
        <div className="mx-auto max-w-[1500px] px-6 pb-10 pt-10 sm:px-10 lg:px-16">

          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-sm text-[#746961] transition hover:text-[#7d1e1e]"
          >
            <ArrowLeft className="h-4 w-4" />
            Continue shopping
          </Link>

          <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#a36d16]">
                Your collection
              </p>

              <h1
                style={displayFont}
                className="mt-2 text-4xl font-semibold text-[#201b18] sm:text-5xl"
              >
                My Cart ({itemCount})
              </h1>

              <p className="mt-3 text-sm text-[#746961]">
                Review your artworks and proceed to checkout.
              </p>
            </div>

            <button
              type="button"
              onClick={clearCart}
              className="inline-flex items-center gap-2 self-start text-sm font-medium text-[#7d1e1e] transition hover:text-[#5e1616] sm:self-auto"
            >
              <Trash2 className="h-4 w-4" />
              Clear Cart
            </button>

          </div>
        </div>
      </section>


      {/* ======================================================
          MAIN CONTENT
          ====================================================== */}

      <main className="mx-auto max-w-[1500px] px-6 py-10 sm:px-10 lg:px-16 lg:py-14">

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">

          {/* ==================================================
              CART ITEMS
              ================================================== */}

          <section className="min-w-0">

            <div className="overflow-hidden rounded-3xl border border-[#e3d9cf] bg-white">

              {/* Table heading */}

              <div className="hidden grid-cols-[minmax(0,1fr)_110px_150px_110px_32px] gap-5 border-b border-[#e8dfd7] bg-[#fcfaf7] px-6 py-5 text-xs font-medium uppercase tracking-[0.14em] text-[#746961] lg:grid">
                <span>Artwork</span>
                <span>Price</span>
                <span>Quantity</span>
                <span>Total</span>
                <span />
              </div>


              {/* Items */}

              <div>
                {cart.map((item, index) => (
                  <div
                    key={item.id}
                    className={[
                      'p-5 sm:p-6',
                      index !== cart.length - 1
                        ? 'border-b border-[#e8dfd7]'
                        : '',
                    ].join(' ')}
                  >

                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_110px_150px_110px_32px] lg:items-center lg:gap-5">

                      {/* Artwork */}

                      <div className="flex min-w-0 items-start gap-4">

                        <div className="h-24 w-28 shrink-0 overflow-hidden rounded-2xl bg-[#eee7df] sm:h-28 sm:w-36">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="min-w-0 pt-1">

                          <h2
                            style={displayFont}
                            className="text-xl font-semibold leading-tight text-[#201b18] sm:text-[22px]"
                          >
                            {item.title}
                          </h2>

                          <p className="mt-1 text-sm text-[#746961]">
                            by {item.artist}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#746961]">
                            {item.medium && (
                              <span>
                                {item.medium}
                              </span>
                            )}

                            {item.medium && item.dimensions && (
                              <span>•</span>
                            )}

                            {item.dimensions && (
                              <span>
                                {item.dimensions}
                              </span>
                            )}

                            {!item.medium &&
                              !item.dimensions &&
                              item.category && (
                                <span>
                                  {item.category}
                                </span>
                              )}
                          </div>

                          <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-green-700">
                            <span className="h-2 w-2 rounded-full bg-green-600" />
                            In Stock
                          </div>

                        </div>
                      </div>


                      {/* Price */}

                      <div className="flex items-center justify-between lg:block">
                        <span className="text-xs uppercase tracking-[0.12em] text-[#9a8d83] lg:hidden">
                          Price
                        </span>

                        <span className="font-semibold text-[#7d1e1e]">
                          {formatPrice(item.price)}
                        </span>
                      </div>


                      {/* Quantity */}

                      <div className="flex items-center justify-between lg:block">
                        <span className="text-xs uppercase tracking-[0.12em] text-[#9a8d83] lg:hidden">
                          Quantity
                        </span>

                        <div className="inline-flex items-center rounded-xl border border-[#dfd4ca] bg-white">

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                Number(item.quantity) - 1
                              )
                            }
                            className="grid h-10 w-10 place-items-center text-[#746961] transition hover:text-[#7d1e1e]"
                            aria-label={`Decrease quantity of ${item.title}`}
                          >
                            <Minus className="h-4 w-4" />
                          </button>

                          <span className="w-9 text-center text-sm font-medium text-[#201b18]">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                Number(item.quantity) + 1
                              )
                            }
                            className="grid h-10 w-10 place-items-center text-[#746961] transition hover:text-[#7d1e1e]"
                            aria-label={`Increase quantity of ${item.title}`}
                          >
                            <Plus className="h-4 w-4" />
                          </button>

                        </div>
                      </div>


                      {/* Total */}

                      <div className="flex items-center justify-between lg:block">
                        <span className="text-xs uppercase tracking-[0.12em] text-[#9a8d83] lg:hidden">
                          Total
                        </span>

                        <span className="font-semibold text-[#7d1e1e]">
                          {formatPrice(
                            Number(item.price) *
                              Number(item.quantity)
                          )}
                        </span>
                      </div>


                      {/* Remove */}

                      <button
                        type="button"
                        onClick={() =>
                          removeItem(item.id)
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-full text-[#a69a91] transition hover:bg-[#f7ece8] hover:text-[#7d1e1e] lg:justify-self-end"
                        title={`Remove ${item.title}`}
                        aria-label={`Remove ${item.title} from cart`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                    </div>
                  </div>
                ))}
              </div>


              {/* Bottom bar */}

              <div className="flex flex-col gap-5 border-t border-[#e8dfd7] bg-[#fcfaf7] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">

                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#7d1e1e] transition hover:text-[#5e1616]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Continue Shopping
                </Link>

                <div className="flex items-center gap-3 text-sm text-[#746961]">
                  <ShieldCheck className="h-7 w-7 text-[#7d1e1e]" />

                  <div>
                    <p className="font-medium text-[#201b18]">
                      Secure shopping
                    </p>

                    <p className="text-xs text-[#8a7d74]">
                      Your data is protected
                    </p>
                  </div>
                </div>

              </div>

            </div>
          </section>


          {/* ==================================================
              ORDER SUMMARY
              ================================================== */}

          <aside className="xl:sticky xl:top-6 xl:self-start">

            <div className="rounded-3xl border border-[#e3d9cf] bg-white p-6 sm:p-7">

              <h2
                style={displayFont}
                className="text-3xl font-semibold text-[#201b18]"
              >
                Order Summary
              </h2>


              {/* Subtotal */}

              <div className="mt-7 space-y-4 text-sm">

                <div className="flex items-center justify-between">
                  <span className="text-[#746961]">
                    Subtotal ({itemCount}{' '}
                    {itemCount === 1 ? 'item' : 'items'})
                  </span>

                  <span className="font-medium text-[#201b18]">
                    {formatPrice(subtotal)}
                  </span>
                </div>


                <div className="flex items-center justify-between">
                  <span className="text-[#746961]">
                    Shipping
                  </span>

                  <span className="font-medium text-[#201b18]">
                    {shipping === 0
                      ? 'Free'
                      : formatPrice(shipping)}
                  </span>
                </div>

              </div>


              {/* Delivery */}

              <div className="mt-5 flex items-center gap-3 border-b border-[#e8dfd7] pb-6 text-sm text-[#746961]">

                <CalendarDays className="h-5 w-5 shrink-0 text-[#7d1e1e]" />

                <span>
                  Estimated delivery:{' '}
                  <strong className="font-medium text-[#403833]">
                    7–10 Business Days
                  </strong>
                </span>

              </div>


              {/* Total */}

              <div className="flex items-end justify-between pt-6">

                <div>
                  <p className="text-lg font-semibold text-[#201b18]">
                    Total
                  </p>

                  <p className="mt-1 text-xs text-[#8a7d74]">
                    Tax included
                  </p>
                </div>

                <p
                  style={displayFont}
                  className="text-3xl font-semibold text-[#7d1e1e]"
                >
                  {formatPrice(total)}
                </p>

              </div>


              {/* Free shipping progress */}

              <div className="mt-7 rounded-2xl border border-[#eadfd4] bg-[#fbf6ef] p-4">

                <div className="flex items-start gap-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#7d1e1e]">
                    <Truck className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">

                    {shipping === 0 ? (
                      <>
                        <p className="text-sm font-semibold text-[#403833]">
                          Free Shipping unlocked
                        </p>

                        <p className="mt-1 text-xs text-[#746961]">
                          Your order qualifies for free shipping.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-[#403833]">
                          Free Shipping
                        </p>

                        <p className="mt-1 text-xs text-[#746961]">
                          Add{' '}
                          {formatPrice(amountForFreeShipping)}{' '}
                          more to get free shipping.
                        </p>
                      </>
                    )}

                  </div>

                </div>


                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#ddd3ca]">
                  <div
                    className="h-full rounded-full bg-[#7d1e1e] transition-all"
                    style={{
                      width: `${shippingProgress}%`,
                    }}
                  />
                </div>

                <div className="mt-2 flex justify-between text-xs">
                  <span className="font-medium text-[#7d1e1e]">
                    {formatPrice(subtotal)}
                  </span>

                  <span className="text-[#8a7d74]">
                    {formatPrice(
                      FREE_SHIPPING_THRESHOLD
                    )}
                  </span>
                </div>

              </div>


              {/* Checkout */}

              <button
                type="button"
                onClick={() => navigate('/checkout')}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#7d1e1e] px-6 py-4 text-sm font-medium text-white transition hover:bg-[#681919]"
              >
                <ShieldCheck className="h-4 w-4" />
                Proceed to Checkout
              </button>


              {/* Payment reassurance */}

              <div className="mt-5 border-t border-[#e8dfd7] pt-5">

                <div className="flex items-center gap-2 text-xs text-[#746961]">
                  <Check className="h-4 w-4 text-green-700" />
                  Secure checkout
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-[#746961]">
                  <Check className="h-4 w-4 text-green-700" />
                  Authentic artwork from independent artists
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-[#746961]">
                  <Check className="h-4 w-4 text-green-700" />
                  Safe and secure packaging
                </div>

              </div>

            </div>

          </aside>

        </div>


        {/* ====================================================
            VALUE STRIP
            ==================================================== */}

        <section className="mt-10 overflow-hidden rounded-3xl border border-[#e3d9cf] bg-white">

          <div className="grid divide-y divide-[#e8dfd7] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">

            <Feature
              icon={<ShieldCheck className="h-7 w-7" />}
              title="100% Authentic Art"
              description="Original artworks from independent artists."
            />

            <Feature
              icon={<ShoppingBag className="h-7 w-7" />}
              title="Secure Packaging"
              description="Safe and careful packaging for every artwork."
            />

            <Feature
              icon={<ArrowLeft className="h-7 w-7" />}
              title="Easy Returns"
              description="Hassle-free returns within 14 days of delivery."
            />

            <Feature
              icon={<HeartIcon />}
              title="Support Artists"
              description="Every purchase empowers independent artists."
            />

          </div>

        </section>

      </main>

    </div>
  )
}


// ============================================================
// FEATURE
// ============================================================

function Feature({ icon, title, description }) {
  return (
    <div className="flex items-start gap-4 px-6 py-7">

      <div className="shrink-0 text-[#7d1e1e]">
        {icon}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-[#201b18]">
          {title}
        </h3>

        <p className="mt-1 text-xs leading-5 text-[#746961]">
          {description}
        </p>
      </div>

    </div>
  )
}


// ============================================================
// HEART ICON
// ============================================================

function HeartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-7 w-7"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"
      />
    </svg>
  )
}