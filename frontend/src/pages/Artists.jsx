import { useState } from 'react'
import {
  Award,
  Check,
  ChevronDown,
  ChevronRight,
  Filter,
  Globe,
  Heart,
  Image,
  Instagram,
  MapPin,
  Share2,
  SlidersHorizontal,
  Star,
  Trophy,
  Twitter,
  UserPlus,
} from 'lucide-react'


// ============================================================
// ARTIST DATA
// ============================================================

const artist = {
  name: 'Bhavya Rao',
  specialty: 'Contemporary Painter',
  location: 'New Delhi, India',
  artworks: 6,
  followers: '2.5K',
  rating: '4.9',
  reviews: 128,
  exhibitions: 18,

  bio:
    'Bhavya Rao is a contemporary painter whose work explores the beauty of nature, light, and everyday moments. Her paintings are collected by art lovers across the globe and have been featured in several international exhibitions.',

  avatar: '/bhavya-rao-profile.png',
  cover: '/bhavya-cover-pic.png',
}


// ============================================================
// ARTWORK DATA
// ============================================================

const artworks = [
  {
    id: 1,
    title: 'Golden Reflections',
    medium: 'Oil on Canvas',
    size: '24 x 30 inch',
    price: 650,
    image: '/bhavya-pic-1.png',
  },
  {
    id: 2,
    title: 'Blooming Peonies',
    medium: 'Oil on Canvas',
    size: '20 x 24 inch',
    price: 600,
    image: '/bhavya-pic-2.png',
  },
  {
    id: 3,
    title: 'Mountain Serenity',
    medium: 'Oil on Canvas',
    size: '18 x 24 inch',
    price: 580,
    image: '/bhavya-pic-3.png',
  },
  {
    id: 4,
    title: 'City Lights',
    medium: 'Acrylic on Canvas',
    size: '20 x 28 inch',
    price: 540,
    image: '/bhavya-pic-4.png',
  },
  {
    id: 5,
    title: 'Sunset Hues',
    medium: 'Oil on Canvas',
    size: '16 x 20 inch',
    price: 480,
    image: '/bhavya-pic-5.png',
  },
  {
    id: 6,
    title: 'Wildflowers',
    medium: 'Oil on Canvas',
    size: '18 x 24 inch',
    price: 490,
    image: '/bhavya-pic-6.png',
  },
]


// ============================================================
// HELPER
// ============================================================

function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(price) || 0)
}


// ============================================================
// ARTIST PAGE
// ============================================================

