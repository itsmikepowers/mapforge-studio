# Atlascope

A product concept and interactive market-intelligence dashboard for an open, provenance-first map data platform.

## What is here

- Live MapLibre map using OpenFreeMap / OpenStreetMap data
- Interactive 15-minute-neighborhood concept
- Competitor positioning matrix
- Open-map product strategy and developer quickstart concept
- Responsive, static Vite + React app with no API keys

## Free API

The deployed Vercel function serves a curated OpenStreetMap sample for Las Vegas, New York, London, and Tokyo. No key is required.

```bash
curl 'https://mapforge-studio.vercel.app/api/nearby?lat=36.1699&lon=-115.1398&category=food&radius=1200&limit=5'
```

Parameters:

- `lat`, `lon` — required center coordinates
- `category` — `all`, `food`, `parks`, or `transit`
- `radius` — 100–5,000 meters
- `limit` — 1–50 results

The bundled sample contains 151 real OSM records and can be refreshed with `python3 scripts/fetch_places.py` while respecting Nominatim's usage policy.

## Run locally

```bash
npm install
npm run dev
```

## Verify

```bash
npm run lint
npm run build
```

## Stack

React, TypeScript, Vite, MapLibre GL JS, OpenFreeMap, OpenStreetMap, Lucide.

Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright). Competitive pricing changes often; follow the source links in the app and recheck before making business decisions.
