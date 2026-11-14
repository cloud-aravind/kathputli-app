import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, MapPin } from 'lucide-react'
import { artistsApi } from '../api/artists'
import { artworksApi, mapArtwork } from '../api/artworks'
import { isUuid } from '../api/ids'

function formatPrice(price, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency || 'INR',
    maximumFractionDigits: 0,
  }).format(Number(price) || 0)
}

export default function Artists() {
  const [artists, setArtists] = useState([])
  const [artworksByArtist, setArtworksByArtist] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadDirectory() {
      setLoading(true)
      setError('')
      try {
        const [artistData, artworkData] = await Promise.all([
          artistsApi.list(),
          // The public active catalogue is available without seller authentication.
          // Group by artist_id because listByArtist is an owner-only management route.
          artworksApi.list(),
        ])
        if (!active) return

        const artistRows = Array.isArray(artistData)
          ? artistData
          : (artistData?.artists || [])
        const publicArtists = artistRows.filter((artist) => isUuid(artist?.id))
        const artworkRows = Array.isArray(artworkData)
          ? artworkData
          : (artworkData?.artworks || [])

        const grouped = {}
        artworkRows.forEach((row, index) => {
          if (!isUuid(row?.id) || !isUuid(row?.artist_id)) return
          const artwork = mapArtwork(row, index)
          if (!grouped[artwork.artist_id]) grouped[artwork.artist_id] = []
          grouped[artwork.artist_id].push(artwork)
        })

        setArtists(publicArtists)
        setArtworksByArtist(grouped)
      } catch (loadError) {
        if (active) {
          setError(loadError?.response?.data?.error || 'The artist directory is unavailable right now.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadDirectory()
    return () => { active = false }
  }, [])

  const artistsWithArtworks = useMemo(
    () => artists.map((artist) => ({
      ...artist,
      artworks: artworksByArtist[artist.id] || [],
    })),
    [artists, artworksByArtist]
  )

  return (
    <main className="min-h-screen bg-[#faf9f6] px-4 py-8 text-[#201b18] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-10 border-b border-[#e7ddd3] pb-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#a36d16]">
            Meet the makers
          </p>
          <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
                Artists of Kathputli
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#716860] sm:text-base">
                Discover the artists behind the works in our collection.
              </p>
            </div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 self-start rounded-full border border-[#e3d9cf] bg-white px-5 py-3 text-sm font-medium transition hover:border-[#7d1e1e] hover:text-[#7d1e1e] sm:self-auto"
            >
              Browse artworks <ArrowRight size={16} />
            </Link>
          </div>
        </header>

        {loading ? (
          <p className="py-16 text-center text-sm text-stone-500">Loading artists…</p>
        ) : error ? (
          <div className="rounded-2xl border border-stone-200 bg-white px-6 py-12 text-center">
            <p className="text-sm text-stone-600">{error}</p>
          </div>
        ) : artistsWithArtworks.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-white px-6 py-12 text-center">
            <h2 className="font-serif text-2xl">No artist profiles yet</h2>
            <p className="mt-2 text-sm text-stone-500">Artist profiles will appear here when they join the catalogue.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {artistsWithArtworks.map((artist) => (
              <section
                key={artist.id}
                className="overflow-hidden rounded-[24px] border border-[#eee5dc] bg-[#fffdf9] shadow-[0_4px_25px_rgba(60,35,15,0.06)]"
              >
                <div className="flex flex-col gap-5 border-b border-[#eee6df] p-6 sm:flex-row sm:items-start sm:justify-between sm:p-8">
                  <div className="max-w-3xl">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#a36d16]">Artist</p>
                    <h2 className="mt-2 font-serif text-3xl font-semibold text-[#171412]">{artist.name}</h2>
                    {(artist.city || artist.state || artist.country) && (
                      <p className="mt-2 flex items-center gap-2 text-sm text-[#68605a]">
                        <MapPin size={15} />
                        {[artist.city, artist.state, artist.country].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {artist.bio && <p className="mt-4 text-sm leading-6 text-[#514943]">{artist.bio}</p>}
                  </div>
                  <p className="shrink-0 text-sm text-[#716963]">
                    {artist.artworks.length} {artist.artworks.length === 1 ? 'artwork' : 'artworks'}
                  </p>
                </div>

                {artist.artworks.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 sm:p-7">
                    {artist.artworks.map((artwork) => (
                      <article key={artwork.id} className="overflow-hidden rounded-xl border border-[#eee5dc] bg-white">
                        <div className="aspect-[4/3] overflow-hidden bg-[#eee8e1]">
                          <img src={artwork.image} alt={artwork.title} className="h-full w-full object-cover" />
                        </div>
                        <div className="p-3">
                          <h3 className="truncate text-sm font-semibold">{artwork.title}</h3>
                          <p className="mt-2 text-sm font-medium text-[#7d1e1e]">
                            {formatPrice(artwork.price, artwork.currency)}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="px-6 py-7 text-sm text-stone-500">No active artworks are listed for this artist yet.</p>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
