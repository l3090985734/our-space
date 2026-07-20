import { useState } from 'react'
import { motion } from 'framer-motion'
import { NoteList } from './NoteList'
import { CapsuleList } from './CapsuleList'

type Tab = 'notes' | 'capsules'

export function NotesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('notes')

  const tabs = [
    { key: 'notes' as const, label: '小纸条' },
    { key: 'capsules' as const, label: '时间胶囊' },
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
                layoutId="notesTabBg"
                className="absolute inset-0 bg-gradient-to-r from-sakura to-sakura-deep rounded-full shadow-sm"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className={activeTab === 'notes' ? 'block' : 'hidden'}>
        <NoteList />
      </div>
      <div className={activeTab === 'capsules' ? 'block' : 'hidden'}>
        <CapsuleList />
      </div>
    </div>
  )
}
