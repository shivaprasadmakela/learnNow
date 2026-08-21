import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted rather than loaded from cdnjs. The icons are genuinely used in 27
// components - including brand marks (Java, Python, JS) that lucide-react has no
// equivalent for - so bundling them keeps them working without a render-blocking
// third-party request, and lets the Content-Security-Policy stay restricted to 'self'.
import '@fortawesome/fontawesome-free/css/all.min.css'
import './index.css'
import App from './app/App.tsx'
import { ToastProvider } from './shared/components'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
)

