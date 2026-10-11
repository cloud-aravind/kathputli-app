import client from './client'

// Artwork Service endpoints implemented by the Kathputli backend.
export const artworksApi = {
  list: () => client.get('/api/artworks').then((r) => r.data),
  get: (id) => client.get(`/api/artworks/${id}`).then((r) => r.data),
  listByArtist: (artistId) =>
    client.get(`/api/artists/${artistId}/artworks`).then((r) => r.data),
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

const BHAVYA_GALLERY_IMAGES = [
  '/bhavya-pic-1.png',
  '/bhavya-pic-2.png',
  '/bhavya-pic-3.png',
  '/bhavya-pic-4.png',
  '/bhavya-pic-5.png',
  '/bhavya-pic-6.png',
]

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

  return aliases[key] || raw || 'Traditional Art'
}

function isUsableImage(url) {
  if (!url || typeof url !== 'string') return false
  const value = url.trim()
  if (!value) return false
  if (/placeholder|example\.com|via\.placeholder/i.test(value)) return false
  return value.startsWith('/') || value.startsWith('http://') || value.startsWith('https://')
}

function resolveArtworkImage(artwork, category, artist, index) {
  const provided = artwork.image_url || artwork.image
  if (isUsableImage(provided)) return provided.trim()

  if (/bhavya\s+rao/i.test(artist)) {
    return BHAVYA_GALLERY_IMAGES[index % BHAVYA_GALLERY_IMAGES.length]
  }

  return CATEGORY_IMAGES[category] || CATEGORY_IMAGES['Traditional Art']
}

export function mapArtwork(artwork, index = 0) {
  const artist = artwork.artist_name || artwork.artist || 'Independent Artist'
  const category = normalizeCategory(artwork.category_name || artwork.category)

  return {
    ...artwork,
    id: artwork.id,
    title: artwork.title,
    artist,
    price: Number(artwork.price || 0),
    category,
    image: resolveArtworkImage(artwork, category, artist, index),
    quantity: 1,
    stock: Number(artwork.stock || 0),
    is_active: Boolean(artwork.is_active),
  }
}
