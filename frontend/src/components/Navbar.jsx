import { Heart, ShoppingBag, UserCircle, Search } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'

export default function Navbar() {
  const location = useLocation()

  const isAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/register'

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Shop', path: '/shop' },
    { label: 'Artists', path: '/artists' },
  ]

  if (isAuthPage) {
    return (
      <header className="w-full border-b border-[#e7ded4] bg-[#faf8f4]">
        <nav className="flex h-[68px] w-full items-center justify-between px-8 lg:px-12">
          <Link to="/" className="flex shrink-0 items-center">
            <img
              src="/kathputli-logo.png"
              alt="Kathputli"
              className="h-[48px] w-auto object-contain"
            />
          </Link>

          <div className="flex items-center gap-7">
            <button
              type="button"
              className="text-sm font-medium text-[#171717] transition-colors hover:text-[#86151a]"
            >
              Need Help?
            </button>

            <span className="h-6 w-px bg-[#ddd3c8]" />

            <button
              type="button"
              className="text-sm font-medium text-[#171717] transition-colors hover:text-[#86151a]"
            >
              English <span className="ml-2 text-xs">⌄</span>
            </button>

            <Link
              to="/login"
              className="text-sm font-semibold text-[#171717] transition-colors hover:text-[#86151a]"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="rounded-xl bg-[#86151a] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#701216]"
            >
              Sign up
            </Link>
          </div>
        </nav>
      </header>
    )
  }

  return (
    <header className="w-full border-b border-[#e9dfd4] bg-[#faf8f4]">
      <nav className="flex h-[72px] w-full items-center px-8 lg:px-12">
        <Link to="/" className="flex shrink-0 items-center">
          <img
            src="/kathputli-logo.png"
            alt="Kathputli"
            className="h-[52px] w-auto object-contain"
          />
        </Link>

        <div className="mx-auto flex items-center gap-8">
          <div className="flex items-center gap-8">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.path}
                className={({ isActive }) =>
                  `relative py-6 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-[#86151a]'
                      : 'text-[#171717] hover:text-[#86151a]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {item.label}

                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#86151a]" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          <div className="hidden w-[340px] items-center rounded-xl border border-[#ded5cc] bg-white px-4 py-3 xl:flex">
            <Search
              size={20}
              strokeWidth={1.8}
              className="mr-3 text-[#77716b]"
            />

            <input
              type="text"
              placeholder="Search artworks, artists, collections..."
              className="w-full bg-transparent text-sm text-[#333] outline-none placeholder:text-[#8b8580]"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-6">
          <Link
            to="/wishlist"
            aria-label="Wishlist"
            className="relative text-[#171717] transition-colors hover:text-[#86151a]"
          >
            <Heart size={25} strokeWidth={1.7} />

            <span className="absolute -right-2 -top-2 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#86151a] px-1 text-[10px] font-semibold text-white">
              3
            </span>
          </Link>

          <Link
            to="/cart"
            aria-label="Shopping cart"
            className="relative text-[#171717] transition-colors hover:text-[#86151a]"
          >
            <ShoppingBag size={25} strokeWidth={1.7} />

            <span className="absolute -right-2 -top-2 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#86151a] px-1 text-[10px] font-semibold text-white">
              2
            </span>
          </Link>

          <Link
            to="/profile"
            aria-label="Profile"
            className="text-[#171717] transition-colors hover:text-[#86151a]"
          >
            <UserCircle size={29} strokeWidth={1.6} />
          </Link>
        </div>
      </nav>
    </header>
  )
}