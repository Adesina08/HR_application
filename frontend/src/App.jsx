import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import AdminRoute from './components/AdminRoute'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import Leaves from './pages/Leaves'
import Goals from './pages/Goals'
import Reviews from './pages/Reviews'
import Announcements from './pages/Announcements'
import Analytics from './pages/Analytics'
import Login from './pages/Login'
import { AuthProvider } from './context/AuthContext'

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <div className="container py-4">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route
              path="/employees"
              element={
                <AdminRoute>
                  <Employees />
                </AdminRoute>
              }
            />
            <Route path="/leaves" element={<Leaves />} />
            <Route path="/goals" element={<Goals />} />
            <Route
              path="/reviews"
              element={
                <AdminRoute>
                  <Reviews />
                </AdminRoute>
              }
            />
            <Route
              path="/announcements"
              element={
                <AdminRoute>
                  <Announcements />
                </AdminRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <AdminRoute>
                  <Analytics />
                </AdminRoute>
              }
            />
            <Route path="/login" element={<Login />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}
