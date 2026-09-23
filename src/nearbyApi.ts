export type Place = {
  id: string
  name: string
  category: string
  coordinates: [number, number]
  distanceMeters: number
  address: string | null
  openingHours: string | null
  website: string | null
  source: 'OpenStreetMap'
  osmUrl: string
}

export type NearbyResponse = {
  count: number
  places: Place[]
  source: 'OpenStreetMap'
  attribution: string
  generatedAt: string
}

export async function fetchNearby(lat: number, lon: number, category: string, signal?: AbortSignal): Promise<NearbyResponse> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    category,
    radius: '1200',
    limit: '20',
  })
  const response = await fetch(`/api/nearby?${params}`, { signal })
  const body = await response.json()
  if (!response.ok) throw new Error(body.error || 'Could not load nearby places')
  return body as NearbyResponse
}
