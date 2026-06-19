import { createRoot } from 'react-dom/client'
import './lib/firebase'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <App />
)
