import { useMemo, useState } from 'react'
import { Wifi, WifiOff, BatteryFull, Signal, HardDrive, Clock } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Progress, Badge } from '@/components/ui/primitives'
import { Gauge } from '@/components/ui/Gauge'
import { cn, formatRelativeTime, statusColor } from '@/lib/utils'

export default function DeviceHealth() {
  const buoys = useStore((s) => s.buoys)
  const [selected, setSelected] = useState<string | null>(null)
  const active = useMemo(() => buoys.find((b) => b.id === selected) ?? buoys[0], [buoys, selected])

  const healthScore = useMemo(() => {
    if (!active) return 0
    const connectivity = active.status === 'online' ? 100 : active.status === 'degraded' ? 55 : 0
    return Math.round(connectivity * 0.4 + active.telemetry.battery * 0.35 + active.signalStrength * 0.25)
  }, [active])

  if (!active) return null

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <Card className="xl:col-span-1">
        <CardHeader><CardTitle>Fleet Devices</CardTitle></CardHeader>
        <CardContent className="max-h-[520px] space-y-1 overflow-y-auto pt-2">
          {buoys.map((b) => {
            const sc = statusColor(b.status)
            return (
              <button
                key={b.id}
                onClick={() => setSelected(b.id)}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                  active.id === b.id ? 'bg-accent-blue/10 text-accent-blue' : 'text-text-primary hover:bg-white/5'
                )}
              >
                <span className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                  {b.name}
                </span>
                <span className="text-xs text-text-secondary">{b.telemetry.battery.toFixed(0)}%</span>
              </button>
            )
          })}
        </CardContent>
      </Card>

      <div className="space-y-4 xl:col-span-2">
        <Card className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-4">
            <Gauge value={healthScore} size={100} color={healthScore > 80 ? '#22C55E' : healthScore > 50 ? '#F59E0B' : '#EF4444'} label="Score" />
            <div>
              <h2 className="font-display text-base font-semibold text-text-primary">{active.name}</h2>
              <p className="text-xs text-text-secondary">{active.id} · {active.region}</p>
              <Badge variant={active.status === 'online' ? 'success' : active.status === 'degraded' ? 'warning' : 'danger'} className="mt-2">
                {active.status === 'online' ? <Wifi size={11} /> : <WifiOff size={11} />} {active.status}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <Clock size={13} /> Last sync {formatRelativeTime(active.lastSync)}
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricPanel icon={BatteryFull} label="Battery" value={active.telemetry.battery} unit="%" />
          <MetricPanel icon={Signal} label="Signal Strength" value={active.signalStrength} unit="%" />
          <MetricPanel icon={HardDrive} label="Storage Usage" value={active.storageUsage} unit="%" />
        </div>

        <Card>
          <CardHeader><CardTitle>Deployment Info</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <InfoField label="Deployed" value={new Date(active.deployedAt).toLocaleDateString()} />
            <InfoField label="Latitude" value={active.latitude.toFixed(2)} />
            <InfoField label="Longitude" value={active.longitude.toFixed(2)} />
            <InfoField label="Region" value={active.region} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MetricPanel({ icon: Icon, label, value, unit }: { icon: any; label: string; value: number; unit: string }) {
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs text-text-secondary">
          <Icon size={14} /> {label}
        </span>
        <span className="tabular text-sm font-semibold text-text-primary">{value.toFixed(0)}{unit}</span>
      </div>
      <Progress value={value} />
    </Card>
  )
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-text-primary">{value}</p>
    </div>
  )
}
