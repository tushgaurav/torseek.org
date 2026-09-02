import { Outlet } from 'react-router'

import Footer from '@/components/shared/footer'
import NavBar from '@/components/shared/nav-bar'
import { Toaster } from '@/components/ui/sonner'

export function AppLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <Outlet />
      <Footer />
      <Toaster />
    </div>
  )
}
