import 'dotenv/config'
process.env.TZ = 'Asia/Jakarta'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import pool from './config/db.js'
import authRoutes from './routes/auth.js'
import orderRoutes from './routes/orders.js'
import paymentRoutes from './routes/payments.js'
import promoRoutes from './routes/promos.js'
import addressRoutes from './routes/addresses.js'
import adminRoutes from './routes/admin.js'
import { verifyToken } from './middleware/auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const PORT = process.env.PORT || 5000

const corsOrigin = process.env.CORS_ORIGIN
app.use(cors({
  origin: corsOrigin === '*' ? true : corsOrigin?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}))
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
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
    const [rows] = await pool.query("SELECT title, message, type, link, created_at FROM notifications WHERE active = TRUE AND type IN ('info', 'promo', 'alert') ORDER BY created_at DESC")
    res.json({ announcements: rows })
  } catch (_err) {
    res.json({ announcements: [] })
  }
})

app.get('/api/payment-info', async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('payment_transfer', 'payment_ewallet')")
    const data = { transfer: [], ewallet: [] }
    rows.forEach(r => {
      if (r.setting_key === 'payment_transfer') {
        try { data.transfer = JSON.parse(r.setting_value) } catch { data.transfer = [] }
      }
      if (r.setting_key === 'payment_ewallet') {
        try { data.ewallet = JSON.parse(r.setting_value) } catch { data.ewallet = [] }
      }
    })
    res.json(data)
  } catch {
    res.json({ transfer: [], ewallet: [] })
  }
})

app.get('/api/products', async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.id, p.name, p.description, p.price, p.discount_type, p.discount_value, p.image, p.category, p.tags, p.weight, p.stock,
        IFNULL((SELECT SUM(oi.quantity) FROM order_items oi
          JOIN orders o ON o.id = oi.order_id AND o.status = 'done'
          WHERE oi.product_id = p.id), 0) AS sold_count
      FROM products p
      WHERE p.active = TRUE
      ORDER BY sold_count DESC, p.name
    `)
    res.json({ products: rows.map(p => {
      const price = Number(p.price)
      let discounted_price = price
      if (p.discount_type && p.discount_value > 0) {
        if (p.discount_type === 'percentage') discounted_price = Math.round(price * (1 - Number(p.discount_value) / 100))
        else if (p.discount_type === 'fixed') discounted_price = Math.max(0, price - Number(p.discount_value))
      }
      return { ...p, tags: p.tags ? p.tags.split(',').filter(Boolean) : [], discounted_price }
    }) })
  } catch {
    res.json({ products: [] })
  }
})

app.get('/api/products/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.id, p.name, p.description, p.price, p.discount_type, p.discount_value, p.image, p.category, p.tags, p.weight, p.stock,
        IFNULL((SELECT SUM(oi.quantity) FROM order_items oi
          JOIN orders o ON o.id = oi.order_id AND o.status = 'done'
          WHERE oi.product_id = p.id), 0) AS sold_count
      FROM products p WHERE p.id = ? AND p.active = TRUE
    `, [req.params.id])
    if (rows.length === 0) return res.status(404).json({ message: 'Produk tidak ditemukan' })
    const p = rows[0]
    const price = Number(p.price)
    let discounted_price = price
    if (p.discount_type && p.discount_value > 0) {
      if (p.discount_type === 'percentage') discounted_price = Math.round(price * (1 - Number(p.discount_value) / 100))
      else if (p.discount_type === 'fixed') discounted_price = Math.max(0, price - Number(p.discount_value))
    }
    p.tags = p.tags ? p.tags.split(',').filter(Boolean) : []
    p.discounted_price = discounted_price
    res.json({ product: p })
  } catch {
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

app.get('/api/promos', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, code, title, description, type, value, min_purchase, max_discount, usage_limit, used_count, start_date, end_date FROM promos WHERE active = TRUE AND (end_date IS NULL OR end_date >= CURDATE()) ORDER BY created_at DESC"
    )
    res.json({ promos: rows })
  } catch {
    res.json({ promos: [] })
  }
})

