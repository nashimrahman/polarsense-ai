import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { createRoot } from 'react-dom/client'
import { useStore } from '@/store/useStore'
import { Buoy } from '@/types'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/primitives'
import { statusColor, cn } from '@/lib/utils'
import { Layers, Wind, Waves as WavesIcon, MapPin } from 'lucide-react'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined

// Rough Antarctic circumpolar current path (illustrative, not navigational)
const CURRENT_PATH: [number, number][] = [
  [-70, -60], [-40, -62], [-10, -61], [20, -60], [50, -63],
  [80, -62], [110, -64], [140, -61], [170, -63], [-160, -62], [-130, -60], [-100, -61], [-70, -60],
]

function popupHtml() {
  return `<div id="popup-root" style="width:220px"></div>`
}

export default function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<Record<string, mapboxgl.Marker>>({})
  const buoys = useStore((s) => s.buoys)
  const [layers, setLayers] = useState({ currents: true, iceZones: true, weather: false })
  const [mapReady, setMapReady] = useState(false)
  const buoysRef = useRef<Buoy[]>(buoys)
  buoysRef.current = buoys

  useEffect(() => {
    if (!MAPBOX_TOKEN || !mapContainer.current || mapRef.current) return
    mapboxgl.accessToken = MAPBOX_TOKEN

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [30, -70],
      zoom: 1.6,
      projection: 'globe' as any,
      attributionControl: false,
    })

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right')

    map.on('load', () => {
      map.setFog({
        color: 'rgb(3, 7, 18)',
        'high-color': 'rgb(6, 18, 40)',
        'horizon-blend': 0.03,
        'space-color': 'rgb(3, 7, 18)',
        'star-intensity': 0.3,
      } as any)

      // Ice zone (illustrative circumpolar band)
      map.addSource('ice-zone', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-180, -60], [-90, -58], [0, -60], [90, -58], [180, -60],
                [180, -90], [-180, -90], [-180, -60],
              ],
            ],
          },
        },
      })
      map.addLayer({
        id: 'ice-zone-fill',
        type: 'fill',
        source: 'ice-zone',
        paint: { 'fill-color': '#3B82F6', 'fill-opacity': 0.06 },
      })
      map.addLayer({
        id: 'ice-zone-line',
        type: 'line',
        source: 'ice-zone',
        paint: { 'line-color': '#06B6D4', 'line-width': 1, 'line-dasharray': [2, 2], 'line-opacity': 0.4 },
      })

      // Current path
      map.addSource('current-path', {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: CURRENT_PATH } },
      })
      map.addLayer({
        id: 'current-line',
        type: 'line',
        source: 'current-path',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#06B6D4', 'line-width': 2, 'line-opacity': 0.55, 'line-dasharray': [0.2, 2] },
      })

      setMapReady(true)
    })

    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Toggle overlay layers
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    if (map.getLayer('current-line')) {
      map.setLayoutProperty('current-line', 'visibility', layers.currents ? 'visible' : 'none')
    }
    if (map.getLayer('ice-zone-fill')) {
      map.setLayoutProperty('ice-zone-fill', 'visibility', layers.iceZones ? 'visible' : 'none')
      map.setLayoutProperty('ice-zone-line', 'visibility', layers.iceZones ? 'visible' : 'none')
    }
  }, [layers, mapReady])

  // Sync buoy markers
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    buoys.forEach((b) => {
      const existing = markersRef.current[b.id]
      const dotColor = b.status === 'online' ? '#22C55E' : b.status === 'degraded' ? '#F59E0B' : '#EF4444'

      if (!existing) {
        const el = document.createElement('div')
        el.style.cssText = `width:16px;height:16px;border-radius:50%;background:${dotColor};box-shadow:0 0 0 3px ${dotColor}33, 0 0 14px ${dotColor}aa;cursor:pointer;border:2px solid #030712;`

        const popup = new mapboxgl.Popup({ offset: 14, closeButton: false }).setHTML(popupHtml())
        popup.on('open', () => {
          const root = document.getElementById('popup-root')
          if (root) {
            createRoot(root).render(<BuoyPopup buoy={buoysRef.current.find((x) => x.id === b.id) ?? b} />)
          }
        })

        const marker = new mapboxgl.Marker(el).setLngLat([b.longitude, b.latitude]).setPopup(popup).addTo(map)
        markersRef.current[b.id] = marker
      } else {
        const el = existing.getElement()
        el.style.background = dotColor
        el.style.boxShadow = `0 0 0 3px ${dotColor}33, 0 0 14px ${dotColor}aa`
      }
    })

    return () => {
      // keep markers between renders; cleanup handled on unmount
    }
  }, [buoys, mapReady])

  return (
    <div className="relative -mx-4 -my-6 h-[calc(100vh-4rem)] overflow-hidden sm:-mx-6 lg:h-[calc(100vh-4rem)]">
      {MAPBOX_TOKEN ? (
        <div ref={mapContainer} className="h-full w-full" />
      ) : (
        <MapFallback buoys={buoys} />
      )}

      <Card className="absolute left-4 top-4 z-10 w-56 p-3">
        <p className="mb-2 flex items-center gap-2 text-xs font-medium text-text-secondary">
          <Layers size={13} /> Overlays
        </p>
        <div className="space-y-2">
          <ToggleRow icon={WavesIcon} label="Ocean currents" checked={layers.currents} onChange={(v) => setLayers((l) => ({ ...l, currents: v }))} />
          <ToggleRow icon={MapPin} label="Ice zones" checked={layers.iceZones} onChange={(v) => setLayers((l) => ({ ...l, iceZones: v }))} />
          <ToggleRow icon={Wind} label="Weather (mock)" checked={layers.weather} onChange={(v) => setLayers((l) => ({ ...l, weather: v }))} />
        </div>
      </Card>

      <div className="absolute bottom-4 left-4 z-10 flex gap-4 rounded-xl border border-base-border bg-base-bg/80 px-4 py-2.5 text-xs text-text-secondary backdrop-blur-xl">
        <LegendDot color="#22C55E" label="Online" />
        <LegendDot color="#F59E0B" label="Degraded" />
        <LegendDot color="#EF4444" label="Offline" />
      </div>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}

