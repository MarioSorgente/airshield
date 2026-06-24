import { createRoot } from 'react-dom/client'
import { lazy, Suspense } from 'react'
import './lib/firebase'
import './index.css'
import App from './App.tsx'

// Tiny path-based route: /dashboard renders the admin view, everything else is
// the marketing site. Vite dev (appType 'spa') serves index.html for /dashboard
// on refresh, so no router library is needed.
//
// The dashboard is lazy-loaded so its module graph never loads (or can break)
// the marketing page — only visitors to /dashboard pull it in.
const isDashboard = window.location.pathname.replace(/\/+$/, "") === "/dashboard"
const Dashboard = lazy(() => import('./dashboard/Dashboard.tsx'))

createRoot(document.getElementById('root')!).render(
  isDashboard ? (
    <Suspense fallback={null}>
      <Dashboard />
    </Suspense>
  ) : (
    <App />
  )
)
