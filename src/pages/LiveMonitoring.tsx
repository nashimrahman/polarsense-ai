import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Thermometer,
  Droplets,
  Wind as WindIcon,
  Gauge as GaugeIcon,
  CloudDrizzle,
  BatteryMedium,
  Waves,
  Compass,
  Snowflake,
  Cpu,
  Activity,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { Card } from '@/components/ui/Card'
import { Sparkline } from '@/components/ui/Sparkline'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

const METRICS = [
  { key: 'temperature', label: 'Water Temp', unit: '°C', icon: Thermometer, color: '#06B6D4' },
  { key: 'airTemperature', label: 'Air Temp', unit: '°C', icon: Thermometer, color: '#38BDF8' },
  { key: 'humidity', label: 'Humidity', unit: '%', icon: CloudDrizzle, color: '#9CA3AF' },
  { key: 'pressure', label: 'Pressure', unit: ' hPa', icon: GaugeIcon, color: '#3B82F6' },
  { key: 'windSpeed', label: 'Wind Speed', unit: ' km/h', icon: WindIcon, color: '#F59E0B' },
  { key: 'waveHeight', label: 'Wave Height', unit: ' m', icon: Waves, color: '#06B6D4' },
  { key: 'salinity', label: 'Salinity', unit: ' PSU', icon: Droplets, color: '#3B82F6' },
  { key: 'iceConcentration', label: 'Ice Concentration', unit: '%', icon: Snowflake, color: '#A5B4FC' },
  { key: 'currentSpeed', label: 'Current Speed', unit: ' m/s', icon: Compass, color: '#38BDF8' },
  { key: 'battery', label: 'Battery', unit: '%', icon: BatteryMedium, color: '#22C55E' },
] as const

export default function LiveMonitoring() {
  const [searchParams, setSearchParams] = useSearchParams()
  const buoys = useStore((s) => s.buoys)
  const initialized = useStore((s) => s.initialized)
  const selectedBuoyId = useStore((s) => s.selectedBuoyId)
  const selectBuoy = useStore((s) => s.selectBuoy)

  const selected = searchParams.get('buoy') || selectedBuoyId

  const setSelected = (id: string) => {
    selectBuoy(id)
    setSearchParams({ buoy: id }, { replace: true })
  }

  const active = useMemo(
    () => buoys.find((b) => b.id === selected) ?? buoys.find((b) => b.status === 'online') ?? buoys[0],
    [buoys, selected]
  )

  if (!initialized || !active) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {buoys.map((b) => (
          <button
            key={b.id}
            onClick={() => setSelected(b.id)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              active.id === b.id
                ? 'border-accent-blue/50 bg-accent-blue/10 text-accent-blue'
                : 'border-base-border text-text-secondary hover:bg-white/5'
            )}
          >
            {b.name}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-base font-semibold text-text-primary">{active.name}</h2>
          <p className="text-xs text-text-secondary">{active.region} · {active.status === 'online' ? 'Live stream' : 'Offline'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {METRICS.map((m) => {
          const rawValue = active.telemetry[m.key as keyof typeof active.telemetry]
          const value = typeof rawValue === 'number' ? rawValue : 0
          const history = (active.history?.[m.key as keyof typeof active.history] as any) ?? []
          const prev = history && history.length > 1 ? history[history.length - 2].value : value
          const up = value >= prev

          return (
            <Card key={m.key} className="p-5 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${m.color}1A`, color: m.color }}>
                  <m.icon size={16} />
                </div>
                <span className={cn('flex items-center gap-0.5 text-xs font-medium', up ? 'text-status-success' : 'text-status-danger')}>
                  {up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                  {Math.abs(value - prev).toFixed(2)}
                </span>
              </div>
              <p className="mt-3 text-xl font-semibold tabular text-text-primary">
                {value.toFixed(1)}
                {m.unit}
              </p>
              <p className="text-xs text-text-secondary">{m.label}</p>
              <div className="mt-2 -mx-1 h-10 w-full min-w-0">
                <Sparkline data={history} color={m.color} height={40} />
              </div>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
            <Cpu size={14} className="text-accent-cyan" /> Autonomous System Status
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <div className="rounded-lg bg-white/[0.02] border border-base-border p-3">
              <span className="text-text-secondary block mb-1">Mode</span>
              <span className="font-semibold text-text-primary text-sm">{active.telemetry.mode || 'NORMAL'}</span>
            </div>
            <div className="rounded-lg bg-white/[0.02] border border-base-border p-3">
              <span className="text-text-secondary block mb-1">Sampling</span>
              <span className="font-semibold text-text-primary text-sm">{active.telemetry.sampling || 'NORMAL'}</span>
            </div>
            <div className="rounded-lg bg-white/[0.02] border border-base-border p-3">
              <span className="text-text-secondary block mb-1">Energy Mode</span>
              <span className="font-semibold text-text-primary text-sm">{active.telemetry.energyMode || 'POWER_SAVING'}</span>
            </div>
            <div className="rounded-lg bg-white/[0.02] border border-base-border p-3">
              <span className="text-text-secondary block mb-1">Risk</span>
              <span className="font-semibold text-status-success text-sm">{active.telemetry.risk || 'LOW'}</span>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
            <Activity size={14} className="text-accent-blue" /> IMU & Position Telemetry
          </div>
          <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
            <div className="rounded-lg bg-white/[0.02] border border-base-border p-3">
              <span className="text-text-secondary block mb-1">Acceleration (g)</span>
              <span className="font-mono text-xs text-text-primary">
                X:{(active.telemetry.accelX ?? 0).toFixed(2)} Y:{(active.telemetry.accelY ?? 0).toFixed(2)} Z:{(active.telemetry.accelZ ?? 0).toFixed(2)}
              </span>
            </div>
            <div className="rounded-lg bg-white/[0.02] border border-base-border p-3">
              <span className="text-text-secondary block mb-1">Gyroscope (dps)</span>
              <span className="font-mono text-xs text-text-primary">
                X:{(active.telemetry.gyroX ?? 0).toFixed(2)} Y:{(active.telemetry.gyroY ?? 0).toFixed(2)} Z:{(active.telemetry.gyroZ ?? 0).toFixed(2)}
              </span>
            </div>
            <div className="rounded-lg bg-white/[0.02] border border-base-border p-3">
              <span className="text-text-secondary block mb-1">GPS Position</span>
              <span className="font-mono text-xs text-text-primary">
                {typeof active.latitude === 'number' && typeof active.longitude === 'number'
                  ? `${active.latitude.toFixed(4)}°, ${active.longitude.toFixed(4)}°`
                  : 'Searching...'}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