app.get('/api/store-status', async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('store_status', 'maintenance_until', 'maintenance_duration', 'store_name', 'store_description', 'operational_hours')")
    const data = { store_status: 'open', maintenance_until: null, maintenance_duration: null, store_name: 'Arazel Store', store_description: '', operational_hours: {} }
    rows.forEach(r => {
      if (r.setting_key === 'store_status') data.store_status = r.setting_value
      else if (r.setting_key === 'maintenance_until') data.maintenance_until = r.setting_value
      else if (r.setting_key === 'maintenance_duration') data.maintenance_duration = r.setting_value
      else if (r.setting_key === 'store_name') data.store_name = r.setting_value
      else if (r.setting_key === 'store_description') data.store_description = r.setting_value
      else if (r.setting_key === 'operational_hours') { try { data.operational_hours = JSON.parse(r.setting_value) } catch {} }
    })
    res.json(data)
  } catch {
    res.json({ store_status: 'open', maintenance_until: null, maintenance_duration: null, store_name: 'Arazel Store', store_description: '', operational_hours: {} })
  }
})

app.get('/api/shipping-info', async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('shipping_fee', 'free_shipping_minimum', 'store_address_full', 'pickup_estimate', 'cod_enabled')")
    const data = { shipping_fee: 10000, free_shipping_minimum: 50000, store_address_full: 'Jl. Merdeka No. 123, Bandung', pickup_estimate: '30-45 menit', cod_enabled: true }
    rows.forEach(r => {
      if (r.setting_key === 'shipping_fee') data.shipping_fee = Number(r.setting_value) || 0
      else if (r.setting_key === 'free_shipping_minimum') data.free_shipping_minimum = Number(r.setting_value) || 0
      else if (r.setting_key === 'store_address_full') data.store_address_full = r.setting_value
      else if (r.setting_key === 'pickup_estimate') data.pickup_estimate = r.setting_value
      else if (r.setting_key === 'cod_enabled') data.cod_enabled = r.setting_value !== 'false'
    })
    res.json(data)
  } catch {
    res.json({ shipping_fee: 10000, free_shipping_minimum: 50000, store_address_full: 'Jl. Merdeka No. 123, Bandung', pickup_estimate: '30-45 menit', cod_enabled: true })
  }
})

app.get('/api/reviews', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, rating, content FROM reviews WHERE active = TRUE ORDER BY created_at DESC')
    res.json({ reviews: rows })
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

    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [orderId, req.user.id])
    if (orders.length === 0) {
      return res.status(404).json({ message: 'Pesanan tidak ditemukan' })
    }
    if (orders[0].status !== 'done') {
      return res.status(400).json({ message: 'Ulasan hanya bisa diberikan untuk pesanan yang sudah selesai' })
    }

    const [existing] = await pool.query('SELECT id FROM reviews WHERE order_id = ?', [orderId])
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Kamu sudah memberikan ulasan untuk pesanan ini' })
    }

    const [users] = await pool.query('SELECT name FROM users WHERE id = ?', [req.user.id])
    const userName = users[0]?.name || req.user.name || 'User'
    await pool.query(
      'INSERT INTO reviews (user_id, order_id, name, rating, content, active) VALUES (?, ?, ?, ?, ?, TRUE)',
      [req.user.id, orderId, userName, rating, content]
    )

    res.status(201).json({ message: 'Ulasan berhasil dikirim' })
  } catch (err) {
    console.error('Create review error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

app.use(express.static(path.join(__dirname, '..', 'dist')))

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'))
})

