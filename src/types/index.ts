export type BuoyStatus = 'online' | 'offline' | 'degraded'

export interface TelemetryPoint {
  timestamp: number
  value: number
}

export interface BuoyTelemetry {
  // Real Sensor Data
  temperature: number          // Water temperature (°C)
  humidity: number             // Humidity (%)
  pressure: number             // Pressure (hPa)
  salinity: number             // Salinity (PSU)
  windSpeed: number            // Wind speed (km/h)
  battery: number              // Battery (%)

  // Extended Sensor & Environment Fields (optional for flexible initialization)
  airTemperature?: number       // Air temperature (°C)
  accelX?: number               // Acceleration X (g)
  accelY?: number               // Acceleration Y (g)
  accelZ?: number               // Acceleration Z (g)
  gyroX?: number                // Gyroscope X (dps)
  gyroY?: number                // Gyroscope Y (dps)
  gyroZ?: number                // Gyroscope Z (dps)
  waveHeight?: number           // Wave height (m)
  iceConcentration?: number     // Ice concentration (%)
  currentSpeed?: number         // Current speed (m/s)

  // Autonomous System
  mode?: string                 // Operation mode
  sampling?: string             // Sampling rate / state
  energyMode?: string           // Energy mode
  risk?: string                 // Risk assessment

  // Compatibility fields
  ph?: number
  oxygen?: number
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
    // Extended metrics — optional so existing fleet init/mockData remains compatible
    airTemperature?: TelemetryPoint[]
    humidity?: TelemetryPoint[]
    waveHeight?: TelemetryPoint[]
    iceConcentration?: TelemetryPoint[]
    currentSpeed?: TelemetryPoint[]
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
