import placesData from '../server/data/places'
import { filterPlaces, parseNearbyParams } from '../server/nearby'

type RequestLike = { method?: string; url?: string }
type ResponseLike = {
  setHeader(name: string, value: string): ResponseLike
  status(code: number): ResponseLike
  json(value: unknown): ResponseLike
  end(): ResponseLike
}

export const config = { maxDuration: 10 }

function setCommonHeaders(response: ResponseLike) {
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
}

export default function handler(request: RequestLike, response: ResponseLike) {
  setCommonHeaders(response)
  if (request.method === 'OPTIONS') return response.status(204).end()
  if (request.method !== 'GET') return response.status(405).json({ error: 'Method not allowed' })

  try {
    const url = new URL(request.url || '/api/nearby', 'https://mapforge-studio.vercel.app')
    const params = parseNearbyParams(url)
    const places = filterPlaces(placesData, params)
    response.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600')
    return response.status(200).json({
      query: params,
      count: places.length,
      places,
      source: 'OpenStreetMap',
      attribution: '© OpenStreetMap contributors',
      dataVersion: '2026-09-17',
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown API error'
    const clientError = message.includes('required') || message.includes('between') || message.includes('must be a number')
    response.setHeader('Cache-Control', 'no-store')
    return response.status(clientError ? 400 : 500).json({ error: message })
  }
}
