import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Mail,
  Lock,
  User as UserIcon,
  ShoppingBag,
  Palette,
} from 'lucide-react'

import { useAuth } from '../store/AuthContext'
import Button from '../components/Button'
import { Field } from './Login'


/* =============================================================
   REGISTRATION ROLES
   ============================================================= */

const ROLES = [
  {
    value: 'customer',
    label: 'Customer',
    Icon: ShoppingBag,
    hint: 'Discover & collect art',
  },
  {
    // Kathputli artist role supported by the backend.
    value: 'artist-admin',
    label: 'Artist',
    Icon: Palette,
    hint: 'Create & sell artwork',
  },
]


/* =============================================================
   REGISTER PAGE
   ============================================================= */

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer',
  })

  const [submitting, setSubmitting] = useState(false)


  /* -------------------------------------------------------------
     Form update
     ------------------------------------------------------------- */

  const update = (e) => {
    setForm((current) => ({
      ...current,
      [e.target.name]: e.target.value,
    }))
  }


  /* -------------------------------------------------------------
     Registration submit
     ------------------------------------------------------------- */

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const data = await register(form)

      toast.success('Welcome to Kathputli.')

      /*
       * If registration automatically authenticates the user,
       * route according to the selected role.
       */
      if (data?.token) {
        navigate(
          form.role === 'artist-admin'
            ? '/artist/dashboard'
            : '/shop',
          { replace: true }
        )
      } else {
        navigate('/login', { replace: true })
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          'Could not create account.'
      )
    } finally {
      setSubmitting(false)
    }
  }


  return (
    <div className="min-h-[calc(100vh-65px)] w-full overflow-hidden bg-[#faf7f2]">

      <div className="grid min-h-[calc(100vh-65px)] w-full md:grid-cols-2">


        {/* =====================================================
            LEFT — KATHPUTLI ARTISTIC PANEL
            ===================================================== */}

        <section className="relative hidden min-h-full overflow-hidden bg-[#faf7f2] md:flex">

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
            className="relative z-10 flex min-h-full w-full items-center justify-center px-8 py-12 lg:px-14"
          >

            <div className="w-full max-w-2xl">


              {/* Eyebrow */}

              <div className="mb-6 flex items-center gap-3">

                <span className="h-px w-10 bg-[#b88932]" />

                <span className="font-display text-sm font-medium tracking-wide text-[#9a6818]">
                  Discover. Collect. Inspire.
                </span>

              </div>


              {/* Main heading */}

              <h2 className="font-display text-5xl font-medium leading-[1.05] tracking-tight text-[#201b18] lg:text-6xl">

                Join the{' '}

                <em className="text-[#741414]">
                  artful
                </em>

                <br />

                <em className="text-[#741414]">
                  journey.
                </em>

              </h2>


              {/* Supporting text */}

              <p className="mt-7 max-w-xl text-base leading-7 text-[#746961] lg:text-lg">
                Create your Kathputli account to discover original
                artworks or share your creativity with collectors
                around the world.
              </p>


              {/* Artist statement */}

              <div className="mt-8 flex items-center gap-3 text-sm font-medium text-[#403833]">

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


              {/* Divider / closing statement */}

              <div className="mt-12 max-w-xl">

                <div className="h-px w-full bg-[#e4d7c8]" />

                <div className="mt-6">

                  <h3 className="font-display text-lg font-semibold text-[#201b18]">
                    Art that inspires life.
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[#746961]">
                    Discover stories, traditions and creativity
                    through art.
                  </p>

                </div>

              </div>

            </div>

          </motion.div>

        </section>


        {/* =====================================================
            RIGHT — REGISTER FORM
            ===================================================== */}

        <section className="flex min-h-full items-center justify-center bg-[#faf9f6] px-6 py-10 sm:px-10 lg:px-16">

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="w-full max-w-xl"
          >


            {/* Header */}

            <div className="mb-8">

              <p className="mb-3 text-sm font-medium tracking-wide text-[#8a6420]">
                JOIN KATHPUTLI
              </p>

              <h1 className="font-display text-4xl font-medium text-[#201b18]">
                Create your account
              </h1>

              <p className="mt-3 text-sm leading-6 text-[#746961]">
                Begin your journey through original art and
                independent artists.
              </p>

            </div>


            {/* =================================================
                Registration form
                ================================================= */}

            <form
              onSubmit={submit}
              className="space-y-5"
            >


              {/* Full name */}

              <Field
                icon={UserIcon}
                id="name"
                name="name"
                label="Full name"
                value={form.name}
                onChange={update}
                autoComplete="name"
                placeholder="Jane Doe"
              />


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

              <Field
                icon={Lock}
                id="password"
                name="password"
                type="password"
                minLength={6}
                label="Password"
                value={form.password}
                onChange={update}
                autoComplete="new-password"
                placeholder="At least 6 characters"
              />


              {/* =================================================
                  Role selection
                  ================================================= */}

              <div>

                <label className="mb-1.5 block text-sm font-medium text-[#403833]">
                  I want to
                </label>


                <div className="grid grid-cols-2 gap-3">

                  {ROLES.map(
                    ({
                      value,
                      label,
                      Icon,
                      hint,
                    }) => {

                      const active =
                        form.role === value

                      return (
                        <motion.button
                          type="button"
                          key={value}
                          whileTap={{ scale: 0.98 }}
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              role: value,
                            }))
                          }
                          className={`flex min-h-[100px] flex-col items-center justify-center gap-1.5 rounded-xl border px-4 py-4 text-center transition ${
                            active
                              ? 'border-[#741414] bg-[#f7eeea] text-[#741414]'
                              : 'border-[#ded5ca] bg-white text-[#746961] hover:border-[#b88932]'
                          }`}
                        >

                          <Icon
                            className={`h-5 w-5 ${
                              active
                                ? 'text-[#741414]'
                                : 'text-[#8f847c]'
                            }`}
                          />

                          <span className="text-sm font-semibold">
                            {label}
                          </span>

                          <span className="text-xs text-[#a0968e]">
                            {hint}
                          </span>

                        </motion.button>
                      )
                    }
                  )}

                </div>

              </div>


              {/* Create account */}

              <Button
                type="submit"
                loading={submitting}
                className="w-full !rounded-lg !bg-[#741414] !shadow-none hover:!bg-[#5d1010]"
              >
                {submitting
                  ? 'Creating…'
                  : 'Create account'}
              </Button>

            </form>


            {/* =================================================
                Login link
                ================================================= */}

            <p className="mt-7 text-center text-sm text-[#746961]">

              Already have an account?{' '}

              <Link
                to="/login"
                className="font-semibold text-[#741414] hover:underline"
              >
                Sign in
              </Link>

            </p>


            {/* =================================================
                Terms
                ================================================= */}

            <p className="mt-7 text-center text-xs leading-5 text-[#a0968e]">

              By creating an account, you agree to Kathputli's
              Terms of Service and Privacy Policy.

            </p>

          </motion.div>

        </section>

      </div>

    </div>
  )
}