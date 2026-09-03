import { NavLink, Link } from 'react-router-dom'
import { LayoutDashboard, Activity, Map, Bell, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { BarChart3, Sparkles, HeartPulse, Settings, Waves, X } from 'lucide-react'

const PRIMARY = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/live', label: 'Live', icon: Activity },
  { to: '/map', label: 'Map', icon: Map },
  { to: '/alerts', label: 'Alerts', icon: Bell },
]

const MORE = [
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/insights', label: 'AI Insights', icon: Sparkles },
  { to: '/devices', label: 'Device Health', icon: HeartPulse },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-base-border bg-base-bg/95 py-2 backdrop-blur-xl lg:hidden">
        {PRIMARY.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn('flex flex-col items-center gap-1 px-3 py-1 text-[10px]', isActive ? 'text-accent-blue' : 'text-text-secondary')
            }
          >
            <item.icon size={19} />
            {item.label}
          </NavLink>
        ))}
        <button onClick={() => setOpen(true)} className="flex flex-col items-center gap-1 px-3 py-1 text-[10px] text-text-secondary">
          <Menu size={19} />
          More
        </button>
      </nav>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 lg:hidden" onClick={() => setOpen(false)}>
          <div
            className="glass-strong rounded-t-2xl border-t p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
                <Waves size={16} className="text-accent-cyan" />
                <span className="text-sm font-medium">PolarSense AI</span>
              </Link>
              <button onClick={() => setOpen(false)} className="text-text-secondary">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MORE.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg border border-base-border px-3 py-3 text-sm text-text-primary"
                >
                  <item.icon size={16} className="text-accent-cyan" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
