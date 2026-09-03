import { ButtonHTMLAttributes, HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Badge({
  className,
  variant = 'default',
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' }) {
  const variants: Record<string, string> = {
    default: 'bg-white/5 text-text-secondary border-base-border',
    success: 'bg-status-success/10 text-status-success border-status-success/30',
    warning: 'bg-status-warning/10 text-status-warning border-status-warning/30',
    danger: 'bg-status-danger/10 text-status-danger border-status-danger/30',
    info: 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/30',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export function Progress({
  value,
  className,
  barClassName,
}: {
  value: number
  className?: string
  barClassName?: string
}) {
  const v = Math.max(0, Math.min(100, value))
  const color = v > 60 ? 'bg-status-success' : v > 25 ? 'bg-status-warning' : 'bg-status-danger'
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-white/5', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-700 ease-out', color, barClassName)}
        style={{ width: `${v}%` }}
      />
    </div>
  )
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}) {
  const variants: Record<string, string> = {
    primary: 'bg-accent-blue text-white hover:bg-accent-blue/90 shadow-[0_0_0_1px_rgba(59,130,246,0.4),0_8px_20px_-6px_rgba(59,130,246,0.5)]',
    ghost: 'bg-transparent text-text-secondary hover:bg-white/5 hover:text-text-primary',
    outline: 'bg-transparent border border-base-border text-text-primary hover:bg-white/5',
  }
  const sizes: Record<string, string> = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-9 px-4 text-sm',
    lg: 'h-11 px-6 text-base',
  }
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
}
