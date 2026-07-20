import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Lock } from 'lucide-react'
import { sha256 } from '../../lib/utils'

interface PasswordPageProps {
  password: string
  onSuccess: () => void
}

function isHash(str: string): boolean {
  return /^[a-f0-9]{64}$/i.test(str)
}

export function PasswordPage({ password, onSuccess }: PasswordPageProps) {
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (verifying) return

    setVerifying(true)
    setError(false)
    let valid = false
    if (isHash(password)) {
      const inputHash = await sha256(input)
      valid = inputHash.toLowerCase() === password.toLowerCase()
    } else {
      valid = input === password
    }

    if (valid) {
      onSuccess()
    } else {
      setError(true)
      setShake(true)
      setInput('')
      setTimeout(() => setShake(false), 500)
    }
    setVerifying(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sakura-light to-white flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="inline-block mb-4"
          >
            <Heart className="w-16 h-16 text-sakura-accent fill-sakura-accent" />
          </motion.div>
          <h1 className="text-2xl font-semibold text-gray-700 mb-2">
            我们的小世界
          </h1>
          <p className="text-sm text-gray-500">
            只有你能进来 💕
          </p>
        </div>

        <motion.div
          animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  setError(false)
                }}
                placeholder="请输入密码"
                autoFocus
                className={`w-full pl-12 pr-4 py-3 rounded-xl border outline-none transition-colors ${
                  error
                    ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                    : 'border-gray-200 focus:border-sakura focus:ring-2 focus:ring-sakura/20'
                }`}
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-500 text-center"
              >
                密码不对哦，再想想~
              </motion.p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-sakura to-sakura-deep text-white rounded-full font-medium hover:shadow-md transition-shadow"
            >
              进入
            </button>
          </form>
        </motion.div>

        <p className="text-center text-xs text-gray-400 mt-6">
          💗 这是只属于我们的地方
        </p>
      </motion.div>
    </div>
  )
}
