import { Router } from 'express'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import Setting from '../models/Setting.js'
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

    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(400).json({ message: 'Email sudah terdaftar' })
    }

    const hashed = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email, password: hashed, phone: phone || null })

    const token = generateToken({ id: user._id, name: user.name, email: user.email, role: user.role })

    res.status(201).json({
      message: 'Registrasi berhasil',
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role },
    })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

function isStoreClosed(settings) {
  const get = (key) => settings.find(s => s.key === key)?.value
  const status = get('store_status')
  if (!status || status === 'open') {
    const hoursRaw = get('operational_hours')
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
    const untilRaw = get('maintenance_until')
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

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: 'Email atau password salah' })
    }

    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      return res.status(401).json({ message: 'Email atau password salah' })
    }

    if (user.role !== 'admin') {
      const settingRows = await Setting.find()
      const closed = isStoreClosed(settingRows)
      if (closed) {
        return res.status(403).json({ message: 'Toko sedang tutup. Hanya administrator yang dapat login.' })
      }
    }

    const token = generateToken({ id: user._id, name: user.name, email: user.email, role: user.role })

    res.json({
      message: 'Login berhasil',
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, created_at: user.createdAt },
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('name email phone role createdAt')
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' })
    }
    res.json({ user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, created_at: user.createdAt } })
  } catch (err) {
    console.error('Get profile error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, phone } = req.body
    const user = await User.findByIdAndUpdate(req.user.id, { name, phone: phone || null }, { new: true }).select('name email phone role createdAt')
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' })
    res.json({ message: 'Profil berhasil diperbarui', user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, created_at: user.createdAt } })
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

    const user = await User.findById(req.user.id).select('password')
    const match = await bcrypt.compare(currentPassword, user.password)
    if (!match) {
      return res.status(400).json({ message: 'Password saat ini salah' })
    }

    const hashed = await bcrypt.hash(newPassword, 10)
    await User.findByIdAndUpdate(req.user.id, { password: hashed })

    res.json({ message: 'Password berhasil diubah' })
  } catch (err) {
    console.error('Update password error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

export default router
