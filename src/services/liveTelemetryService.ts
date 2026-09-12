import { io, Socket } from 'socket.io-client'
import { Buoy, TelemetryPoint } from '@/types'

type Listener = (partial: Partial<Buoy> & { id: string }) => void

const API_URL = (import.meta?.env?.VITE_API_URL as string | undefined) || 'http://localhost:4000'

/** The frontend buoy ID that corresponds to the real ESP32 device. */
const LIVE_BUOY_ID = 'PS-01'

/** The device_id the ESP32 actually sends in its MQTT payload. */
const DEVICE_BUOY_ID = 'POLAR-001'

/**
 * How long (ms) to wait after the last telemetry update before declaring
 * PS-01 offline.
 */
export const TELEMETRY_TIMEOUT_MS = 30_000

/** Rolling history window length (number of points kept per metric). */
const HISTORY_MAX_POINTS = 48

// In-memory sparkline history for PS-01 (accumulates across telemetry packets).
// All 10 metrics tracked so every Live Monitoring card gets a sparkline.
let history: Buoy['history'] = {
  temperature: [],
  salinity: [],
  windSpeed: [],
  battery: [],
  pressure: [],
  airTemperature: [],
  humidity: [],
  waveHeight: [],
  iceConcentration: [],
  currentSpeed: [],
}

function num(val: unknown, fallback = 0): number {
  if (typeof val === 'number') return isNaN(val) ? fallback : val
  if (typeof val === 'string') {
    const parsed = parseFloat(val)
    return isNaN(parsed) ? fallback : parsed
  }
  return fallback
}

function pushPoint(arr: TelemetryPoint[] | undefined, value: number | undefined, timestamp?: number): TelemetryPoint[] {
  if (value == null || isNaN(value)) return arr ?? []
  const pointTs = typeof timestamp === 'number' && timestamp > 0 ? timestamp : Date.now()
  const next = [...(arr ?? []), { timestamp: pointTs, value }]
  return next.slice(-HISTORY_MAX_POINTS)
}

function mapRowToBuoyPatch(row: Record<string, unknown>): Partial<Buoy> & { id: string } {
  const timestamp = row.created_at ? new Date(row.created_at as string).getTime() : Date.now()

  const windSpeedMs = num(row.wind_speed_ms)
  const windSpeedKmh = windSpeedMs * 3.6

  const temp = num(row.temperature_c)
  const airTemp = num(row.air_temperature_c)
  const hum = num(row.humidity_percent)
  const press = num(row.pressure_hpa)
  const sal = num(row.salinity_psu)
  const waveHeight = num(row.wave_height_m)
  const iceConc = num(row.ice_concentration_percent ?? row.ice_concentration_pct)
  const currentSpeed = num(row.current_speed_ms)
  const batt = num(row.battery_percent)

  const extra = (row.extra && typeof row.extra === 'object' ? row.extra : {}) as Record<string, any>

  const accelX = num(row.accel_x_g ?? extra.accel_x_g ?? extra.accel?.x)
  const accelY = num(row.accel_y_g ?? extra.accel_y_g ?? extra.accel?.y)
  const accelZ = num(row.accel_z_g ?? extra.accel_z_g ?? extra.accel?.z)

  const gyroX = num(row.gyro_x_dps ?? extra.gyro_x_dps ?? extra.gyro?.x)
  const gyroY = num(row.gyro_y_dps ?? extra.gyro_y_dps ?? extra.gyro?.y)
  const gyroZ = num(row.gyro_z_dps ?? extra.gyro_z_dps ?? extra.gyro?.z)

  const mode = (row.mode as string) || extra.mode || 'NORMAL'
  const sampling = (row.sampling as string) || extra.sampling || 'NORMAL'
  const energyMode = (row.energy_mode as string) || extra.energy_mode || 'POWER_SAVING'
  const risk = (row.risk as string) || extra.risk || 'LOW'

  // Append real readings to in-memory sparkline history — all 10 metrics.
  history.temperature      = pushPoint(history.temperature,      temp,         timestamp)
  history.airTemperature  = pushPoint(history.airTemperature,  airTemp,      timestamp)
  history.humidity        = pushPoint(history.humidity,        hum,          timestamp)
  history.pressure        = pushPoint(history.pressure,        press,        timestamp)
  history.windSpeed       = pushPoint(history.windSpeed,       windSpeedKmh, timestamp)
  history.waveHeight      = pushPoint(history.waveHeight,      waveHeight,   timestamp)
  history.salinity        = pushPoint(history.salinity,        sal,          timestamp)
  history.iceConcentration = pushPoint(history.iceConcentration, iceConc,     timestamp)
  history.currentSpeed    = pushPoint(history.currentSpeed,    currentSpeed, timestamp)
  history.battery         = pushPoint(history.battery,         batt,         timestamp)

  console.info(`[LiveTelemetryService] PS-01 telemetry mapped. History length: ${history.temperature.length}`)

  return {
    id: LIVE_BUOY_ID,
    status: 'online',
    latitude:  typeof row.latitude  === 'number' ? row.latitude  : undefined,
    longitude: typeof row.longitude === 'number' ? row.longitude : undefined,
    lastSync:  row.created_at ? new Date(row.created_at as string).getTime() : Date.now(),
    signalStrength: 100,
    telemetry: {
      temperature: temp,
      airTemperature: airTemp,
      humidity: hum,
      pressure: press,
      accelX,
      accelY,
      accelZ,
      gyroX,
      gyroY,
      gyroZ,
      windSpeed: windSpeedKmh,
      waveHeight,
      salinity: sal,
      iceConcentration: iceConc,
      currentSpeed,
      battery: batt,
      mode,
      sampling,
      energyMode,
      risk,
      ph: 0,
      oxygen: 0,
    },
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

    this.socket.on('connect_error', (err) => {
      console.error('[LiveTelemetryService] Socket.IO connect error:', err.message)
    })

    this.socket.on('disconnect', () => {
      // Do NOT emit offline here. A Socket.IO disconnect can be momentary
      // (e.g. server restart via node --watch). The stale timer is the sole
      // mechanism for declaring PS-01 offline — it will fire after
      // TELEMETRY_TIMEOUT_MS if no real telemetry resumes.
      console.warn('[LiveTelemetryService] Socket.IO disconnected — waiting for reconnect or stale timeout.')
    })

    this.socket.on('telemetry_update', (row: Record<string, unknown>) => {
      console.log('[LiveTelemetryService] Received telemetry_update for', row.buoy_id)
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
    // Do NOT clear module-level history here.
    // Historical graph data should remain visible while PS-01 is offline
    // so the user can still see the previous telemetry session.
    // When telemetry resumes, new points will append to the existing history.

    const offlinePatch: Partial<Buoy> & { id: string } = {
      id: LIVE_BUOY_ID,
      status: 'offline',
      signalStrength: 0,
      telemetry: {
        temperature: 0,
        airTemperature: 0,
        humidity: 0,
        pressure: 0,
        accelX: 0,
        accelY: 0,
        accelZ: 0,
        gyroX: 0,
        gyroY: 0,
        gyroZ: 0,
        windSpeed: 0,
        waveHeight: 0,
        salinity: 0,
        iceConcentration: 0,
        currentSpeed: 0,
        battery: 0,
        mode: 'OFFLINE',
        sampling: 'OFFLINE',
        energyMode: 'OFFLINE',
        risk: 'NONE',
        ph: 0,
        oxygen: 0,
      },
      // history intentionally omitted — useStore will keep b.history unchanged
      // (patch.history is undefined → `patch.history ? {...} : b.history` falls through)
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