import { io, Socket } from 'socket.io-client'
import { Buoy, TelemetryPoint } from '@/types'

type Listener = (partial: Partial<Buoy> & { id: string }) => void

const API_URL = import.meta.env.VITE_API_URL as string | undefined

/** The frontend buoy ID that corresponds to the real ESP32 device. */
const LIVE_BUOY_ID = 'PS-01'

/** The device_id the ESP32 actually sends in its MQTT payload. */
const DEVICE_BUOY_ID = 'POLAR-001'

/**
 * How long (ms) to wait after the last telemetry update before declaring
 * PS-01 offline. Set to 0 to disable the staleness check.
 * ⚠️ This is a hackathon/prototype timeout — tune for your ESP32 publish rate.
 */
export const TELEMETRY_TIMEOUT_MS = 15_000

/** Rolling history window length (number of points kept per metric). */
const HISTORY_MAX_POINTS = 48

// In-memory sparkline history for PS-01 (accumulates while the page is open).
const history: Buoy['history'] = {
  temperature: [],
  salinity: [],
  windSpeed: [],
  battery: [],
  pressure: [],
}

function pushPoint(arr: TelemetryPoint[], value: number | undefined): TelemetryPoint[] {
  if (value == null || isNaN(value)) return arr
  const next = [...arr, { timestamp: Date.now(), value }]
  return next.slice(-HISTORY_MAX_POINTS)
}

function mapRowToBuoyPatch(row: Record<string, unknown>): Partial<Buoy> & { id: string } {
  const windSpeedKmh =
    typeof row.wind_speed_ms === 'number' ? row.wind_speed_ms * 3.6 : undefined

  // Append real readings to in-memory sparkline history.
  history.temperature = pushPoint(history.temperature, row.temperature_c as number)
  history.salinity    = pushPoint(history.salinity,    row.salinity_psu as number)
  history.windSpeed   = pushPoint(history.windSpeed,   windSpeedKmh)
  history.battery     = pushPoint(history.battery,     row.battery_percent as number)
  history.pressure    = pushPoint(history.pressure,    row.pressure_hpa as number)

  return {
    id: LIVE_BUOY_ID,
    // ✅ Mark PS-01 online the moment real telemetry arrives.
    status: 'online',
    latitude:  typeof row.latitude  === 'number' ? row.latitude  : undefined,
    longitude: typeof row.longitude === 'number' ? row.longitude : undefined,
    lastSync:  row.created_at ? new Date(row.created_at as string).getTime() : Date.now(),
    signalStrength: 100, // real MQTT connection → treat as full signal
    telemetry: {
      temperature: (row.temperature_c as number) ?? undefined,
      humidity:    (row.humidity_percent as number) ?? undefined,
      pressure:    (row.pressure_hpa as number) ?? undefined,
      salinity:    (row.salinity_psu as number) ?? undefined,
      windSpeed:   windSpeedKmh,
      battery:     (row.battery_percent as number) ?? undefined,
      // ph & oxygen: not provided by ESP32 — keep whatever the store already has.
    } as Buoy['telemetry'],
    history: { ...history },
  }
}

class LiveTelemetryService {
  private socket: Socket | null = null
  private listeners: Set<Listener> = new Set()
  private staleTimer: ReturnType<typeof setTimeout> | null = null

  init() {
    if (!API_URL) {
      console.warn('[LiveTelemetryService] VITE_API_URL is not set — Socket.IO disabled.')
      return
    }
    if (this.socket) return // already initialised

    this.socket = io(API_URL, {
      reconnectionDelay: 3000,
      reconnectionDelayMax: 10_000,
    })

    this.socket.on('connect', () => {
      console.info('[LiveTelemetryService] Socket.IO connected to', API_URL)
    })

    this.socket.on('disconnect', () => {
      console.warn('[LiveTelemetryService] Socket.IO disconnected — PS-01 going offline.')
      this._emitOffline()
      this._clearStaleTimer()
    })

    this.socket.on('telemetry_update', (row: Record<string, unknown>) => {
      // Ignore telemetry from any buoy other than our mapped device.
      if (row.buoy_id !== DEVICE_BUOY_ID) return

      const patch = mapRowToBuoyPatch(row)
      this.listeners.forEach((cb) => cb(patch))

      // Reset the staleness countdown every time a real update arrives.
      this._resetStaleTimer()
    })
  }

  subscribe(cb: Listener) {
    this.listeners.add(cb)
    return () => this.listeners.delete(cb)
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private _emitOffline() {
    const offlinePatch: Partial<Buoy> & { id: string } = {
      id: LIVE_BUOY_ID,
      status: 'offline',
      signalStrength: 0,
    }
    this.listeners.forEach((cb) => cb(offlinePatch))
  }

  private _resetStaleTimer() {
    this._clearStaleTimer()
    if (TELEMETRY_TIMEOUT_MS <= 0) return
    this.staleTimer = setTimeout(() => {
      console.warn(
        `[LiveTelemetryService] No telemetry for ${TELEMETRY_TIMEOUT_MS / 1000}s — PS-01 OFFLINE.`
      )
      this._emitOffline()
    }, TELEMETRY_TIMEOUT_MS)
  }

  private _clearStaleTimer() {
    if (this.staleTimer) {
      clearTimeout(this.staleTimer)
      this.staleTimer = null
    }
  }
}

export const liveTelemetryService = new LiveTelemetryService()