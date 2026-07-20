import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { PullToRefresh } from './PullToRefresh'
import { triggerRefresh } from '../../lib/refreshEvent'
import { useSwipeNav } from '../../hooks/useSwipeNav'

export function Layout() {
  useSwipeNav(true)

  const handleRefresh = async () => {
    triggerRefresh()
    await new Promise((r) => setTimeout(r, 800))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sakura-light to-white">
      <main className="max-w-lg mx-auto px-4 pt-6 pb-24">
        <PullToRefresh onRefresh={handleRefresh}>
          <Outlet />
        </PullToRefresh>
      </main>
      <BottomNav />
    </div>
  )
}
