import { useEffect, useRef, useState } from 'react'
import { AttributionControl, Map as MapLibreMap, NavigationControl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  Activity, ArrowRight, BarChart3, Braces, Check, ChevronRight, CircleDot,
  Clock3, Compass, Copy, Database, GitBranch, Globe2, KeyRound, Layers3,
  MapPin, Menu, Radar, Route, Search, Sparkles, X, Zap,
} from 'lucide-react'
import './App.css'

type City = { name: string; country: string; coords: [number, number]; score: number; latency: number; requests: string }

const cities: City[] = [
  { name: 'Las Vegas', country: 'US', coords: [-115.1398, 36.1699], score: 87, latency: 42, requests: '1.42M' },
  { name: 'New York', country: 'US', coords: [-74.006, 40.7128], score: 94, latency: 31, requests: '3.81M' },
  { name: 'London', country: 'UK', coords: [-0.1276, 51.5072], score: 92, latency: 36, requests: '2.77M' },
  { name: 'Tokyo', country: 'JP', coords: [139.6917, 35.6895], score: 97, latency: 48, requests: '4.12M' },
]

const competitors = [
  { name: 'Google Maps', focus: 'Full location suite', free: 'Limited monthly credit', open: false, edge: 'Coverage + ecosystem' },
  { name: 'Mapbox', focus: 'Maps + navigation', free: 'Usage-based free tier', open: false, edge: 'Design + SDKs' },
  { name: 'Radar', focus: 'Geofencing + location', free: 'Generous starter tier', open: false, edge: 'Location events' },
  { name: 'HERE', focus: 'Enterprise logistics', free: 'Limited free tier', open: false, edge: 'Fleet + traffic' },
  { name: 'TomTom', focus: 'Traffic + automotive', free: 'Daily free allowance', open: false, edge: 'Live traffic' },
  { name: 'Geoapify', focus: 'Composable APIs', free: 'Daily free credits', open: false, edge: 'Simple pricing' },
  { name: 'Protomaps', focus: 'Self-hosted tiles', free: 'Open source', open: true, edge: 'Serverless PMTiles' },
  { name: 'Atlascope', focus: 'Data trust + observability', free: 'Open core', open: true, edge: 'Freshness + provenance' },
]

const code = `import { Atlascope } from '@atlascope/sdk'

const map = new Atlascope({
  key: 'atlas_pk_demo',
  style: 'midnight'
})

const area = await map.explore({
  center: [-115.1398, 36.1699],
  radius: '15min-walk',
  layers: ['food', 'parks', 'transit']
})`

function ProductMap({ city, onCity }: { city: City; onCity: (city: City) => void }) {
  const node = useRef<HTMLDivElement>(null)
  const map = useRef<MapLibreMap | null>(null)

  useEffect(() => {
    if (!node.current || map.current) return
    const instance = new MapLibreMap({
      container: node.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: city.coords,
      zoom: 10.5,
      attributionControl: false,
    })
    instance.addControl(new NavigationControl({ showCompass: false }), 'bottom-right')
    instance.addControl(new AttributionControl({ compact: true }), 'bottom-left')
    map.current = instance
  }, [city.coords])

  useEffect(() => {
    map.current?.flyTo({ center: city.coords, zoom: 11, duration: 1300 })
  }, [city])

  return (
    <div className="map-shell">
      <div ref={node} className="map-canvas" />
      <div className="map-search"><Search size={16} /><span>Search any city or coordinate</span><kbd>⌘ K</kbd></div>
      <div className="map-live"><span /> LIVE OPEN DATA</div>
      <div className="city-switcher">
        {cities.map((item) => <button className={item.name === city.name ? 'active' : ''} onClick={() => onCity(item)} key={item.name}>{item.name}</button>)}
      </div>
      <div className="map-insight glass">
        <div className="score-ring"><strong>{city.score}</strong><small>/100</small></div>
        <div><span>15-minute score</span><strong>{city.name}</strong><small>Food, parks & transit coverage</small></div>
        <ChevronRight size={18} />
      </div>
    </div>
  )
}

