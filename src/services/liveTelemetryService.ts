import { io, Socket } from 'socket.io-client'
import { Buoy } from '@/types'

type Listener = (partial: Partial<Buoy> & { id: string }) => void

const API_URL = import.meta.env.VITE_API_URL as string | undefined
const LIVE_BUOY_ID = 'PS-01' // matches Velxio buoy_id "POLAR-001" mapped to PS-01 below
const DEVICE_BUOY_ID = 'POLAR-001' // the id the ESP32 actually sends

function mapRowToBuoyPatch(row: any): Partial<Buoy> & { id: string } {
  return {
    id: LIVE_BUOY_ID,
    telemetry: {
      temperature: row.temperature_c,
      humidity: row.humidity_percent,
      pressure: row.pressure_hpa,
      salinity: row.salinity_psu,
      windSpeed: row.wind_speed_ms != null ? row.wind_speed_ms * 3.6 : undefined,
      battery: row.battery_percent,
      // ph, oxygen intentionally omitted — not provided by ESP32, keep existing mock value
    } as any,
    latitude: row.latitude,
    longitude: row.longitude,
    lastSync: new Date(row.created_at).getTime(),
  }
}

class LiveTelemetryService {
  private socket: Socket | null = null
  private listeners: Set<Listener> = new Set()

  init() {
    if (!API_URL || this.socket) return
    this.socket = io(API_URL, { reconnectionDelay: 3000 })
    this.socket.on('telemetry_update', (row) => {
      if (row.buoy_id !== DEVICE_BUOY_ID) return
      const patch = mapRowToBuoyPatch(row)
      this.listeners.forEach((cb) => cb(patch))
    })
  }

  subscribe(cb: Listener) {
    this.listeners.add(cb)
    return () => this.listeners.delete(cb)
  }
}

export const liveTelemetryService = new LiveTelemetryService()