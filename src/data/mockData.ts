import { Buoy } from '@/types'

// Coordinates across polar regions
const BUOY_SEEDS: { id: string; lat: number; lon: number; region: string }[] = [
  { id: 'PS-01', lat: -65.2, lon: -45.8, region: 'North Pole' },
  { id: 'PS-02', lat: -76.5, lon: 168.3, region: 'region' },
  { id: 'PS-03', lat: -60.1, lon: -63.4, region: 'region' },
  { id: 'PS-04', lat: -73.8, lon: -112.6, region: 'region' },
  { id: 'PS-05', lat: -68.9, lon: -78.2, region: 'region' },
  { id: 'PS-06', lat: -60.6, lon: -45.5, region: 'region' },
  { id: 'PS-07', lat: -49.3, lon: 69.5, region: 'region' },
  { id: 'PS-08', lat: -68.4, lon: 76.8, region: 'region' },
  { id: 'PS-09', lat: -66.0, lon: 91.2, region: 'region' },
  { id: 'PS-10', lat: -67.6, lon: 62.9, region: 'region' },
  { id: 'PS-11', lat: -57.8, lon: -26.4, region: 'region' },
  { id: 'PS-12', lat: -66.8, lon: 45.1, region: 'region' },
  { id: 'PS-13', lat: -65.9, lon: 53.7, region: 'region' },
  { id: 'PS-14', lat: -64.7, lon: 112.4, region: 'region' },
  { id: 'PS-15', lat: -66.9, lon: 163.2, region: 'region' },
  { id: 'PS-16', lat: -66.3, lon: -60.9, region: 'region' },
  { id: 'PS-17', lat: -63.4, lon: -57.1, region: 'region' },
  { id: 'PS-18', lat: -54.4, lon: -36.6, region: 'region' },
  { id: 'PS-19', lat: -69.7, lon: 71.3, region: 'region' },
  { id: 'PS-20', lat: -74.9, lon: 164.1, region: 'region' },
  { id: 'PS-21', lat: -70.2, lon: -1.2, region: 'region' },
  { id: 'PS-22', lat: -69.4, lon: 15.6, region: 'region' },
  { id: 'PS-23', lat: -66.1, lon: 100.6, region: 'region' },
  { id: 'PS-24', lat: -55.1, lon: 3.4, region: 'region' },
]

export function generateInitialFleet(): Buoy[] {
  return BUOY_SEEDS.map((seed) => {
    const isRealBuoy = seed.id === 'PS-01'

    return {
      id: seed.id,
      name: isRealBuoy ? 'PS-01' : 'Unnamed',
      latitude: seed.lat,
      longitude: seed.lon,
      status: 'offline' as const,
      region: seed.region,
      deployedAt: new Date(0).toISOString(),
      lastSync: 0,
      signalStrength: 0,
      storageUsage: 0,
      telemetry: {
        temperature: 0,
        humidity: 0,
        pressure: 0,
        salinity: 0,
        windSpeed: 0,
        battery: 0,
        airTemperature: 0,
        accelX: 0,
        accelY: 0,
        accelZ: 0,
        gyroX: 0,
        gyroY: 0,
        gyroZ: 0,
        waveHeight: 0,
        iceConcentration: 0,
        currentSpeed: 0,
        mode: 'OFFLINE',
        sampling: 'OFFLINE',
        energyMode: 'OFFLINE',
        risk: 'NONE',
        ph: 0,
        oxygen: 0,
      },
      history: {
        temperature: [],
        airTemperature: [],
        humidity: [],
        pressure: [],
        windSpeed: [],
        waveHeight: [],
        salinity: [],
        iceConcentration: [],
        currentSpeed: [],
        battery: [],
      },
    }
  })
}
