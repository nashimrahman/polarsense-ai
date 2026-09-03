import { useState, type ReactNode } from 'react'
import { Bell, Globe, Palette, Radio, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className={cn('h-5 w-9 rounded-full p-0.5 transition-colors', checked ? 'bg-accent-blue' : 'bg-white/10')}>
      <span className={cn('block h-4 w-4 rounded-full bg-white transition-transform', checked && 'translate-x-4')} />
    </button>
  )
}

export default function Settings() {
  const [settings, setSettings] = useState({
    stormAlerts: true,
    batteryAlerts: true,
    offlineAlerts: true,
    anomalyDigest: false,
    telemetryInterval: '3s',
    units: 'metric',
  })

  return (
    <div className="max-w-3xl space-y-4">
      <Card>
        <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>
        <CardContent className="space-y-4 pt-2">
          <SettingRow icon={Bell} title="Storm probability alerts" description="Notify when AI storm confidence exceeds 60%">
            <Toggle checked={settings.stormAlerts} onChange={(v) => setSettings((s) => ({ ...s, stormAlerts: v }))} />
          </SettingRow>
          <SettingRow icon={Bell} title="Battery threshold alerts" description="Notify when any buoy drops below 20% battery">
            <Toggle checked={settings.batteryAlerts} onChange={(v) => setSettings((s) => ({ ...s, batteryAlerts: v }))} />
          </SettingRow>
          <SettingRow icon={Bell} title="Offline device alerts" description="Notify immediately when a buoy loses connection">
            <Toggle checked={settings.offlineAlerts} onChange={(v) => setSettings((s) => ({ ...s, offlineAlerts: v }))} />
          </SettingRow>
          <SettingRow icon={Bell} title="Weekly anomaly digest" description="Receive a weekly summary of anomaly scores">
            <Toggle checked={settings.anomalyDigest} onChange={(v) => setSettings((s) => ({ ...s, anomalyDigest: v }))} />
          </SettingRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Telemetry</CardTitle></CardHeader>
        <CardContent className="space-y-4 pt-2">
          <SettingRow icon={Radio} title="Refresh interval" description="How often the dashboard polls simulated telemetry">
            <select
              value={settings.telemetryInterval}
              onChange={(e) => setSettings((s) => ({ ...s, telemetryInterval: e.target.value }))}
              className="rounded-lg border border-base-border bg-base-card px-3 py-1.5 text-sm text-text-primary"
            >
              <option value="1s">1 second</option>
              <option value="3s">3 seconds</option>
              <option value="10s">10 seconds</option>
            </select>
          </SettingRow>
          <SettingRow icon={Globe} title="Measurement units" description="Display units across charts and cards">
            <select
              value={settings.units}
              onChange={(e) => setSettings((s) => ({ ...s, units: e.target.value }))}
              className="rounded-lg border border-base-border bg-base-card px-3 py-1.5 text-sm text-text-primary"
            >
              <option value="metric">Metric (°C, km/h)</option>
              <option value="imperial">Imperial (°F, mph)</option>
            </select>
          </SettingRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
        <CardContent className="pt-2">
          <SettingRow icon={Palette} title="Theme" description="PolarSense AI is optimized for dark mode command-center displays">
            <span className="rounded-full border border-base-border bg-white/5 px-3 py-1 text-xs text-text-secondary">Dark (locked)</span>
          </SettingRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Security</CardTitle></CardHeader>
        <CardContent className="pt-2">
          <SettingRow icon={ShieldCheck} title="Two-factor authentication" description="Require a verification code for mission control access">
            <Toggle checked={true} onChange={() => {}} />
          </SettingRow>
        </CardContent>
      </Card>
    </div>
  )
}

function SettingRow({ icon: Icon, title, description, children }: { icon: any; title: string; description: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-base-border/60 pb-4 last:border-none last:pb-0">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-text-secondary">
          <Icon size={15} />
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">{title}</p>
          <p className="text-xs text-text-secondary">{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}
