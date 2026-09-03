import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useStore } from '@/store/useStore'
import Landing from '@/pages/Landing'
import Dashboard from '@/pages/Dashboard'
import LiveMonitoring from '@/pages/LiveMonitoring'
import MapView from '@/pages/MapView'
import Analytics from '@/pages/Analytics'
import AIInsights from '@/pages/AIInsights'
import Alerts from '@/pages/Alerts'
import DeviceHealth from '@/pages/DeviceHealth'
import Settings from '@/pages/Settings'

export default function App() {
  const init = useStore((s) => s.init)

  useEffect(() => {
    init()
  }, [init])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/live" element={<LiveMonitoring />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/insights" element={<AIInsights />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/devices" element={<DeviceHealth />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
