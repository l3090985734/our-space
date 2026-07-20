import { useRef, useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Plus, RefreshCw } from 'lucide-react'
import { NoteCard } from './NoteCard'
import { NoteEditor } from './NoteEditor'
import { useNotes } from '../../hooks/useNotes'
import { useIdentity } from '../../hooks/useIdentity'
import { NotesSkeleton } from '../ui/PageSkeletons'

export function NoteList() {
  const {
    notes,
    replies,
    loading,
    loadingMore,
    hasMore,
    expandedNoteId,
    loadMore,
    createNote,
    toggleExpand,
    refreshNotes,
  } = useNotes()
  const { identity } = useIdentity()
  const [showEditor, setShowEditor] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const observerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!observerRef.current || loadingMore || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(observerRef.current)

    return () => observer.disconnect()
  }, [loadMore, loadingMore, hasMore])

  const handleCreateNote = async (content: string) => {
    if (!identity) return
    setSubmitting(true)
    try {
      await createNote(content, identity)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReply = async (noteId: number, content: string) => {
    if (!identity) return
    try {
      await createNote(content, identity, noteId)
    } catch (e) {
      console.error('Reply failed:', e)
    }
  }

  if (loading) {
    return <NotesSkeleton />
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-gray-700">小纸条</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshNotes}
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-gray-500" />
          </button>
          <button
            onClick={() => setShowEditor(true)}
            className="w-10 h-10 rounded-full bg-gradient-to-r from-sakura to-sakura-deep text-white flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-24 h-24 rounded-full bg-sakura-light flex items-center justify-center mb-6">
            <span className="text-4xl">💌</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">还没有纸条</h2>
          <p className="text-gray-500 mb-6 text-center">
            写下第一张纸条，告诉TA你的心情
          </p>
          <button
            onClick={() => setShowEditor(true)}
            className="px-8 py-3 bg-gradient-to-r from-sakura to-sakura-deep text-white rounded-full font-medium hover:shadow-lg transition-shadow"
          >
            写纸条
          </button>
        </div>
      ) : (
        <div className="space-y-4 pb-8">
          <AnimatePresence>
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                replies={replies[note.id] || []}
                isExpanded={expandedNoteId === note.id}
                onToggleExpand={() => toggleExpand(note.id)}
                onReply={(content) => handleReply(note.id, content)}
              />
            ))}
          </AnimatePresence>

          {hasMore && (
            <div ref={observerRef} className="py-8 flex justify-center">
              {loadingMore && (
                <div className="w-8 h-8 border-3 border-sakura/30 border-t-sakura rounded-full animate-spin" />
              )}
            </div>
          )}

          {!hasMore && notes.length > 0 && (
            <p className="text-center text-gray-400 text-sm py-4">
              没有更多了 ~
            </p>
          )}
        </div>
      )}

      <NoteEditor
        isOpen={showEditor}
        onClose={() => setShowEditor(false)}
        onSubmit={handleCreateNote}
        submitting={submitting}
      />
    </div>
  )
}
