import { useId } from 'react'
import { TelemetryPoint } from '@/types'

export function Sparkline({
  data = [],
  color = '#06B6D4',
  height = 44,
}: {
  data: TelemetryPoint[]
  color?: string
  height?: number
}) {
  const width = 200
  const rawId = useId()
  const gradientId = `spark-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`

  if (!data || data.length === 0) {
    const y = height / 2
    return (
      <div className="w-full flex items-center justify-center" style={{ height: `${height}px` }}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
          <line x1={0} y1={y} x2={width} y2={y} stroke="#374151" strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />
        </svg>
      </div>
    )
  }

  const values = data.map((d) => (typeof d.value === 'number' && !isNaN(d.value) ? d.value : 0))

  if (data.length === 1) {
    const y = height / 2
    const linePath = `M 0 ${y} L ${width} ${y}`
    const areaPath = `M 0 ${y} L ${width} ${y} L ${width} ${height} L 0 ${height} Z`

    return (
      <div className="w-full" style={{ height: `${height}px` }}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${gradientId})`} />
          <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
          <circle cx={width - 4} cy={y} r={3} fill={color} />
          <circle cx={width - 4} cy={y} r={6} fill={color} fillOpacity={0.25} />
        </svg>
      </div>
    )
  }

  let min = Math.min(...values)
  let max = Math.max(...values)

  if (min === max) {
    min -= 1
    max += 1
  } else {
    const pad = (max - min) * 0.15
    min -= pad
    max += pad
  }

  const pts = values.map((val, i) => {
    const x = (i / (values.length - 1)) * (width - 8) + 4
    const y = height - 6 - ((val - min) / (max - min)) * (height - 12)
    return { x, y, value: val }
  })

  let linePath = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const curr = pts[i]
    const next = pts[i + 1]
    const cpX = (curr.x + next.x) / 2
    linePath += ` C ${cpX.toFixed(1)} ${curr.y.toFixed(1)}, ${cpX.toFixed(1)} ${next.y.toFixed(1)}, ${next.x.toFixed(1)} ${next.y.toFixed(1)}`
  }

  const first = pts[0]
  const last = pts[pts.length - 1]
  const areaPath = `${linePath} L ${last.x.toFixed(1)} ${height} L ${first.x.toFixed(1)} ${height} Z`

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, idx) => (
          <circle
            key={idx}
            cx={p.x.toFixed(1)}
            cy={p.y.toFixed(1)}
            r={idx === pts.length - 1 ? 3 : 1.5}
            fill={color}
            opacity={idx === pts.length - 1 ? 1 : 0.6}
          />
        ))}
        <circle cx={last.x.toFixed(1)} cy={last.y.toFixed(1)} r={6} fill={color} fillOpacity={0.25} />
      </svg>
    </div>
  )
}
