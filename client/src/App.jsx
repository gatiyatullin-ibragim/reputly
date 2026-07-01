import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'

import Login      from './pages/Login'
import Register   from './pages/Register'
import Dashboard  from './pages/Dashboard'
import Reviews    from './pages/Reviews'
import ReviewDetail from './pages/ReviewDetail'
import Analytics  from './pages/Analytics'
import Locations  from './pages/Locations'
import InstagramCallback from './pages/InstagramCallback'
import Competitors from './pages/Competitors'
import Settings   from './pages/Settings'
import Onboarding from './pages/Onboarding'
import Layout     from './components/layout/Layout'

function ProtectedRoute({ children }) {
  const user = useAuthStore((s) => s.user)
  return user ? children : <Navigate to="/login" replace />
}

function GuestRoute({ children }) {
  const user = useAuthStore((s) => s.user)
  return !user ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <Routes>
      {/* Гостевые страницы */}
      <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

      {/* Онбординг */}
      <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
      <Route path="/instagram/callback" element={<ProtectedRoute><InstagramCallback /></ProtectedRoute>} />

      {/* Защищённые страницы с Layout */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index           element={<Dashboard />} />
        <Route path="reviews"  element={<Reviews />} />
        <Route path="reviews/:id" element={<ReviewDetail />} />
        <Route path="analytics"   element={<Analytics />} />
        <Route path="locations"   element={<Locations />} />
        <Route path="competitors" element={<Competitors />} />
        <Route path="settings"    element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
