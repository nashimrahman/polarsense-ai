import { NavLink, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Activity,
  Map,
  BarChart3,
  Sparkles,
  Bell,
  HeartPulse,
  Settings,
  Waves,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/useStore'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/live', label: 'Live Monitoring', icon: Activity },
  { to: '/map', label: 'Map View', icon: Map },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/insights', label: 'AI Insights', icon: Sparkles },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/devices', label: 'Device Health', icon: HeartPulse },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const alerts = useStore((s) => s.alerts)
  const activeAlertCount = alerts.filter((a) => !a.acknowledged).length

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-base-border bg-base-bg/95 backdrop-blur-xl lg:flex">
      <Link
        to="/"
        className="flex h-16 items-center gap-2.5 border-b border-base-border px-5 transition-colors hover:bg-white/[0.03]"
      >
        <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-blue to-accent-cyan">
          <Waves size={17} className="text-white" />
          <span className="absolute -right-1 -top-1 h-2 w-2 animate-pulse rounded-full bg-status-success" />
        </div>
        <div className="leading-tight">
          <p className="font-display text-sm font-semibold tracking-tight text-text-primary">PolarSense</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-text-secondary">AI Mission Control</p>
        </div>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent-blue/10 text-accent-blue'
                  : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className="flex items-center gap-3">
                  <item.icon size={17} className={cn(isActive ? 'text-accent-blue' : 'text-text-secondary group-hover:text-text-primary')} />
                  {item.label}
                </span>
                {item.to === '/alerts' && activeAlertCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-status-danger px-1 text-[10px] font-semibold text-white">
                    {activeAlertCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-base-border p-4">
        <div className="glass flex items-center gap-3 rounded-xl p-3">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-success opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-status-success" />
          </span>
          <div className="text-xs">
            <p className="font-medium text-text-primary">Uplink Active</p>
            <p className="text-text-secondary">Southern Ocean relay</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
