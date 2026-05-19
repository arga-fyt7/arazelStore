import { Router } from 'express'
import pool from '../config/db.js'
import { verifyToken } from '../middleware/auth.js'

const router = Router()

async function generateOrderNumber(pool) {
  const [rows] = await pool.query(
    "SELECT order_number FROM orders WHERE order_number LIKE 'ARZ-%' ORDER BY id DESC LIMIT 1"
  )
  let num = 1
  if (rows.length > 0) {
    const last = parseInt(rows[0].order_number.replace('ARZ-', ''), 10)
    num = last >= 999 ? 1 : last + 1
  }
  return `ARZ-${String(num).padStart(3, '0')}`
}

router.post('/', verifyToken, async (req, res) => {
  try {
    const { items, customerName, customerPhone, deliveryMethod, deliveryAddress, paymentMethod, promoCode, notes } = req.body

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Keranjang belanja kosong' })
    }
    if (!customerName || !customerPhone) {
      return res.status(400).json({ message: 'Nama dan nomor HP wajib diisi' })
    }
    if (!deliveryMethod) {
      return res.status(400).json({ message: 'Pilih metode pengiriman' })
    }
    if (deliveryMethod === 'antar' && !deliveryAddress) {
      return res.status(400).json({ message: 'Alamat pengiriman wajib diisi' })
    }
    if (!paymentMethod) {
      return res.status(400).json({ message: 'Pilih metode pembayaran' })
    }

    const subtotal = items.reduce((sum, item) => sum + item.productPrice * item.quantity, 0)

    const [shipSettings] = await pool.query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('shipping_fee', 'free_shipping_minimum')")
    const shipCfg = { shipping_fee: 10000, free_shipping_minimum: 50000 }
    shipSettings.forEach(r => {
      if (r.setting_key === 'shipping_fee') shipCfg.shipping_fee = Number(r.setting_value) || 0
      else if (r.setting_key === 'free_shipping_minimum') shipCfg.free_shipping_minimum = Number(r.setting_value) || 0
    })

    let shippingFee = deliveryMethod === 'antar' ? shipCfg.shipping_fee : 0
    if (deliveryMethod === 'antar' && shipCfg.free_shipping_minimum > 0 && subtotal >= shipCfg.free_shipping_minimum) {
      shippingFee = 0
    }
    let discountAmount = 0

    if (promoCode) {
      const [promos] = await pool.query(
        `SELECT * FROM promos WHERE code = ? AND active = TRUE
         AND (end_date IS NULL OR end_date >= CURDATE())
         AND (usage_limit IS NULL OR used_count < usage_limit)`,
        [promoCode]
      )
      if (promos.length === 0) {
        return res.status(400).json({ message: 'Kode promo tidak valid atau sudah habis' })
      }
      const promo = promos[0]
      if (subtotal < promo.min_purchase) {
        return res.status(400).json({ message: `Minimal pembelian Rp${promo.min_purchase.toLocaleString()} untuk promo ini` })
      }
      if (promo.type === 'percentage') {
        discountAmount = (subtotal * promo.value) / 100
        if (promo.max_discount) discountAmount = Math.min(discountAmount, promo.max_discount)
      } else if (promo.type === 'fixed') {
        discountAmount = promo.value
      } else if (promo.type === 'free_shipping') {
        shippingFee = 0
      }
      await pool.query('UPDATE promos SET used_count = used_count + 1 WHERE code = ?', [promoCode])
    }

    const total = Math.max(0, subtotal - discountAmount + shippingFee)
    const orderNumber = await generateOrderNumber(pool)

    const [orderResult] = await pool.query(
      `INSERT INTO orders (user_id, order_number, customer_name, customer_phone, delivery_method, delivery_address, payment_method, promo_code, discount_amount, subtotal, shipping_fee, total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, orderNumber, customerName, customerPhone, deliveryMethod, deliveryAddress || null, paymentMethod, promoCode || null, discountAmount, subtotal, shippingFee, total]
    )

    const orderId = orderResult.insertId
    const itemValues = items.map(item => [orderId, item.productId, item.productName, item.productPrice, item.quantity, item.productPrice * item.quantity])
    await pool.query(
      'INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal) VALUES ?',
      [itemValues]
    )

    const [order] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId])

    res.status(201).json({
      message: 'Pesanan berhasil dibuat',
      order: order[0],
    })
  } catch (err) {
    console.error('Create order error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.get('/', verifyToken, async (req, res) => {
  try {
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    )
    res.json({ orders })
  } catch (err) {
    console.error('Get orders error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    )
    if (orders.length === 0) {
      return res.status(404).json({ message: 'Pesanan tidak ditemukan' })
    }
    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [req.params.id])
    const [payments] = await pool.query('SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1', [req.params.id])
    const [reviews] = await pool.query('SELECT id, rating, content, reply, replied_at, created_at FROM reviews WHERE order_id = ?', [req.params.id])
    res.json({ order: orders[0], items, payment: payments[0] || null, review: reviews[0] || null })
  } catch (err) {
    console.error('Get order error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

export default router
