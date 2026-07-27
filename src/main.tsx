import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

try {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
} catch (e) {
  console.error('Failed to render app:', e)
}

function removeSplash() {
  const splash = document.getElementById('splash')
  if (splash) {
    splash.classList.add('fade-out')
    setTimeout(() => {
      splash.remove()
    }, 600)
  }
}

setTimeout(removeSplash, 500)

window.addEventListener('load', () => {
  setTimeout(removeSplash, 300)
})
