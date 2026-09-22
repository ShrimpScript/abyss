import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

import './styles/tokens.css'
import './styles/base.css'
import './styles/gate.css'
import './styles/hud.css'
import './styles/rail.css'
import './styles/column.css'
import './styles/cursor.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
