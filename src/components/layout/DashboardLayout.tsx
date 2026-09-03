import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { ToastHost } from '@/components/ui/ToastHost'
import { MobileNav } from './MobileNav'

export function DashboardLayout() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-base-bg">
      <div className="pointer-events-none fixed inset-0 bg-aurora" />
      <Sidebar />
      <MobileNav />
      <div className="relative lg:pl-60">
        <TopBar path={location.pathname} />
        <main className="relative px-4 py-6 sm:px-6 pb-24 lg:pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <ToastHost />
    </div>
  )
}
