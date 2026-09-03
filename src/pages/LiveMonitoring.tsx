import { useMemo, useState } from 'react'
import {
  Thermometer,
  Droplets,
  FlaskConical,
  Wind as WindIcon,
  Gauge as GaugeIcon,
  CloudDrizzle,
  BatteryMedium,
  Waves,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Sparkline } from '@/components/ui/Sparkline'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

const METRICS = [
  { key: 'temperature', label: 'Temperature', unit: '°C', icon: Thermometer, color: '#06B6D4' },
  { key: 'salinity', label: 'Salinity', unit: ' PSU', icon: Droplets, color: '#3B82F6' },
  { key: 'ph', label: 'pH Level', unit: '', icon: FlaskConical, color: '#22C55E' },
  { key: 'oxygen', label: 'Dissolved Oxygen', unit: ' mg/L', icon: Waves, color: '#06B6D4' },
  { key: 'pressure', label: 'Pressure', unit: ' hPa', icon: GaugeIcon, color: '#3B82F6' },
  { key: 'humidity', label: 'Humidity', unit: '%', icon: CloudDrizzle, color: '#9CA3AF' },
  { key: 'windSpeed', label: 'Wind Speed', unit: ' km/h', icon: WindIcon, color: '#F59E0B' },
  { key: 'battery', label: 'Battery', unit: '%', icon: BatteryMedium, color: '#22C55E' },
] as const

export default function LiveMonitoring() {
  const buoys = useStore((s) => s.buoys)
  const initialized = useStore((s) => s.initialized)
  const [selected, setSelected] = useState<string | null>(null)

  const active = useMemo(() => buoys.find((b) => b.id === selected) ?? buoys.find((b) => b.status === 'online') ?? buoys[0], [buoys, selected])

  if (!initialized || !active) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
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
            {b.id}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-base font-semibold text-text-primary">{active.name}</h2>
          <p className="text-xs text-text-secondary">{active.region} · updating every 3s</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {METRICS.map((m) => {
          const value = active.telemetry[m.key as keyof typeof active.telemetry]
          const history = m.key in active.history ? active.history[m.key as keyof typeof active.history] : undefined
          const prev = history && history.length > 1 ? history[history.length - 2].value : value
          const up = value >= prev

          return (
            <Card key={m.key} className="p-5">
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
                {value.toFixed(m.key === 'ph' ? 2 : 1)}
                {m.unit}
              </p>
              <p className="text-xs text-text-secondary">{m.label}</p>
              {history && (
                <div className="mt-2 -mx-1">
                  <Sparkline data={history} color={m.color} height={40} />
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
