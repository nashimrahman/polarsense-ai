import { Buoy, BuoyStatus, TelemetryPoint } from '@/types'

// Realistic-ish Southern Ocean / Antarctic perimeter coordinates
const BUOY_SEEDS: { id: string; name: string; lat: number; lon: number; region: string }[] = [
  { id: 'PS-01', name: 'Weddell Sentinel', lat: -65.2, lon: -45.8, region: 'Weddell Sea' },
  { id: 'PS-02', name: 'Ross Ice Watch', lat: -76.5, lon: 168.3, region: 'Ross Sea' },
  { id: 'PS-03', name: 'Drake Passage I', lat: -60.1, lon: -63.4, region: 'Drake Passage' },
  { id: 'PS-04', name: 'Amundsen Drift', lat: -73.8, lon: -112.6, region: 'Amundsen Sea' },
  { id: 'PS-05', name: 'Bellingshausen A', lat: -68.9, lon: -78.2, region: 'Bellingshausen Sea' },
  { id: 'PS-06', name: 'South Orkney Buoy', lat: -60.6, lon: -45.5, region: 'Scotia Sea' },
  { id: 'PS-07', name: 'Kerguelen Node', lat: -49.3, lon: 69.5, region: 'Kerguelen Plateau' },
  { id: 'PS-08', name: 'Prydz Bay Watch', lat: -68.4, lon: 76.8, region: 'Prydz Bay' },
  { id: 'PS-09', name: 'Davis Sea Relay', lat: -66.0, lon: 91.2, region: 'Davis Sea' },
  { id: 'PS-10', name: 'Mawson Coastal', lat: -67.6, lon: 62.9, region: 'Mac. Robertson Land' },
  { id: 'PS-11', name: 'South Sandwich N', lat: -57.8, lon: -26.4, region: 'South Sandwich' },
  { id: 'PS-12', name: 'Cosmonaut Sea I', lat: -66.8, lon: 45.1, region: 'Cosmonaut Sea' },
  { id: 'PS-13', name: 'Enderby Land Buoy', lat: -65.9, lon: 53.7, region: 'Enderby Land' },
  { id: 'PS-14', name: 'Wilkes Land Node', lat: -64.7, lon: 112.4, region: 'Wilkes Land' },
  { id: 'PS-15', name: 'Balleny Islands', lat: -66.9, lon: 163.2, region: 'Balleny Islands' },
  { id: 'PS-16', name: 'Larsen Shelf I', lat: -66.3, lon: -60.9, region: 'Larsen Ice Shelf' },
  { id: 'PS-17', name: 'Antarctic Peninsula S', lat: -63.4, lon: -57.1, region: 'Antarctic Peninsula' },
  { id: 'PS-18', name: 'South Georgia Relay', lat: -54.4, lon: -36.6, region: 'South Georgia' },
  { id: 'PS-19', name: 'Amery Basin Node', lat: -69.7, lon: 71.3, region: 'Amery Ice Shelf' },
  { id: 'PS-20', name: 'Terra Nova Bay', lat: -74.9, lon: 164.1, region: 'Terra Nova Bay' },
  { id: 'PS-21', name: 'Fimbul Shelf Buoy', lat: -70.2, lon: -1.2, region: 'Fimbul Ice Shelf' },
  { id: 'PS-22', name: 'Riiser-Larsen Node', lat: -69.4, lon: 15.6, region: 'Riiser-Larsen Sea' },
  { id: 'PS-23', name: 'Shackleton Coast', lat: -66.1, lon: 100.6, region: 'Shackleton Coast' },
  { id: 'PS-24', name: 'Bouvet Fringe Relay', lat: -55.1, lon: 3.4, region: 'Bouvet Basin' },
]

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function buildHistory(rand: () => number, base: number, volatility: number, points: number, floor: number, ceil: number): TelemetryPoint[] {
  const now = Date.now()
  const arr: TelemetryPoint[] = []
  let v = base
  for (let i = points; i >= 0; i--) {
    v = Math.max(floor, Math.min(ceil, v + (rand() - 0.5) * volatility))
    arr.push({ timestamp: now - i * 60 * 60 * 1000, value: Number(v.toFixed(2)) })
  }
  return arr
}

function statusFor(rand: () => number): BuoyStatus {
  const r = rand()
  if (r > 0.95) return 'offline'
  if (r > 0.85) return 'degraded'
  return 'online'
}

export function generateInitialFleet(): Buoy[] {
  return BUOY_SEEDS.map((seed, i) => {
    const rand = seededRandom(i * 137 + 7)
    const status = statusFor(rand)
    const baseTemp = -1.8 + (rand() - 0.5) * 1.5
    const baseBattery = 60 + rand() * 38
    const baseWind = 10 + rand() * 22
    const basePressure = 990 + rand() * 40
    const baseSalinity = 33.5 + rand() * 2

    return {
      id: seed.id,
      name: seed.name,
      latitude: seed.lat,
      longitude: seed.lon,
      status,
      region: seed.region,
      deployedAt: new Date(Date.now() - (200 + rand() * 500) * 24 * 60 * 60 * 1000).toISOString(),
      lastSync: Date.now() - Math.floor(rand() * 120) * 1000,
      signalStrength: status === 'offline' ? 0 : Math.round(40 + rand() * 60),
      storageUsage: Math.round(20 + rand() * 70),
      telemetry: {
        temperature: Number(baseTemp.toFixed(1)),
        salinity: Number(baseSalinity.toFixed(1)),
        ph: Number((7.9 + rand() * 0.4).toFixed(2)),
        oxygen: Number((5.5 + rand() * 2).toFixed(1)),
        pressure: Number(basePressure.toFixed(0)),
        humidity: Math.round(60 + rand() * 30),
        windSpeed: Number(baseWind.toFixed(1)),
        battery: Math.round(baseBattery),
      },
      history: {
        temperature: buildHistory(rand, baseTemp, 0.4, 48, -3, 2),
        salinity: buildHistory(rand, baseSalinity, 0.15, 48, 32, 36),
        windSpeed: buildHistory(rand, baseWind, 3, 48, 0, 60),
        battery: buildHistory(rand, baseBattery, 1.5, 48, 0, 100),
        pressure: buildHistory(rand, basePressure, 2, 48, 970, 1040),
      },
    }
  })
}
