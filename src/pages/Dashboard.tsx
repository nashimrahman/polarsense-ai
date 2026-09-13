import { useMemo, useState } from 'react'
import { Radio, Wifi, AlertTriangle, BatteryMedium, Thermometer, Wind, Download, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { StatCard } from '@/components/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Sparkline } from '@/components/ui/Sparkline'
import { Badge, Button } from '@/components/ui/primitives'
import { statusColor, formatRelativeTime } from '@/lib/utils'
import { Link, useNavigate } from 'react-router-dom'
import { exportTelemetry, ExportFormat } from '@/services/exportService'

// ─── Export Panel ────────────────────────────────────────────────────────────

type ExportStatus =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'success'; filename: string }
  | { type: 'error'; message: string }

function ExportPanel() {
  const buoys = useStore((s) => s.buoys)

  // Only list buoys that are real/active (PS-01). Placeholder buoys stay offline.
  // We still show all buoys in the dropdown but default to PS-01.
  const [buoyId, setBuoyId] = useState('PS-01')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [format, setFormat] = useState<ExportFormat>('csv')
  const [status, setStatus] = useState<ExportStatus>({ type: 'idle' })

  // Today's date as the max allowed value for date inputs
  const todayISO = new Date().toISOString().slice(0, 10)

  async function handleExport() {
    // Client-side validation
    if (from && to && new Date(from) > new Date(to)) {
      setStatus({ type: 'error', message: '"From" date must not be after "To" date.' })
      return
    }

    setStatus({ type: 'loading' })
    try {
      await exportTelemetry({
        buoyId,
        from: from || undefined,
        to: to || undefined,
        format,
      })
      // Build a display filename for the success toast
      const dateSuffix =
        from && to ? `${from} → ${to}`
        : from     ? `from ${from}`
        : to       ? `to ${to}`
        : 'all time'
      setStatus({ type: 'success', filename: `${buoyId} · ${dateSuffix} · ${format.toUpperCase()}` })
    } catch (err) {
      setStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Export failed. Please try again.',
      })
    }
  }

  const isLoading = status.type === 'loading'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-4 w-4 text-accent-cyan" />
          Export Previous Data
        </CardTitle>
        <span className="text-xs text-text-secondary">PostgreSQL → file download</span>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Buoy selector */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="export-buoy" className="text-xs font-medium text-text-secondary">
              Buoy
            </label>
            <select
              id="export-buoy"
              value={buoyId}
              onChange={(e) => { setBuoyId(e.target.value); setStatus({ type: 'idle' }) }}
              disabled={isLoading}
              className="h-9 rounded-lg border border-base-border bg-base-card px-3 text-sm text-text-primary
                         focus:outline-none focus:ring-1 focus:ring-accent-cyan/60
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {/* Only PS-01 is a real buoy — list it first and mark others as offline */}
              <option value="PS-01">PS-01 (Active Buoy)</option>
              {buoys
                .filter((b) => b.id !== 'PS-01')
                .slice(0, 5)
                .map((b) => (
                  <option key={b.id} value={b.id} disabled>
                    {b.id} (offline)
                  </option>
                ))}
            </select>
          </div>

          {/* From date */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="export-from" className="text-xs font-medium text-text-secondary">
              From
            </label>
            <input
              id="export-from"
              type="date"
              value={from}
              max={to || todayISO}
              onChange={(e) => { setFrom(e.target.value); setStatus({ type: 'idle' }) }}
              disabled={isLoading}
              className="h-9 rounded-lg border border-base-border bg-base-card px-3 text-sm text-text-primary
                         [color-scheme:dark]
                         focus:outline-none focus:ring-1 focus:ring-accent-cyan/60
                         disabled:opacity-40 disabled:cursor-not-allowed"
            />
          </div>

          {/* To date */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="export-to" className="text-xs font-medium text-text-secondary">
              To
            </label>
            <input
              id="export-to"
              type="date"
              value={to}
              min={from || undefined}
              max={todayISO}
              onChange={(e) => { setTo(e.target.value); setStatus({ type: 'idle' }) }}
              disabled={isLoading}
              className="h-9 rounded-lg border border-base-border bg-base-card px-3 text-sm text-text-primary
                         [color-scheme:dark]
                         focus:outline-none focus:ring-1 focus:ring-accent-cyan/60
                         disabled:opacity-40 disabled:cursor-not-allowed"
            />
          </div>

          {/* Format selector */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="export-format" className="text-xs font-medium text-text-secondary">
              Format
            </label>
            <select
              id="export-format"
              value={format}
              onChange={(e) => { setFormat(e.target.value as ExportFormat); setStatus({ type: 'idle' }) }}
              disabled={isLoading}
              className="h-9 rounded-lg border border-base-border bg-base-card px-3 text-sm text-text-primary
                         focus:outline-none focus:ring-1 focus:ring-accent-cyan/60
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
          </div>
        </div>

        {/* Action row */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            id="export-data-btn"
            onClick={handleExport}
            disabled={isLoading}
            variant="primary"
            size="md"
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting…
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export Data
              </>
            )}
          </Button>

          <p className="text-xs text-text-secondary">
            Data is read directly from PostgreSQL. Leave dates blank to export all records.
          </p>
        </div>

        {/* Status messages */}
        {status.type === 'error' && (
          <div
            role="alert"
            className="mt-3 flex items-start gap-2.5 rounded-lg border border-status-danger/30
                       bg-status-danger/10 px-3.5 py-2.5"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-status-danger" />
            <p className="text-sm text-status-danger">{status.message}</p>
          </div>
        )}

        {status.type === 'success' && (
          <div
            role="status"
            className="mt-3 flex items-start gap-2.5 rounded-lg border border-status-success/30
                       bg-status-success/10 px-3.5 py-2.5"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-status-success" />
            <p className="text-sm text-status-success">
              Download started — <span className="font-medium">{status.filename}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

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

      {/* ── Export Previous Data ───────────────────────────────────────────── */}
      <ExportPanel />
    </div>
  )
}


