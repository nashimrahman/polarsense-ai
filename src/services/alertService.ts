import { AlertItem, AlertSeverity, Buoy } from '@/types'

type Listener = (alerts: AlertItem[]) => void

const TEMPLATES: { match: (b: Buoy) => boolean; severity: AlertSeverity; title: string; message: (b: Buoy) => string }[] = [
  {
    match: (b) => b.status === 'online' && b.telemetry.windSpeed > 45,
    severity: 'high',
    title: 'HIGH WIND DETECTED',
    message: (b) => `Sustained wind speed of ${b.telemetry.windSpeed} km/h recorded at ${b.name}.`,
  },
  {
    match: (b) => b.status === 'online' && b.telemetry.battery > 0 && b.telemetry.battery < 20,
    severity: 'critical',
    title: 'BATTERY BELOW 20%',
    message: (b) => `${b.name} battery at ${b.telemetry.battery.toFixed(0)}%. Solar recharge recommended.`,
  },
  {
    match: (b) => b.status === 'online' && (b.telemetry.temperature > 1.5 || b.telemetry.temperature < -3.2),
    severity: 'medium',
    title: 'TEMPERATURE ANOMALY',
    message: (b) => `Water temperature reading of ${b.telemetry.temperature}\u00b0C deviates from seasonal baseline.`,
  },
  {
    match: (b) => b.id === 'PS-01' && b.status === 'offline' && b.lastSync > 0,
    severity: 'high',
    title: 'SENSOR OFFLINE',
    message: (b) => `${b.name} has not reported telemetry since ${new Date(b.lastSync).toLocaleTimeString()}.`,
  },
  {
    match: (b) => b.status === 'online' && b.signalStrength < 35,
    severity: 'low',
    title: 'WEAK SIGNAL STRENGTH',
    message: (b) => `${b.name} signal strength degraded to ${b.signalStrength}%.`,
  },
]

class AlertService {
  private alerts: AlertItem[] = []
  private listeners: Set<Listener> = new Set()
  private recentKeys: Map<string, number> = new Map()
  private readonly DEDUPE_WINDOW_MS = 45000

  evaluate(buoys: Buoy[]) {
    const now = Date.now()
    let created = false

    buoys.forEach((b) => {
      TEMPLATES.forEach((t) => {
        if (!t.match(b)) return
        const key = `${b.id}:${t.title}`
        const last = this.recentKeys.get(key)
        if (last && now - last < this.DEDUPE_WINDOW_MS) return

        this.recentKeys.set(key, now)
        this.alerts.unshift({
          id: `${key}:${now}`,
          buoyId: b.id,
          buoyName: b.name,
          severity: t.severity,
          title: t.title,
          message: t.message(b),
          timestamp: now,
          acknowledged: false,
        })
        created = true
      })
    })

    this.alerts = this.alerts.slice(0, 200)
    if (created) this.listeners.forEach((cb) => cb(this.alerts))
    return created
  }

  acknowledge(id: string) {
    this.alerts = this.alerts.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
    this.listeners.forEach((cb) => cb(this.alerts))
  }

  seed(alerts: AlertItem[]) {
    this.alerts = alerts
  }

  subscribe(cb: Listener) {
    this.listeners.add(cb)
    cb(this.alerts)
    return () => this.listeners.delete(cb)
  }

  getSnapshot() {
    return this.alerts
  }
}

export const alertService = new AlertService()