const fullSchema = `
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS user_addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    label VARCHAR(50) NOT NULL,
    recipient_name VARCHAR(100) NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    street_address TEXT NOT NULL,
    notes TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'promo', 'alert') DEFAULT 'info',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(12,2) NOT NULL,
    image VARCHAR(500),
    category VARCHAR(50),
    weight INT DEFAULT 0,
    stock INT DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    order_number VARCHAR(20) NOT NULL UNIQUE,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    delivery_method ENUM('antar', 'jemput') NOT NULL,
    delivery_address TEXT,
    payment_method ENUM('transfer', 'e-wallet', 'cod') NOT NULL,
    promo_code VARCHAR(50),
    discount_amount DECIMAL(12,2) DEFAULT 0,
    subtotal DECIMAL(12,2) NOT NULL,
    shipping_fee DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL,
    status ENUM('pending', 'paid', 'processing', 'done', 'cancelled') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT,
    product_name VARCHAR(200) NOT NULL,
    product_price DECIMAL(12,2) NOT NULL,
    quantity INT NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    method ENUM('transfer', 'e-wallet') NOT NULL,
    proof_image VARCHAR(255),
    account_name VARCHAR(100),
    account_number VARCHAR(50),
    amount DECIMAL(12,2) NOT NULL,
    status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT
  );
  INSERT IGNORE INTO settings (setting_key, setting_value) VALUES
    ('store_name', 'Arazel Store'),
    ('store_description', 'Toko Makanan & Minuman'),
    ('store_address', ''),
    ('store_phone', ''),
    ('store_email', ''),
    ('whatsapp_number', ''),
    ('instagram', ''),
    ('payment_transfer', '[{"bank":"Bank BCA","account":"1234567890","name":"Arazel Store"},{"bank":"Bank Mandiri","account":"9876543210","name":"Arazel Store"}]'),
    ('payment_ewallet', '[{"provider":"GoPay","account":"081234567890","name":"Arazel Store"},{"provider":"DANA","account":"081234567890","name":"Arazel Store"}]'),
    ('store_status', 'open'),
    ('maintenance_duration', ''),
    ('maintenance_until', ''),
    ('operational_hours', '{"senin":{"open":"08:00","close":"21:00","active":true},"selasa":{"open":"08:00","close":"21:00","active":true},"rabu":{"open":"08:00","close":"21:00","active":true},"kamis":{"open":"08:00","close":"21:00","active":true},"jumat":{"open":"08:00","close":"21:00","active":true},"sabtu":{"open":"08:00","close":"21:00","active":true},"minggu":{"open":"","close":"","active":false}}'),
    ('announcement_active', 'false'),
    ('announcement_text', ''),
    ('shipping_fee', '10000'),
    ('free_shipping_minimum', '50000'),
    ('store_address_full', 'Jl. Merdeka No. 123, Bandung'),
    ('pickup_estimate', '30-45 menit'),
    ('cod_enabled', 'true');
  CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    order_id INT DEFAULT NULL,
    name VARCHAR(100) NOT NULL,
    rating TINYINT DEFAULT 5,
    content TEXT NOT NULL,
    avatar VARCHAR(500) DEFAULT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );
  CREATE TABLE IF NOT EXISTS promos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    type ENUM('percentage', 'fixed', 'free_shipping') NOT NULL,
    value DECIMAL(12,2) NOT NULL,
    min_purchase DECIMAL(12,2) DEFAULT 0,
    max_discount DECIMAL(12,2) DEFAULT NULL,
    usage_limit INT DEFAULT NULL,
    used_count INT DEFAULT 0,
    start_date DATE,
    end_date DATE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`

