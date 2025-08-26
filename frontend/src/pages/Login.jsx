import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [role, setRole] = useState('employee')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    login(role)
    navigate('/')
  }

  return (
    <div className="mt-5" style={{ maxWidth: '400px' }}>
      <h4>Login</h4>
      <form onSubmit={handleSubmit} className="mt-3">
        <div className="mb-3">
          <label htmlFor="role" className="form-label">Role</label>
          <select
            id="role"
            className="form-select"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="employee">Employee</option>
            <option value="admin">HR Admin</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary w-100">Login</button>
      </form>
    </div>
  )
}
