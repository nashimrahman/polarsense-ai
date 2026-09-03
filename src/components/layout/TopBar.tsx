import { useEffect, useState } from 'react'
import { Wifi, Satellite } from 'lucide-react'
import { useStore } from '@/store/useStore'

const TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Mission Overview', subtitle: 'Fleet-wide status across the Southern Ocean' },
  '/live': { title: 'Live Monitoring', subtitle: 'Real-time telemetry streams' },
  '/map': { title: 'Polar Map', subtitle: 'Antarctic buoy network' },
  '/analytics': { title: 'Analytics', subtitle: 'Historical trends & comparisons' },
  '/insights': { title: 'AI Insights', subtitle: 'Predictive intelligence layer' },
  '/alerts': { title: 'Alert Center', subtitle: 'Fleet incidents & anomalies' },
  '/devices': { title: 'Device Health', subtitle: 'Hardware diagnostics' },
  '/settings': { title: 'Settings', subtitle: 'Platform configuration' },
}

export function TopBar({ path }: { path: string }) {
  const [time, setTime] = useState(new Date())
  const buoys = useStore((s) => s.buoys)
  const online = buoys.filter((b) => b.status !== 'offline').length

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const meta = TITLES[path] ?? { title: 'PolarSense AI', subtitle: '' }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-base-border bg-base-bg/80 px-6 backdrop-blur-xl">
      <div>
        <h1 className="font-display text-lg font-semibold text-text-primary">{meta.title}</h1>
        <p className="text-xs text-text-secondary">{meta.subtitle}</p>
      </div>

      <div className="flex items-center gap-5">
        <div className="hidden items-center gap-2 rounded-full border border-base-border bg-white/[0.02] px-3 py-1.5 text-xs text-text-secondary md:flex">
          <Satellite size={13} className="text-accent-cyan" />
          {online}/{buoys.length || '—'} nodes linked
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-base-border bg-white/[0.02] px-3 py-1.5 text-xs text-text-secondary md:flex">
          <Wifi size={13} className="text-status-success" />
          Live
        </div>
        <div className="tabular text-sm font-medium text-text-primary">
          {time.toUTCString().slice(17, 25)} <span className="text-text-secondary">UTC</span>
        </div>
      </div>
    </header>
  )
}
