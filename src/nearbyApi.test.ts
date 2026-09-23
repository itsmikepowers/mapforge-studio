import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchNearby } from './nearbyApi'

afterEach(() => vi.unstubAllGlobals())

describe('fetchNearby', () => {
  it('calls the public endpoint and returns places', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ count: 1, places: [{ id: 'node/1', name: 'Cafe' }], source: 'OpenStreetMap' }), { status: 200 }))
    vi.stubGlobal('fetch', mockFetch)
    const result = await fetchNearby(36.17, -115.14, 'cafe')
    expect(result.count).toBe(1)
    expect(mockFetch).toHaveBeenCalledWith('/api/nearby?lat=36.17&lon=-115.14&category=cafe&radius=1200&limit=20', expect.any(Object))
  })

  it('surfaces API errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'upstream unavailable' }), { status: 502 })))
    await expect(fetchNearby(1, 2, 'parks')).rejects.toThrow('upstream unavailable')
  })
})
