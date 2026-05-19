import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import Order from '../models/Order.js'
import { verifyToken } from '../middleware/auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const router = Router()

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, '..', 'uploads', 'payments')),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `payment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp']
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, allowed.includes(ext))
  },
})

router.post('/upload', verifyToken, upload.single('proof'), async (req, res) => {
  try {
    const { orderId, accountName, accountNumber, amount } = req.body
    if (!orderId || !amount) {
      return res.status(400).json({ message: 'Data pembayaran tidak lengkap' })
    }

    const order = await Order.findOne({ _id: orderId, userId: req.user.id })
    if (!order) {
      return res.status(404).json({ message: 'Pesanan tidak ditemukan' })
    }

    const proofImage = req.file ? `/uploads/payments/${req.file.filename}` : null
    const paymentMethod = order.paymentMethod

    await Order.updateOne(
      { _id: orderId, 'payment.status': 'rejected' },
      { $unset: { payment: '' } }
    )

    await Order.updateOne({ _id: orderId }, { $set: { payment: { method: paymentMethod, proofImage, accountName: accountName || null, accountNumber: accountNumber || null, amount: Number(amount), status: 'pending' } } })

    res.status(201).json({ message: 'Bukti pembayaran berhasil dikirim' })
  } catch (err) {
    console.error('Upload payment error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

export default router
