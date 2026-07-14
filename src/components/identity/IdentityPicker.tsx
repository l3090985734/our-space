import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import type { Identity } from '../../types'

interface IdentityPickerProps {
  onSelect: (identity: Identity) => void
}

export function IdentityPicker({ onSelect }: IdentityPickerProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sakura-light to-white flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="inline-block mb-4"
        >
          <Heart className="w-16 h-16 text-sakura-accent fill-sakura-accent" />
        </motion.div>
        <h1 className="text-3xl font-semibold text-gray-700 mb-2">我们的空间</h1>
        <p className="text-gray-500">一个只属于两个人的小世界</p>
      </motion.div>

      <div className="flex gap-6 w-full max-w-sm">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect('he')}
          className="flex-1 bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center gap-3 border-2 border-transparent hover:border-blue-200 transition-colors"
        >
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-2xl">💙</span>
          </div>
          <span className="font-semibold text-gray-700">我是男朋友</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect('she')}
          className="flex-1 bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center gap-3 border-2 border-transparent hover:border-sakura transition-colors"
        >
          <div className="w-16 h-16 rounded-full bg-sakura-light flex items-center justify-center">
            <span className="text-2xl">💗</span>
          </div>
          <span className="font-semibold text-gray-700">我是女朋友</span>
        </motion.button>
      </div>
    </div>
  )
}