export default function Artists() {
  const [activeTab, setActiveTab] = useState('Artworks')
  const [sortBy, setSortBy] = useState('Newest')
  const [wishlist, setWishlist] = useState([])


  // ==========================================================
  // WISHLIST
  // ==========================================================

  const toggleWishlist = (id) => {
    setWishlist((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    )
  }


  return (
    <main className="min-h-screen bg-[#faf9f6] px-4 py-4 text-[#201b18] sm:px-6 lg:px-8">

      <div className="mx-auto max-w-[1500px] overflow-hidden rounded-[24px] bg-[#fffdf9] shadow-[0_4px_25px_rgba(60,35,15,0.08)]">


        {/* ======================================================
            BREADCRUMB
            ====================================================== */}

        <div className="border-b border-[#eee6df] px-6 py-5 sm:px-8 lg:px-10">

          <div className="flex items-center gap-3 text-sm text-[#6b625c]">

            <span>Home</span>

            <ChevronRight size={15} />

            <span>Artists</span>

            <ChevronRight size={15} />

            <span className="font-medium text-[#302824]">
              {artist.name}
            </span>

          </div>

        </div>


        {/* ======================================================
            ARTIST HERO
            ====================================================== */}

        <section className="px-6 pt-6 sm:px-8 lg:px-10">

          <div className="grid overflow-hidden rounded-[18px] border border-[#eee5dc] bg-[#fffdf9] shadow-[0_3px_18px_rgba(60,35,15,0.05)] lg:grid-cols-[1fr_1.05fr] xl:grid-cols-[1.25fr_0.75fr_0.95fr]">


            {/* ==================================================
                PROFILE INFORMATION
                ================================================== */}

            <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">

              <div className="flex flex-col gap-7 sm:flex-row sm:items-start">


                {/* AVATAR */}

                <div className="mx-auto h-[190px] w-[190px] shrink-0 overflow-hidden rounded-full border-[6px] border-[#f4eee7] bg-[#eee7df] sm:mx-0">

                  <img
                    src={artist.avatar}
                    alt={artist.name}
                    className="h-full w-full object-cover"
                  />

                </div>


                {/* PROFILE TEXT */}

                <div className="min-w-0">

                  <div className="flex items-center justify-center gap-2 sm:justify-start">

                    <h1 className="font-serif text-3xl font-semibold tracking-[-0.5px] text-[#171412] sm:text-[32px]">
                      {artist.name}
                    </h1>

                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#7d1e1e] text-white">
                      <Check size={12} strokeWidth={3} />
                    </span>

                  </div>


                  <p className="mt-2 text-base text-[#39332f]">
                    {artist.specialty}
                  </p>


                  <div className="mt-3 flex items-center justify-center gap-2 text-sm text-[#5e5751] sm:justify-start">

                    <MapPin size={17} strokeWidth={1.8} />

                    <span>{artist.location}</span>

                  </div>


                  <p className="mt-5 max-w-[560px] text-sm leading-6 text-[#3f3935]">
                    {artist.bio}
                  </p>


                  {/* SOCIAL LINKS */}

                  <div className="mt-5 flex items-center justify-center gap-5 sm:justify-start">

                    <button
                      type="button"
                      className="text-[#201b18] transition hover:text-[#7d1e1e]"
                      aria-label="Instagram"
                    >
                      <Instagram size={19} />
                    </button>

                    <button
                      type="button"
                      className="text-[#201b18] transition hover:text-[#7d1e1e]"
                      aria-label="Facebook"
                    >
                      <span className="text-[19px] font-semibold">f</span>
                    </button>

                    <button
                      type="button"
                      className="text-[#201b18] transition hover:text-[#7d1e1e]"
                      aria-label="Twitter"
                    >
                      <Twitter size={19} />
                    </button>

                    <button
                      type="button"
                      className="text-[#201b18] transition hover:text-[#7d1e1e]"
                      aria-label="Website"
                    >
                      <Globe size={19} />
                    </button>

                  </div>

                </div>

              </div>

            </div>


            {/* ==================================================
                ARTIST STATS
                ================================================== */}

            <div className="border-t border-[#eee5dc] p-7 lg:border-l lg:border-t-0 lg:p-8">

              <div className="grid h-full grid-cols-2 gap-x-8 gap-y-10 content-center">


                <Stat
                  icon={<Image size={28} strokeWidth={1.7} />}
                  value={artist.artworks}
                  label="Artworks"
                />

                <Stat
                  icon={<Heart size={28} strokeWidth={1.7} />}
                  value={artist.followers}
                  label="Followers"
                />

                <Stat
                  icon={<Star size={29} strokeWidth={1.7} />}
                  value={artist.rating}
                  label="Rating"
                  extra={`(${artist.reviews} reviews)`}
                />

                <Stat
                  icon={<Trophy size={29} strokeWidth={1.7} />}
                  value={artist.exhibitions}
                  label="Exhibitions"
                />

              </div>

            </div>


            {/* ==================================================
                COVER IMAGE
                ================================================== */}

            <div className="relative min-h-[290px] overflow-hidden bg-[#eee8e1] lg:min-h-[330px]">

              <img
                src={artist.cover}
                alt={`${artist.name} artwork`}
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />

            </div>

          </div>

        </section>


        {/* ======================================================
            TABS + ACTIONS
            ====================================================== */}

        <section className="px-6 sm:px-8 lg:px-10">

          <div className="flex flex-col gap-4 border-b border-[#e9e0d8] py-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-7 overflow-x-auto">

              {['Artworks', 'About', 'Exhibitions', 'Reviews (128)'].map(
                (tab) => {

                  const tabName = tab.split(' ')[0]

                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tabName)}
                      className={`relative whitespace-nowrap px-1 py-3 text-sm font-medium transition ${
                        activeTab === tabName
                          ? 'text-[#201b18]'
                          : 'text-[#69615b] hover:text-[#7d1e1e]'
                      }`}
                    >

                      {tab}

                      {activeTab === tabName && (
                        <span className="absolute bottom-[-17px] left-0 right-0 h-[2px] bg-[#7d1e1e]" />
                      )}

                    </button>
                  )
                }
              )}

            </div>


            <div className="flex items-center gap-2">

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-[#e5ddd5] bg-white px-4 py-2.5 text-sm font-medium transition hover:border-[#7d1e1e] hover:text-[#7d1e1e]"
              >
                <Share2 size={16} />
                Share Profile
              </button>

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg bg-[#7d1e1e] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#681818]"
              >
                <UserPlus size={16} />
                Follow
              </button>

            </div>

          </div>

        </section>


        {/* ======================================================
            ARTWORK SECTION
            ====================================================== */}

        {activeTab === 'Artworks' && (
          <section className="px-6 pb-6 pt-7 sm:px-8 lg:px-10">

            {/* SECTION HEADER */}

            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

              <div>

                <h2 className="font-serif text-2xl font-semibold tracking-[-0.3px] text-[#171412]">
                  Artworks by {artist.name}
                </h2>

                <p className="mt-2 text-sm text-[#716963]">
                  Showing 1–12 of {artist.artworks} artworks
                </p>

              </div>


              {/* CONTROLS */}

              <div className="flex items-center gap-2">

                <div className="relative">

                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                    className="appearance-none rounded-lg border border-[#e5ddd5] bg-white py-2.5 pl-4 pr-10 text-sm outline-none transition focus:border-[#7d1e1e]"
                  >
                    <option>Newest</option>
                    <option>Popular</option>
                    <option>Price: Low to High</option>
                    <option>Price: High to Low</option>
                  </select>

                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
                  />

                </div>


                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg border border-[#e5ddd5] bg-white px-4 py-2.5 text-sm transition hover:border-[#7d1e1e] hover:text-[#7d1e1e]"
                >
                  <SlidersHorizontal size={16} />
                  Filter
                </button>

              </div>

            </div>


            {/* ARTWORK GRID */}

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

              {artworks.map((artwork) => {

                const isWishlisted = wishlist.includes(artwork.id)

                return (
                  <article
                    key={artwork.id}
                    className="group overflow-hidden rounded-xl border border-[#eee5dc] bg-white shadow-[0_3px_14px_rgba(60,35,15,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(60,35,15,0.10)]"
                  >

                    {/* IMAGE */}

                    <div className="relative aspect-[4/3] overflow-hidden bg-[#eee8e1]">

                      <img
                        src={artwork.image}
                        alt={artwork.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />


                      {/* WISHLIST */}

                      <button
                        type="button"
                        onClick={() => toggleWishlist(artwork.id)}
                        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-sm transition hover:scale-105"
                        aria-label={`Add ${artwork.title} to wishlist`}
                      >

                        <Heart
                          size={18}
                          className={
                            isWishlisted
                              ? 'fill-[#7d1e1e] text-[#7d1e1e]'
                              : 'text-[#7d1e1e]'
                          }
                        />

                      </button>

                    </div>


                    {/* DETAILS */}

                    <div className="p-3.5">

                      <h3 className="truncate text-sm font-semibold text-[#201b18]">
                        {artwork.title}
                      </h3>

                      <p className="mt-1 text-xs text-[#68605a]">
                        {artwork.medium}
                        <span className="mx-1.5">•</span>
                        {artwork.size}
                      </p>

                      <p className="mt-3 text-sm font-semibold text-[#7d1e1e]">
                        {formatPrice(artwork.price)}
                      </p>

                    </div>

                  </article>
                )
              })}

            </div>

          </section>
        )}


        {/* ======================================================
            ABOUT TAB
            ====================================================== */}

        {activeTab === 'About' && (
          <section className="px-6 pb-12 pt-8 sm:px-8 lg:px-10">

            <div className="max-w-4xl">

              <h2 className="font-serif text-2xl font-semibold">
                About {artist.name}
              </h2>

              <p className="mt-5 text-[15px] leading-7 text-[#514943]">
                {artist.bio}
              </p>

              <div className="mt-7 grid gap-4 sm:grid-cols-3">

                <InfoCard
                  icon={<Award size={22} />}
                  title="International Exhibitions"
                  text="Featured in several exhibitions."
                />

                <InfoCard
                  icon={<Image size={22} />}
                  title="129 Artworks"
                  text="Original works available to collectors."
                />

                <InfoCard
                  icon={<Heart size={22} />}
                  title="2.5K Followers"
                  text="A growing community of art lovers."
                />

              </div>

            </div>

          </section>
        )}


        {/* ======================================================
            EXHIBITIONS TAB
            ====================================================== */}

        {activeTab === 'Exhibitions' && (
          <section className="px-6 pb-12 pt-8 sm:px-8 lg:px-10">

            <h2 className="font-serif text-2xl font-semibold">
              Exhibitions
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-3">

              {[
                'Contemporary Visions — New Delhi',
                'Art Across Borders — Mumbai',
                'International Contemporary Art — Singapore',
              ].map((exhibition) => (
                <div
                  key={exhibition}
                  className="rounded-xl border border-[#eee5dc] bg-white p-5"
                >
                  <Trophy
                    size={23}
                    className="text-[#7d1e1e]"
                  />

                  <h3 className="mt-4 text-sm font-semibold">
                    {exhibition}
                  </h3>

                  <p className="mt-2 text-sm text-[#716963]">
                    Featured exhibition
                  </p>
                </div>
              ))}

            </div>

          </section>
        )}


        {/* ======================================================
            REVIEWS TAB
            ====================================================== */}

        {activeTab === 'Reviews' && (
          <section className="px-6 pb-12 pt-8 sm:px-8 lg:px-10">

            <div className="flex items-center gap-4">

              <div className="flex items-center gap-1">

                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={20}
                    className="fill-[#c49a2c] text-[#c49a2c]"
                  />
                ))}

              </div>

              <span className="font-semibold">
                {artist.rating}
              </span>

              <span className="text-sm text-[#716963]">
                ({artist.reviews} reviews)
              </span>

            </div>


            <div className="mt-6 rounded-xl border border-[#eee5dc] bg-white p-6">

              <p className="text-sm leading-6 text-[#514943]">
                Art collectors consistently appreciate Bhavya Rao's
                attention to nature, light, atmosphere, and everyday
                moments.
              </p>

            </div>

          </section>
        )}


        {/* ======================================================
            TRUST / BENEFITS BAR
            ====================================================== */}

        <section className="border-t border-[#eee5dc] px-6 py-6 sm:px-8 lg:px-10">

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

            <Benefit
              icon={<ShieldIcon />}
              title="100% Authentic Art"
              description="All artworks come with a certificate of authenticity."
            />

            <Benefit
              icon={<PackageIcon />}
              title="Secure Packaging"
              description="Safe and secure packaging for every artwork."
            />

            <Benefit
              icon={<ReturnIcon />}
              title="Easy Returns"
              description="Hassle-free returns within 14 days."
            />

            <Benefit
              icon={<SupportIcon />}
              title="Support Artists"
              description="Every purchase empowers independent artists."
            />

          </div>

        </section>

      </div>

    </main>
  )
}


