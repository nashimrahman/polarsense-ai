import { useMemo } from 'react'
import { Radio, Wifi, AlertTriangle, BatteryMedium, Thermometer, Wind } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { StatCard } from '@/components/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Sparkline } from '@/components/ui/Sparkline'
import { Badge } from '@/components/ui/primitives'
import { statusColor, formatRelativeTime } from '@/lib/utils'
import { Link, useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()
  const buoys = useStore((s) => s.buoys)
  const initialized = useStore((s) => s.initialized)
  const selectBuoy = useStore((s) => s.selectBuoy)

  const summary = useMemo(() => {
    const online = buoys.filter((b) => b.status !== 'offline')
    const avgBattery = online.reduce((s, b) => s + b.telemetry.battery, 0) / (online.length || 1)
    const avgTemp = online.reduce((s, b) => s + b.telemetry.temperature, 0) / (online.length || 1)
    const avgWind = online.reduce((s, b) => s + b.telemetry.windSpeed, 0) / (online.length || 1)
    return {
      total: buoys.length,
      online: online.length,
      avgBattery,
      avgTemp,
      avgWind,
    }
  }, [buoys])

  const alerts = useStore((s) => s.alerts)
  const activeAlerts = alerts.filter((a) => !a.acknowledged).length

  if (!initialized) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={Radio} label="Active Buoys" value={summary.total} accent="blue" delay={0} />
        <StatCard icon={Wifi} label="Online Devices" value={summary.online} suffix={`/${summary.total}`} accent="cyan" delay={0.05} />
        <StatCard icon={AlertTriangle} label="Active Alerts" value={activeAlerts} accent={activeAlerts > 3 ? 'danger' : 'warning'} delay={0.1} />
        <StatCard icon={BatteryMedium} label="Average Battery" value={summary.avgBattery} decimals={0} suffix="%" accent="success" delay={0.15} />
        <StatCard icon={Thermometer} label="Ocean Temperature" value={summary.avgTemp} decimals={1} suffix="°C" accent="cyan" delay={0.2} />
        <StatCard icon={Wind} label="Wind Speed" value={summary.avgWind} decimals={0} suffix=" km/h" accent="blue" delay={0.25} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Fleet Snapshot</CardTitle>
            <Link to="/live" className="text-xs font-medium text-accent-cyan hover:underline">
              View live monitoring
            </Link>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="max-h-[420px] space-y-1 overflow-y-auto pr-1">
              {buoys.map((b) => {
                const sc = statusColor(b.status)
                return (
                  <div
                    key={b.id}
                    onClick={() => {
                      selectBuoy(b.id)
                      navigate(`/live?buoy=${b.id}`)
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        selectBuoy(b.id)
                        navigate(`/live?buoy=${b.id}`)
                      }
                    }}
                    className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-2.5 transition-colors hover:bg-white/[0.06] active:bg-white/[0.08]"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`h-2 w-2 rounded-full ${sc.dot}`} />
                      <div>
                        <p className="text-sm font-medium text-text-primary">{b.name}</p>
                        <p className="text-xs text-text-secondary">{b.id} · {b.region}</p>
                      </div>
                    </div>
                    <div className="hidden items-center gap-6 sm:flex">
                      <span className="tabular text-xs text-text-secondary">{b.telemetry.temperature.toFixed(1)}°C</span>
                      <span className="tabular text-xs text-text-secondary">{b.telemetry.battery.toFixed(0)}%</span>
                      <span className="w-16 text-right text-xs text-text-secondary">{formatRelativeTime(b.lastSync)}</span>
                    </div>
                    <Badge variant={b.status === 'online' ? 'success' : b.status === 'degraded' ? 'warning' : 'danger'}>
                      {b.status}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fleet Avg. Temperature Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <Sparkline data={buoys[0]?.history.temperature ?? []} color="#06B6D4" height={140} />
            <p className="mt-3 text-xs text-text-secondary">
              Trailing 48-hour readings across the {buoys[0]?.region ?? 'network'} sector, sampled every 3 seconds in this simulation.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