async function init() {
  try {
    const conn = await pool.getConnection()
    console.log('MySQL terhubung')
    const statements = fullSchema.split(';').filter(s => s.trim())
    for (const stmt of statements) {
      await conn.query(stmt)
    }
    try { await conn.query("ALTER TABLE products ADD COLUMN tags VARCHAR(255) DEFAULT '' AFTER category") } catch {}
    try { await conn.query("ALTER TABLE users ADD COLUMN status ENUM('active','suspended','blocked') DEFAULT 'active' AFTER role") } catch {}
    try { await conn.query("ALTER TABLE notifications ADD COLUMN link VARCHAR(500) DEFAULT NULL AFTER type") } catch {}
    try { await conn.query("ALTER TABLE notifications ADD COLUMN `read` BOOLEAN DEFAULT FALSE AFTER active") } catch {}
    try { await conn.query("ALTER TABLE products ADD COLUMN discount_type ENUM('percentage','fixed') DEFAULT NULL AFTER price") } catch {}
    try { await conn.query("ALTER TABLE products ADD COLUMN discount_value DECIMAL(12,2) DEFAULT NULL AFTER discount_type") } catch {}

    await conn.query(`INSERT IGNORE INTO users (name, email, password, phone, role, status) VALUES
      ('Admin Arazel', 'admin@arazelstore.com', '$2a$10$8KRj.M.Ong.oaD14e.myFOa32wsSnI18VJsJe6nsnMqmBvvsnW0Wm', '081234567890', 'admin', 'active'),
      ('Budi Santoso', 'customer@arazelstore.com', '$2a$10$v0Ei9oGqk0q9HTE7oGjaGOtMSZ7oNi5UWkyNjLrMcdasUyojasBB.', '081298765432', 'user', 'active')`)
    await conn.query(`UPDATE users SET password = '$2a$10$8KRj.M.Ong.oaD14e.myFOa32wsSnI18VJsJe6nsnMqmBvvsnW0Wm' WHERE email = 'admin@arazelstore.com'`)
    await conn.query(`UPDATE users SET password = '$2a$10$v0Ei9oGqk0q9HTE7oGjaGOtMSZ7oNi5UWkyNjLrMcdasUyojasBB.' WHERE email = 'customer@arazelstore.com'`)

    await conn.query(`INSERT IGNORE INTO products (name, description, price, image, category, tags, weight, stock, active) VALUES
      ('Dimsum Mentai', 'Dimsum ayam udang dengan saus mentai creamy yang dipanggang hingga kecoklatan.', 28000, 'https://images.unsplash.com/photo-1604632910793-c0601f361b34?w=400&h=400&fit=crop', 'dimsum', 'best-seller,populer', 200, 30, TRUE),
      ('Es Teh Manis', 'Minuman teh segar dengan gula batu.', 8000, 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=400&fit=crop', 'minuman', 'irit', 250, 100, TRUE)`)

    await conn.query(`INSERT IGNORE INTO promos (code, title, description, type, value, min_purchase, max_discount, end_date, active) VALUES
      ('DISKON10', 'Diskon 10% Semua Menu', 'Nikmati diskon 10% untuk setiap pembelian di Arazel Store.', 'percentage', 10, 0, 30000, '2026-07-31', TRUE),
      ('GRATISONGKIR', 'Gratis Ongkir', 'Gratis biaya pengiriman tanpa minimal pembelian.', 'free_shipping', 0, 0, NULL, '2026-07-31', TRUE)`)

    await conn.query(`INSERT IGNORE INTO settings (setting_key, setting_value) VALUES
      ('store_name', 'Arazel Store'),
      ('store_description', 'Toko Makanan & Minuman'),
      ('store_address', ''),
      ('store_phone', ''),
      ('store_email', ''),
      ('whatsapp_number', ''),
      ('instagram', ''),
      ('payment_transfer', '[{"bank":"Bank BCA","account":"1234567890","name":"Arazel Store"},{"bank":"Bank Mandiri","account":"9876543210","name":"Arazel Store"}]'),
      ('payment_ewallet', '[{"provider":"GoPay","account":"081234567890","name":"Arazel Store"},{"provider":"DANA","account":"081234567890","name":"Arazel Store"}]'),
      ('store_status', 'open'),
      ('maintenance_duration', ''),
      ('maintenance_until', ''),
      ('operational_hours', '{"senin":{"open":"08:00","close":"21:00","active":true},"selasa":{"open":"08:00","close":"21:00","active":true},"rabu":{"open":"08:00","close":"21:00","active":true},"kamis":{"open":"08:00","close":"21:00","active":true},"jumat":{"open":"08:00","close":"21:00","active":true},"sabtu":{"open":"08:00","close":"21:00","active":true},"minggu":{"open":"","close":"","active":false}}'),
      ('announcement_active', 'false'),
      ('announcement_text', ''),
      ('shipping_fee', '10000'),
      ('free_shipping_minimum', '50000'),
      ('store_address_full', 'Jl. Merdeka No. 123, Bandung'),
      ('pickup_estimate', '30-45 menit'),
      ('cod_enabled', 'true')`)

    conn.release()
    console.log('Semua tabel siap')
  } catch (err) {
    console.error('Database init error:', err)
  }

  app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`)
  })
}

init()
