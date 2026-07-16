import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Image, FileText, Target, Heart } from 'lucide-react'

const navItems = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/timeline', icon: Heart, label: '故事' },
  { path: '/photos', icon: Image, label: '照片' },
  { path: '/notes', icon: FileText, label: '纸条' },
  { path: '/countdowns', icon: Target, label: '目标' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-sakura-light z-40">
      <div className="max-w-lg mx-auto flex justify-around items-center h-16 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-2 transition-colors ${
                isActive ? 'text-sakura-deep' : 'text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <motion.div
                className="flex flex-col items-center gap-1"
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <item.icon className="w-6 h-6" />
                <span className="text-xs">{item.label}</span>
              </motion.div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
