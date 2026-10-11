import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ordersApi } from '../api/orders'
import { paymentsApi } from '../api/payments'
import { normalizeOrder } from '../api/orderFormat'
import { useAuth } from '../store/AuthContext'
import {
  ArrowLeft,
  Check,
  ChevronRight,
  CreditCard,
  MapPin,
  ShieldCheck,
  Truck,
} from 'lucide-react'

const CART_KEY = 'kathputli-cart'

const SHIPPING_FEE = 50
const FREE_SHIPPING_THRESHOLD = 2000

const INITIAL_ADDRESS = {
  fullName: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
}

export default function Checkout() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const [cart, setCart] = useState([])
  const [cartLoaded, setCartLoaded] = useState(false)
  const [address, setAddress] = useState(INITIAL_ADDRESS)
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderId, setOrderId] = useState('')

  /*
   * Load the persisted artwork cart before deciding whether
   * the user should remain on Checkout or return to Cart.
   */
  useEffect(() => {
    try {
      const storedCart = JSON.parse(
        localStorage.getItem(CART_KEY) || '[]'
      )

      setCart(Array.isArray(storedCart) ? storedCart : [])
    } catch {
      setCart([])
    } finally {
      setCartLoaded(true)
    }
  }, [])

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (total, item) =>
          total +
          Number(item.price || 0) *
            Number(item.quantity || 1),
        0
      ),
    [cart]
  )

  const shipping =
    subtotal === 0
      ? 0
      : subtotal >= FREE_SHIPPING_THRESHOLD
        ? 0
        : SHIPPING_FEE

  const total = subtotal + shipping

  const itemCount = cart.reduce(
    (total, item) =>
      total + Number(item.quantity || 1),
    0
  )

  /*
   * Only redirect after the cart has actually been loaded
   * from localStorage.
   */
  useEffect(() => {
    if (
      cartLoaded &&
      cart.length === 0 &&
      !orderPlaced
    ) {
      navigate('/cart', { replace: true })
    }
  }, [
    cartLoaded,
    cart.length,
    navigate,
    orderPlaced,
  ])

  const updateAddress = (field, value) => {
    setAddress((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const isAddressComplete =
    address.fullName.trim() &&
    address.phone.trim() &&
    address.address.trim() &&
    address.city.trim() &&
    address.state.trim() &&
    address.pincode.trim()

  const placeOrder = async (event) => {
    event.preventDefault()

    if (!isAddressComplete) {
      toast.error(
        'Please complete your shipping address.'
      )
      return
    }

    if (cart.length === 0) {
      toast.error('Your cart is empty.')
      navigate('/cart')
      return
    }

    setIsSubmitting(true)

    if (!isAuthenticated) {
      toast.error('Please sign in before placing an order.')
      navigate('/login', { state: { from: { pathname: '/checkout' } } })
      setIsSubmitting(false)
      return
    }

    try {
      const created = await ordersApi.create(
        cart.map((item) => ({
          artwork_id: String(item.artwork_id || item.id),
          quantity: Number(item.quantity || 1),
        }))
      )

      // The backend currently supports mock payment completion only.
      const payment = await paymentsApi.create(created.id, 'mock')
      const completedPayment = await paymentsApi.completeMock(payment.id)
      const normalized = normalizeOrder({
        ...created,
        status: created.status === 'pending_payment' ? 'confirmed' : created.status,
        paymentStatus: completedPayment.status,
        paymentMethod: completedPayment.method || 'mock',
        shippingAddress: address,
      })

      localStorage.setItem('kathputli-last-order', JSON.stringify(normalized))
      const prior = JSON.parse(localStorage.getItem('kathputli-orders') || '[]')
      localStorage.setItem('kathputli-orders', JSON.stringify([
        normalized,
        ...(Array.isArray(prior) ? prior.filter((item) => item.id !== normalized.id) : []),
      ]))
      localStorage.setItem(CART_KEY, '[]')
      setOrderId(normalized.id)
      setOrderPlaced(true)
      toast.success('Your order and mock payment were completed.')
      setTimeout(() => navigate(`/orders/${normalized.id}`), 1200)
    } catch (error) {
      console.error('Unable to place Kathputli order:', error)
      toast.error(error?.response?.data?.error || 'Could not place your order. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  /*
   * Don't render the checkout UI until the persisted
   * cart has been loaded.
   */
  if (!cartLoaded) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#f8f5ef]">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-[#7d1e1e]" />
          <p className="mt-4 text-sm text-stone-500">
            Loading checkout…
          </p>
        </div>
      </div>
    )
  }

  if (orderPlaced) {
    return (
      <div className="min-h-[70vh] bg-[#f8f5ef] px-4 py-16">
        <div className="mx-auto flex max-w-xl flex-col items-center rounded-3xl bg-white px-6 py-14 text-center shadow-sm ring-1 ring-stone-200/70">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-[#f2e5dc] text-[#7d1e1e]">
            <Check
              className="h-10 w-10"
              strokeWidth={2.2}
            />
          </div>

          <p className="mt-7 text-xs font-semibold uppercase tracking-[0.25em] text-[#a47b55]">
            Order confirmed
          </p>

          <h1 className="mt-3 font-serif text-3xl text-stone-900">
            Thank you for choosing Kathputli
          </h1>

          <p className="mt-4 max-w-md text-sm leading-6 text-stone-500">
            Your artwork order has been placed
            successfully. We are preparing your pieces
            for their journey to you.
          </p>

          <div className="mt-7 rounded-2xl bg-[#faf8f4] px-6 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-stone-400">
              Order number
            </p>

            <p className="mt-1 font-medium text-stone-900">
              {orderId}
            </p>
          </div>

          <p className="mt-6 text-xs text-stone-400">
            Taking you to your order details…
          </p>
        </div>
      </div>
    )
  }

  if (cart.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#f8f5ef]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <Link
          to="/cart"
          className="mb-8 inline-flex items-center gap-2 text-sm text-stone-500 transition hover:text-[#7d1e1e]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to cart
        </Link>

        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#a47b55]">
            Secure checkout
          </p>

          <h1 className="mt-2 font-serif text-4xl text-stone-900 sm:text-5xl">
            Complete your order
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-500">
            Enter your delivery details and choose
            your preferred payment method to complete
            your artwork purchase.
          </p>
        </div>

        <form onSubmit={placeOrder}>
          <div className="grid gap-8 lg:grid-cols-[1fr_390px]">
            {/* LEFT COLUMN */}

            <div className="space-y-6">
              {/* SHIPPING ADDRESS */}

              <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200/70 sm:p-8">
                <div className="mb-7 flex items-start gap-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#f2e5dc] text-[#7d1e1e]">
                    <MapPin className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="font-serif text-2xl text-stone-900">
                      Shipping address
                    </h2>

                    <p className="mt-1 text-sm text-stone-500">
                      Where should we deliver your artwork?
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Full name"
                    value={address.fullName}
                    onChange={(value) =>
                      updateAddress(
                        'fullName',
                        value
                      )
                    }
                    placeholder="Your full name"
                    required
                  />

                  <Field
                    label="Phone number"
                    value={address.phone}
                    onChange={(value) =>
                      updateAddress(
                        'phone',
                        value
                      )
                    }
                    placeholder="10-digit mobile number"
                    type="tel"
                    required
                  />

                  <div className="sm:col-span-2">
                    <Field
                      label="Address"
                      value={address.address}
                      onChange={(value) =>
                        updateAddress(
                          'address',
                          value
                        )
                      }
                      placeholder="House / flat number, street, area"
                      required
                    />
                  </div>

                  <Field
                    label="City"
                    value={address.city}
                    onChange={(value) =>
                      updateAddress(
                        'city',
                        value
                      )
                    }
                    placeholder="City"
                    required
                  />

                  <Field
                    label="State"
                    value={address.state}
                    onChange={(value) =>
                      updateAddress(
                        'state',
                        value
                      )
                    }
                    placeholder="State"
                    required
                  />

                  <Field
                    label="Pincode"
                    value={address.pincode}
                    onChange={(value) =>
                      updateAddress(
                        'pincode',
                        value
                      )
                    }
                    placeholder="6-digit pincode"
                    inputMode="numeric"
                    required
                  />
                </div>
              </section>

              {/* DELIVERY */}

              <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200/70 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#f2e5dc] text-[#7d1e1e]">
                    <Truck className="h-5 w-5" />
                  </div>

                  <div className="flex-1">
                    <h2 className="font-serif text-2xl text-stone-900">
                      Delivery
                    </h2>

                    <div className="mt-4 rounded-2xl border border-stone-200 bg-[#faf8f4] p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-stone-900">
                            Standard delivery
                          </p>

                          <p className="mt-1 text-xs leading-5 text-stone-500">
                            Carefully packed and
                            delivered to your address.
                          </p>
                        </div>

                        <p className="shrink-0 text-sm font-medium text-stone-900">
                          {shipping === 0
                            ? 'Free'
                            : `₹${shipping}`}
                        </p>
                      </div>

                      <div className="mt-4 border-t border-stone-200 pt-4">
                        <p className="text-xs text-stone-500">
                          Estimated delivery
                        </p>

                        <p className="mt-1 text-sm font-medium text-stone-800">
                          7–10 business days
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* PAYMENT */}

              <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200/70 sm:p-8">
                <div className="mb-7 flex items-start gap-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#f2e5dc] text-[#7d1e1e]">
                    <CreditCard className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="font-serif text-2xl text-stone-900">
                      Payment method
                    </h2>

                    <p className="mt-1 text-sm text-stone-500">
                      Choose how you would like to pay.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <PaymentOption
                    value="card"
                    currentValue={paymentMethod}
                    onChange={setPaymentMethod}
                    title="Credit / Debit Card"
                    description="Visa, Mastercard, RuPay and more"
                    icon={
                      <CreditCard className="h-5 w-5" />
                    }
                  />

                  <PaymentOption
                    value="upi"
                    currentValue={paymentMethod}
                    onChange={setPaymentMethod}
                    title="UPI"
                    description="Pay using your preferred UPI app"
                    icon={
                      <span className="text-base font-bold">
                        UPI
                      </span>
                    }
                  />

                  <PaymentOption
                    value="cod"
                    currentValue={paymentMethod}
                    onChange={setPaymentMethod}
                    title="Cash on Delivery"
                    description="Pay when your artwork arrives"
                    icon={
                      <span className="text-base font-semibold">
                        ₹
                      </span>
                    }
                  />
                </div>
              </section>
            </div>

            {/* RIGHT COLUMN */}

            <aside className="h-fit lg:sticky lg:top-24">
              <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200/70 sm:p-7">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-2xl text-stone-900">
                    Order summary
                  </h2>

                  <span className="text-xs text-stone-400">
                    {itemCount}{' '}
                    {itemCount === 1
                      ? 'item'
                      : 'items'}
                  </span>
                </div>

                <div className="mt-6 space-y-5">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4"
                    >
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-stone-100">
                        <img
                          src={item.image}
                          alt={
                            item.title ||
                            item.name
                          }
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-medium text-stone-900">
                          {item.title ||
                            item.name}
                        </h3>

                        {item.artist && (
                          <p className="mt-1 text-xs text-stone-500">
                            {item.artist}
                          </p>
                        )}

                        <div className="mt-2 flex items-center justify-between gap-3">
                          <p className="text-xs text-stone-400">
                            Qty{' '}
                            {item.quantity ||
                              1}
                          </p>

                          <p className="text-sm font-medium text-stone-800">
                            ₹
                            {(
                              Number(
                                item.price ||
                                  0
                              ) *
                              Number(
                                item.quantity ||
                                  1
                              )
                            ).toLocaleString(
                              'en-IN'
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="my-6 border-t border-stone-200" />

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-stone-500">
                    <span>Subtotal</span>

                    <span>
                      ₹
                      {subtotal.toLocaleString(
                        'en-IN'
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-stone-500">
                    <span>Shipping</span>

                    <span>
                      {shipping === 0
                        ? 'Free'
                        : `₹${shipping.toLocaleString(
                            'en-IN'
                          )}`}
                    </span>
                  </div>
                </div>

                <div className="my-5 border-t border-stone-200" />

                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm text-stone-500">
                      Total
                    </p>

                    <p className="mt-1 text-xs text-stone-400">
                      Inclusive of all applicable
                      charges
                    </p>
                  </div>

                  <p className="font-serif text-2xl font-semibold text-stone-900">
                    ₹
                    {total.toLocaleString(
                      'en-IN'
                    )}
                  </p>
                </div>

                {subtotal > 0 &&
                  subtotal <
                    FREE_SHIPPING_THRESHOLD && (
                    <div className="mt-5 rounded-2xl bg-[#faf4ee] px-4 py-3">
                      <p className="text-xs leading-5 text-[#7d1e1e]">
                        Add ₹
                        {(
                          FREE_SHIPPING_THRESHOLD -
                          subtotal
                        ).toLocaleString(
                          'en-IN'
                        )}{' '}
                        more to unlock free
                        shipping.
                      </p>
                    </div>
                  )}

                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !isAddressComplete
                  }
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#7d1e1e] px-5 py-3.5 text-sm font-medium text-white transition hover:bg-[#681919] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Placing order…
                    </>
                  ) : (
                    <>
                      Place order
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <div className="mt-5 flex items-center justify-center gap-2 text-xs text-stone-400">
                  <ShieldCheck className="h-4 w-4" />
                  Secure checkout
                </div>
              </section>

              <div className="mt-4 rounded-2xl border border-stone-200 bg-white/70 px-5 py-4">
                <p className="text-center text-xs leading-5 text-stone-500">
                  Your artwork will be carefully
                  packaged to help ensure it reaches
                  you safely.
                </p>
              </div>
            </aside>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
  required = false,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-stone-500">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        inputMode={inputMode}
        required={required}
        className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-300 focus:border-[#a47b55] focus:ring-2 focus:ring-[#a47b55]/10"
      />
    </label>
  )
}

function PaymentOption({
  value,
  currentValue,
  onChange,
  title,
  description,
  icon,
}) {
  const active = value === currentValue

  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={`flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left transition ${
        active
          ? 'border-[#7d1e1e] bg-[#faf4ee]'
          : 'border-stone-200 bg-white hover:border-stone-300'
      }`}
    >
      <div
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
          active
            ? 'bg-[#7d1e1e] text-white'
            : 'bg-stone-100 text-stone-500'
        }`}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-stone-900">
          {title}
        </p>

        <p className="mt-1 text-xs text-stone-500">
          {description}
        </p>
      </div>

      <div
        className={`grid h-5 w-5 place-items-center rounded-full border ${
          active
            ? 'border-[#7d1e1e] bg-[#7d1e1e]'
            : 'border-stone-300'
        }`}
      >
        {active && (
          <Check className="h-3 w-3 text-white" />
        )}
      </div>
    </button>
  )
}