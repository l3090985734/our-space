import { useEffect, useState, lazy, Suspense } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { IdentityPicker } from './components/identity/IdentityPicker'
import { PasswordPage } from './components/auth/PasswordPage'
import { ToastProvider } from './components/ui/Toast'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { HomeSkeleton, NotesSkeleton, PhotosSkeleton, TimelineSkeleton, CountdownSkeleton } from './components/ui/PageSkeletons'
import { useIdentity } from './hooks/useIdentity'
import { isDemoMode, initDemoData } from './lib/mockStorage'
import { ACCESS_PASSWORD } from './lib/config'

const HomePage = lazy(() => import('./components/home/HomePage').then(m => ({ default: m.HomePage })))
const PhotoWall = lazy(() => import('./components/photos/PhotoWall').then(m => ({ default: m.PhotoWall })))
const NotesPage = lazy(() => import('./components/notes/NotesPage').then(m => ({ default: m.NotesPage })))
const GoalsPage = lazy(() => import('./components/goals/GoalsPage').then(m => ({ default: m.GoalsPage })))
const TimelineList = lazy(() => import('./components/timeline/TimelineList').then(m => ({ default: m.TimelineList })))

function DemoBanner() {
  const [visible, setVisible] = useState(true)

  if (!isDemoMode() || !visible) return null

  return (
    <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white text-xs text-center py-1.5 z-50">
      🎮 演示模式 - 数据保存在本地浏览器，刷新不会丢
      <button
        onClick={() => setVisible(false)}
        className="ml-2 underline hover:text-amber-100"
      >
        知道了
      </button>
    </div>
  )
}

function AppContent() {
  const { identity, isLoading, selectIdentity } = useIdentity()
  const [authenticated, setAuthenticated] = useState(() => {
    return sessionStorage.getItem('our-space-authed') === '1'
  })

  useEffect(() => {
    if (isDemoMode()) {
      initDemoData()
    }
  }, [])

  const needPassword = ACCESS_PASSWORD && ACCESS_PASSWORD.length > 0

  const handleAuthSuccess = () => {
    sessionStorage.setItem('our-space-authed', '1')
    setAuthenticated(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sakura-light to-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-sakura/30 border-t-sakura rounded-full animate-spin" />
      </div>
    )
  }

  if (needPassword && !authenticated) {
    return <PasswordPage password={ACCESS_PASSWORD} onSuccess={handleAuthSuccess} />
  }

  if (!identity) {
    return (
      <>
        <DemoBanner />
        <IdentityPicker onSelect={selectIdentity} />
      </>
    )
  }

  return (
    <HashRouter>
      <DemoBanner />
      <div className={isDemoMode() ? 'pt-6' : ''}>
        <Routes>
          <Route element={<Layout />}>
            <Route
              path="/"
              element={
                <Suspense fallback={<div className="p-4"><HomeSkeleton /></div>}>
                  <HomePage />
                </Suspense>
              }
            />
            <Route
              path="/photos"
              element={
                <Suspense fallback={<div className="p-4"><PhotosSkeleton /></div>}>
                  <PhotoWall />
                </Suspense>
              }
            />
            <Route
              path="/timeline"
              element={
                <Suspense fallback={<div className="p-4"><TimelineSkeleton /></div>}>
                  <TimelineList />
                </Suspense>
              }
            />
            <Route
              path="/notes"
              element={
                <Suspense fallback={<div className="p-4"><NotesSkeleton /></div>}>
                  <NotesPage />
                </Suspense>
              }
            />
            <Route
              path="/countdowns"
              element={
                <Suspense fallback={<div className="p-4"><CountdownSkeleton /></div>}>
                  <GoalsPage />
                </Suspense>
              }
            />
          </Route>
        </Routes>
      </div>
    </HashRouter>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ErrorBoundary>
  )
}