function App() {
  const [city, setCity] = useState(cities[0])
  const [copied, setCopied] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [activeLayer, setActiveLayer] = useState('Places')

  const copyCode = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <main>
      <nav>
        <a className="brand" href="#top"><span className="brand-mark"><Globe2 size={20} /></span>atlascope</a>
        <div className="nav-links">
          <a href="#platform">Platform</a><a href="#playground">Playground</a><a href="#intel">Market intel</a><a href="#build">Build</a>
        </div>
        <div className="nav-actions"><a className="github" href="https://github.com/itsmikepowers/mapforge-studio" target="_blank"><GitBranch size={17} /> GitHub</a><a className="button small" href="#playground">Explore free <ArrowRight size={15} /></a></div>
        <button className="menu" onClick={() => setMobile(!mobile)} aria-label="Toggle menu">{mobile ? <X /> : <Menu />}</button>
      </nav>
      {mobile && <div className="mobile-nav"><a href="#platform">Platform</a><a href="#playground">Playground</a><a href="#intel">Market intel</a><a href="#build">Build</a></div>}

      <section id="top" className="hero-section">
        <div className="orb orb-one"/><div className="orb orb-two"/>
        <div className="eyebrow"><Sparkles size={14} /> OPEN MAP INTELLIGENCE</div>
        <h1>Understand the world.<br/><em>Then build on it.</em></h1>
        <p className="hero-copy">The open location platform for teams who care where their map data came from, how fresh it is, and what it can unlock.</p>
        <div className="hero-buttons"><a className="button" href="#playground">Open live playground <ArrowRight size={17} /></a><a className="button secondary" href="#intel"><BarChart3 size={17} /> See competitor intel</a></div>
        <div className="proof"><span><Check size={14}/> No API key</span><span><Check size={14}/> OpenStreetMap powered</span><span><Check size={14}/> Deploy anywhere</span></div>
        <ProductMap city={city} onCity={setCity} />
      </section>

      <section id="platform" className="section stats-section">
        <div className="section-label">PLATFORM PULSE</div>
        <div className="stats-grid">
          <div><span>API requests</span><strong>{city.requests}</strong><small><Activity size={13}/> +18.4% this month</small></div>
          <div><span>Edge latency</span><strong>{city.latency}<i>ms</i></strong><small><Zap size={13}/> p95 global</small></div>
          <div><span>Fresh features</span><strong>98.7<i>%</i></strong><small><Database size={13}/> updated &lt;30 days</small></div>
          <div><span>Countries</span><strong>195</strong><small><Globe2 size={13}/> open coverage</small></div>
        </div>
      </section>

      <section id="playground" className="section playground">
        <div className="section-head"><div><div className="section-label">THE FREE PROJECT</div><h2>How alive is your neighborhood?</h2></div><p>Drop into any city. Atlascope scores what you can reach in a 15-minute walk—then shows the raw map features behind the answer.</p></div>
        <div className="lab">
          <div className="lab-sidebar">
            <div className="lab-heading"><Radar size={18}/><span>Coverage explorer</span><i>FREE</i></div>
            <label>Location</label>
            <div className="input"><MapPin size={15}/><span>{city.name}, {city.country}</span></div>
            <label>Explore layer</label>
            <div className="layers">
              {[
                ['Places', MapPin], ['Walkability', Route], ['Freshness', Clock3], ['Coverage', Layers3]
              ].map(([name, Icon]) => <button key={name as string} onClick={() => setActiveLayer(name as string)} className={activeLayer === name ? 'active' : ''}><Icon size={16}/>{name as string}<span>{activeLayer === name && <Check size={13}/>}</span></button>)}
            </div>
            <div className="query-card"><span>QUERY COST</span><strong>$0.0004</strong><small>84 features · 12 KB</small></div>
          </div>
          <div className="lab-content">
            <div className="radar-visual">
              <div className="radar-lines"/><div className="radar-pulse"><Compass size={32}/></div>
              {['Cafe','Park','Market','Transit','Gym'].map((x,i)=><span className={`poi poi-${i+1}`} key={x}><CircleDot size={11}/>{x}</span>)}
              <div className="radar-caption"><small>{activeLayer.toUpperCase()} SCORE</small><strong>{city.score}</strong><span>Top {100-city.score}% of mapped cities</span></div>
            </div>
            <div className="breakdown">
              {[['Food & drink',96,'+4'],['Parks',78,'+12'],['Transit',91,'+2'],['Daily needs',84,'+7']].map(([name,value,delta])=><div key={name as string}><span>{name}</span><div className="bar"><i style={{width:`${value}%`}}/></div><strong>{value}</strong><small>{delta}</small></div>)}
            </div>
          </div>
        </div>
      </section>

      <section id="intel" className="section intel">
        <div className="section-head"><div><div className="section-label">MARKET INTELLIGENCE</div><h2>Where the map market is open.</h2></div><p>Most platforms sell tiles or calls. The wedge: make data quality visible, provenance queryable, and open infrastructure easy to ship.</p></div>
        <div className="intel-grid">
          <div className="matrix">
            <div className="matrix-row matrix-head"><span>Platform</span><span>Core focus</span><span>Entry point</span><span>Open</span><span>Defensible edge</span></div>
            {competitors.map((item)=><div className={`matrix-row ${item.name === 'Atlascope' ? 'highlight' : ''}`} key={item.name}><strong>{item.name}</strong><span>{item.focus}</span><span>{item.free}</span><span>{item.open ? <Check className="yes" size={16}/> : '—'}</span><span>{item.edge}</span></div>)}
          </div>
          <div className="strategy">
            <span className="strategy-icon"><Sparkles/></span><small>THE OPPORTUNITY</small><h3>Be the Stripe for trusted map data.</h3><p>One API across open sources, with a quality score and provenance attached to every result.</p>
            <ul><li><span>01</span><div><strong>Start with trust</strong><small>Freshness, source, confidence and change history per feature.</small></div></li><li><span>02</span><div><strong>Win developers</strong><small>One key, clear pricing, delightful docs, generous local dev.</small></div></li><li><span>03</span><div><strong>Compound the moat</strong><small>Corrections and validation signals improve each returned place.</small></div></li></ul>
          </div>
        </div>
        <p className="source-note">Competitive claims are directional and should be rechecked before business decisions. Sources: <a href="https://mapsplatform.google.com/pricing/" target="_blank">Google</a>, <a href="https://www.mapbox.com/pricing" target="_blank">Mapbox</a>, <a href="https://radar.com/pricing" target="_blank">Radar</a>, <a href="https://www.here.com/get-started/pricing" target="_blank">HERE</a>, <a href="https://developer.tomtom.com/store/maps-api" target="_blank">TomTom</a>, <a href="https://www.geoapify.com/pricing/" target="_blank">Geoapify</a>, <a href="https://protomaps.com/" target="_blank">Protomaps</a>.</p>
      </section>

      <section id="build" className="section build-section">
        <div className="build-copy"><div className="section-label">DEVELOPER FIRST</div><h2>From idea to map<br/>in eight lines.</h2><p>Start with the open stack. Add hosted reliability only when your traffic earns it.</p><div className="feature-list"><span><KeyRound size={17}/><b>No key for local development</b></span><span><Braces size={17}/><b>Typed SDKs and simple GeoJSON</b></span><span><Database size={17}/><b>Source lineage on every feature</b></span></div><a className="button" href="https://github.com/itsmikepowers/mapforge-studio" target="_blank"><GitBranch size={17}/> Fork the project</a></div>
        <div className="code-card"><div className="code-top"><span><i/><i/><i/></span><b>quickstart.ts</b><button onClick={copyCode}>{copied ? <Check/> : <Copy/>}{copied ? 'Copied' : 'Copy'}</button></div><pre><code>{code}</code></pre><div className="code-output"><span><Check size={14}/> 84 features returned</span><small>42ms</small></div></div>
      </section>

      <footer><a className="brand" href="#top"><span className="brand-mark"><Globe2 size={20}/></span>atlascope</a><p>Open maps. Visible quality. Better products.</p><div><a href="#intel">Strategy</a><a href="#playground">Demo</a><a href="https://www.openstreetmap.org/copyright" target="_blank">Open data credits</a><a href="https://github.com/itsmikepowers/mapforge-studio" target="_blank">GitHub</a></div></footer>
    </main>
  )
}

export default App
