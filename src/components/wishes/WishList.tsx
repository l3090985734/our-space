import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Check, Edit2, Trash2 } from 'lucide-react'
import { WishEditor } from './WishEditor'
import { useWishes } from '../../hooks/useWishes'
import { useToast } from '../ui/Toast'
import type { Wish } from '../../types'
import { WishesSkeleton } from '../ui/PageSkeletons'

export function WishList() {
  const { wishes, loading, createWish, updateWish, toggleWish, deleteWish } = useWishes()
  const { showToast } = useToast()
  const [showEditor, setShowEditor] = useState(false)
  const [editingWish, setEditingWish] = useState<Wish | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleSubmit = async (title: string, description: string, icon: string) => {
    setSubmitting(true)
    try {
      if (editingWish) {
        await updateWish(editingWish.id, title, description, icon)
        showToast('愿望已更新～', 'success')
      } else {
        await createWish(title, description, icon)
        showToast('愿望已许下 ⭐', 'success')
      }
      setShowEditor(false)
      setEditingWish(null)
    } catch (e: any) {
      showToast(e.message || '保存失败，请重试', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleNew = () => {
    setEditingWish(null)
    setShowEditor(true)
  }

  const handleEdit = (wish: Wish) => {
    setEditingWish(wish)
    setShowEditor(true)
  }

  const handleToggle = async (id: number) => {
    try {
      const wish = wishes.find((w) => w.id === id)
      const wasCompleted = wish?.completed
      await toggleWish(id)
      if (!wasCompleted) {
        showToast('🎉 恭喜实现愿望！', 'success')
      }
    } catch (e: any) {
      showToast(e.message || '操作失败，请重试', 'error')
    }
  }

  const handleDelete = async (id: number) => {
    setDeleting(true)
    try {
      await deleteWish(id)
      setDeleteConfirm(null)
      showToast('已删除', 'success')
    } catch (e: any) {
      showToast(e.message || '删除失败，请重试', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const completedCount = wishes.filter((w) => w.completed).length

  if (loading) {
    return <WishesSkeleton />
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-700">愿望清单</h1>
          {wishes.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              已完成 <span className="text-sakura-deep font-semibold">{completedCount}</span> / {wishes.length} 个愿望
            </p>
          )}
        </div>
        <button
          onClick={handleNew}
          className="w-10 h-10 rounded-full bg-gradient-to-r from-sakura to-sakura-deep text-white flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {wishes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-24 h-24 rounded-full bg-sakura-light flex items-center justify-center mb-6">
            <span className="text-4xl">💫</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">还没有愿望</h2>
          <p className="text-gray-500 mb-6 text-center">
            写下你们的小愿望，一起慢慢实现吧
          </p>
          <button
            onClick={handleNew}
            className="px-8 py-3 bg-gradient-to-r from-sakura to-sakura-deep text-white rounded-full font-medium hover:shadow-lg transition-shadow"
          >
            许第一个愿
          </button>
        </div>
      ) : (
        <div className="space-y-3 pb-8">
          <AnimatePresence initial={false}>
            {wishes.map((wish) => (
              <motion.div
                key={wish.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className={`bg-white rounded-2xl p-4 shadow-sm transition-all ${
                  wish.completed ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggle(wish.id)}
                    className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                      wish.completed
                        ? 'bg-sakura border-sakura text-white'
                        : 'border-gray-300 hover:border-sakura'
                    }`}
                  >
                    {wish.completed && <Check className="w-4 h-4" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{wish.icon}</span>
                      <h3
                        className={`font-semibold text-gray-700 ${
                          wish.completed ? 'line-through text-gray-400' : ''
                        }`}
                      >
                        {wish.title}
                      </h3>
                    </div>
                    {wish.description && (
                      <p
                        className={`text-sm mt-1 ${
                          wish.completed ? 'text-gray-400 line-through' : 'text-gray-500'
                        }`}
                      >
                        {wish.description}
                      </p>
                    )}
                    {wish.completed && wish.completed_at && (
                      <p className="text-xs text-sakura mt-2">
                        ✨ {new Date(wish.completed_at).toLocaleDateString('zh-CN')} 实现啦
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(wish)}
                      className="p-2 rounded-full text-gray-400 hover:text-sakura hover:bg-sakura-light/50 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(wish.id)}
                      className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <WishEditor
        isOpen={showEditor}
        onClose={() => {
          setShowEditor(false)
          setEditingWish(null)
        }}
        onSubmit={handleSubmit}
        editing={editingWish}
        submitting={submitting}
      />

      <AnimatePresence>
        {deleteConfirm !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center px-6"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                删除这个愿望？
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                删除后就找不回来啦，确定要删除吗？
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-colors"
                >
                  再想想
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={deleting}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {deleting ? '删除中...' : '删除'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
