import { useState } from 'react'
import { Plus } from 'lucide-react'
import { NoteCard } from './NoteCard'
import { NoteEditor } from './NoteEditor'
import { useNotes } from '../../hooks/useNotes'
import { useIdentity } from '../../hooks/useIdentity'
import { useToast } from '../ui/Toast'
import { SkeletonText } from '../ui/Skeleton'
import type { Note } from '../../types'

export function NoteList() {
  const { notes, loading, error, createNote, replies, toggleExpand, expandedNoteId } = useNotes()
  const { identity } = useIdentity()
  const { showToast } = useToast()
  const [showEditor, setShowEditor] = useState(false)
  const [replyLoadingId, setReplyLoadingId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const mainNotes = notes.filter((n) => !n.parent_id)
  const getReplies = (noteId: number) => replies[noteId] || []

  const handleAddNote = async (content: string) => {
    if (!identity) {
      showToast('请先选择身份', 'error')
      return
    }
    setSubmitting(true)
    try {
      await createNote(content, identity)
      setShowEditor(false)
      showToast('小纸条已送达 💌', 'success')
    } catch (e: any) {
      showToast(e.message || '发送失败，请重试', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReply = async (noteId: number, content: string) => {
    if (!identity) {
      showToast('请先选择身份', 'error')
      return
    }
    setReplyLoadingId(noteId)
    try {
      await createNote(content, identity, noteId)
      await toggleExpand(noteId)
      showToast('回复成功～', 'success')
    } catch (e: any) {
      showToast(e.message || '回复失败，请重试', 'error')
    } finally {
      setReplyLoadingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {loading && (
        <>
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
              <SkeletonText className="w-16 mb-3" />
              <SkeletonText className="w-full mb-2" />
              <SkeletonText className="w-4/5" />
            </div>
          ))}
        </>
      )}

      {!loading && mainNotes.length === 0 && (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">💌</p>
          <p className="text-gray-400 text-sm">还没有小纸条</p>
          <p className="text-gray-300 text-xs mt-1">
            写点什么，给ta一个小惊喜吧～
          </p>
        </div>
      )}

      {!loading &&
        mainNotes.map((note: Note) => (
          <NoteCard
            key={note.id}
            note={note}
            replies={getReplies(note.id)}
            isExpanded={expandedNoteId === note.id}
            onToggleExpand={() => toggleExpand(note.id)}
            onReply={(content) => handleReply(note.id, content)}
            replyLoading={replyLoadingId === note.id}
          />
        ))}

      {error && (
        <div className="text-center py-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <button
        onClick={() => setShowEditor(true)}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-gradient-to-br from-sakura to-sakura-deep text-white shadow-lg shadow-sakura/30 flex items-center justify-center hover:scale-110 transition-transform z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      <NoteEditor
        isOpen={showEditor}
        onClose={() => setShowEditor(false)}
        onSubmit={handleAddNote}
        submitting={submitting}
      />
    </div>
  )
}
