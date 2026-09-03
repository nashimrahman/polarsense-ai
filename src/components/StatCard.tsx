import { motion } from 'framer-motion'
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import { cn } from '@/lib/utils'

export function StatCard({
  icon: Icon,
  label,
  value,
  decimals = 0,
  suffix = '',
  prefix = '',
  trend,
  accent = 'blue',
  delay = 0,
}: {
  icon: LucideIcon
  label: string
  value: number
  decimals?: number
  suffix?: string
  prefix?: string
  trend?: { value: number; positive: boolean }
  accent?: 'blue' | 'cyan' | 'success' | 'warning' | 'danger'
  delay?: number
}) {
  const accentMap: Record<string, string> = {
    blue: 'text-accent-blue bg-accent-blue/10',
    cyan: 'text-accent-cyan bg-accent-cyan/10',
    success: 'text-status-success bg-status-success/10',
    warning: 'text-status-warning bg-status-warning/10',
    danger: 'text-status-danger bg-status-danger/10',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="overflow-hidden p-5 transition-transform duration-300 hover:-translate-y-0.5">
        <div className="flex items-start justify-between">
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', accentMap[accent])}>
            <Icon size={17} />
          </div>
          {trend && (
            <span className={cn('flex items-center gap-0.5 text-xs font-medium', trend.positive ? 'text-status-success' : 'text-status-danger')}>
              {trend.positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {Math.abs(trend.value)}%
            </span>
          )}
        </div>
        <p className="mt-4 text-2xl font-semibold tabular text-text-primary">
          <AnimatedCounter value={value} decimals={decimals} suffix={suffix} prefix={prefix} />
        </p>
        <p className="mt-1 text-xs text-text-secondary">{label}</p>
      </Card>
    </motion.div>
  )
}
