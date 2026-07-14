import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, MessageCircle, Send } from 'lucide-react'
import type { Note } from '../../types'
import { formatTimeAgo } from '../../lib/utils'

interface NoteCardProps {
  note: Note
  replies: Note[]
  isExpanded: boolean
  onToggleExpand: () => void
  onReply: (content: string) => void
}

export function NoteCard({
  note,
  replies,
  isExpanded,
  onToggleExpand,
  onReply,
}: NoteCardProps) {
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [replyContent, setReplyContent] = useState('')

  const handleSubmitReply = () => {
    if (!replyContent.trim()) return
    onReply(replyContent.trim())
    setReplyContent('')
    setShowReplyInput(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-4 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            note.author === 'he'
              ? 'bg-blue-100 text-blue-600'
              : 'bg-sakura-light text-sakura-deep'
          }`}
        >
          {note.author === 'he' ? '他' : '她'}
        </span>
        <span className="text-xs text-gray-400">
          {formatTimeAgo(note.created_at)}
        </span>
      </div>

      <p className="text-gray-700 leading-relaxed mb-3 whitespace-pre-wrap">
        {note.content}
      </p>

      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            setShowReplyInput(!showReplyInput)
            if (!isExpanded) {
              onToggleExpand()
            }
          }}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-sakura-deep transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span>回复 {replies.length > 0 ? `(${replies.length})` : ''}</span>
        </button>

        {replies.length > 0 && (
          <button
            onClick={onToggleExpand}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span>{isExpanded ? '收起' : '展开回复'}</span>
            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </button>
        )}
      </div>

      <AnimatePresence>
        {showReplyInput && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="写点什么..."
                className="flex-1 px-4 py-2 rounded-full bg-gray-50 border border-gray-200 focus:border-sakura focus:ring-2 focus:ring-sakura/20 outline-none text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmitReply()
                }}
              />
              <button
                onClick={handleSubmitReply}
                disabled={!replyContent.trim()}
                className="w-10 h-10 rounded-full bg-sakura text-white flex items-center justify-center disabled:opacity-50 hover:bg-sakura-deep transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isExpanded && replies.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
              {replies.map((reply) => (
                <div key={reply.id} className="pl-4 border-l-2 border-sakura-light">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                        reply.author === 'he'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-sakura-light text-sakura-deep'
                      }`}
                    >
                      {reply.author === 'he' ? '他' : '她'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTimeAgo(reply.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {reply.content}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
