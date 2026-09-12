import { Buoy } from '@/types'

type Listener = (buoys: Buoy[]) => void

/**
 * Fleet telemetry service.
 * Inactive buoys (PS-02..PS-24) remain static offline placeholders with 0 readings.
 * PS-01 is managed exclusively by liveTelemetryService.
 */
class TelemetryService {
  private buoys: Buoy[] = []
  private listeners: Set<Listener> = new Set()

  init(initialFleet: Buoy[]) {
    this.buoys = initialFleet
    return this
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
    this.listeners.clear()
  }
}

export const telemetryService = new TelemetryService()
