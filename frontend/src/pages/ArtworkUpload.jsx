import { useRef, useState } from 'react'
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Image as ImageIcon,
  Info,
  Plus,
  Save,
  Upload,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const categories = [
  'Paintings',
  'Digital Art',
  'Traditional Art',
  'Famous Artworks',
  'Sculptures',
  'Photography',
]

const collections = [
  'Nature & Light',
  'Contemporary Expressions',
  'Everyday Moments',
  'New Works',
]

const mediums = [
  'Oil on Canvas',
  'Acrylic on Canvas',
  'Watercolor',
  'Mixed Media',
  'Digital',
  'Charcoal',
  'Other',
]

export default function ArtworkUpload() {
  const fileInputRef = useRef(null)

  const [image, setImage] = useState(null)
  const [imageName, setImageName] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    collection: '',
    medium: '',
    width: '',
    height: '',
    depth: '',
    price: '',
    quantity: '1',
    tags: '',
    availability: 'Available',
  })

  const [saved, setSaved] = useState(false)

  const handleInputChange = (event) => {
    const { name, value } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))

    setSaved(false)
  }

  const handleImage = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      return
    }

    setImageName(file.name)

    const reader = new FileReader()

    reader.onload = (event) => {
      setImage(event.target.result)
    }

    reader.readAsDataURL(file)
    setSaved(false)
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]

    if (file) {
      handleImage(file)
    }
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragging(false)

    const file = event.dataTransfer.files?.[0]

    if (file) {
      handleImage(file)
    }
  }

  const removeImage = () => {
    setImage(null)
    setImageName('')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSaveDraft = (event) => {
    event.preventDefault()
    setSaved(true)
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    // UI-only for now.
    setSaved(true)
  }

  return (
    <main className="min-h-screen bg-[#faf8f5] px-4 py-5 text-stone-900 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-6xl">
        {/* Breadcrumb */}
        <div className="mb-7 flex items-center gap-2 text-xs text-stone-400">
          <Link
            to="/"
            className="transition hover:text-[#741f2b]"
          >
            Home
          </Link>

          <span>/</span>

          <Link
            to="/artist/dashboard"
            className="transition hover:text-[#741f2b]"
          >
            Artist Dashboard
          </Link>

          <span>/</span>

          <span className="text-stone-600">
            Upload Artwork
          </span>
        </div>

        {/* Page Header */}
        <section className="mb-8">
          <Link
            to="/artist/dashboard"
            className="mb-4 inline-flex items-center gap-2 text-sm text-stone-500 transition hover:text-[#741f2b]"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#9b6a5d]">
                Artist Studio
              </p>

              <h1 className="mt-2 font-serif text-3xl text-[#3b2020] sm:text-4xl">
                Upload artwork
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
                Add a new artwork to your studio and share it with
                collectors on Kathputli.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-stone-400">
              <span className="h-2 w-2 rounded-full bg-green-600" />
              Artist: Bhavya Rao
            </div>
          </div>
        </section>

        {/* Success Message */}
        {saved && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100">
              <Check size={15} />
            </div>

            <div>
              <p className="font-medium">
                Artwork saved successfully
              </p>
              <p className="mt-0.5 text-xs text-green-700">
                This is currently a UI preview. Backend submission will
                be connected later.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
            {/* ==================================================
                LEFT COLUMN — IMAGE
                ================================================== */}

            <section className="h-fit rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_8px_30px_rgba(58,28,20,0.04)] sm:p-6">
              <div className="mb-5">
                <p className="text-xs uppercase tracking-[0.15em] text-[#9b6a5d]">
                  Artwork image
                </p>

                <h2 className="mt-1 font-serif text-2xl text-stone-900">
                  Add your artwork
                </h2>

                <p className="mt-2 text-xs leading-5 text-stone-500">
                  Upload a high-quality image of the artwork you want
                  collectors to see.
                </p>
              </div>

              {/* Upload Area */}
              {!image ? (
                <div
                  onDragOver={(event) => {
                    event.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex aspect-[4/3] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition ${
                    isDragging
                      ? 'border-[#741f2b] bg-[#fcf3f0]'
                      : 'border-[#ded5cd] bg-[#faf8f5] hover:border-[#b9968c] hover:bg-[#fcfaf8]'
                  }`}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f5eae5] text-[#741f2b]">
                    <Upload size={23} strokeWidth={1.7} />
                  </div>

                  <p className="mt-4 text-sm font-medium text-stone-800">
                    Drop your artwork here
                  </p>

                  <p className="mt-1 text-xs text-stone-400">
                    or click to browse from your computer
                  </p>

                  <span className="mt-4 rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-medium text-stone-600">
                    Choose image
                  </span>

                  <p className="mt-4 text-[10px] text-stone-400">
                    JPG, PNG or WEBP · Recommended 4:3 ratio
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-stone-100">
                  <div className="aspect-[4/3]">
                    <img
                      src={image}
                      alt="Artwork preview"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-stone-700 shadow-sm transition hover:bg-white hover:text-[#741f2b]"
                    aria-label="Remove artwork image"
                  >
                    <X size={17} />
                  </button>

                  <div className="border-t border-stone-200 bg-white px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ImageIcon
                        size={15}
                        className="text-[#741f2b]"
                      />

                      <p className="min-w-0 flex-1 truncate text-xs text-stone-600">
                        {imageName}
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          fileInputRef.current?.click()
                        }
                        className="text-xs font-medium text-[#741f2b] hover:underline"
                      >
                        Change
                      </button>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </div>
              )}

              {/* Image Guidelines */}
              <div className="mt-5 rounded-xl bg-[#faf8f5] p-4">
                <div className="flex gap-3">
                  <Info
                    size={16}
                    className="mt-0.5 shrink-0 text-[#741f2b]"
                  />

                  <div>
                    <p className="text-xs font-medium text-stone-700">
                      Image guidelines
                    </p>

                    <ul className="mt-2 space-y-1 text-[11px] leading-5 text-stone-500">
                      <li>• Use a clear, well-lit photograph.</li>
                      <li>• Avoid excessive filters or watermarks.</li>
                      <li>• Recommended minimum: 1200 × 900 px.</li>
                      <li>• Use an image you own the rights to.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* ==================================================
                RIGHT COLUMN — DETAILS
                ================================================== */}

            <div className="space-y-8">
              {/* Basic Information */}
              <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_8px_30px_rgba(58,28,20,0.04)] sm:p-7">
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-[0.15em] text-[#9b6a5d]">
                    Basic information
                  </p>

                  <h2 className="mt-1 font-serif text-2xl text-stone-900">
                    Tell us about your artwork
                  </h2>
                </div>

                <div className="space-y-5">
                  {/* Title */}
                  <Field label="Artwork title" required>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g. Golden Reflections"
                      className="form-input"
                    />
                  </Field>

                  {/* Description */}
                  <Field label="Description" required>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={5}
                      placeholder="Tell collectors about the inspiration, story, or feeling behind this artwork..."
                      className="form-input resize-none"
                    />

                    <p className="mt-1.5 text-right text-[10px] text-stone-400">
                      {formData.description.length} / 1000
                    </p>
                  </Field>

                  {/* Category + Collection */}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Category" required>
                      <SelectField
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        placeholder="Select category"
                        options={categories}
                      />
                    </Field>

                    <Field label="Collection">
                      <SelectField
                        name="collection"
                        value={formData.collection}
                        onChange={handleInputChange}
                        placeholder="Select collection"
                        options={collections}
                      />
                    </Field>
                  </div>

                  {/* Medium */}
                  <Field label="Medium" required>
                    <SelectField
                      name="medium"
                      value={formData.medium}
                      onChange={handleInputChange}
                      placeholder="Select medium"
                      options={mediums}
                    />
                  </Field>
                </div>
              </section>

              {/* Dimensions & Pricing */}
              <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_8px_30px_rgba(58,28,20,0.04)] sm:p-7">
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-[0.15em] text-[#9b6a5d]">
                    Artwork details
                  </p>

                  <h2 className="mt-1 font-serif text-2xl text-stone-900">
                    Size and pricing
                  </h2>
                </div>

                <div className="space-y-6">
                  {/* Dimensions */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-stone-700">
                      Dimensions
                    </label>

                    <div className="grid grid-cols-3 gap-3">
                      <DimensionField
                        name="width"
                        value={formData.width}
                        onChange={handleInputChange}
                        placeholder="Width"
                      />

                      <DimensionField
                        name="height"
                        value={formData.height}
                        onChange={handleInputChange}
                        placeholder="Height"
                      />

                      <DimensionField
                        name="depth"
                        value={formData.depth}
                        onChange={handleInputChange}
                        placeholder="Depth"
                      />
                    </div>

                    <p className="mt-2 text-[10px] text-stone-400">
                      Measurements in inches. Depth is optional for
                      two-dimensional artwork.
                    </p>
                  </div>

                  {/* Price + Quantity */}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Price" required>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-stone-400">
                          ₹
                        </span>

                        <input
                          type="number"
                          name="price"
                          min="0"
                          value={formData.price}
                          onChange={handleInputChange}
                          placeholder="650"
                          className="form-input pl-9"
                        />
                      </div>
                    </Field>

                    <Field label="Quantity">
                      <input
                        type="number"
                        name="quantity"
                        min="1"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        className="form-input"
                      />
                    </Field>
                  </div>

                  {/* Availability */}
                  <Field label="Availability">
                    <SelectField
                      name="availability"
                      value={formData.availability}
                      onChange={handleInputChange}
                      options={[
                        'Available',
                        'Sold',
                        'Reserved',
                      ]}
                    />
                  </Field>
                </div>
              </section>

              {/* Tags */}
              <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_8px_30px_rgba(58,28,20,0.04)] sm:p-7">
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-[0.15em] text-[#9b6a5d]">
                    Discoverability
                  </p>

                  <h2 className="mt-1 font-serif text-2xl text-stone-900">
                    Add tags
                  </h2>

                  <p className="mt-2 text-xs leading-5 text-stone-500">
                    Add a few words that help collectors discover your
                    artwork.
                  </p>
                </div>

                <Field label="Tags">
                  <div className="relative">
                    <Plus
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
                    />

                    <input
                      type="text"
                      name="tags"
                      value={formData.tags}
                      onChange={handleInputChange}
                      placeholder="nature, landscape, contemporary, light"
                      className="form-input pl-10"
                    />
                  </div>

                  <p className="mt-2 text-[10px] text-stone-400">
                    Separate tags with commas.
                  </p>
                </Field>
              </section>

              {/* Submit Actions */}
              <section className="rounded-2xl border border-[#e5d9d2] bg-[#f7eee9] p-5 sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-[#3b2020]">
                      Ready to publish?
                    </h3>

                    <p className="mt-1 max-w-md text-xs leading-5 text-[#75635d]">
                      You can save your artwork as a draft and finish
                      it later, or submit it for publishing.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d8c8c0] bg-white px-5 py-2.5 text-sm font-medium text-stone-700 transition hover:border-[#741f2b] hover:text-[#741f2b]"
                    >
                      <Save size={16} />
                      Save Draft
                    </button>

                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#741f2b] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#5f1823]"
                    >
                      <Upload size={16} />
                      Submit Artwork
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </form>
      </div>

      {/* Local utility styles */}
      <style>{`
        .form-input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid #e5ddd5;
          background: #ffffff;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          color: #29231f;
          outline: none;
          transition: border-color 150ms ease, box-shadow 150ms ease;
        }

        .form-input::placeholder {
          color: #aaa19a;
        }

        .form-input:focus {
          border-color: #9f6b61;
          box-shadow: 0 0 0 3px rgba(116, 31, 43, 0.06);
        }
      `}</style>
    </main>
  )
}


// ============================================================
// FIELD
// ============================================================

function Field({ label, required = false, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-stone-700">
        {label}

        {required && (
          <span className="ml-1 text-[#741f2b]">*</span>
        )}
      </label>

      {children}
    </div>
  )
}


// ============================================================
// SELECT FIELD
// ============================================================

function SelectField({
  name,
  value,
  onChange,
  placeholder,
  options,
}) {
  return (
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="form-input appearance-none pr-10"
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-stone-400"
      />
    </div>
  )
}


// ============================================================
// DIMENSION FIELD
// ============================================================

function DimensionField({
  name,
  value,
  onChange,
  placeholder,
}) {
  return (
    <div className="relative">
      <input
        type="number"
        name={name}
        min="0"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="form-input pr-10"
      />

      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-stone-400">
        in
      </span>
    </div>
  )
}