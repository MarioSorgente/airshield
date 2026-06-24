import { createRoot } from 'react-dom/client'
import './lib/firebase'
import './index.css'
import App from './App.tsx'
import Dashboard from './dashboard/Dashboard.tsx'

// Tiny path-based route: /dashboard renders the admin view, everything else is
// the marketing site. Vite dev (appType 'spa') serves index.html for /dashboard
// on refresh, so no router library is needed.
const isDashboard = window.location.pathname.replace(/\/+$/, "") === "/dashboard"

createRoot(document.getElementById('root')!).render(
  isDashboard ? <Dashboard /> : <App />
)