// ============================================================
// STAT COMPONENT
// ============================================================

function Stat({ icon, value, label, extra }) {
  return (
    <div>

      <div className="text-[#7d1e1e]">
        {icon}
      </div>

      <p className="mt-2 text-xl font-semibold text-[#171412]">
        {value}
      </p>

      <p className="text-sm text-[#39332f]">
        {label}
      </p>

      {extra && (
        <p className="mt-0.5 text-xs text-[#716963]">
          {extra}
        </p>
      )}

    </div>
  )
}


// ============================================================
// INFO CARD
// ============================================================

function InfoCard({ icon, title, text }) {
  return (
    <div className="rounded-xl border border-[#eee5dc] bg-white p-5">

      <div className="text-[#7d1e1e]">
        {icon}
      </div>

      <h3 className="mt-4 text-sm font-semibold">
        {title}
      </h3>

      <p className="mt-1 text-sm leading-5 text-[#716963]">
        {text}
      </p>

    </div>
  )
}


// ============================================================
// BENEFIT
// ============================================================

function Benefit({ icon, title, description }) {
  return (
    <div className="flex items-start gap-4">

      <div className="shrink-0 text-[#7d1e1e]">
        {icon}
      </div>

      <div>

        <h3 className="text-sm font-semibold text-[#201b18]">
          {title}
        </h3>

        <p className="mt-1 text-sm leading-5 text-[#514943]">
          {description}
        </p>

      </div>

    </div>
  )
}


// ============================================================
// SIMPLE ICONS
// ============================================================

function ShieldIcon() {
  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M12 3 4.5 6v5.5c0 4.7 3.1 8 7.5 9.5 4.4-1.5 7.5-4.8 7.5-9.5V6L12 3Z" />
      <path d="m8.5 12 2.2 2.2 4.8-5" />
    </svg>
  )
}


function PackageIcon() {
  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="m4 7 8-4 8 4-8 4-8-4Z" />
      <path d="M4 7v10l8 4 8-4V7" />
      <path d="M12 11v10" />
      <path d="m8 5 8 4" />
    </svg>
  )
}


function ReturnIcon() {
  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
      <path d="M12 8v4l3 2" />
    </svg>
  )
}


function SupportIcon() {
  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M4 13v-2a8 8 0 0 1 16 0v2" />
      <path d="M4 13h3v5H5a1 1 0 0 1-1-1v-4Z" />
      <path d="M20 13h-3v5h2a1 1 0 0 1 1-1v-4Z" />
      <path d="M17 18c0 1.1-1.8 2-4 2h-1" />
    </svg>
  )
}