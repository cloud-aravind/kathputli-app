import client from './client'
import { uuidString } from './ids'

export { isUuid as isBackendArtworkId } from './ids'

// Artwork Service endpoints implemented by the Kathputli backend.
export const artworksApi = {
  list: () => client.get('/api/artworks').then((r) => r.data),
  get: (id) => {
    const artworkId = uuidString(id)
    if (!artworkId) return Promise.reject(new Error('invalid artwork id'))
    return client.get(`/api/artworks/${artworkId}`).then((r) => r.data)
  },
  listByArtist: (artistId) => {
    const id = uuidString(artistId)
    if (!id) return Promise.reject(new Error('invalid artist id'))
    return client.get(`/api/artists/${id}/artworks`).then((r) => r.data)
  },
  listCategories: (artistId) =>
    client.get(`/api/artists/${artistId}/categories`).then((r) => r.data),
  createCategory: (artistId, payload) =>
    client.post(`/api/artists/${artistId}/categories`, payload).then((r) => r.data),
  create: (artistId, payload) =>
    client.post(`/api/artists/${artistId}/artworks`, payload).then((r) => r.data),
  update: (id, payload) =>
    client.put(`/api/artworks/${id}`, payload).then((r) => r.data),
  remove: (id) => client.delete(`/api/artworks/${id}`).then((r) => r.data),
}

// Shop category thumbnails live in frontend/public. Bhavya Rao's paintings use
// a separate gallery and should not be assigned to unrelated catalogue items.
const CATEGORY_IMAGES = {
  Paintings: '/category-paintings.jpg',
  'Digital Art': '/category-digital-art.jpg',
  'Traditional Art': '/category-traditional-art.jpg',
  'Famous Artworks': '/category-famous-artworks.jpg',
  Sculptures: '/category-sculptures.jpg',
  Photography: '/category-photography.jpg',
}

function normalizeCategory(value) {
  const raw = String(value || '').trim()
  if (CATEGORY_IMAGES[raw]) return raw

  const key = raw.toLowerCase().replace(/[_-]+/g, ' ')
  const aliases = {
    painting: 'Paintings',
    paintings: 'Paintings',
    digital: 'Digital Art',
    'digital art': 'Digital Art',
    traditional: 'Traditional Art',
    'traditional art': 'Traditional Art',
    famous: 'Famous Artworks',
    'famous artworks': 'Famous Artworks',
    sculpture: 'Sculptures',
    sculptures: 'Sculptures',
    photography: 'Photography',
  }

  return aliases[key] || raw || 'Uncategorized'
}

function isUsableImage(url) {
  if (!url || typeof url !== 'string') return false
  const value = url.trim()
  if (!value) return false
  if (/placeholder|example\.com|via\.placeholder/i.test(value)) return false
  return value.startsWith('/') || value.startsWith('http://') || value.startsWith('https://')
}

function resolveArtworkImage(artwork, category) {
  const provided = artwork.image_url || artwork.image
  if (isUsableImage(provided)) return provided.trim()

  return CATEGORY_IMAGES[category] || CATEGORY_IMAGES['Traditional Art']
}

// Display-only creator attribution parsed from catalogue copy.
// Never treat this value as artists.id or as an owning artist profile.
export function extractCreditedName(artwork) {
  const desc = String(artwork?.description || '').trim()
  if (desc) {
    const match = desc.match(/\bby\s+([A-Za-z\s]+?)(?:\s*[-–—,]|\s*$)/i)
    if (match && match[1]) {
      const extracted = match[1].trim()
      if (extracted.length > 2 && !/^(the|a|an)$/i.test(extracted)) {
        return extracted
      }
    }
  }

  return ''
}

export function mapArtwork(artwork) {
  const creditedName = extractCreditedName(artwork)
  const rawCategory = artwork.category_name || artwork.category
  const category = normalizeCategory(rawCategory)
  const imageMissing = !isUsableImage(artwork.image_url || artwork.image)

  return {
    ...artwork,
    id: uuidString(artwork.id) || artwork.id,
    artist_id: uuidString(artwork.artist_id),
    title: artwork.title,
    credited_name: creditedName,
    // Owning profile name is resolved from Artist Service via artist_id.
    artist: '',
    price: Number(artwork.price || 0),
    currency: String(artwork.currency || 'INR').toUpperCase(),
    category,
    image: resolveArtworkImage(artwork, category),
    image_missing: imageMissing,
    quantity: 1,
    stock: Number(artwork.stock || 0),
    is_active: Boolean(artwork.is_active),
  }
}
