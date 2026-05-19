import { Router } from 'express'
import bcrypt from 'bcryptjs'
import pool from '../config/db.js'
import { verifyToken, isAdmin } from '../middleware/auth.js'

const router = Router()

router.use(verifyToken, isAdmin)

router.get('/dashboard', async (_req, res) => {
  try {
    const [[{ totalOrders }]] = await pool.query('SELECT COUNT(*) as totalOrders FROM orders')
    const [[{ totalRevenue }]] = await pool.query("SELECT COALESCE(SUM(total),0) as totalRevenue FROM orders WHERE status != 'cancelled'")
    const [[{ totalProducts }]] = await pool.query('SELECT COUNT(*) as totalProducts FROM products')
    const [[{ activeProducts }]] = await pool.query("SELECT COUNT(*) as activeProducts FROM products WHERE active = TRUE")
    const [[{ totalUsers }]] = await pool.query("SELECT COUNT(*) as totalUsers FROM users WHERE role = 'user'")
    const [[{ pendingOrders }]] = await pool.query("SELECT COUNT(*) as pendingOrders FROM orders WHERE status = 'pending'")
    const [[{ pendingPayments }]] = await pool.query("SELECT COUNT(*) as pendingPayments FROM payments WHERE status = 'pending'")
    const [[{ todayOrders }]] = await pool.query('SELECT COUNT(*) as todayOrders FROM orders WHERE DATE(created_at) = CURDATE()')
    const [[{ activePromos }]] = await pool.query("SELECT COUNT(*) as activePromos FROM promos WHERE active = TRUE AND (end_date IS NULL OR end_date >= CURDATE())")

    const [recentOrders] = await pool.query(
      `SELECT o.id, o.order_number, o.customer_name, o.total, o.status, o.created_at,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
       FROM orders o ORDER BY o.created_at DESC LIMIT 5`
    )

    const [revenueByMonth] = await pool.query(
      "SELECT DATE_FORMAT(created_at, '%Y-%m') as month, SUM(total) as revenue FROM orders WHERE status != 'cancelled' GROUP BY month ORDER BY month DESC LIMIT 6"
    )

    const [ordersByStatus] = await pool.query(
      "SELECT status, COUNT(*) as count FROM orders GROUP BY status ORDER BY FIELD(status, 'pending','paid','processing','done','cancelled')"
    )

    const [lowStock] = await pool.query(
      "SELECT id, name, stock, image FROM products WHERE active = TRUE AND stock > 0 AND stock <= 5 ORDER BY stock ASC LIMIT 5"
    )

    res.json({
      stats: { totalOrders, totalRevenue, totalProducts, activeProducts, totalUsers, pendingOrders, pendingPayments, todayOrders, activePromos },
      recentOrders,
      revenueByMonth,
      ordersByStatus,
      lowStock,
    })
  } catch (err) {
    console.error('Dashboard error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.get('/orders', async (req, res) => {
  try {
    const { status, search } = req.query
    let query = `
      SELECT o.*, u.name as user_name, u.email as user_email,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `
    const params = []
    if (status && status !== 'all') {
      query += ' AND o.status = ?'
      params.push(status)
    }
    if (search) {
      query += ' AND (o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_phone LIKE ?)'
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }
    query += ' ORDER BY o.created_at DESC'

    const [orders] = await pool.query(query, params)
    res.json({ orders })
  } catch (err) {
    console.error('Admin orders error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.get('/orders/:id', async (req, res) => {
  try {
    const [orderRows] = await pool.query(
      'SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?',
      [req.params.id]
    )
    if (orderRows.length === 0) return res.status(404).json({ message: 'Pesanan tidak ditemukan' })

    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [req.params.id])
    const [payment] = await pool.query('SELECT * FROM payments WHERE order_id = ?', [req.params.id])

    res.json({ order: orderRows[0], items, payment: payment[0] || null })
  } catch (err) {
    console.error('Admin order detail error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body
    const validStatuses = ['pending', 'paid', 'processing', 'done', 'cancelled']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Status tidak valid' })
    }

    const [existing] = await pool.query('SELECT id FROM orders WHERE id = ?', [req.params.id])
    if (existing.length === 0) return res.status(404).json({ message: 'Pesanan tidak ditemukan' })

    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id])
    res.json({ message: 'Status pesanan berhasil diperbarui' })
  } catch (err) {
    console.error('Update order status error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.get('/products', async (_req, res) => {
  try {
    const [products] = await pool.query('SELECT * FROM products ORDER BY created_at DESC')
    res.json({ products })
  } catch (err) {
    console.error('Admin products error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.post('/products', async (req, res) => {
  try {
    const { name, description, price, image, category, weight, stock, discount_type, discount_value } = req.body
    if (!name || !price) return res.status(400).json({ message: 'Nama dan harga wajib diisi' })

    const [result] = await pool.query(
      'INSERT INTO products (name, description, price, discount_type, discount_value, image, category, weight, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, description || null, price, discount_type || null, discount_value || null, image || null, category || null, weight || 0, stock || 0]
    )

    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId])
    res.status(201).json({ message: 'Produk berhasil ditambahkan', product: rows[0] })
  } catch (err) {
    console.error('Create product error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.put('/products/:id', async (req, res) => {
  try {
    const { name, description, price, image, category, weight, stock, active, discount_type, discount_value } = req.body

    const [existing] = await pool.query('SELECT id FROM products WHERE id = ?', [req.params.id])
    if (existing.length === 0) return res.status(404).json({ message: 'Produk tidak ditemukan' })

    await pool.query(
      'UPDATE products SET name=?, description=?, price=?, discount_type=?, discount_value=?, image=?, category=?, weight=?, stock=?, active=? WHERE id=?',
      [name, description, price, discount_type || null, discount_value || null, image, category, weight, stock, active ?? true, req.params.id]
    )

    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id])
    res.json({ message: 'Produk berhasil diperbarui', product: rows[0] })
  } catch (err) {
    console.error('Update product error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.patch('/products/:id/toggle', async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT id, active FROM products WHERE id = ?', [req.params.id])
    if (existing.length === 0) return res.status(404).json({ message: 'Produk tidak ditemukan' })
    const active = existing[0].active ? 0 : 1
    await pool.query('UPDATE products SET active = ? WHERE id = ?', [active, req.params.id])
    res.json({ message: active ? 'Produk diaktifkan' : 'Produk dinonaktifkan', active: !!active })
  } catch (err) {
    console.error('Toggle product error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.delete('/products/:id', async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT id FROM products WHERE id = ?', [req.params.id])
    if (existing.length === 0) return res.status(404).json({ message: 'Produk tidak ditemukan' })

    await pool.query('DELETE FROM products WHERE id = ?', [req.params.id])
    res.json({ message: 'Produk berhasil dihapus' })
  } catch (err) {
    console.error('Delete product error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.get('/promos', async (_req, res) => {
  try {
    const [promos] = await pool.query('SELECT * FROM promos ORDER BY created_at DESC')
    res.json({ promos })
  } catch (err) {
    console.error('Admin promos error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.post('/promos', async (req, res) => {
  try {
    const { code, title, description, type, value, minPurchase, maxDiscount, usageLimit, startDate, endDate } = req.body

    if (!code || !title || !type || !value) {
      return res.status(400).json({ message: 'Kode, judul, tipe, dan nilai wajib diisi' })
    }

    const [existing] = await pool.query('SELECT id FROM promos WHERE code = ?', [code])
    if (existing.length > 0) return res.status(400).json({ message: 'Kode promo sudah ada' })

    const [result] = await pool.query(
      'INSERT INTO promos (code, title, description, type, value, min_purchase, max_discount, usage_limit, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [code.toUpperCase(), title, description || null, type, value, minPurchase || 0, maxDiscount || null, usageLimit || null, startDate || null, endDate || null]
    )

    const [rows] = await pool.query('SELECT * FROM promos WHERE id = ?', [result.insertId])
    res.status(201).json({ message: 'Promo berhasil ditambahkan', promo: rows[0] })
  } catch (err) {
    console.error('Create promo error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.put('/promos/:id', async (req, res) => {
  try {
    const { code, title, description, type, value, minPurchase, maxDiscount, usageLimit, startDate, endDate, active } = req.body

    const [existing] = await pool.query('SELECT id FROM promos WHERE id = ?', [req.params.id])
    if (existing.length === 0) return res.status(404).json({ message: 'Promo tidak ditemukan' })

    const [dup] = await pool.query('SELECT id FROM promos WHERE code = ? AND id != ?', [code, req.params.id])
    if (dup.length > 0) return res.status(400).json({ message: 'Kode promo sudah digunakan' })

    await pool.query(
      'UPDATE promos SET code=?, title=?, description=?, type=?, value=?, min_purchase=?, max_discount=?, usage_limit=?, start_date=?, end_date=?, active=? WHERE id=?',
      [code.toUpperCase(), title, description, type, value, minPurchase, maxDiscount, usageLimit, startDate, endDate, active ?? true, req.params.id]
    )

    const [rows] = await pool.query('SELECT * FROM promos WHERE id = ?', [req.params.id])
    res.json({ message: 'Promo berhasil diperbarui', promo: rows[0] })
  } catch (err) {
    console.error('Update promo error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.patch('/promos/:id/toggle', async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT id, active FROM promos WHERE id = ?', [req.params.id])
    if (existing.length === 0) return res.status(404).json({ message: 'Promo tidak ditemukan' })
    const active = existing[0].active ? 0 : 1
    await pool.query('UPDATE promos SET active = ? WHERE id = ?', [active, req.params.id])
    res.json({ message: active ? 'Promo diaktifkan' : 'Promo dinonaktifkan', active: !!active })
  } catch (err) {
    console.error('Toggle promo error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.delete('/promos/:id', async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT id FROM promos WHERE id = ?', [req.params.id])
    if (existing.length === 0) return res.status(404).json({ message: 'Promo tidak ditemukan' })

    await pool.query('DELETE FROM promos WHERE id = ?', [req.params.id])
    res.json({ message: 'Promo berhasil dihapus' })
  } catch (err) {
    console.error('Delete promo error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.get('/payments', async (req, res) => {
  try {
    const { status } = req.query
    let query = `
      SELECT p.*, o.order_number, o.customer_name, o.total, o.status as order_status,
        u.name as user_name, u.email as user_email
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `
    const params = []
    if (status && status !== 'all') {
      query += ' AND p.status = ?'
      params.push(status)
    }
    query += ' ORDER BY p.created_at DESC'

    const [payments] = await pool.query(query, params)
    res.json({ payments })
  } catch (err) {
    console.error('Admin payments error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.put('/payments/:id/verify', async (req, res) => {
  try {
    const { status } = req.body
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status tidak valid' })
    }

    const [payment] = await pool.query('SELECT * FROM payments WHERE id = ?', [req.params.id])
    if (payment.length === 0) return res.status(404).json({ message: 'Pembayaran tidak ditemukan' })

    await pool.query('UPDATE payments SET status = ? WHERE id = ?', [status, req.params.id])

    if (status === 'verified') {
      await pool.query("UPDATE orders SET status = 'paid' WHERE id = ?", [payment[0].order_id])
    }

    res.json({ message: `Pembayaran berhasil ${status === 'verified' ? 'diverifikasi' : 'ditolak'}` })
  } catch (err) {
    console.error('Verify payment error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.get('/users', async (_req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT id, name, email, phone, role, status, created_at, (SELECT COUNT(*) FROM orders WHERE user_id = users.id) as order_count FROM users ORDER BY created_at DESC"
    )
    res.json({ users })
  } catch (err) {
    console.error('Admin users error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Role tidak valid' })
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE id = ?', [req.params.id])
    if (existing.length === 0) return res.status(404).json({ message: 'User tidak ditemukan' })

    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id])
    res.json({ message: 'Role user berhasil diperbarui' })
  } catch (err) {
    console.error('Update user role error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.put('/users/:id/status', async (req, res) => {
  try {
    const { status } = req.body
    if (!['active', 'suspended', 'blocked'].includes(status)) {
      return res.status(400).json({ message: 'Status tidak valid' })
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE id = ?', [req.params.id])
    if (existing.length === 0) return res.status(404).json({ message: 'User tidak ditemukan' })

    await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id])
    const label = { suspended: 'Ditangguhkan', blocked: 'Diblokir', active: 'Diaktifkan' }
    res.json({ message: `Pengguna berhasil ${label[status] || 'diupdate'}` })
  } catch (err) {
    console.error('Update user status error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.delete('/users/:id', async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE id = ?', [req.params.id])
    if (existing.length === 0) return res.status(404).json({ message: 'User tidak ditemukan' })

    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id])
    res.json({ message: 'Pengguna berhasil dihapus' })
  } catch (err) {
    console.error('Delete user error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.get('/announcements', async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM notifications WHERE active = TRUE AND type IN ('info', 'promo', 'alert') ORDER BY created_at DESC")
    res.json({ announcements: rows })
  } catch (err) {
    console.error('Get announcements error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.get('/notifications', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM notifications ORDER BY created_at DESC')
    res.json({ notifications: rows })
  } catch (err) {
    console.error('Get notifications error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.put('/notifications/read', async (_req, res) => {
  try {
    await pool.query("UPDATE notifications SET `read` = TRUE WHERE `read` = FALSE")
    res.json({ message: 'Semua notifikasi ditandai telah dibaca' })
  } catch (err) {
    console.error('Mark notifications read error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.post('/notifications', async (req, res) => {
  try {
    const { title, message, type, link, active } = req.body
    if (!title || !message) return res.status(400).json({ message: 'Judul dan pesan wajib diisi' })

    const [result] = await pool.query(
      'INSERT INTO notifications (title, message, type, link, active) VALUES (?, ?, ?, ?, ?)',
      [title, message, type || 'info', link || null, active ?? true]
    )
    const [rows] = await pool.query('SELECT * FROM notifications WHERE id = ?', [result.insertId])
    res.status(201).json({ message: 'Notifikasi berhasil ditambahkan', notification: rows[0] })
  } catch (err) {
    console.error('Create notification error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.put('/notifications/:id', async (req, res) => {
  try {
    const { title, message, type, link, active } = req.body
    const [existing] = await pool.query('SELECT id FROM notifications WHERE id = ?', [req.params.id])
    if (existing.length === 0) return res.status(404).json({ message: 'Notifikasi tidak ditemukan' })

    await pool.query(
      'UPDATE notifications SET title=?, message=?, type=?, link=?, active=? WHERE id=?',
      [title, message, type, link || null, active ?? true, req.params.id]
    )
    const [rows] = await pool.query('SELECT * FROM notifications WHERE id = ?', [req.params.id])
    res.json({ message: 'Notifikasi berhasil diperbarui', notification: rows[0] })
  } catch (err) {
    console.error('Update notification error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.delete('/notifications/:id', async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT id FROM notifications WHERE id = ?', [req.params.id])
    if (existing.length === 0) return res.status(404).json({ message: 'Notifikasi tidak ditemukan' })
    await pool.query('DELETE FROM notifications WHERE id = ?', [req.params.id])
    res.json({ message: 'Notifikasi berhasil dihapus' })
  } catch (err) {
    console.error('Delete notification error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.get('/settings', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM settings')
    const settings = {}
    rows.forEach(r => { settings[r.setting_key] = r.setting_value })
    res.json({ settings })
  } catch (err) {
    console.error('Get settings error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.get('/reviews', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM reviews ORDER BY created_at DESC')
    res.json({ reviews: rows })
  } catch (err) {
    console.error('Get reviews error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.post('/reviews', async (req, res) => {
  try {
    const { name, rating, content } = req.body
    if (!name || !content) return res.status(400).json({ message: 'Nama dan konten wajib diisi' })
    const [result] = await pool.query(
      'INSERT INTO reviews (name, rating, content) VALUES (?, ?, ?)',
      [name, rating || 5, content]
    )
    const [rows] = await pool.query('SELECT * FROM reviews WHERE id = ?', [result.insertId])
    res.status(201).json({ message: 'Testimonial berhasil ditambahkan', review: rows[0] })
  } catch (err) {
    console.error('Create review error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.put('/reviews/:id', async (req, res) => {
  try {
    const { name, rating, content, active } = req.body
    const [existing] = await pool.query('SELECT id FROM reviews WHERE id = ?', [req.params.id])
    if (existing.length === 0) return res.status(404).json({ message: 'Testimonial tidak ditemukan' })
    await pool.query(
      'UPDATE reviews SET name=?, rating=?, content=?, active=? WHERE id=?',
      [name, rating || 5, content, active ?? true, req.params.id]
    )
    const [rows] = await pool.query('SELECT * FROM reviews WHERE id = ?', [req.params.id])
    res.json({ message: 'Testimonial berhasil diperbarui', review: rows[0] })
  } catch (err) {
    console.error('Update review error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.patch('/reviews/:id/reply', async (req, res) => {
  try {
    const { reply } = req.body
    if (reply === undefined) return res.status(400).json({ message: 'Balasan wajib diisi' })
    const [existing] = await pool.query('SELECT id FROM reviews WHERE id = ?', [req.params.id])
    if (existing.length === 0) return res.status(404).json({ message: 'Testimonial tidak ditemukan' })
    const replyValue = reply.trim() || null
    await pool.query(
      'UPDATE reviews SET reply = ?, replied_at = ? WHERE id = ?',
      [replyValue, replyValue ? new Date() : null, req.params.id]
    )
    const [rows] = await pool.query('SELECT * FROM reviews WHERE id = ?', [req.params.id])
    res.json({ message: replyValue ? 'Balasan berhasil dikirim' : 'Balasan berhasil dihapus', review: rows[0] })
  } catch (err) {
    console.error('Reply review error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.delete('/reviews/:id', async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT id FROM reviews WHERE id = ?', [req.params.id])
    if (existing.length === 0) return res.status(404).json({ message: 'Testimonial tidak ditemukan' })
    await pool.query('DELETE FROM reviews WHERE id = ?', [req.params.id])
    res.json({ message: 'Testimonial berhasil dihapus' })
  } catch (err) {
    console.error('Delete review error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.put('/settings', async (req, res) => {
  try {
    const updates = req.body
    for (const [key, value] of Object.entries(updates)) {
      await pool.query(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, String(value), String(value)]
      )
    }
    res.json({ message: 'Pengaturan berhasil disimpan' })
  } catch (err) {
    console.error('Update settings error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.get('/notifications/recent', async (_req, res) => {
  try {
    const [recentOrders] = await pool.query(
      "SELECT id, order_number, customer_name, total, status, created_at FROM orders WHERE DATE(created_at) = CURDATE() ORDER BY created_at DESC LIMIT 10"
    )
    const [recentPayments] = await pool.query(
      "SELECT p.*, o.order_number, o.customer_name FROM payments p JOIN orders o ON p.order_id = o.id WHERE p.status = 'pending' ORDER BY p.created_at DESC LIMIT 5"
    )
    const [unreadNotifs] = await pool.query(
      "SELECT id, title, message, type, link, created_at FROM notifications WHERE active = TRUE AND `read` = FALSE ORDER BY created_at DESC LIMIT 5"
    )

    const items = []
    recentOrders.forEach(o => {
      items.push({
        id: `order-${o.id}`,
        type: o.status === 'pending' ? 'order_baru' : 'order_update',
        title: o.status === 'pending' ? 'Pesanan Baru' : `Pesanan ${o.status}`,
        description: `#${o.order_number} — ${o.customer_name}`,
        link: `/admin/orders?status=${o.status}&order=${o.id}`,
        time: o.created_at,
        read: false,
      })
    })
    recentPayments.forEach(p => {
      items.push({
        id: `payment-${p.id}`,
        type: 'pembayaran',
        title: 'Pembayaran Menunggu',
        description: `#${p.order_number} — ${p.customer_name}`,
        link: '/admin/payments?status=pending',
        time: p.created_at,
        read: false,
      })
    })
    unreadNotifs.forEach(n => {
      items.push({
        id: `notif-${n.id}`,
        type: 'info',
        title: n.title,
        description: n.message,
        link: n.link || null,
        time: n.created_at,
        read: false,
      })
    })

    items.sort((a, b) => new Date(b.time) - new Date(a.time))
    const notifications = items.slice(0, 15)
    const unreadCount = notifications.filter(n => !n.read).length

    res.json({ notifications, unread_count: unreadCount })
  } catch (err) {
    console.error('Recent notifications error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

export default router
