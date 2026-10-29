import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { initPWA } from './pwa'
import { initTheme } from './lib/theme'
import { initSeason } from './seasonal/halloween'

initTheme()
initSeason()
initPWA()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
