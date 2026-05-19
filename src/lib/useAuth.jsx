import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useToast } from './useToast'

const AuthContext = createContext()

const API = '/api/auth'

async function api(path, options = {}) {
  const { headers: optHeaders, ...rest } = options
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...optHeaders },
    ...rest,
  })
  let data
  try {
    data = await res.json()
  } catch {
    throw new Error('Gagal terhubung ke server. Pastikan server backend sedang berjalan.')
  }
  if (!res.ok) throw new Error(data.message || 'Terjadi kesalahan')
  return data
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    api('/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((data) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem('token')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await api('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    localStorage.setItem('token', data.token)
    setUser(data.user)
    return data
  }, [])

  const register = useCallback(async (name, email, password, phone) => {
    const data = await api('/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, phone }),
    })
    localStorage.setItem('token', data.token)
    setUser(data.user)
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setUser(null)
  }, [])

  const updateProfile = useCallback(async (name, phone) => {
    const token = localStorage.getItem('token')
    const data = await api('/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, phone }),
    })
    setUser(data.user)
    return data
  }, [])

  const updatePassword = useCallback(async (currentPassword, newPassword) => {
    const token = localStorage.getItem('token')
    return api('/password', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ currentPassword, newPassword }),
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, updatePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
