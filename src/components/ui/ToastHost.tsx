import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'

const ICONS = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
  info: Info,
}

const COLORS = {
  success: 'text-status-success border-status-success/30',
  warning: 'text-status-warning border-status-warning/30',
  danger: 'text-status-danger border-status-danger/30',
  info: 'text-accent-cyan border-accent-cyan/30',
}

export function ToastHost() {
  const toasts = useStore((s) => s.toasts)
  const dismissToast = useStore((s) => s.dismissToast)

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[340px] flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = ICONS[t.variant]
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className={cn('glass-strong pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 shadow-2xl', COLORS[t.variant])}
            >
              <Icon size={18} className="mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-primary">{t.title}</p>
                {t.description && <p className="mt-0.5 truncate text-xs text-text-secondary">{t.description}</p>}
              </div>
              <button onClick={() => dismissToast(t.id)} className="text-text-secondary hover:text-text-primary">
                <X size={14} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
