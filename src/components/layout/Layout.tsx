import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export function Layout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sakura-light to-white">
      <main className="max-w-lg mx-auto px-4 pt-6 pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
