import { useMemo, useState } from 'react'
import { AlertTriangle, BatteryWarning, ThermometerSun, WifiOff, RadioTower, Check } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { AlertSeverity } from '@/types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/primitives'
import { cn, formatRelativeTime, severityColor } from '@/lib/utils'

const SEVERITIES: AlertSeverity[] = ['critical', 'high', 'medium', 'low']

const ICONS: Record<string, any> = {
  'HIGH WIND DETECTED': AlertTriangle,
  'BATTERY BELOW 20%': BatteryWarning,
  'TEMPERATURE ANOMALY': ThermometerSun,
  'SENSOR OFFLINE': WifiOff,
  'WEAK SIGNAL STRENGTH': RadioTower,
}

export default function Alerts() {
  const alerts = useStore((s) => s.alerts)
  const acknowledgeAlert = useStore((s) => s.acknowledgeAlert)
  const [filter, setFilter] = useState<AlertSeverity | 'all'>('all')

  const filtered = useMemo(() => (filter === 'all' ? alerts : alerts.filter((a) => a.severity === filter)), [alerts, filter])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: alerts.length }
    SEVERITIES.forEach((s) => (c[s] = alerts.filter((a) => a.severity === s).length))
    return c
  }, [alerts])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <FilterChip label={`All (${counts.all})`} active={filter === 'all'} onClick={() => setFilter('all')} />
        {SEVERITIES.map((s) => (
          <FilterChip key={s} label={`${s[0].toUpperCase()}${s.slice(1)} (${counts[s]})`} active={filter === s} onClick={() => setFilter(s)} severity={s} />
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-2 p-14 text-center">
          <Check size={28} className="text-status-success" />
          <p className="text-sm font-medium text-text-primary">No alerts match this filter</p>
          <p className="text-xs text-text-secondary">The fleet is operating within expected parameters.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => {
            const sc = severityColor(a.severity)
            const Icon = ICONS[a.title] ?? AlertTriangle
            return (
              <Card key={a.id} className={cn('flex items-start gap-3 p-4', a.acknowledged && 'opacity-50')}>
                <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', sc.bg)}>
                  <Icon size={16} className={sc.text} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-text-primary">{a.title}</p>
                    <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide', sc.text, sc.border, sc.bg)}>
                      {a.severity}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-text-secondary">{a.message}</p>
                  <p className="mt-1 text-[11px] text-text-secondary/70">{a.buoyName} · {formatRelativeTime(a.timestamp)}</p>
                </div>
                {!a.acknowledged && (
                  <Button size="sm" variant="outline" onClick={() => acknowledgeAlert(a.id)}>
                    Acknowledge
                  </Button>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FilterChip({ label, active, onClick, severity }: { label: string; active: boolean; onClick: () => void; severity?: AlertSeverity }) {
  const sc = severity ? severityColor(severity) : null
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        active ? (sc ? `${sc.bg} ${sc.text} ${sc.border}` : 'border-accent-blue/50 bg-accent-blue/10 text-accent-blue') : 'border-base-border text-text-secondary hover:bg-white/5'
      )}
    >
      {label}
    </button>
  )
}
