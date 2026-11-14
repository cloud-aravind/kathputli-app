import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  ImagePlus,
  Save,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { artworksApi } from '../api/artworks'

const collections = [
  'Nature & Light',
  'Contemporary Expressions',
  'Everyday Moments',
  'New Works',
]

const availabilityOptions = ['Available', 'Unavailable']

export default function ArtworkEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [artwork, setArtwork] = useState(null)
  const [categories, setCategories] = useState([])
  const [formData, setFormData] = useState({
    title: '', description: '', category: '', collection: '', medium: '',
    dimensions: '', price: '', quantity: 1, availability: 'Available',
    tags: '', status: 'Inactive',
  })
  const [imagePreview, setImagePreview] = useState('')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [imageChanged, setImageChanged] = useState(false)

  useEffect(() => {
    let active = true
    artworksApi.get(id)
      .then(async (record) => {
        if (!active) return
        const categoryRows = record.artist_id
          ? await artworksApi.listCategories(record.artist_id).catch(() => [])
          : []
        if (!active) return
        setArtwork(record)
        setCategories(Array.isArray(categoryRows) ? categoryRows : [])
        setImagePreview(record.image_url || '')
        setFormData((current) => ({
          ...current,
          title: record.title || '',
          description: record.description || '',
          category: record.category_id || '',
          price: String(record.price ?? ''),
          quantity: String(record.stock ?? 0),
          availability: Number(record.stock) > 0 ? 'Available' : 'Unavailable',
          status: record.is_active ? 'Published' : 'Inactive',
        }))
      })
      .catch((error) => {
        if (active) toast.error(error?.response?.data?.error || 'Could not load artwork.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [id])

  if (loading || !artwork) {
    return (
      <div className="min-h-screen bg-[#f8f5ef] px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-stone-400">
            Artwork Management
          </p>

          <h1 className="mt-4 font-serif text-4xl text-stone-900">
            {loading ? 'Loading artwork…' : 'Artwork unavailable'}
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-stone-500">
            {loading ? 'Loading the saved backend artwork.' : 'The artwork could not be loaded. Check that the ID is valid and that this account owns it before saving changes.'}
          </p>

          <Link
            to="/artist/artworks"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-stone-800"
          >
            <ArrowLeft size={16} />
            Back to artworks
          </Link>
        </div>
      </div>
    )
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))

    setSaved(false)
  }

  const handleImageChange = (event) => {
    const file = event.target.files?.[0]

    if (!file) return

    const previewUrl = URL.createObjectURL(file)
    setImagePreview(previewUrl)
    setImageChanged(true)
    setSaved(false)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const price = Number(formData.price)
    const stock = Number(formData.quantity)
    if (!formData.title.trim() || !formData.description.trim() || !String(formData.price).trim() || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) {
      toast.error('Enter a title, description, non-negative price, and non-negative stock.')
      return
    }
    if (imageChanged) {
      toast.error('The selected image is only a local preview; image upload is not supported.')
      return
    }
    setSaving(true)
    try {
      await artworksApi.update(id, {
        category_id: formData.category || null,
        title: formData.title.trim(),
        description: formData.description.trim(),
        price,
        currency: artwork.currency || 'INR',
        image_url: artwork.image_url || '',
        stock: formData.availability === 'Available' ? stock : 0,
        is_active: formData.status === 'Published',
      })
      setSaved(true)
      toast.success('Artwork changes saved.')
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Could not save artwork changes.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f5ef]">
      {/* Header */}
      <section className="border-b border-stone-200 bg-[#f8f5ef]">
        <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                to="/artist/artworks"
                className="inline-flex items-center gap-2 text-sm text-stone-500 transition hover:text-stone-900"
              >
                <ArrowLeft size={16} />
                Back to artworks
              </Link>

              <div className="mt-6">
                <p className="text-xs uppercase tracking-[0.25em] text-stone-400">
                  Artist Studio
                </p>

                <h1 className="mt-2 font-serif text-4xl text-stone-900 sm:text-5xl">
                  Edit artwork
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-500">
                  Update the details, pricing, availability, and presentation
                  of your artwork.
                </p>
              </div>
            </div>

            <Link
              to="/artist/artworks"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
            >
              <X size={16} />
              Cancel
            </Link>
          </div>
        </div>
      </section>

      {/* Form */}
      <main className="mx-auto max-w-7xl px-6 py-10 sm:px-8 lg:px-10 lg:py-14">
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900" role="status">
          The backend saves title, description, category, price, stock, active status, and the existing image URL. It does not support file uploads, collections, medium, dimensions, or tags.
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            {/* Image */}
            <section className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
              <div className="mb-5">
                <p className="text-xs uppercase tracking-[0.22em] text-stone-400">
                  Artwork image
                </p>

                <h2 className="mt-2 font-serif text-2xl text-stone-900">
                  Presentation
                </h2>
              </div>

              <div className="overflow-hidden rounded-2xl bg-stone-100">
                <div className="aspect-[4/3]">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt={formData.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-stone-400">
                      <ImagePlus size={32} strokeWidth={1.5} />
                      <p className="mt-3 text-sm">No image selected</p>
                    </div>
                  )}
                </div>
              </div>

              <label className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-full border border-stone-300 px-5 py-3 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50">
                <ImagePlus size={17} />
                Change image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>

              <p className="mt-3 text-center text-xs leading-5 text-stone-400">
                  Local preview only; changing the image will not upload it.
              </p>

              {/* Status */}
              <div className="mt-8 border-t border-stone-200 pt-6">
                <label
                  htmlFor="status"
                  className="text-sm font-medium text-stone-800"
                >
                  Artwork status
                </label>

                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-stone-700"
                >
                  <option value="Published">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </section>

            {/* Details */}
            <section className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 lg:p-8">
              <div className="mb-8">
                <p className="text-xs uppercase tracking-[0.22em] text-stone-400">
                  Artwork information
                </p>

                <h2 className="mt-2 font-serif text-2xl text-stone-900">
                  Details
                </h2>
              </div>

              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label
                    htmlFor="title"
                    className="text-sm font-medium text-stone-800"
                  >
                    Artwork title
                  </label>

                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={formData.title}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-stone-700"
                    placeholder="Enter artwork title"
                  />
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="description"
                    className="text-sm font-medium text-stone-800"
                  >
                    Description
                  </label>

                  <textarea
                    id="description"
                    name="description"
                    rows={5}
                    value={formData.description}
                    onChange={handleChange}
                    className="mt-2 w-full resize-none rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm leading-6 text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-stone-700"
                    placeholder="Describe your artwork..."
                  />
                </div>

                {/* Category / Collection */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="category"
                      className="text-sm font-medium text-stone-800"
                    >
                      Category
                    </label>

                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-stone-700"
                    >
                      {!categories.some((category) => category.id === formData.category) && formData.category && (
                        <option value={formData.category}>{artwork.category_name || 'Current category'}</option>
                      )}
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="collection"
                      className="text-sm font-medium text-stone-800"
                    >
                      Collection
                    </label>

                    <select
                      id="collection"
                      name="collection"
                      value={formData.collection}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-stone-700"
                    >
                      {collections.map((collection) => (
                        <option key={collection} value={collection}>
                          {collection}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Medium */}
                <div>
                  <label
                    htmlFor="medium"
                    className="text-sm font-medium text-stone-800"
                  >
                    Medium
                  </label>

                  <input
                    id="medium"
                    name="medium"
                    type="text"
                    value={formData.medium}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-stone-700"
                    placeholder="e.g. Oil on Canvas"
                  />
                </div>

                {/* Dimensions / Price */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="dimensions"
                      className="text-sm font-medium text-stone-800"
                    >
                      Dimensions
                    </label>

                    <input
                      id="dimensions"
                      name="dimensions"
                      type="text"
                      value={formData.dimensions}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-stone-700"
                      placeholder="e.g. 24 × 30 inch"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="price"
                      className="text-sm font-medium text-stone-800"
                    >
                      Price
                    </label>

                    <div className="relative mt-2">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-stone-400">
                        ₹
                      </span>

                      <input
                        id="price"
                        name="price"
                        type="number"
                        min="0"
                        value={formData.price}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-stone-300 bg-white py-3 pl-9 pr-4 text-sm text-stone-800 outline-none transition focus:border-stone-700"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Quantity / Availability */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="quantity"
                      className="text-sm font-medium text-stone-800"
                    >
                      Quantity
                    </label>

                    <input
                      id="quantity"
                      name="quantity"
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-stone-700"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="availability"
                      className="text-sm font-medium text-stone-800"
                    >
                      Availability
                    </label>

                    <select
                      id="availability"
                      name="availability"
                      value={formData.availability}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-stone-700"
                    >
                      {availabilityOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label
                    htmlFor="tags"
                    className="text-sm font-medium text-stone-800"
                  >
                    Tags
                  </label>

                  <input
                    id="tags"
                    name="tags"
                    type="text"
                    value={formData.tags}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-stone-700"
                    placeholder="nature, landscape, contemporary"
                  />

                  <p className="mt-2 text-xs text-stone-400">
                    Separate multiple tags with commas.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-10 border-t border-stone-200 pt-6">
                {saved && (
                  <div className="mb-5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    <CheckCircle2 size={17} />
                    Artwork changes saved successfully.
                  </div>
                )}

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => navigate('/artist/artworks')}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 px-6 py-3 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#6f1d2f] px-7 py-3 text-sm font-medium text-white transition hover:bg-[#5b1727]"
                  >
                    <Save size={17} />
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </div>
            </section>
          </div>
        </form>
      </main>
    </div>
  )
}
