import { useEffect, useState } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { HomePage } from './components/home/HomePage'
import { PhotoWall } from './components/photos/PhotoWall'
import { NoteList } from './components/notes/NoteList'
import { CountdownList } from './components/countdowns/CountdownList'
import { IdentityPicker } from './components/identity/IdentityPicker'
import { useIdentity } from './hooks/useIdentity'
import { usePhotos } from './hooks/usePhotos'
import { isDemoMode, initDemoData } from './lib/mockStorage'

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
  const { photos, loading, uploading, uploadPhoto, deletePhoto, updateCaption } =
    usePhotos()

  useEffect(() => {
    if (isDemoMode()) {
      initDemoData()
    }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sakura-light to-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-sakura/30 border-t-sakura rounded-full animate-spin" />
      </div>
    )
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
            <Route path="/" element={<HomePage />} />
            <Route
              path="/photos"
              element={
                <PhotoWall
                  photos={photos}
                  loading={loading}
                  uploading={uploading}
                  onUpload={(file, caption) => uploadPhoto(file, caption, identity)}
                  onDelete={deletePhoto}
                  onUpdateCaption={updateCaption}
                />
              }
            />
            <Route path="/notes" element={<NoteList />} />
            <Route path="/countdowns" element={<CountdownList />} />
          </Route>
        </Routes>
      </div>
    </HashRouter>
  )
}

export default function App() {
  return <AppContent />
}
