export type NearbyParams = {
  lat: number
  lon: number
  category: string
  radius: number
  limit: number
}

export type OverpassElement = {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

export type NominatimResult = {
  osm_type: string
  osm_id: number
  lat: string
  lon: string
  name?: string
  type?: string
  category?: string
  display_name?: string
  extratags?: Record<string, string>
}

const categoryTags: Record<string, Array<[string, string]>> = {
  all: [['amenity', '.'], ['shop', '.'], ['leisure', 'park|garden|playground']],
  cafe: [['amenity', 'cafe']],
  food: [['amenity', 'restaurant|cafe|fast_food|bar']],
  parks: [['leisure', 'park|garden|playground']],
  transit: [['highway', 'bus_stop'], ['public_transport', 'platform|station'], ['railway', 'station|halt|tram_stop']],
  health: [['amenity', 'hospital|clinic|pharmacy|doctors|dentist']],
  shops: [['shop', '.']],
  culture: [['amenity', 'library|theatre|arts_centre|cinema'], ['tourism', 'museum|gallery|attraction']],
}

const nominatimTerms: Record<string, string> = {
  all: 'cafe', cafe: 'cafe', food: 'restaurant', parks: 'park', transit: 'transit station',
  health: 'pharmacy', shops: 'shop', culture: 'museum',
}

export function normalizeCategory(value: string) {
  return categoryTags[value.toLowerCase()] ?? categoryTags.all
}

function boundedNumber(raw: string | null, fallback: number, min: number, max: number) {
  if (raw === null || raw.trim() === '') return fallback
  const value = Number(raw)
  if (!Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, value))
}

export function parseNearbyParams(url: URL): NearbyParams {
  const rawLat = url.searchParams.get('lat')
  const rawLon = url.searchParams.get('lon')
  if (rawLat === null || rawLat.trim() === '') throw new Error('lat is required')
  if (rawLon === null || rawLon.trim() === '') throw new Error('lon is required')
  const lat = Number(rawLat)
  const lon = Number(rawLon)
  if (!Number.isFinite(lat)) throw new Error('lat must be a number')
  if (!Number.isFinite(lon)) throw new Error('lon must be a number')
  if (lat < -90 || lat > 90) throw new Error('lat must be between -90 and 90')
  if (lon < -180 || lon > 180) throw new Error('lon must be between -180 and 180')
  return {
    lat,
    lon,
    category: (url.searchParams.get('category') || 'all').toLowerCase(),
    radius: Math.round(boundedNumber(url.searchParams.get('radius'), 1000, 100, 5000)),
    limit: Math.round(boundedNumber(url.searchParams.get('limit'), 20, 1, 50)),
  }
}

export function buildOverpassQuery(params: NearbyParams) {
  const around = `(around:${params.radius},${params.lat},${params.lon})`
  const statements = normalizeCategory(params.category).flatMap(([key, value]) =>
    ['node', 'way', 'relation'].map((kind) => `${kind}${around}["${key}"~"${value}",i];`),
  )
  return `[out:json][timeout:12];(${statements.join('')});out center tags ${params.limit};`
}

export function buildNominatimUrl(params: NearbyParams) {
  const latDelta = params.radius / 111320
  const lonDelta = params.radius / (111320 * Math.max(0.2, Math.cos(params.lat * Math.PI / 180)))
  const viewbox = [params.lon - lonDelta, params.lat + latDelta, params.lon + lonDelta, params.lat - latDelta]
  const search = new URLSearchParams({
    format: 'jsonv2',
    q: nominatimTerms[params.category] ?? nominatimTerms.all,
    viewbox: viewbox.map((value) => value.toFixed(6)).join(','),
    bounded: '1',
    limit: String(params.limit),
    addressdetails: '1',
    extratags: '1',
  })
  return `https://nominatim.openstreetmap.org/search?${search}`
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const rad = Math.PI / 180
  const dLat = (lat2 - lat1) * rad
  const dLon = (lon2 - lon1) * rad
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2
  return Math.round(6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

export function filterPlaces<T extends { group: string; coordinates: readonly [number, number] }>(places: readonly T[], params: NearbyParams) {
  return places
    .filter((place) => place.group === params.category)
    .map((place) => ({ ...place, distanceMeters: haversineMeters(params.lat, params.lon, place.coordinates[1], place.coordinates[0]) }))
    .filter((place) => place.distanceMeters <= params.radius)
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, params.limit)
}

export function toPlace(element: OverpassElement, originLat: number, originLon: number) {
  const lat = element.lat ?? element.center?.lat
  const lon = element.lon ?? element.center?.lon
  if (lat === undefined || lon === undefined) return null
  const tags = element.tags ?? {}
  const category = tags.amenity ?? tags.shop ?? tags.leisure ?? tags.tourism ?? tags.public_transport ?? tags.railway ?? tags.highway ?? 'place'
  return {
    id: `${element.type}/${element.id}`,
    name: tags.name ?? `Unnamed ${category.replaceAll('_', ' ')}`,
    category,
    coordinates: [lon, lat] as [number, number],
    distanceMeters: haversineMeters(originLat, originLon, lat, lon),
    address: [tags['addr:housenumber'], tags['addr:street'], tags['addr:city']].filter(Boolean).join(' ') || null,
    openingHours: tags.opening_hours ?? null,
    website: tags.website ?? tags['contact:website'] ?? null,
    source: 'OpenStreetMap',
    osmUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
  }
}

export function toPlaceFromNominatim(result: NominatimResult, originLat: number, originLon: number) {
  const lat = Number(result.lat)
  const lon = Number(result.lon)
  const osmType = result.osm_type === 'N' ? 'node' : result.osm_type === 'W' ? 'way' : result.osm_type === 'R' ? 'relation' : result.osm_type.toLowerCase()
  return {
    id: `${osmType}/${result.osm_id}`,
    name: result.name || result.display_name?.split(',')[0] || `Unnamed ${result.type || 'place'}`,
    category: result.type || result.category || 'place',
    coordinates: [lon, lat] as [number, number],
    distanceMeters: haversineMeters(originLat, originLon, lat, lon),
    address: result.display_name || null,
    openingHours: result.extratags?.opening_hours || null,
    website: result.extratags?.website || result.extratags?.['contact:website'] || null,
    source: 'OpenStreetMap',
    osmUrl: `https://www.openstreetmap.org/${osmType}/${result.osm_id}`,
  }
}
