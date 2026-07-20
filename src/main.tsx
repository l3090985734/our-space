import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

const splash = document.getElementById('splash')
if (splash) {
  setTimeout(() => {
    splash.classList.add('fade-out')
    setTimeout(() => {
      splash.remove()
    }, 600)
  }, 300)
}
