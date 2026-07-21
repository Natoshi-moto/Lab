import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'

try {
  // Only attempt resize in non-Electron browser context.
  if (!(window as any).electronAPI) {
    window.moveTo(0, 0)
    window.resizeTo(screen.availWidth, screen.availHeight)
  }
} catch {
  // silently ignored in regular browser tabs
}

// Sweep 59-R — handoff from inline boot splash to React. The splash lives in
// index.html inside #root so it paints on the first frame. Before mounting
// React we move it out of #root (React 18 warns if the container has children),
// fade it, then remove it. Persistence and identity are untouched.
function detachBootSplash() {
  const splash = document.getElementById('n-boot')
  const rootEl = document.getElementById('root')
  if (!splash || !rootEl) return
  // Pull the splash up to <body> so it overlays the React tree during fade.
  if (splash.parentElement === rootEl) {
    document.body.appendChild(splash)
  }
  // Defer one frame so React's first paint happens before the fade starts.
  requestAnimationFrame(() => {
    splash.setAttribute('data-leaving', 'true')
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const removeAfter = prefersReduced ? 0 : 260
    window.setTimeout(() => splash.remove(), removeAfter)
  })
}
detachBootSplash()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)
