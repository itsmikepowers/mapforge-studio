import json, math, time, urllib.parse, urllib.request
from pathlib import Path

cities = {
    'Las Vegas': (36.1699, -115.1398),
    'New York': (40.7128, -74.0060),
    'London': (51.5072, -0.1276),
    'Tokyo': (35.6895, 139.6917),
}
terms = {'food': 'restaurant', 'parks': 'park', 'transit': 'station', 'all': 'cafe'}
rows = []
for city, (lat, lon) in cities.items():
    lat_delta = 0.03
    lon_delta = 0.03 / max(0.2, math.cos(math.radians(lat)))
    viewbox = f'{lon-lon_delta},{lat+lat_delta},{lon+lon_delta},{lat-lat_delta}'
    for category, term in terms.items():
        params = urllib.parse.urlencode({'format':'jsonv2','q':term,'viewbox':viewbox,'bounded':1,'limit':10,'addressdetails':1,'extratags':1})
        request = urllib.request.Request('https://nominatim.openstreetmap.org/search?' + params, headers={'User-Agent':'Atlascope/1.0 (https://mapforge-studio.vercel.app)'})
        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                data = json.load(response)
        except Exception as exc:
            print(city, category, 'ERROR', exc)
            data = []
        for item in data:
            extra = item.get('extratags') or {}
            osm_type = {'N':'node','W':'way','R':'relation'}.get(item.get('osm_type'), str(item.get('osm_type','node')).lower())
            rows.append({
                'id': f"{osm_type}/{item['osm_id']}", 'city': city, 'group': category,
                'name': item.get('name') or item.get('display_name','Unnamed').split(',')[0],
                'category': item.get('type') or item.get('category') or 'place',
                'coordinates': [float(item['lon']), float(item['lat'])],
                'address': item.get('display_name'),
                'openingHours': extra.get('opening_hours'),
                'website': extra.get('website') or extra.get('contact:website'),
                'source': 'OpenStreetMap', 'osmUrl': f"https://www.openstreetmap.org/{osm_type}/{item['osm_id']}"
            })
        print(city, category, len(data))
        time.sleep(1.1)
# Dedupe while preserving distinct group labels.
seen=set(); clean=[]
for row in rows:
    key=(row['id'],row['group'])
    if key not in seen: clean.append(row); seen.add(key)
out = 'export default ' + json.dumps(clean, ensure_ascii=False, separators=(',', ':')) + ' as const\n'
Path('server/data/places.ts').parent.mkdir(parents=True, exist_ok=True)
Path('server/data/places.ts').write_text(out)
print('TOTAL', len(clean))
