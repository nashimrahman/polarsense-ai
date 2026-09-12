import { create } from 'zustand'
import { AIInsightState, AlertItem, Buoy, ToastMessage } from '@/types'
import { generateInitialFleet } from '@/data/mockData'
import { telemetryService } from '@/services/telemetryService'
import { alertService } from '@/services/alertService'
import { predictionService } from '@/services/predictionService'
import { liveTelemetryService } from '@/services/liveTelemetryService'

interface StoreState {
  buoys: Buoy[]
  alerts: AlertItem[]
  insights: AIInsightState
  toasts: ToastMessage[]
  selectedBuoyId: string | null
  initialized: boolean
  init: () => void
  selectBuoy: (id: string | null) => void
  acknowledgeAlert: (id: string) => void
  pushToast: (toast: Omit<ToastMessage, 'id'>) => void
  dismissToast: (id: string) => void
}

let initStarted = false

export const useStore = create<StoreState>((set, get) => ({
  buoys: [],
  alerts: [],
  insights: {
    batteryRemainingDays: 0,
    sensorHealthPct: 0,
    stormProbabilityPct: 0,
    anomalyScore: 0,
    recommendations: [],
  },
  toasts: [],
  selectedBuoyId: null,
  initialized: false,

  init: () => {
    if (initStarted) return
    initStarted = true

    const fleet = generateInitialFleet()
    telemetryService.init(fleet)

    telemetryService.subscribe((buoys) => {
      const insights = predictionService.infer(buoys)
      set({
        buoys,
        insights,
        initialized: true,
      })

      const createdNew = alertService.evaluate(buoys)
      if (createdNew) {
        const latest = alertService.getSnapshot()[0]
        set({ alerts: alertService.getSnapshot() })
        if (latest) {
          get().pushToast({
            variant: latest.severity === 'critical' || latest.severity === 'high' ? 'danger' : 'warning',
            title: latest.title,
            description: latest.buoyName,
          })
        }
      }
    })

    liveTelemetryService.init()
    liveTelemetryService.subscribe((patch) => {
      set((s) => {
        const nextBuoys = s.buoys.map((b) =>
          b.id === patch.id
            ? {
                ...b,
                ...patch,
                telemetry: patch.telemetry ? { ...patch.telemetry } : b.telemetry,
                history: patch.history ? { ...patch.history } : b.history,
              }
            : b
        )
        const insights = predictionService.infer(nextBuoys)
        const createdNew = alertService.evaluate(nextBuoys)
        if (createdNew) {
          const latest = alertService.getSnapshot()[0]
          if (latest) {
            get().pushToast({
              variant: latest.severity === 'critical' || latest.severity === 'high' ? 'danger' : 'warning',
              title: latest.title,
              description: latest.buoyName,
            })
          }
        }
        return {
          buoys: nextBuoys,
          insights,
          alerts: alertService.getSnapshot(),
        }
      })
    })

    alertService.subscribe((alerts) => set({ alerts }))
  },

  selectBuoy: (id) => set({ selectedBuoyId: id }),

  acknowledgeAlert: (id) => alertService.acknowledge(id),

  pushToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }))
    setTimeout(() => get().dismissToast(id), 5000)
  },

  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
