import 'dotenv/config'
process.env.TZ = 'Asia/Jakarta'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import connectDB from './config/db.mjs'
import authRoutes from './routes/auth.mjs'
import orderRoutes from './routes/orders.mjs'
import paymentRoutes from './routes/payments.mjs'
import promoRoutes from './routes/promos.mjs'
import addressRoutes from './routes/addresses.mjs'
import adminRoutes from './routes/admin.mjs'
import { verifyToken } from './middleware/auth.mjs'
import User from './models/User.mjs'
import Product from './models/Product.mjs'
import Promo from './models/Promo.mjs'
import Setting from './models/Setting.mjs'
import Notification from './models/Notification.mjs'
import Review from './models/Review.mjs'
import Order from './models/Order.mjs'

const _dirname = path.dirname(fileURLToPath(import.meta.url))
const _filename = fileURLToPath(import.meta.url)

const app = express()
const PORT = process.env.PORT || 5000

const corsOrigin = process.env.CORS_ORIGIN
app.use(cors({
  origin: corsOrigin === '*' ? true : corsOrigin?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}))
app.use(express.json())
app.use('/uploads', express.static(path.join(_dirname, 'uploads')))
app.use('/api/auth', authRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/promos', promoRoutes)
app.use('/api/addresses', addressRoutes)
app.use('/api/admin', adminRoutes)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

app.get('/api/announcements', async (_req, res) => {
  try {
    const rows = await Notification.find({ active: true, type: { $in: ['info', 'promo', 'alert'] } }).sort({ createdAt: -1 })
    res.json({ announcements: rows.map(n => ({ title: n.title, message: n.message, type: n.type, link: n.link, created_at: n.createdAt })) })
  } catch {
    res.json({ announcements: [] })
  }
})

app.get('/api/payment-info', async (_req, res) => {
  try {
    const rows = await Setting.find({ key: { $in: ['payment_transfer', 'payment_ewallet'] } })
    const data = { transfer: [], ewallet: [] }
    rows.forEach(r => {
      if (r.key === 'payment_transfer') { try { data.transfer = JSON.parse(r.value) } catch { data.transfer = [] } }
      if (r.key === 'payment_ewallet') { try { data.ewallet = JSON.parse(r.value) } catch { data.ewallet = [] } }
    })
    res.json(data)
  } catch {
    res.json({ transfer: [], ewallet: [] })
  }
})

app.get('/api/products', async (_req, res) => {
  try {
    const products = await Product.find({ active: true }).sort({ createdAt: -1 })
    const enriched = await Promise.all(products.map(async (p) => {
      const price = Number(p.price)
      let discounted_price = price
      if (p.discountType && p.discountValue > 0) {
        if (p.discountType === 'percentage') discounted_price = Math.round(price * (1 - Number(p.discountValue) / 100))
        else if (p.discountType === 'fixed') discounted_price = Math.max(0, price - Number(p.discountValue))
      }
      const soldResult = await Order.aggregate([
        { $match: { status: 'done', 'items.productId': p._id } },
        { $unwind: '$items' },
        { $match: { 'items.productId': p._id } },
        { $group: { _id: null, total: { $sum: '$items.quantity' } } },
      ])
      const sold_count = soldResult[0]?.total || 0
      return {
        id: p._id,
        name: p.name,
        description: p.description,
        price,
        discount_type: p.discountType,
        discount_value: p.discountValue,
        image: p.image,
        category: p.category,
        tags: p.tags || [],
        weight: p.weight,
        stock: p.stock,
        sold_count,
        discounted_price,
      }
    }))
    enriched.sort((a, b) => b.sold_count - a.sold_count || a.name.localeCompare(b.name))
    res.json({ products: enriched })
  } catch {
    res.json({ products: [] })
  }
})

app.get('/api/products/:id', async (req, res) => {
  try {
    const p = await Product.findById(req.params.id)
    if (!p || !p.active) return res.status(404).json({ message: 'Produk tidak ditemukan' })
    const price = Number(p.price)
    let discounted_price = price
    if (p.discountType && p.discountValue > 0) {
      if (p.discountType === 'percentage') discounted_price = Math.round(price * (1 - Number(p.discountValue) / 100))
      else if (p.discountType === 'fixed') discounted_price = Math.max(0, price - Number(p.discountValue))
    }
    const soldResult = await Order.aggregate([
      { $match: { status: 'done', 'items.productId': p._id } },
      { $unwind: '$items' },
      { $match: { 'items.productId': p._id } },
      { $group: { _id: null, total: { $sum: '$items.quantity' } } },
    ])
    res.json({ product: { id: p._id, name: p.name, description: p.description, price, discount_type: p.discountType, discount_value: p.discountValue, image: p.image, category: p.category, tags: p.tags || [], weight: p.weight, stock: p.stock, sold_count: soldResult[0]?.total || 0, discounted_price } })
  } catch {
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

app.get('/api/promos', async (_req, res) => {
  try {
    const now = new Date()
    const promos = await Promo.find({ active: true, $or: [{ endDate: null }, { endDate: { $gte: now } }] }).sort({ createdAt: -1 })
    res.json({ promos: promos.map(p => ({ id: p._id, code: p.code, title: p.title, description: p.description, type: p.type, value: p.value, min_purchase: p.minPurchase, max_discount: p.maxDiscount, usage_limit: p.usageLimit, used_count: p.usedCount, start_date: p.startDate, end_date: p.endDate })) })
  } catch {
    res.json({ promos: [] })
  }
})

app.get('/api/store-status', async (_req, res) => {
  try {
    const rows = await Setting.find({ key: { $in: ['store_status', 'maintenance_until', 'maintenance_duration', 'store_name', 'store_description', 'operational_hours'] } })
    const data = { store_status: 'open', maintenance_until: null, maintenance_duration: null, store_name: 'Arazel Store', store_description: '', operational_hours: {} }
    rows.forEach(r => {
      if (r.key === 'store_status') data.store_status = r.value
      else if (r.key === 'maintenance_until') data.maintenance_until = r.value
      else if (r.key === 'maintenance_duration') data.maintenance_duration = r.value
      else if (r.key === 'store_name') data.store_name = r.value
      else if (r.key === 'store_description') data.store_description = r.value
      else if (r.key === 'operational_hours') { try { data.operational_hours = JSON.parse(r.value) } catch {} }
    })
    res.json(data)
  } catch {
    res.json({ store_status: 'open', maintenance_until: null, maintenance_duration: null, store_name: 'Arazel Store', store_description: '', operational_hours: {} })
  }
})

app.get('/api/shipping-info', async (_req, res) => {
  try {
    const rows = await Setting.find({ key: { $in: ['shipping_fee', 'free_shipping_minimum', 'store_address_full', 'pickup_estimate', 'cod_enabled'] } })
    const data = { shipping_fee: 10000, free_shipping_minimum: 50000, store_address_full: 'Jl. Merdeka No. 123, Bandung', pickup_estimate: '30-45 menit', cod_enabled: true }
    rows.forEach(r => {
      if (r.key === 'shipping_fee') data.shipping_fee = Number(r.value) || 0
      else if (r.key === 'free_shipping_minimum') data.free_shipping_minimum = Number(r.value) || 0
      else if (r.key === 'store_address_full') data.store_address_full = r.value
      else if (r.key === 'pickup_estimate') data.pickup_estimate = r.value
      else if (r.key === 'cod_enabled') data.cod_enabled = r.value !== 'false'
    })
    res.json(data)
  } catch {
    res.json({ shipping_fee: 10000, free_shipping_minimum: 50000, store_address_full: 'Jl. Merdeka No. 123, Bandung', pickup_estimate: '30-45 menit', cod_enabled: true })
  }
})

app.get('/api/reviews', async (_req, res) => {
  try {
    const reviews = await Review.find({ active: true }).sort({ createdAt: -1 })
    res.json({ reviews: reviews.map(r => ({ id: r._id, name: r.name, rating: r.rating, content: r.content })) })
  } catch {
    res.json({ reviews: [] })
  }
})

app.post('/api/reviews', verifyToken, async (req, res) => {
  try {
    const { orderId, rating, content } = req.body
    if (!orderId || !rating || !content) {
      return res.status(400).json({ message: 'Data ulasan tidak lengkap' })
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating harus 1-5' })
    }

    const order = await Order.findOne({ _id: orderId, userId: req.user.id })
    if (!order) {
      return res.status(404).json({ message: 'Pesanan tidak ditemukan' })
    }
    if (order.status !== 'done') {
      return res.status(400).json({ message: 'Ulasan hanya bisa diberikan untuk pesanan yang sudah selesai' })
    }

    const existing = await Review.findOne({ orderId })
    if (existing) {
      return res.status(400).json({ message: 'Kamu sudah memberikan ulasan untuk pesanan ini' })
    }

    const user = await User.findById(req.user.id)
    const userName = user?.name || req.user.name || 'User'
    await Review.create({ userId: req.user.id, orderId, name: userName, rating, content, active: true })

    res.status(201).json({ message: 'Ulasan berhasil dikirim' })
  } catch (err) {
    console.error('Create review error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

const isLocal = process.argv[1] === _filename
if (isLocal) {
  app.use(express.static(path.join(_dirname, '..', 'dist')))

  app.get('*', (_req, res) => {
    res.sendFile(path.join(_dirname, '..', 'dist', 'index.html'))
  })
}

async function seedData() {
  const userCount = await User.countDocuments()
  if (userCount > 0) {
    console.log('Data sudah ada, skip seeding')
    return
  }

  console.log('Menjalankan seed data...')

  await User.create([
    { name: 'Admin Arazel', email: 'admin@arazelstore.com', password: '$2a$10$8KRj.M.Ong.oaD14e.myFOa32wsSnI18VJsJe6nsnMqmBvvsnW0Wm', phone: '081234567890', role: 'admin', status: 'active' },
    { name: 'Budi Santoso', email: 'customer@arazelstore.com', password: '$2a$10$v0Ei9oGqk0q9HTE7oGjaGOtMSZ7oNi5UWkyNjLrMcdasUyojasBB.', phone: '081298765432', role: 'user', status: 'active' },
  ])

  await Product.create([
    { name: 'Dimsum Mentai', description: 'Dimsum ayam udang dengan saus mentai creamy yang dipanggang hingga kecoklatan.', price: 28000, image: 'https://images.unsplash.com/photo-1604632910793-c0601f361b34?w=400&h=400&fit=crop', category: 'dimsum', tags: ['best-seller', 'populer'], weight: 200, stock: 30, active: true },
    { name: 'Es Teh Manis', description: 'Minuman teh segar dengan gula batu.', price: 8000, image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=400&fit=crop', category: 'minuman', tags: ['irit'], weight: 250, stock: 100, active: true },
  ])

  await Promo.create([
    { code: 'DISKON10', title: 'Diskon 10% Semua Menu', description: 'Nikmati diskon 10% untuk setiap pembelian di Arazel Store.', type: 'percentage', value: 10, minPurchase: 0, maxDiscount: 30000, endDate: new Date('2026-07-31'), active: true },
    { code: 'GRATISONGKIR', title: 'Gratis Ongkir', description: 'Gratis biaya pengiriman tanpa minimal pembelian.', type: 'free_shipping', value: 0, minPurchase: 0, endDate: new Date('2026-07-31'), active: true },
  ])

  const settings = [
    { key: 'store_name', value: 'Arazel Store' },
    { key: 'store_description', value: 'Toko Makanan & Minuman' },
    { key: 'store_address', value: '' },
    { key: 'store_phone', value: '' },
    { key: 'store_email', value: '' },
    { key: 'whatsapp_number', value: '' },
    { key: 'instagram', value: '' },
    { key: 'payment_transfer', value: '[{"bank":"Bank BCA","account":"1234567890","name":"Arazel Store"},{"bank":"Bank Mandiri","account":"9876543210","name":"Arazel Store"}]' },
    { key: 'payment_ewallet', value: '[{"provider":"GoPay","account":"081234567890","name":"Arazel Store"},{"provider":"DANA","account":"081234567890","name":"Arazel Store"}]' },
    { key: 'store_status', value: 'open' },
    { key: 'maintenance_duration', value: '' },
    { key: 'maintenance_until', value: '' },
    { key: 'operational_hours', value: '{"senin":{"open":"08:00","close":"21:00","active":true},"selasa":{"open":"08:00","close":"21:00","active":true},"rabu":{"open":"08:00","close":"21:00","active":true},"kamis":{"open":"08:00","close":"21:00","active":true},"jumat":{"open":"08:00","close":"21:00","active":true},"sabtu":{"open":"08:00","close":"21:00","active":true},"minggu":{"open":"","close":"","active":false}}' },
    { key: 'announcement_active', value: 'false' },
    { key: 'announcement_text', value: '' },
    { key: 'shipping_fee', value: '10000' },
    { key: 'free_shipping_minimum', value: '50000' },
    { key: 'store_address_full', value: 'Jl. Merdeka No. 123, Bandung' },
    { key: 'pickup_estimate', value: '30-45 menit' },
    { key: 'cod_enabled', value: 'true' },
  ]
  for (const s of settings) {
    await Setting.create(s)
  }

  console.log('Seed data selesai')
}

export default app

if (isLocal) {
  async function init() {
    await connectDB()
    await seedData()
    app.listen(PORT, () => {
      console.log(`Server berjalan di http://localhost:${PORT}`)
    })
  }
  init()
}
