import { io, Socket } from 'socket.io-client'
import { Buoy, TelemetryPoint } from '@/types'

type Listener = (partial: Partial<Buoy> & { id: string }) => void

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:4000'

/** The frontend buoy ID that corresponds to the real ESP32 device. */
const LIVE_BUOY_ID = 'PS-01'

/** The device_id the ESP32 actually sends in its MQTT payload. */
const DEVICE_BUOY_ID = 'POLAR-001'

/**
 * How long (ms) to wait after the last telemetry update before declaring
 * PS-01 offline.
 */
export const TELEMETRY_TIMEOUT_MS = 10_000

/** Rolling history window length (number of points kept per metric). */
const HISTORY_MAX_POINTS = 48

// In-memory sparkline history for PS-01 (accumulates while the page is open and simulation is online).
let history: Buoy['history'] = {
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
  const windSpeedMs = typeof row.wind_speed_ms === 'number' ? row.wind_speed_ms : 0
  const windSpeedKmh = windSpeedMs * 3.6

  const temp = typeof row.temperature_c === 'number' ? row.temperature_c : 0
  const airTemp = typeof row.air_temperature_c === 'number' ? row.air_temperature_c : 0
  const hum = typeof row.humidity_percent === 'number' ? row.humidity_percent : 0
  const press = typeof row.pressure_hpa === 'number' ? row.pressure_hpa : 0
  const sal = typeof row.salinity_psu === 'number' ? row.salinity_psu : 0
  const waveHeight = typeof row.wave_height_m === 'number' ? row.wave_height_m : 0
  const iceConc =
    typeof row.ice_concentration_percent === 'number'
      ? row.ice_concentration_percent
      : typeof row.ice_concentration_pct === 'number'
        ? row.ice_concentration_pct
        : 0
  const currentSpeed = typeof row.current_speed_ms === 'number' ? row.current_speed_ms : 0
  const batt = typeof row.battery_percent === 'number' ? row.battery_percent : 0

  const extra = (row.extra && typeof row.extra === 'object' ? row.extra : {}) as Record<string, any>

  const accelX = typeof row.accel_x_g === 'number' ? row.accel_x_g : (extra.accel_x_g ?? extra.accel?.x ?? 0)
  const accelY = typeof row.accel_y_g === 'number' ? row.accel_y_g : (extra.accel_y_g ?? extra.accel?.y ?? 0)
  const accelZ = typeof row.accel_z_g === 'number' ? row.accel_z_g : (extra.accel_z_g ?? extra.accel?.z ?? 0)

  const gyroX = typeof row.gyro_x_dps === 'number' ? row.gyro_x_dps : (extra.gyro_x_dps ?? extra.gyro?.x ?? 0)
  const gyroY = typeof row.gyro_y_dps === 'number' ? row.gyro_y_dps : (extra.gyro_y_dps ?? extra.gyro?.y ?? 0)
  const gyroZ = typeof row.gyro_z_dps === 'number' ? row.gyro_z_dps : (extra.gyro_z_dps ?? extra.gyro?.z ?? 0)

  const mode = (row.mode as string) || extra.mode || 'NORMAL'
  const sampling = (row.sampling as string) || extra.sampling || 'NORMAL'
  const energyMode = (row.energy_mode as string) || extra.energy_mode || 'POWER_SAVING'
  const risk = (row.risk as string) || extra.risk || 'LOW'

  // Append real readings to in-memory sparkline history.
  history.temperature = pushPoint(history.temperature, temp)
  history.salinity    = pushPoint(history.salinity,    sal)
  history.windSpeed   = pushPoint(history.windSpeed,   windSpeedKmh)
  history.battery     = pushPoint(history.battery,     batt)
  history.pressure    = pushPoint(history.pressure,    press)

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
      console.warn('[LiveTelemetryService] Socket.IO disconnected — PS-01 going offline.')
      this._emitOffline()
      this._clearStaleTimer()
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
    history = {
      temperature: [],
      salinity: [],
      windSpeed: [],
      battery: [],
      pressure: [],
    }

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
      history: { ...history },
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