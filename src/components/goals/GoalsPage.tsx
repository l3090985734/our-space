import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CountdownList } from '../countdowns/CountdownList'
import { WishList } from '../wishes/WishList'

type Tab = 'countdowns' | 'wishes'

export function GoalsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('countdowns')

  const tabs = [
    { key: 'countdowns' as const, label: '倒计时' },
    { key: 'wishes' as const, label: '愿望清单' },
  ]

  return (
    <div>
      <div className="flex bg-sakura-light/50 rounded-full p-1 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 relative py-2.5 text-sm font-medium rounded-full transition-colors z-10 ${
              activeTab === tab.key ? 'text-white' : 'text-gray-500'
            }`}
          >
            {activeTab === tab.key && (
              <motion.div
                layoutId="goalTabBg"
                className="absolute inset-0 bg-gradient-to-r from-sakura to-sakura-deep rounded-full shadow-sm"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative">{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: activeTab === 'wishes' ? 20 : -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: activeTab === 'wishes' ? -20 : 20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'countdowns' && <CountdownList />}
          {activeTab === 'wishes' && <WishList />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
