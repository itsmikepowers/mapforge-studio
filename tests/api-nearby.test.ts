import { afterEach, describe, expect, it, vi } from 'vitest'
import handler from '../api/nearby'

afterEach(() => vi.unstubAllGlobals())

function invoke(url: string, method = 'GET') {
  let statusCode = 200
  let body: unknown
  const headers = new Map<string, string>()
  const request = { method, url }
  const response = {
    status(code: number) { statusCode = code; return this },
    setHeader(name: string, value: string) { headers.set(name.toLowerCase(), String(value)); return this },
    json(value: unknown) { body = value; return this },
    end() { return this },
  }
  return Promise.resolve(handler(request, response)).then(() => ({ statusCode, body: body as Record<string, unknown>, headers }))
}

describe('GET /api/nearby', () => {
  it('returns a 400 response for missing coordinates', async () => {
    const result = await invoke('/api/nearby')
    expect(result.statusCode).toBe(400)
    expect(result.body).toMatchObject({ error: 'lat is required' })
  })

  it('returns nearby places without a runtime upstream dependency', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('The API must not depend on a live upstream'))
    vi.stubGlobal('fetch', mockFetch)

    const result = await invoke('/api/nearby?lat=36.17&lon=-115.14&category=food&radius=1200')
    expect(result.statusCode).toBe(200)
    expect(result.body.source).toBe('OpenStreetMap')
    expect(result.body.count).toBeGreaterThan(0)
    expect(result.body.places).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Triple George Grill', category: 'restaurant' })]))
    expect(mockFetch).not.toHaveBeenCalled()
    expect(result.headers.get('cache-control')).toContain('s-maxage=300')
  })
})
