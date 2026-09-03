import { useMemo, useState } from 'react'
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { useStore } from '@/store/useStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { TimeRange } from '@/types'
import { cn, formatTime } from '@/lib/utils'

const RANGES: { key: TimeRange; label: string; points: number }[] = [
  { key: '24h', label: '24H', points: 24 },
  { key: '7d', label: '7D', points: 42 },
  { key: '30d', label: '30D', points: 48 },
]

function tooltipStyle() {
  return {
    contentStyle: { background: '#111827', border: '1px solid #1F2937', borderRadius: 10, fontSize: 12 },
    labelStyle: { color: '#9CA3AF' },
    itemStyle: { color: '#F9FAFB' },
  }
}

export default function Analytics() {
  const buoys = useStore((s) => s.buoys)
  const [range, setRange] = useState<TimeRange>('24h')
  const rangeMeta = RANGES.find((r) => r.key === range)!

  const primary = buoys[0]

  const chartData = useMemo(() => {
    if (!primary) return []
    const slice = (arr: { timestamp: number; value: number }[]) => arr.slice(-rangeMeta.points)
    const temp = slice(primary.history.temperature)
    const sal = slice(primary.history.salinity)
    const wind = slice(primary.history.windSpeed)
    const batt = slice(primary.history.battery)
    const pres = slice(primary.history.pressure)

    return temp.map((p, i) => ({
      time: formatTime(p.timestamp),
      temperature: p.value,
      salinity: sal[i]?.value,
      windSpeed: wind[i]?.value,
      battery: batt[i]?.value,
      pressure: pres[i]?.value,
    }))
  }, [primary, rangeMeta])

  if (!primary) return null

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold text-text-primary">{primary.name}</h2>
          <p className="text-xs text-text-secondary">Historical analysis · {primary.region}</p>
        </div>
        <div className="flex rounded-lg border border-base-border p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                range === r.key ? 'bg-accent-blue text-white' : 'text-text-secondary hover:text-text-primary'
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Temperature vs Time</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} minTickGap={30} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} unit="°C" width={44} />
                <Tooltip {...tooltipStyle()} />
                <Line type="monotone" dataKey="temperature" stroke="#06B6D4" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Salinity vs Time</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} minTickGap={30} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} unit=" PSU" width={50} />
                <Tooltip {...tooltipStyle()} />
                <Line type="monotone" dataKey="salinity" stroke="#3B82F6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Wind Speed vs Time</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="windFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} minTickGap={30} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} unit=" km/h" width={54} />
                <Tooltip {...tooltipStyle()} />
                <Area type="monotone" dataKey="windSpeed" stroke="#F59E0B" strokeWidth={2} fill="url(#windFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Battery Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} minTickGap={30} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} unit="%" width={40} domain={[0, 100]} />
                <Tooltip {...tooltipStyle()} />
                <Line type="monotone" dataKey="battery" stroke="#22C55E" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>Pressure History</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} minTickGap={30} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} unit=" hPa" width={56} domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip {...tooltipStyle()} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#9CA3AF' }} />
                <Line type="monotone" dataKey="pressure" name="Pressure" stroke="#3B82F6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
