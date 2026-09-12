import { Buoy } from '@/types'
import { randomWalk } from '@/lib/utils'

type Listener = (buoys: Buoy[]) => void

/**
 * Simulates a realtime telemetry backend (e.g. Firebase Realtime Database).
 * subscribe() mimics `onSnapshot` / `onValue`: it immediately replays the
 * current fleet state, then pushes a new snapshot on every tick.
 */
class TelemetryService {
  private buoys: Buoy[] = []
  private listeners: Set<Listener> = new Set()
  private intervalId: ReturnType<typeof setInterval> | null = null
  private readonly TICK_MS = 3000

  init(initialFleet: Buoy[]) {
    this.buoys = initialFleet
    if (!this.intervalId) {
      this.intervalId = setInterval(() => this.tick(), this.TICK_MS)
    }
    return this
  }

  // ID of the real ESP32 buoy — mock tick must never touch it.
  private readonly REAL_BUOY_ID = 'PS-01'

  private tick() {
    const now = Date.now()
    this.buoys = this.buoys.map((b) => {
      // PS-01 is driven exclusively by live Socket.IO telemetry — skip it here.
      if (b.id === this.REAL_BUOY_ID) return b
      if (b.status === 'offline') return b

      const t = b.telemetry
      const nextTelemetry = {
        temperature: randomWalk(t.temperature, 0.15, -3, 2),
        salinity: randomWalk(t.salinity, 0.05, 32, 36),
        ph: randomWalk(t.ph, 0.02, 7.6, 8.4),
        oxygen: randomWalk(t.oxygen, 0.1, 4, 9),
        pressure: randomWalk(t.pressure, 0.8, 960, 1045),
        humidity: randomWalk(t.humidity, 1, 40, 100),
        windSpeed: randomWalk(t.windSpeed, 1.2, 0, 65),
        battery: Number(Math.max(0, t.battery - Math.random() * 0.03).toFixed(1)),
      }

      const pushPoint = (arr: { timestamp: number; value: number }[], value: number) => {
        const next = [...arr, { timestamp: now, value }]
        return next.slice(-48)
      }

      return {
        ...b,
        lastSync: now,
        signalStrength: Math.round(randomWalk(b.signalStrength, 4, 30, 100)),
        telemetry: nextTelemetry,
        history: {
          temperature: pushPoint(b.history.temperature, nextTelemetry.temperature),
          salinity: pushPoint(b.history.salinity, nextTelemetry.salinity),
          windSpeed: pushPoint(b.history.windSpeed, nextTelemetry.windSpeed),
          battery: pushPoint(b.history.battery, nextTelemetry.battery),
          pressure: pushPoint(b.history.pressure, nextTelemetry.pressure),
        },
      }
    })

    this.listeners.forEach((cb) => cb(this.buoys))
  }

  subscribe(cb: Listener) {
    this.listeners.add(cb)
    cb(this.buoys)
    return () => this.listeners.delete(cb)
  }

  getSnapshot() {
    return this.buoys
  }

  destroy() {
    if (this.intervalId) clearInterval(this.intervalId)
    this.intervalId = null
    this.listeners.clear()
  }
}

export const telemetryService = new TelemetryService()
