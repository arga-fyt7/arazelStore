const BASE_URL = import.meta.env.VITE_API_URL || ''

export async function api(path, options = {}) {
  const token = localStorage.getItem('token')
  const { headers: optHeaders, ...rest } = options
  const res = await fetch(`${BASE_URL}/api${path}`, {
    ...rest,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...optHeaders },
  })
  let data
  try { data = await res.json() } catch { data = {} }
  if (!res.ok) throw new Error(data.message || 'Terjadi kesalahan')
  return data
}

export async function apiGet(path) {
  return api(path)
}