function ToggleRow({ icon: Icon, label, checked, onChange }: { icon: any; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className="flex w-full items-center justify-between text-xs text-text-primary">
      <span className="flex items-center gap-2 text-text-secondary">
        <Icon size={13} /> {label}
      </span>
      <span className={cn('h-4 w-7 rounded-full p-0.5 transition-colors', checked ? 'bg-accent-blue' : 'bg-white/10')}>
        <span className={cn('block h-3 w-3 rounded-full bg-white transition-transform', checked && 'translate-x-3')} />
      </span>
    </button>
  )
}

function BuoyPopup({ buoy }: { buoy: Buoy }) {
  const sc = statusColor(buoy.status)
  return (
    <div className="p-3 font-sans">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-text-primary">{buoy.name}</p>
        <Badge variant={buoy.status === 'online' ? 'success' : buoy.status === 'degraded' ? 'warning' : 'danger'}>{buoy.status}</Badge>
      </div>
      <p className="mb-2 text-[11px] text-text-secondary">{buoy.id} · {buoy.region}</p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-text-secondary">Temperature</p>
          <p className="tabular font-medium text-text-primary">{buoy.telemetry.temperature.toFixed(1)}°C</p>
        </div>
        <div>
          <p className="text-text-secondary">Battery</p>
          <p className="tabular font-medium text-text-primary">{buoy.telemetry.battery.toFixed(0)}%</p>
        </div>
        <div>
          <p className="text-text-secondary">Wind Speed</p>
          <p className="tabular font-medium text-text-primary">{buoy.telemetry.windSpeed.toFixed(0)} km/h</p>
        </div>
        <div>
          <p className="text-text-secondary">Signal</p>
          <p className="tabular font-medium text-text-primary">{buoy.signalStrength}%</p>
        </div>
      </div>
    </div>
  )
}

/** Static illustrative fallback rendered when no Mapbox token is configured. */
function MapFallback({ buoys }: { buoys: Buoy[] }) {
  const project = (lat: number, lon: number) => {
    const r = ((90 + lat) / 60) * 260 // squish so Antarctica fills the circle
    const theta = (lon * Math.PI) / 180
    return { x: 320 + r * Math.sin(theta), y: 320 - r * Math.cos(theta) }
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-base-bg">
      <div className="grid-overlay absolute inset-0 opacity-60" />
      <div className="absolute rounded-full border border-base-border bg-gradient-to-b from-white/[0.03] to-transparent" style={{ width: 560, height: 560 }} />
      <svg width="640" height="640" viewBox="0 0 640 640" className="relative">
        {[80, 160, 240].map((r) => (
          <circle key={r} cx="320" cy="320" r={r} fill="none" stroke="#1F2937" strokeWidth="1" strokeDasharray="3 4" />
        ))}
        <circle cx="320" cy="320" r="6" fill="#3B82F6" />
        {buoys.map((b) => {
          const { x, y } = project(b.latitude, b.longitude)
          const color = b.status === 'online' ? '#22C55E' : b.status === 'degraded' ? '#F59E0B' : '#EF4444'
          return (
            <g key={b.id}>
              <circle cx={x} cy={y} r="10" fill={color} opacity="0.15" className="animate-pulse-ring" />
              <circle cx={x} cy={y} r="4.5" fill={color} stroke="#030712" strokeWidth="2" />
            </g>
          )
        })}
      </svg>
      <Card className="absolute bottom-6 right-6 max-w-xs p-4 text-xs text-text-secondary">
        <p className="mb-1 font-medium text-text-primary">Mapbox token not configured</p>
        <p>
          Add <code className="rounded bg-white/10 px-1 py-0.5 text-accent-cyan">VITE_MAPBOX_TOKEN</code> to your <code className="rounded bg-white/10 px-1 py-0.5">.env</code> file
          to render the interactive globe. This illustrative polar projection shows live buoy positions in the meantime.
        </p>
      </Card>
    </div>
  )
}
