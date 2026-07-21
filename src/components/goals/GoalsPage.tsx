import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CountdownList } from '../countdowns/CountdownList'
import { WishList } from '../wishes/WishList'

type Tab = 'countdowns' | 'wishes'

export function GoalsPage() {
  const location = useLocation()
  const initialTab = (location.state as { tab?: Tab })?.tab || 'countdowns'
  const [activeTab, setActiveTab] = useState<Tab>(initialTab)

  useEffect(() => {
    const tab = (location.state as { tab?: Tab })?.tab
    if (tab) {
      setActiveTab(tab)
    }
  }, [location.state])

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

      {activeTab === 'countdowns' && <CountdownList />}
      {activeTab === 'wishes' && <WishList />}
    </div>
  )
}
