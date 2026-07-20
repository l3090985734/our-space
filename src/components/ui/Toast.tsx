import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, XCircle, Loader2, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'loading'

interface Toast {
  id: number
  type: ToastType
  message: string
}

interface ToastContextValue {
  showSuccess: (message: string, duration?: number) => void
  showError: (message: string, duration?: number) => void
  showLoading: (message: string) => () => void
  hideToast: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

let toastIdCounter = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const hideToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const showToast = useCallback(
    (type: ToastType, message: string, duration?: number) => {
      const id = ++toastIdCounter
      setToasts((prev) => [...prev, { id, type, message }])

      if (type !== 'loading' && duration !== 0) {
        const timer = setTimeout(
          () => hideToast(id),
          duration ?? (type === 'error' ? 3000 : 2000)
        )
        timersRef.current.set(id, timer)
      }

      return id
    },
    [hideToast]
  )

  const showSuccess = useCallback(
    (message: string, duration?: number) => {
      showToast('success', message, duration)
    },
    [showToast]
  )

  const showError = useCallback(
    (message: string, duration?: number) => {
      showToast('error', message, duration)
    },
    [showToast]
  )

  const showLoading = useCallback(
    (message: string) => {
      const id = showToast('loading', message, 0)
      return () => hideToast(id)
    },
    [showToast, hideToast]
  )

  return (
    <ToastContext.Provider value={{ showSuccess, showError, showLoading, hideToast }}>
      {children}
      <div className="fixed inset-0 pointer-events-none z-[70] flex flex-col items-center gap-2 pt-20">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg bg-white max-w-[80%]"
            >
              {toast.type === 'success' && (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              )}
              {toast.type === 'error' && (
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              )}
              {toast.type === 'loading' && (
                <Loader2 className="w-5 h-5 text-sakura animate-spin flex-shrink-0" />
              )}
              <span className="text-sm text-gray-700">{toast.message}</span>
              {toast.type !== 'loading' && (
                <button
                  onClick={() => hideToast(toast.id)}
                  className="p-0.5 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
