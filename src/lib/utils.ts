import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export function randomWalk(current: number, volatility: number, min: number, max: number) {
  const next = current + (Math.random() - 0.5) * volatility
  return Number(clamp(next, min, max).toFixed(2))
}

export function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function formatRelativeTime(ts: number) {
  const diff = Date.now() - ts
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export function severityColor(severity: 'critical' | 'high' | 'medium' | 'low') {
  switch (severity) {
    case 'critical':
      return { text: 'text-status-danger', bg: 'bg-status-danger/10', border: 'border-status-danger/30', dot: 'bg-status-danger' }
    case 'high':
      return { text: 'text-status-warning', bg: 'bg-status-warning/10', border: 'border-status-warning/30', dot: 'bg-status-warning' }
    case 'medium':
      return { text: 'text-accent-cyan', bg: 'bg-accent-cyan/10', border: 'border-accent-cyan/30', dot: 'bg-accent-cyan' }
    case 'low':
      return { text: 'text-text-secondary', bg: 'bg-white/5', border: 'border-base-border', dot: 'bg-text-secondary' }
  }
}

export function statusColor(status: 'online' | 'offline' | 'degraded') {
  switch (status) {
    case 'online':
      return { text: 'text-status-success', dot: 'bg-status-success' }
    case 'degraded':
      return { text: 'text-status-warning', dot: 'bg-status-warning' }
    case 'offline':
      return { text: 'text-status-danger', dot: 'bg-status-danger' }
  }
}
