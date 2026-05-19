import { Router } from 'express'
import bcrypt from 'bcryptjs'
import pool from '../config/db.js'
import { generateToken, verifyToken } from '../middleware/auth.js'

const router = Router()

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nama, email, dan password wajib diisi' })
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password minimal 6 karakter' })
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email])
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email sudah terdaftar' })
    }

    const hashed = await bcrypt.hash(password, 10)
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)',
      [name, email, hashed, phone || null]
    )

    const user = { id: result.insertId, name, email, phone: phone || null, role: 'user' }
    const token = generateToken(user)

    res.status(201).json({
      message: 'Registrasi berhasil',
      token,
      user,
    })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

function isStoreClosed(settings) {
  const status = settings.find(s => s.setting_key === 'store_status')?.setting_value
  if (!status || status === 'open') {
    const hoursRaw = settings.find(s => s.setting_key === 'operational_hours')?.setting_value
    if (hoursRaw) {
      try {
        const hours = JSON.parse(hoursRaw)
        const days = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu']
        const now = new Date()
        const jakarta = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
        const todayKey = days[jakarta.getDay()]
        const today = hours[todayKey]
        const nowMin = jakarta.getHours() * 60 + jakarta.getMinutes()
        if (today?.active !== false && today?.open) {
          const [oh, om] = today.open.split(':').map(Number)
          const [ch, cm] = today.close.split(':').map(Number)
          const openMin = oh * 60 + om
          const closeMin = ch * 60 + cm
          const within = closeMin <= openMin ? (nowMin >= openMin || nowMin < closeMin) : (nowMin >= openMin && nowMin < closeMin)
          if (!within) return 'diluar_jam_operasional'
        }
      } catch {}
    }
    return null
  }
  if (status === 'tutup') return 'tutup'
  if (status === 'tutup_sementara') {
    const untilRaw = settings.find(s => s.setting_key === 'maintenance_until')?.setting_value
    if (untilRaw && new Date(untilRaw).getTime() > Date.now()) return 'tutup_sementara'
  }
  return null
}

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan password wajib diisi' })
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email])
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Email atau password salah' })
    }

    const user = rows[0]
    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      return res.status(401).json({ message: 'Email atau password salah' })
    }

    if (user.role !== 'admin') {
      const [settingRows] = await pool.query('SELECT setting_key, setting_value FROM settings')
      const closed = isStoreClosed(settingRows)
      if (closed) {
        return res.status(403).json({ message: 'Toko sedang tutup. Hanya administrator yang dapat login.' })
      }
    }

    const token = generateToken(user)

    res.json({
      message: 'Login berhasil',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        created_at: user.created_at,
      },
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.get('/me', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    )
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' })
    }
    res.json({ user: rows[0] })
  } catch (err) {
    console.error('Get profile error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, phone } = req.body
    await pool.query('UPDATE users SET name = ?, phone = ? WHERE id = ?', [
      name,
      phone || null,
      req.user.id,
    ])

    const [rows] = await pool.query(
      'SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    )

    res.json({ message: 'Profil berhasil diperbarui', user: rows[0] })
  } catch (err) {
    console.error('Update profile error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.put('/password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Password saat ini dan baru wajib diisi' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password baru minimal 6 karakter' })
    }

    const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id])
    const match = await bcrypt.compare(currentPassword, rows[0].password)
    if (!match) {
      return res.status(400).json({ message: 'Password saat ini salah' })
    }

    const hashed = await bcrypt.hash(newPassword, 10)
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id])

    res.json({ message: 'Password berhasil diubah' })
  } catch (err) {
    console.error('Update password error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

export default router
