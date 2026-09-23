import { describe, expect, it } from 'vitest'
import { buildNominatimUrl, buildOverpassQuery, filterPlaces, normalizeCategory, parseNearbyParams, toPlace, toPlaceFromNominatim } from '../server/nearby'

describe('parseNearbyParams', () => {
  it('accepts valid coordinates, category and radius', () => {
    expect(parseNearbyParams(new URL('https://example.com?lat=36.17&lon=-115.14&category=cafe&radius=1200')))
      .toEqual({ lat: 36.17, lon: -115.14, category: 'cafe', radius: 1200, limit: 20 })
  })

  it('rejects coordinates outside the world', () => {
    expect(() => parseNearbyParams(new URL('https://example.com?lat=91&lon=0'))).toThrow('lat must be between -90 and 90')
  })

  it('caps radius and limit for the public upstream', () => {
    expect(parseNearbyParams(new URL('https://example.com?lat=1&lon=2&radius=99999&limit=200')))
      .toMatchObject({ radius: 5000, limit: 50 })
  })
})

describe('OpenStreetMap query helpers', () => {
  it('filters the bundled open data by category, radius and limit', () => {
    const data = [
      { id: 'node/1', group: 'food', coordinates: [-115.14, 36.17] as [number, number] },
      { id: 'node/2', group: 'parks', coordinates: [-115.14, 36.17] as [number, number] },
      { id: 'node/3', group: 'food', coordinates: [-118, 40] as [number, number] },
    ]
    expect(filterPlaces(data, { lat: 36.17, lon: -115.14, radius: 1200, category: 'food', limit: 10 }).map((place) => place.id)).toEqual(['node/1'])
  })

  it('builds a bounded Nominatim request around the requested point', () => {
    const url = new URL(buildNominatimUrl({ lat: 36.17, lon: -115.14, radius: 1200, category: 'food', limit: 20 }))
    expect(url.hostname).toBe('nominatim.openstreetmap.org')
    expect(url.searchParams.get('q')).toBe('restaurant')
    expect(url.searchParams.get('bounded')).toBe('1')
  })

  it('normalizes a Nominatim result into a public place', () => {
    expect(toPlaceFromNominatim({ osm_type: 'node', osm_id: 8, lat: '36.171', lon: '-115.141', name: 'eat.', type: 'restaurant', display_name: 'eat., Downtown Las Vegas' }, 36.17, -115.14))
      .toMatchObject({ id: 'node/8', name: 'eat.', category: 'restaurant', source: 'OpenStreetMap', coordinates: [-115.141, 36.171] })
  })

  it('maps friendly categories to OSM tags', () => {
    expect(normalizeCategory('food')).toEqual([['amenity', 'restaurant|cafe|fast_food|bar']])
    expect(normalizeCategory('parks')).toEqual([['leisure', 'park|garden|playground']])
  })

  it('builds a bounded Overpass query', () => {
    const query = buildOverpassQuery({ lat: 36.17, lon: -115.14, radius: 800, category: 'transit', limit: 20 })
    expect(query).toContain('[out:json][timeout:12]')
    expect(query).toContain('(around:800,36.17,-115.14)')
    expect(query).toContain('["highway"~"bus_stop",i]')
  })

  it('normalizes an Overpass element into a public place', () => {
    expect(toPlace({ type: 'node', id: 42, lat: 36.1, lon: -115.2, tags: { name: 'Sunrise Cafe', amenity: 'cafe', opening_hours: 'Mo-Fr 08:00-17:00' } }, 36.17, -115.14))
      .toMatchObject({ id: 'node/42', name: 'Sunrise Cafe', category: 'cafe', source: 'OpenStreetMap', coordinates: [-115.2, 36.1] })
  })
})
