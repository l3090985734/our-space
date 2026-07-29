import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Trash2, MessageCircle } from 'lucide-react'
import { usePhotoComments } from '../../hooks/usePhotoComments'
import { useIdentity } from '../../hooks/useIdentity'
import { useToast } from '../ui/Toast'
import { AuthorBadge } from '../ui/AuthorBadge'
import { formatTimeAgo } from '../../lib/utils'
import type { PhotoComment } from '../../types'

interface PhotoCommentSectionProps {
  photoId: number | undefined
}

export function PhotoCommentSection({ photoId }: PhotoCommentSectionProps) {
  const { comments, loading, submitting, createComment, deleteComment } = usePhotoComments(photoId)
  const { identity } = useIdentity()
  const { showSuccess, showError } = useToast()
  const [input, setInput] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const content = input.trim()
    if (!content || !identity || submitting) return

    try {
      await createComment(content, identity)
      setInput('')
      showSuccess('评论发送成功 💬')
    } catch (e: any) {
      showError(`评论失败：${e.message || '请重试'}`)
    }
  }

  const handleDelete = async (comment: PhotoComment) => {
    if (!identity || comment.author !== identity) {
      showError('只能删除自己的评论')
      return
    }
    try {
      setDeletingId(comment.id)
      await deleteComment(comment.id)
      setConfirmDeleteId(null)
      showSuccess('删除成功')
    } catch (e: any) {
      showError(`删除失败：${e.message || '请重试'}`)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="mt-4 bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-sakura" />
        <h3 className="font-semibold text-gray-700">评论</h3>
        <span className="text-xs text-gray-400">（{comments.length}）</span>
      </div>

      {/* 评论列表 */}
      <div className="space-y-3 mb-4 max-h-[280px] overflow-y-auto pr-1">
        {loading && comments.length === 0 ? (
          <div className="py-6 text-center text-sm text-gray-400">
            加载中...
          </div>
        ) : comments.length === 0 ? (
          <div className="py-6 text-center text-sm text-gray-400 bg-sakura-light/10 rounded-xl">
            还没有评论，来说点什么吧 💭
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <AuthorBadge identity={comment.author} size="xs" />
                    <span className="text-[11px] text-gray-400">
                      {formatTimeAgo(comment.created_at)}
                    </span>
                    {identity && comment.author === identity && (
                      <button
                        onClick={() => setConfirmDeleteId(comment.id)}
                        className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500"
                        disabled={deletingId === comment.id}
                        title="删除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 break-words leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* 输入框 */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={identity ? '写下你的评论...' : '请先选择身份'}
          disabled={!identity || submitting}
          className="flex-1 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:border-sakura focus:ring-2 focus:ring-sakura/20 outline-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={!identity || submitting || !input.trim()}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-sakura to-sakura-deep text-white text-sm font-medium flex items-center gap-1.5 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
        >
          {submitting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          发送
        </button>
      </form>

      {/* 删除确认对话框 */}
      <AnimatePresence>
        {confirmDeleteId !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center px-6"
            onClick={() => setConfirmDeleteId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                确认删除评论
              </h3>
              <p className="text-gray-500 mb-6">
                删除后无法恢复，确定要删除这条评论吗？
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    const comment = comments.find((c) => c.id === confirmDeleteId)
                    if (comment) handleDelete(comment)
                  }}
                  disabled={deletingId === confirmDeleteId}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition-colors disabled:opacity-60"
                >
                  {deletingId === confirmDeleteId ? '删除中...' : '删除'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
