import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { role, logout } = useAuth()
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
      <div className="container">
        <Link className="navbar-brand" to="/">HR Portal</Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            {role === 'admin' ? (
              <li className="nav-item">
                <NavLink className="nav-link" to="/admin">Admin Dashboard</NavLink>
              </li>
            ) : (
              <li className="nav-item">
                <NavLink className="nav-link" to="/dashboard">Dashboard</NavLink>
              </li>
            )}
            {role === 'admin' && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/employees">Employees</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/reviews">Reviews</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/announcements">Announcements</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/analytics">Analytics</NavLink>
                </li>
              </>
            )}
            <li className="nav-item">
              <NavLink className="nav-link" to="/leaves">Leave Requests</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/goals">Goals</NavLink>
            </li>
            {role ? (
              <li className="nav-item">
                <button
                  className="btn btn-link nav-link"
                  onClick={logout}
                >
                  Logout
                </button>
              </li>
            ) : (
              <li className="nav-item">
                <NavLink className="nav-link" to="/login">Login</NavLink>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  )
}
