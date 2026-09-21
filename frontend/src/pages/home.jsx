import {
  ArrowRight,
  ShieldCheck,
  Award,
  Truck,
  Heart,
  Palette,
  PenTool,
  Flower2,
  Landmark,
  Camera,
} from 'lucide-react'

const categories = [
  {
    name: 'Paintings',
    image: '/category-paintings.jpg',
    icon: Palette,
  },
  {
    name: 'Digital Art',
    image: '/category-digital-art.jpg',
    icon: PenTool,
  },
  {
    name: 'Traditional Art',
    image: '/category-traditional-art.jpg',
    icon: Flower2,
  },
  {
    name: 'Famous Artworks',
    image: '/category-famous-artworks.jpg',
    icon: Landmark,
  },
  {
    name: 'Sculptures',
    image: '/category-sculptures.jpg',
    icon: Landmark,
  },
  {
    name: 'Photography',
    image: '/category-photography.jpg',
    icon: Camera,
  },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-[#faf8f4] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] overflow-hidden rounded-[24px] bg-[#fffdf9] shadow-[0_4px_25px_rgba(60,35,15,0.08)]">

        {/* =====================================================
            HERO SECTION
        ===================================================== */}
        <section className="grid overflow-hidden rounded-[24px] bg-[#fffaf3] lg:grid-cols-[42%_58%]">

          {/* LEFT — HERO CONTENT */}
          <div className="relative flex min-h-[500px] flex-col justify-center overflow-hidden rounded-l-[24px] px-8 py-12 sm:px-12 lg:px-16">

            {/* Decorative strokes */}
            <div className="pointer-events-none absolute -left-12 top-10 opacity-40">
              <div className="h-32 w-2 rotate-[35deg] rounded-full bg-[#d9b46b]" />
              <div className="ml-5 mt-[-90px] h-32 w-2 rotate-[35deg] rounded-full bg-[#d9b46b]" />
              <div className="ml-10 mt-[-90px] h-32 w-2 rotate-[35deg] rounded-full bg-[#d9b46b]" />
            </div>

            {/* Eyebrow */}
            <div className="relative mb-7 flex items-center gap-3 text-sm font-medium text-[#a16a12]">
              <span className="h-px w-9 bg-[#b88924]" />
              <span>Discover. Collect. Inspire.</span>
            </div>

            {/* Main heading */}
            <h1 className="relative max-w-[580px] font-serif text-[58px] leading-[0.98] tracking-[-1.5px] text-[#101010] sm:text-[68px] lg:text-[72px]">
              Art that
              <br />
              <span className="italic text-[#86151a]">
                inspires life
              </span>
            </h1>

            {/* Description */}
            <p className="relative mt-7 max-w-[470px] text-[17px] leading-7 text-[#4e4b48]">
              Discover original paintings, digital art, sculptures and more
              from talented artists around the world.
            </p>

            {/* CTA */}
            <div className="relative mt-7 flex items-center">

              <button
                type="button"
                className="flex items-center gap-4 rounded-xl bg-[#9b1117] px-7 py-4 text-sm font-semibold text-white transition hover:bg-[#811015]"
              >
                Explore Collections
                <ArrowRight size={18} />
              </button>

            </div>
          </div>

          {/* ===================================================
              RIGHT — MAIN HERO ARTWORK
              =================================================== */}
          <div className="relative aspect-[3/2] w-full overflow-hidden rounded-r-[24px] bg-[#eee9e3]">

            <img
              src="/main-hero-pic-1.png"
              alt="Artwork displayed in an art gallery"
              className="absolute inset-0 h-full w-full object-cover"
            />

            {/* Future carousel indicators — visual only */}
            <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-3">

              <span className="h-2.5 w-5 rounded-full bg-[#9b1117]" />

              <span className="h-2.5 w-2.5 rounded-full bg-white/80" />

              <span className="h-2.5 w-2.5 rounded-full bg-white/80" />

              <span className="h-2.5 w-2.5 rounded-full bg-white/80" />

              <span className="h-2.5 w-2.5 rounded-full bg-white/80" />

            </div>

          </div>
        </section>

        {/* =====================================================
            TRUST / BENEFITS BAR
        ===================================================== */}
        <section className="mx-8 mt-5 overflow-hidden rounded-2xl border border-[#eee5dc] bg-white sm:mx-12 lg:mx-16">

          <div className="grid grid-cols-1 divide-y divide-[#e8dfd6] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">

            <Benefit
              icon={ShieldCheck}
              title="Original & Authentic Art"
              subtitle="100% genuine artworks"
            />

            <Benefit
              icon={Award}
              title="Secure Shopping"
              subtitle="Safe & reliable payments"
            />

            <Benefit
              icon={Truck}
              title="Worldwide Delivery"
              subtitle="Fast & trusted shipping"
            />

            <Benefit
              icon={Heart}
              title="Support Artists"
              subtitle="Empower creativity"
            />

          </div>
        </section>

        {/* =====================================================
            SHOP BY CATEGORY
        ===================================================== */}
        <section className="px-8 pb-6 pt-7 sm:px-12 lg:px-16">

          <div className="mb-4 flex items-center justify-between">

            <h2 className="font-serif text-3xl font-semibold text-[#111111]">
              Shop by Category
            </h2>

            <button
              type="button"
              className="flex items-center gap-1 text-sm font-medium text-[#86151a]"
            >
              View all
              <ArrowRight size={16} />
            </button>

          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">

            {categories.map((category) => {
              const Icon = category.icon

              return (
                <div
                  key={category.name}
                  className="group overflow-hidden rounded-2xl border border-[#eee2d7] bg-[#fffaf3] transition hover:-translate-y-1 hover:shadow-md"
                >

                  <div className="relative h-[150px] overflow-hidden">

                    <img
                      src={category.image}
                      alt={category.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />

                    <div className="absolute bottom-[-20px] left-1/2 grid h-11 w-11 -translate-x-1/2 place-items-center rounded-full border border-[#e6d9ce] bg-white shadow-sm">

                      <Icon
                        size={20}
                        strokeWidth={1.7}
                        className="text-[#9b1117]"
                      />

                    </div>

                  </div>

                  <div className="flex h-12 items-end justify-center pb-3 pt-4">

                    <span className="text-sm font-medium text-[#171717]">
                      {category.name}
                    </span>

                  </div>

                </div>
              )
            })}

          </div>
        </section>

      </div>
    </main>
  )
}

/* =========================================================
   BENEFIT ITEM
   ========================================================= */

function Benefit({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-4 px-6 py-4">

      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#fcf0e8]">

        <Icon
          size={21}
          strokeWidth={1.7}
          className="text-[#9b1117]"
        />

      </div>

      <div>

        <p className="text-sm font-medium text-[#171717]">
          {title}
        </p>

        <p className="mt-1 text-xs text-[#77716b]">
          {subtitle}
        </p>

      </div>

    </div>
  )
}