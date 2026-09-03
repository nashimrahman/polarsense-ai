import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { BatteryCharging, HeartPulse, CloudLightning, ScanEye, Sparkles, CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Gauge } from '@/components/ui/Gauge'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'

const TONE_ICON = { positive: CheckCircle2, warning: AlertTriangle, neutral: Info }
const TONE_COLOR = { positive: 'text-status-success', warning: 'text-status-warning', neutral: 'text-accent-cyan' }

export default function AIInsights() {
  const insights = useStore((s) => s.insights)
  const initialized = useStore((s) => s.initialized)

  if (!initialized) return null

  return (
    <div className="space-y-5">
      <Card className="relative overflow-hidden p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent-cyan/10 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-blue to-accent-cyan">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold text-text-primary">PolarSense Prediction Engine</h2>
            <p className="text-xs text-text-secondary">Inference refreshed continuously from live fleet telemetry</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InsightCard icon={BatteryCharging} label="Battery Remaining" accent="#22C55E">
          <p className="text-3xl font-semibold tabular text-text-primary">
            <AnimatedCounter value={insights.batteryRemainingDays} suffix=" Days" />
          </p>
        </InsightCard>

        <InsightCard icon={HeartPulse} label="Sensor Health" accent="#06B6D4">
          <Gauge value={insights.sensorHealthPct} color="#06B6D4" size={104} />
        </InsightCard>

        <InsightCard icon={CloudLightning} label="Storm Probability" accent="#F59E0B">
          <Gauge value={insights.stormProbabilityPct} color="#F59E0B" size={104} />
        </InsightCard>

        <InsightCard icon={ScanEye} label="Anomaly Score" accent="#EF4444">
          <p className="text-3xl font-semibold tabular text-text-primary">
            <AnimatedCounter value={insights.anomalyScore} suffix="/100" />
          </p>
        </InsightCard>
      </div>

      <Card>
        <CardHeader><CardTitle>AI Recommendations</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {insights.recommendations.map((r, i) => {
            const Icon = TONE_ICON[r.tone]
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-start gap-3 rounded-xl border border-base-border bg-white/[0.02] p-3.5"
              >
                <Icon size={16} className={`mt-0.5 shrink-0 ${TONE_COLOR[r.tone]}`} />
                <p className="text-sm text-text-primary/90">{r.text}</p>
              </motion.div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

function InsightCard({ icon: Icon, label, accent, children }: { icon: any; label: string; accent: string; children: ReactNode }) {
  return (
    <Card className="flex flex-col items-center gap-3 p-6 text-center">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${accent}1A`, color: accent }}>
        <Icon size={17} />
      </div>
      {children}
      <p className="text-xs text-text-secondary">{label}</p>
    </Card>
  )
}
