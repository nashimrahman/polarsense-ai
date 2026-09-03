import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Waves, Radio, Cpu, CloudLightning, Map as MapIcon, ShieldCheck, ArrowRight,
  Satellite, Server, Database, MonitorSmartphone,
} from 'lucide-react'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'

const FEATURES = [
  {
    icon: Radio,
    title: 'Live telemetry',
    description: 'Temperature, salinity, pH, dissolved oxygen, pressure, and battery streamed from every node in the fleet every three seconds.',
  },
  {
    icon: MapIcon,
    title: 'Polar map command view',
    description: 'A globe-projected view of the Southern Ocean showing buoy position, drift, ice zones, and circumpolar current paths.',
  },
  {
    icon: CloudLightning,
    title: 'Predictive intelligence',
    description: 'Forecasts storm formation, sensor degradation, and remaining battery life from rolling telemetry windows.',
  },
  {
    icon: ShieldCheck,
    title: 'Fleet-wide alerting',
    description: 'Severity-ranked incidents for wind, battery, temperature anomalies, and lost connections, deduplicated in real time.',
  },
  {
    icon: Cpu,
    title: 'Device diagnostics',
    description: 'Signal strength, storage headroom, and a composite health score for every buoy in the network.',
  },
  {
    icon: Waves,
    title: 'Built for the Southern Ocean',
    description: 'Coordinates, ice-shelf regions, and thermal ranges modeled on real Antarctic and sub-Antarctic geography.',
  },
]

