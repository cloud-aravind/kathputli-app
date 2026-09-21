import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'

import { useAuth } from '../store/AuthContext'
import Button from '../components/Button'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/restaurants'

  const [form, setForm] = useState({
    email: '',
    password: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const update = (e) => {
    setForm((current) => ({
      ...current,
      [e.target.name]: e.target.value,
    }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await login(form)

      toast.success('Welcome back to Kathputli.')
      navigate(from, { replace: true })
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          'Invalid email or password.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-65px)] overflow-hidden bg-[#faf7f2]">

      <div className="grid min-h-[calc(100vh-65px)] md:grid-cols-2">

        {/* =====================================================
            LEFT — KATHPUTLI ARTISTIC BRAND PANEL
            ===================================================== */}
        <section className="relative hidden overflow-hidden bg-[#faf7f2] md:flex">

          {/* Top-left Kathputli watermark */}
          <img
            src="/kathputli-watermark-top-left.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 z-0 w-28 opacity-40 sm:w-36"
          />

          {/* Bottom-right Kathputli watermark */}
          <img
            src="/kathputli-watermark-bottom-right.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 right-0 z-0 w-32 opacity-40 sm:w-40"
          />

          {/* Main artistic content */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="relative z-10 flex min-h-full w-full items-center justify-center px-8 py-14 lg:px-14"
          >
            <div className="w-full max-w-2xl text-center">

              {/* Eyebrow */}
              <div className="mb-6 flex items-center justify-center gap-3">
                <span className="h-px w-10 bg-[#b88932]" />

                <span className="font-display text-sm font-medium tracking-wide text-[#9a6818]">
                  Discover. Collect. Inspire.
                </span>

                <span className="h-px w-10 bg-[#b88932]" />
              </div>

              {/* Main heading */}
              <h2 className="font-display text-5xl font-medium leading-[1.05] tracking-tight text-[#201b18] lg:text-6xl">
                Art that{' '}
                <em className="text-[#741414]">
                  inspires life.
                </em>
              </h2>

              {/* Supporting text */}
              <p className="mx-auto mt-7 max-w-xl text-base leading-7 text-[#746961] lg:text-lg">
                Sign in to discover original artworks, connect with artists
                and build your personal collection.
              </p>

              {/* Artist statement */}
              <div className="mt-8 flex items-center justify-center gap-3 text-sm font-medium text-[#403833]">
                <span
                  className="text-2xl leading-none text-[#741414]"
                  aria-hidden="true"
                >
                  ♡
                </span>

                <span>
                  Original art from independent artists
                </span>
              </div>

              {/* Divider */}
              <div className="mx-auto mt-12 flex max-w-xl items-center justify-center">
                <div className="h-px flex-1 bg-[#e4d7c8]" />

                <span className="mx-4 text-[#b88932]">
                  ✦
                </span>

                <div className="h-px flex-1 bg-[#e4d7c8]" />
              </div>

              {/* Closing statement */}
              <div className="mt-8">
                <h3 className="font-display text-xl font-semibold text-[#741414]">
                  Every piece. A story. A connection.
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#746961]">
                  Discover stories, traditions and creativity through art.
                </p>
              </div>

            </div>
          </motion.div>
        </section>


        {/* =====================================================
            RIGHT — LOGIN FORM
            ===================================================== */}
        <section className="flex min-h-full items-center justify-center bg-[#faf9f6] px-6 py-12 sm:px-10 lg:px-16">

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="w-full max-w-md"
          >

            {/* Header */}
            <div className="mb-8">

              <p className="mb-3 text-sm font-medium tracking-wide text-[#8a6420]">
                WELCOME BACK
              </p>

              <h1 className="font-display text-4xl font-medium text-[#201b18]">
                Sign in to Kathputli
              </h1>

              <p className="mt-3 text-sm leading-6 text-[#746961]">
                Continue your journey through original art and
                independent artists.
              </p>

            </div>


            {/* Login form */}
            <form
              onSubmit={submit}
              className="space-y-5"
            >

              {/* Email */}
              <Field
                icon={Mail}
                id="email"
                name="email"
                type="email"
                label="Email address"
                value={form.email}
                onChange={update}
                autoComplete="email"
                placeholder="you@example.com"
              />


              {/* Password */}
              <div>

                <div className="mb-1.5 flex items-center justify-between">

                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-[#403833]"
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    className="text-xs font-medium text-[#741414] hover:underline"
                  >
                    Forgot password?
                  </button>

                </div>


                <div className="relative">

                  <Lock
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a8f87]"
                  />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={update}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    required
                    className="w-full rounded-lg border border-[#ded5ca] bg-white py-3 pl-10 pr-11 text-sm text-[#201b18] outline-none transition placeholder:text-[#a69b92] focus:border-[#741414] focus:ring-2 focus:ring-[#741414]/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((value) => !value)
                    }
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8f847c] hover:text-[#741414]"
                    aria-label={
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>

                </div>
              </div>


              {/* Sign in */}
              <Button
                type="submit"
                loading={submitting}
                className="w-full !rounded-lg !bg-[#741414] !shadow-none hover:!bg-[#5d1010]"
              >
                {submitting ? 'Signing in…' : 'Sign in'}
              </Button>

            </form>


            {/* OR divider */}
            <div className="my-7 flex items-center gap-4">

              <div className="h-px flex-1 bg-[#e4ddd5]" />

              <span className="text-xs text-[#9a8f87]">
                OR
              </span>

              <div className="h-px flex-1 bg-[#e4ddd5]" />

            </div>


            {/* Register link */}
            <p className="text-center text-sm text-[#746961]">
              New to Kathputli?{' '}
              <Link
                to="/register"
                className="font-semibold text-[#741414] hover:underline"
              >
                Create an account
              </Link>
            </p>


            {/* Terms */}
            <p className="mt-8 text-center text-xs leading-5 text-[#a0968e]">
              By continuing, you agree to Kathputli's Terms of
              Service and Privacy Policy.
            </p>

          </motion.div>

        </section>

      </div>

    </div>
  )
}


/* =============================================================
   REUSABLE FORM FIELD
   Register.jsx imports this component.
   ============================================================= */

export function Field({
  icon: Icon,
  label,
  ...props
}) {
  return (
    <div>

      <label
        className="mb-1.5 block text-sm font-medium text-[#403833]"
        htmlFor={props.id}
      >
        {label}
      </label>

      <div className="relative">

        {Icon && (
          <Icon
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a8f87]"
          />
        )}

        <input
          className={`w-full rounded-lg border border-[#ded5ca] bg-white py-3 ${
            Icon ? 'pl-10' : 'pl-3.5'
          } pr-3.5 text-sm text-[#201b18] outline-none transition placeholder:text-[#a69b92] focus:border-[#741414] focus:ring-2 focus:ring-[#741414]/10`}
          required
          {...props}
        />

      </div>

    </div>
  )
}