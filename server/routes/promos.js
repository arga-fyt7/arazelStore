import { Router } from 'express'
import pool from '../config/db.js'
import { verifyToken } from '../middleware/auth.js'

const router = Router()

router.post('/validate', verifyToken, async (req, res) => {
  try {
    const { code, subtotal, deliveryMethod } = req.body

    if (!code) {
      return res.status(400).json({ message: 'Kode promo wajib diisi' })
    }

    const [promos] = await pool.query(
      `SELECT * FROM promos WHERE code = ? AND active = TRUE
       AND (end_date IS NULL OR end_date >= CURDATE())
       AND (usage_limit IS NULL OR used_count < usage_limit)`,
      [code]
    )

    if (promos.length === 0) {
      return res.status(400).json({ message: 'Kode promo tidak valid atau sudah habis' })
    }

    const promo = promos[0]

    if (subtotal < promo.min_purchase) {
      return res.status(400).json({
        message: `Minimal pembelian Rp${promo.min_purchase.toLocaleString()} untuk promo ini`,
      })
    }

    let discountAmount = 0
    let freeShipping = false

    if (promo.type === 'percentage') {
      discountAmount = (subtotal * promo.value) / 100
      if (promo.max_discount) discountAmount = Math.min(discountAmount, promo.max_discount)
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