const ARCHITECTURE = [
  { icon: Satellite, label: 'Buoy Fleet', detail: '24 autonomous sensor nodes' },
  { icon: Radio, label: 'Telemetry Uplink', detail: 'Satellite relay, 3s cadence' },
  { icon: Server, label: 'Ingestion Service', detail: 'Realtime stream processing' },
  { icon: Cpu, label: 'Prediction Engine', detail: 'Storm & anomaly inference' },
  { icon: Database, label: 'Time-series Store', detail: 'Rolling 48h windows' },
  { icon: MonitorSmartphone, label: 'Mission Control UI', detail: 'This dashboard' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-base-bg text-text-primary">
      <div className="grid-overlay pointer-events-none fixed inset-0 opacity-40" />
      <div className="pointer-events-none fixed inset-0 bg-aurora" />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-blue to-accent-cyan">
            <Waves size={16} className="text-white" />
          </div>
          <span className="font-display text-sm font-semibold tracking-tight">PolarSense AI</span>
        </div>
        <Link
          to="/dashboard"
          className="rounded-lg border border-base-border bg-white/[0.03] px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-white/[0.06]"
        >
          Enter Dashboard
        </Link>
      </header>

      {/* Hero */}
      <section className="relative z-10 px-6 pb-20 pt-16 sm:px-10 sm:pt-24">
        <div className="mx-auto max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-base-border bg-white/[0.03] px-3.5 py-1.5 text-xs text-text-secondary"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-success opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-status-success" />
            </span>
            Live across the Southern Ocean right now
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl"
          >
            Autonomous eyes on the
            <span className="block bg-gradient-to-r from-accent-cyan to-accent-blue bg-clip-text text-transparent">
              coldest ocean on Earth
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mx-auto mt-5 max-w-xl text-base text-text-secondary sm:text-lg"
          >
            PolarSense AI streams telemetry from a fleet of drifting ocean buoys across Antarctic waters,
            turning raw sensor data into forecasts, alerts, and a live command view.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-8 flex items-center justify-center gap-3"
          >
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-accent-blue px-5 py-3 text-sm font-medium text-white shadow-[0_0_0_1px_rgba(59,130,246,0.4),0_10px_30px_-8px_rgba(59,130,246,0.6)] transition-transform hover:-translate-y-0.5"
            >
              Enter Mission Control
              <ArrowRight size={15} />
            </Link>
            <Link
              to="/map"
              className="rounded-lg border border-base-border px-5 py-3 text-sm font-medium text-text-primary transition-colors hover:bg-white/[0.03]"
            >
              View the map
            </Link>
          </motion.div>

          {/* Hero readout strip */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="glass mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-6 rounded-2xl p-6 sm:grid-cols-4"
          >
            <Readout value={24} label="Buoys deployed" />
            <Readout value={-1.8} decimals={1} suffix="°C" label="Avg. ocean temp" />
            <Readout value={22} suffix="/24" label="Nodes online" />
            <Readout value={98} suffix="%" label="Sensor health" />
          </motion.div>
        </div>
      </section>

      {/* Overview */}
      <section className="relative z-10 border-t border-base-border/60 px-6 py-20 sm:px-10">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Built like the operations floor of a research vessel
            </h2>
            <p className="mt-4 text-text-secondary">
              Every reading on this dashboard traces back to a physical constraint of polar deployment: buoys drift
              with the circumpolar current, batteries fade under months of low sun, and signal drops when ice closes in.
              PolarSense AI is designed around those realities, not around a generic metrics template.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-text-secondary">
              <li className="flex gap-3"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-cyan" /> Oceanographic and atmospheric sensors on one pane of glass</li>
              <li className="flex gap-3"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-cyan" /> Device health modeled on battery, signal, and storage together</li>
              <li className="flex gap-3"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-cyan" /> Predictions grounded in the fleet's own rolling history</li>
            </ul>
          </div>
          <div className="relative rounded-2xl border border-base-border bg-base-card/60 p-6">
            <div className="grid-overlay absolute inset-0 rounded-2xl opacity-30" />
            <div className="relative space-y-4">
              {[
                { label: 'PS-02 · Ross Ice Watch', temp: '-2.1°C', status: 'online' },
                { label: 'PS-16 · Larsen Shelf I', temp: '-1.4°C', status: 'degraded' },
                { label: 'PS-20 · Terra Nova Bay', temp: '-2.6°C', status: 'online' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-xl border border-base-border/60 bg-base-bg/60 px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`h-2 w-2 rounded-full ${row.status === 'online' ? 'bg-status-success' : 'bg-status-warning'}`} />
                    <span className="text-sm text-text-primary">{row.label}</span>
                  </div>
                  <span className="tabular text-sm text-text-secondary">{row.temp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 border-t border-base-border/60 px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">What the platform does</h2>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                className="rounded-2xl border border-base-border bg-base-card/60 p-5"
              >
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-accent-cyan/10 text-accent-cyan">
                  <f.icon size={16} />
                </div>
                <h3 className="text-sm font-semibold text-text-primary">{f.title}</h3>
                <p className="mt-1.5 text-sm text-text-secondary">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="relative z-10 border-t border-base-border/60 px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">How data reaches this screen</h2>
          <p className="mt-3 max-w-2xl text-text-secondary">
            A telemetry frame's path from an ocean buoy to a rendered chart, simulated end-to-end in this build.
          </p>
          <div className="mt-10 flex flex-col gap-3 lg:flex-row lg:items-stretch">
            {ARCHITECTURE.map((step, i) => (
              <div key={step.label} className="flex flex-1 items-stretch gap-3">
                <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-base-border bg-base-card/60 px-4 py-6 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-blue/20 to-accent-cyan/20 text-accent-cyan">
                    <step.icon size={18} />
                  </div>
                  <p className="text-sm font-medium text-text-primary">{step.label}</p>
                  <p className="text-xs text-text-secondary">{step.detail}</p>
                </div>
                {i < ARCHITECTURE.length - 1 && (
                  <div className="hidden items-center lg:flex">
                    <ArrowRight size={16} className="text-base-border" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 border-t border-base-border/60 px-6 py-20 sm:px-10">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 rounded-3xl border border-base-border bg-gradient-to-br from-accent-blue/10 to-accent-cyan/10 p-10 text-center sm:p-14">
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Step onto the operations floor</h2>
          <p className="max-w-md text-text-secondary">
            Open mission control to see live telemetry, the polar map, and predictive alerts updating in real time.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-accent-blue px-6 py-3 text-sm font-medium text-white shadow-[0_0_0_1px_rgba(59,130,246,0.4),0_10px_30px_-8px_rgba(59,130,246,0.6)] transition-transform hover:-translate-y-0.5"
          >
            Enter Dashboard
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      <footer className="relative z-10 border-t border-base-border/60 px-6 py-8 text-center text-xs text-text-secondary sm:px-10">
        PolarSense AI · Simulated telemetry for demonstration purposes
      </footer>
    </div>
  )
}

function Readout({ value, decimals = 0, suffix = '', label }: { value: number; decimals?: number; suffix?: string; label: string }) {
  return (
    <div>
      <p className="tabular text-2xl font-semibold text-text-primary">
        <AnimatedCounter value={value} decimals={decimals} suffix={suffix} />
      </p>
      <p className="mt-1 text-xs text-text-secondary">{label}</p>
    </div>
  )
}
