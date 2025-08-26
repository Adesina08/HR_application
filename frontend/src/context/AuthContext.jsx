/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [role, setRole] = useState(null)

  const login = (newRole) => setRole(newRole)
  const logout = () => setRole(null)

  return (
    <AuthContext.Provider value={{ role, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
