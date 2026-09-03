export type BuoyStatus = 'online' | 'offline' | 'degraded'

export interface TelemetryPoint {
  timestamp: number
  value: number
}

export interface BuoyTelemetry {
  temperature: number
  salinity: number
  ph: number
  oxygen: number
  pressure: number
  humidity: number
  windSpeed: number
  battery: number
}

export interface Buoy {
  id: string
  name: string
  latitude: number
  longitude: number
  status: BuoyStatus
  region: string
  deployedAt: string
  lastSync: number
  signalStrength: number // 0-100
  storageUsage: number // 0-100
  telemetry: BuoyTelemetry
  history: {
    temperature: TelemetryPoint[]
    salinity: TelemetryPoint[]
    windSpeed: TelemetryPoint[]
    battery: TelemetryPoint[]
    pressure: TelemetryPoint[]
  }
}

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low'

export interface AlertItem {
  id: string
  buoyId: string
  buoyName: string
  severity: AlertSeverity
  title: string
  message: string
  timestamp: number
  acknowledged: boolean
}

export interface AIRecommendation {
  id: string
  tone: 'positive' | 'warning' | 'neutral'
  text: string
}

export interface AIInsightState {
  batteryRemainingDays: number
  sensorHealthPct: number
  stormProbabilityPct: number
  anomalyScore: number // 0-100, lower is better
  recommendations: AIRecommendation[]
}

export interface FleetSummary {
  activeBuoys: number
  onlineBuoys: number
  totalBuoys: number
  activeAlerts: number
  avgBattery: number
  avgOceanTemp: number
  avgWindSpeed: number
}

export type TimeRange = '24h' | '7d' | '30d'

export interface ToastMessage {
  id: string
  variant: 'success' | 'warning' | 'danger' | 'info'
  title: string
  description?: string
}
