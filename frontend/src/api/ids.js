const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value) {
  if (typeof value === 'number') return false
  return UUID_PATTERN.test(String(value ?? ''))
}

export function uuidString(value) {
  if (!isUuid(value)) return null
  return String(value)
}

export function artworkRecordId(item) {
  if (!item || typeof item !== 'object') return item
  return item.artwork_id ?? item.id
}

export function keepValidArtworkRecords(items) {
  if (!Array.isArray(items)) return []
  return items.filter((item) => isUuid(artworkRecordId(item)))
}
