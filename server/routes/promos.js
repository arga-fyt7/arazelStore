import { Router } from 'express'
import Promo from '../models/Promo.js'
import { verifyToken } from '../middleware/auth.js'

const router = Router()

router.post('/validate', verifyToken, async (req, res) => {
  try {
    const { code, subtotal, deliveryMethod } = req.body

    if (!code) {
      return res.status(400).json({ message: 'Kode promo wajib diisi' })
    }

    const now = new Date()
    const promo = await Promo.findOne({
      code,
      active: true,
      $or: [{ endDate: null }, { endDate: { $gte: now } }],
      $expr: { $or: [{ $eq: ['$usageLimit', null] }, { $lt: ['$usedCount', '$usageLimit'] }] },
    })

    if (!promo) {
      return res.status(400).json({ message: 'Kode promo tidak valid atau sudah habis' })
    }

    if (subtotal < promo.minPurchase) {
      return res.status(400).json({
        message: `Minimal pembelian Rp${promo.minPurchase.toLocaleString()} untuk promo ini`,
      })
    }

    let discountAmount = 0
    let freeShipping = false

    if (promo.type === 'percentage') {
      discountAmount = (subtotal * promo.value) / 100
      if (promo.maxDiscount) discountAmount = Math.min(discountAmount, promo.maxDiscount)
    } else if (promo.type === 'fixed') {
      discountAmount = promo.value
    } else if (promo.type === 'free_shipping') {
      freeShipping = true
    }

    res.json({
      valid: true,
      promo: {
        code: promo.code,
        title: promo.title,
        description: promo.description,
        type: promo.type,
        discountAmount: Math.round(discountAmount),
        freeShipping,
      },
    })
  } catch (err) {
    console.error('Validate promo error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

export default router
