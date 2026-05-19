import { Router } from 'express'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import Product from '../models/Product.js'
import Promo from '../models/Promo.js'
import Notification from '../models/Notification.js'
import Setting from '../models/Setting.js'
import Review from '../models/Review.js'
import { verifyToken, isAdmin } from '../middleware/auth.js'

const router = Router()
router.use(verifyToken, isAdmin)

router.get('/dashboard', async (_req, res) => {
  try {
    const Order = (await import('../models/Order.js')).default

    const totalOrders = await Order.countDocuments()
    const totalRevenueArr = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ])
    const totalRevenue = totalRevenueArr[0]?.total || 0
    const totalProducts = await Product.countDocuments()
    const activeProducts = await Product.countDocuments({ active: true })
    const totalUsers = await User.countDocuments({ role: 'user' })
    const pendingOrders = await Order.countDocuments({ status: 'pending' })
    const pendingPayments = await Order.countDocuments({ 'payment.status': 'pending' })

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayOrders = await Order.countDocuments({ createdAt: { $gte: todayStart } })

    const now = new Date()
    const activePromos = await Promo.countDocuments({ active: true, $or: [{ endDate: null }, { endDate: { $gte: now } }] })

    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5).lean()
    const recentOrdersMapped = recentOrders.map(o => ({
      id: o._id,
      order_number: o.orderNumber,
      customer_name: o.customerName,
      total: o.total,
      status: o.status,
      created_at: o.createdAt,
      item_count: o.items?.length || 0,
    }))

    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const revenueByMonth = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' }, createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, revenue: { $sum: '$total' } } },
      { $sort: { _id: -1 } },
      { $limit: 6 },
    ])
    const revenueByMonthMapped = revenueByMonth.map(r => ({ month: r._id, revenue: r.revenue }))

    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ])
    const statusOrder = ['pending', 'paid', 'processing', 'done', 'cancelled']
    const ordersByStatusMapped = statusOrder.map(s => {
      const found = ordersByStatus.find(o => o._id === s)
      return { status: s, count: found?.count || 0 }
    })

    const lowStock = await Product.find({ active: true, stock: { $gt: 0, $lte: 5 } }).sort({ stock: 1 }).limit(5).lean()
    const lowStockMapped = lowStock.map(p => ({ id: p._id, name: p.name, stock: p.stock, image: p.image }))

    res.json({
      stats: { totalOrders, totalRevenue, totalProducts, activeProducts, totalUsers, pendingOrders, pendingPayments, todayOrders, activePromos },
      recentOrders: recentOrdersMapped,
      revenueByMonth: revenueByMonthMapped,
      ordersByStatus: ordersByStatusMapped,
      lowStock: lowStockMapped,
    })
  } catch (err) {
    console.error('Dashboard error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.get('/orders', async (req, res) => {
  try {
    const { status, search } = req.query
    const filter = {}
    if (status && status !== 'all') {
      filter.status = status
    }
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
      ]
    }

    const Order = (await import('../models/Order.js')).default
    const orders = await Order.find(filter).sort({ createdAt: -1 }).populate('userId', 'name email').lean()

    const mapped = orders.map(o => ({
      id: o._id,
      user_id: o.userId?._id,
      user_name: o.userId?.name,
      user_email: o.userId?.email,
      order_number: o.orderNumber,
      customer_name: o.customerName,
      customer_phone: o.customerPhone,
      delivery_method: o.deliveryMethod,
      delivery_address: o.deliveryAddress,
      payment_method: o.paymentMethod,
      promo_code: o.promoCode,
      discount_amount: o.discountAmount,
      subtotal: o.subtotal,
      shipping_fee: o.shippingFee,
      total: o.total,
      status: o.status,
      notes: o.notes,
      created_at: o.createdAt,
      updated_at: o.updatedAt,
      item_count: o.items?.length || 0,
    }))

    res.json({ orders: mapped })
  } catch (err) {
    console.error('Admin orders error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.get('/orders/:id', async (req, res) => {
  try {
    const Order = (await import('../models/Order.js')).default
    const order = await Order.findById(req.params.id).populate('userId', 'name email phone').lean()
    if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' })

    const detail = {
      id: order._id,
      user_id: order.userId?._id,
      user_name: order.userId?.name,
      user_email: order.userId?.email,
      user_phone: order.userId?.phone,
      order_number: order.orderNumber,
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      delivery_method: order.deliveryMethod,
      delivery_address: order.deliveryAddress,
      payment_method: order.paymentMethod,
      promo_code: order.promoCode,
      discount_amount: order.discountAmount,
      subtotal: order.subtotal,
      shipping_fee: order.shippingFee,
      total: order.total,
      status: order.status,
      notes: order.notes,
      created_at: order.createdAt,
      updated_at: order.updatedAt,
    }

    const items = (order.items || []).map(item => ({
      id: item._id,
      product_id: item.productId,
      product_name: item.productName,
      product_price: item.productPrice,
      quantity: item.quantity,
      subtotal: item.subtotal,
    }))

    const payment = order.payment ? {
      id: order.payment._id,
      method: order.payment.method,
      proof_image: order.payment.proofImage,
      account_name: order.payment.accountName,
      account_number: order.payment.accountNumber,
      amount: order.payment.amount,
      status: order.payment.status,
      created_at: order.payment.createdAt,
    } : null

    res.json({ order: detail, items, payment })
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

    const Order = (await import('../models/Order.js')).default
    const existing = await Order.findById(req.params.id)
    if (!existing) return res.status(404).json({ message: 'Pesanan tidak ditemukan' })

    existing.status = status
    await existing.save()
    res.json({ message: 'Status pesanan berhasil diperbarui' })
  } catch (err) {
    console.error('Update order status error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.get('/products', async (_req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).lean()
    const mapped = products.map(p => ({
      id: p._id,
      name: p.name,
      description: p.description,
      price: p.price,
      discount_type: p.discountType,
      discount_value: p.discountValue,
      image: p.image,
      category: p.category,
      tags: p.tags ? p.tags.join(',') : '',
      weight: p.weight,
      stock: p.stock,
      active: p.active,
      created_at: p.createdAt,
      updated_at: p.updatedAt,
    }))
    res.json({ products: mapped })
  } catch (err) {
    console.error('Admin products error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.post('/products', async (req, res) => {
  try {
    const { name, description, price, image, category, weight, stock, discount_type, discount_value } = req.body
    if (!name || !price) return res.status(400).json({ message: 'Nama dan harga wajib diisi' })

    const product = await Product.create({
      name, description: description || null, price,
      discountType: discount_type || null, discountValue: discount_value || null,
      image: image || null, category: category || null, weight: weight || 0, stock: stock || 0,
    })

    res.status(201).json({
      message: 'Produk berhasil ditambahkan',
      product: { id: product._id, name: product.name, description: product.description, price: product.price, discount_type: product.discountType, discount_value: product.discountValue, image: product.image, category: product.category, tags: '', weight: product.weight, stock: product.stock, active: product.active, created_at: product.createdAt, updated_at: product.updatedAt },
    })
  } catch (err) {
    console.error('Create product error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.put('/products/:id', async (req, res) => {
  try {
    const { name, description, price, image, category, weight, stock, active, discount_type, discount_value } = req.body

    const existing = await Product.findById(req.params.id)
    if (!existing) return res.status(404).json({ message: 'Produk tidak ditemukan' })

    existing.name = name
    existing.description = description
    existing.price = price
    existing.discountType = discount_type || null
    existing.discountValue = discount_value || null
    existing.image = image
    existing.category = category
    existing.weight = weight
    existing.stock = stock
    existing.active = active ?? true
    await existing.save()

    res.json({
      message: 'Produk berhasil diperbarui',
      product: { id: existing._id, name: existing.name, description: existing.description, price: existing.price, discount_type: existing.discountType, discount_value: existing.discountValue, image: existing.image, category: existing.category, tags: existing.tags ? existing.tags.join(',') : '', weight: existing.weight, stock: existing.stock, active: existing.active, created_at: existing.createdAt, updated_at: existing.updatedAt },
    })
  } catch (err) {
    console.error('Update product error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.patch('/products/:id/toggle', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ message: 'Produk tidak ditemukan' })
    product.active = !product.active
    await product.save()
    res.json({ message: product.active ? 'Produk diaktifkan' : 'Produk dinonaktifkan', active: product.active })
  } catch (err) {
    console.error('Toggle product error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ message: 'Produk tidak ditemukan' })
    await Product.deleteOne({ _id: req.params.id })
    res.json({ message: 'Produk berhasil dihapus' })
  } catch (err) {
    console.error('Delete product error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.get('/promos', async (_req, res) => {
  try {
    const promos = await Promo.find().sort({ createdAt: -1 }).lean()
    const mapped = promos.map(p => ({
      id: p._id,
      code: p.code,
      title: p.title,
      description: p.description,
      type: p.type,
      value: p.value,
      min_purchase: p.minPurchase,
      max_discount: p.maxDiscount,
      usage_limit: p.usageLimit,
      used_count: p.usedCount,
      start_date: p.startDate,
      end_date: p.endDate,
      active: p.active,
      created_at: p.createdAt,
    }))
    res.json({ promos: mapped })
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

    const existing = await Promo.findOne({ code })
    if (existing) return res.status(400).json({ message: 'Kode promo sudah ada' })

    const promo = await Promo.create({
      code: code.toUpperCase(), title, description: description || null, type, value,
      minPurchase: minPurchase || 0, maxDiscount: maxDiscount || null,
      usageLimit: usageLimit || null, startDate: startDate || null, endDate: endDate || null,
    })

    res.status(201).json({
      message: 'Promo berhasil ditambahkan',
      promo: { id: promo._id, code: promo.code, title: promo.title, description: promo.description, type: promo.type, value: promo.value, min_purchase: promo.minPurchase, max_discount: promo.maxDiscount, usage_limit: promo.usageLimit, used_count: promo.usedCount, start_date: promo.startDate, end_date: promo.endDate, active: promo.active, created_at: promo.createdAt },
    })
  } catch (err) {
    console.error('Create promo error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.put('/promos/:id', async (req, res) => {
  try {
    const { code, title, description, type, value, minPurchase, maxDiscount, usageLimit, startDate, endDate, active } = req.body

    const promo = await Promo.findById(req.params.id)
    if (!promo) return res.status(404).json({ message: 'Promo tidak ditemukan' })

    const dup = await Promo.findOne({ code, _id: { $ne: req.params.id } })
    if (dup) return res.status(400).json({ message: 'Kode promo sudah digunakan' })

    promo.code = code.toUpperCase()
    promo.title = title
    promo.description = description
    promo.type = type
    promo.value = value
    promo.minPurchase = minPurchase
    promo.maxDiscount = maxDiscount
    promo.usageLimit = usageLimit
    promo.startDate = startDate
    promo.endDate = endDate
    promo.active = active ?? true
    await promo.save()

    res.json({
      message: 'Promo berhasil diperbarui',
      promo: { id: promo._id, code: promo.code, title: promo.title, description: promo.description, type: promo.type, value: promo.value, min_purchase: promo.minPurchase, max_discount: promo.maxDiscount, usage_limit: promo.usageLimit, used_count: promo.usedCount, start_date: promo.startDate, end_date: promo.endDate, active: promo.active, created_at: promo.createdAt },
    })
  } catch (err) {
    console.error('Update promo error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.patch('/promos/:id/toggle', async (req, res) => {
  try {
    const promo = await Promo.findById(req.params.id)
    if (!promo) return res.status(404).json({ message: 'Promo tidak ditemukan' })
    promo.active = !promo.active
    await promo.save()
    res.json({ message: promo.active ? 'Promo diaktifkan' : 'Promo dinonaktifkan', active: promo.active })
  } catch (err) {
    console.error('Toggle promo error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.delete('/promos/:id', async (req, res) => {
  try {
    const promo = await Promo.findById(req.params.id)
    if (!promo) return res.status(404).json({ message: 'Promo tidak ditemukan' })
    await Promo.deleteOne({ _id: req.params.id })
    res.json({ message: 'Promo berhasil dihapus' })
  } catch (err) {
    console.error('Delete promo error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.get('/payments', async (req, res) => {
  try {
    const Order = (await import('../models/Order.js')).default
    const { status } = req.query
    const match = { payment: { $exists: true, $ne: null } }
    if (status && status !== 'all') {
      match['payment.status'] = status
    }

    const orders = await Order.find(match).populate('userId', 'name email').sort({ 'payment.createdAt': -1 }).lean()

    const payments = orders.map(o => ({
      id: o.payment._id,
      order_id: o._id,
      method: o.payment.method,
      proof_image: o.payment.proofImage,
      account_name: o.payment.accountName,
      account_number: o.payment.accountNumber,
      amount: o.payment.amount,
      status: o.payment.status,
      created_at: o.payment.createdAt,
      order_number: o.orderNumber,
      customer_name: o.customerName,
      total: o.total,
      order_status: o.status,
      user_name: o.userId?.name,
      user_email: o.userId?.email,
    }))

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

    const Order = (await import('../models/Order.js')).default
    const order = await Order.findOne({ 'payment._id': req.params.id })
    if (!order) return res.status(404).json({ message: 'Pembayaran tidak ditemukan' })

    order.payment.status = status
    if (status === 'verified') {
      order.status = 'paid'
    }
    await order.save()

    res.json({ message: `Pembayaran berhasil ${status === 'verified' ? 'diverifikasi' : 'ditolak'}` })
  } catch (err) {
    console.error('Verify payment error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.get('/users', async (_req, res) => {
  try {
    const Order = (await import('../models/Order.js')).default
    const users = await User.find().sort({ createdAt: -1 }).lean()

    const mapped = await Promise.all(users.map(async (u) => {
      const orderCount = await Order.countDocuments({ userId: u._id })
      return {
        id: u._id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        status: u.status,
        created_at: u.createdAt,
        order_count: orderCount,
      }
    }))

    res.json({ users: mapped })
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

    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' })
    user.role = role
    await user.save()
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

    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' })
    user.status = status
    await user.save()
    const label = { suspended: 'Ditangguhkan', blocked: 'Diblokir', active: 'Diaktifkan' }
    res.json({ message: `Pengguna berhasil ${label[status] || 'diupdate'}` })
  } catch (err) {
    console.error('Update user status error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' })
    await User.deleteOne({ _id: req.params.id })
    res.json({ message: 'Pengguna berhasil dihapus' })
  } catch (err) {
    console.error('Delete user error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.get('/announcements', async (_req, res) => {
  try {
    const rows = await Notification.find({ active: true, type: { $in: ['info', 'promo', 'alert'] } }).sort({ createdAt: -1 }).lean()
    const mapped = rows.map(n => ({
      id: n._id,
      title: n.title,
      message: n.message,
      type: n.type,
      link: n.link,
      active: n.active,
      created_at: n.createdAt,
    }))
    res.json({ announcements: mapped })
  } catch (err) {
    console.error('Get announcements error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.get('/notifications', async (_req, res) => {
  try {
    const rows = await Notification.find().sort({ createdAt: -1 }).lean()
    const mapped = rows.map(n => ({
      id: n._id,
      title: n.title,
      message: n.message,
      type: n.type,
      link: n.link,
      active: n.active,
      read: n.read,
      created_at: n.createdAt,
      updated_at: n.updatedAt,
    }))
    res.json({ notifications: mapped })
  } catch (err) {
    console.error('Get notifications error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.put('/notifications/read', async (_req, res) => {
  try {
    await Notification.updateMany({ read: false }, { read: true })
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

    const notification = await Notification.create({ title, message, type: type || 'info', link: link || null, active: active ?? true })

    res.status(201).json({
      message: 'Notifikasi berhasil ditambahkan',
      notification: { id: notification._id, title: notification.title, message: notification.message, type: notification.type, link: notification.link, active: notification.active, read: notification.read, created_at: notification.createdAt, updated_at: notification.updatedAt },
    })
  } catch (err) {
    console.error('Create notification error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.put('/notifications/:id', async (req, res) => {
  try {
    const { title, message, type, link, active } = req.body

    const notification = await Notification.findById(req.params.id)
    if (!notification) return res.status(404).json({ message: 'Notifikasi tidak ditemukan' })

    notification.title = title
    notification.message = message
    notification.type = type
    notification.link = link || null
    notification.active = active ?? true
    await notification.save()

    res.json({
      message: 'Notifikasi berhasil diperbarui',
      notification: { id: notification._id, title: notification.title, message: notification.message, type: notification.type, link: notification.link, active: notification.active, read: notification.read, created_at: notification.createdAt, updated_at: notification.updatedAt },
    })
  } catch (err) {
    console.error('Update notification error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.delete('/notifications/:id', async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
    if (!notification) return res.status(404).json({ message: 'Notifikasi tidak ditemukan' })
    await Notification.deleteOne({ _id: req.params.id })
    res.json({ message: 'Notifikasi berhasil dihapus' })
  } catch (err) {
    console.error('Delete notification error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.get('/settings', async (_req, res) => {
  try {
    const rows = await Setting.find().lean()
    const settings = {}
    rows.forEach(r => { settings[r.key] = r.value })
    res.json({ settings })
  } catch (err) {
    console.error('Get settings error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.put('/settings', async (req, res) => {
  try {
    const updates = req.body
    for (const [key, value] of Object.entries(updates)) {
      await Setting.updateOne({ key }, { key, value: String(value) }, { upsert: true })
    }
    res.json({ message: 'Pengaturan berhasil disimpan' })
  } catch (err) {
    console.error('Update settings error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.get('/notifications/recent', async (_req, res) => {
  try {
    const Order = (await import('../models/Order.js')).default

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const recentOrders = await Order.find({ createdAt: { $gte: todayStart } }).sort({ createdAt: -1 }).limit(10).lean()
    const recentPayments = await Order.find({ 'payment.status': 'pending' }).sort({ 'payment.createdAt': -1 }).limit(5).populate('userId', 'name').lean()
    const unreadNotifs = await Notification.find({ active: true, read: false }).sort({ createdAt: -1 }).limit(5).lean()

    const items = []
    recentOrders.forEach(o => {
      items.push({
        id: `order-${o._id}`,
        type: o.status === 'pending' ? 'order_baru' : 'order_update',
        title: o.status === 'pending' ? 'Pesanan Baru' : `Pesanan ${o.status}`,
        description: `#${o.orderNumber} — ${o.customerName}`,
        link: `/admin/orders?status=${o.status}&order=${o._id}`,
        time: o.createdAt,
        read: false,
      })
    })
    recentPayments.forEach(o => {
      items.push({
        id: `payment-${o.payment._id}`,
        type: 'pembayaran',
        title: 'Pembayaran Menunggu',
        description: `#${o.orderNumber} — ${o.customerName}`,
        link: '/admin/payments?status=pending',
        time: o.payment.createdAt,
        read: false,
      })
    })
    unreadNotifs.forEach(n => {
      items.push({
        id: `notif-${n._id}`,
        type: 'info',
        title: n.title,
        description: n.message,
        link: n.link || null,
        time: n.createdAt,
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

router.get('/reviews', async (_req, res) => {
  try {
    const rows = await Review.find().sort({ createdAt: -1 }).lean()
    const mapped = rows.map(r => ({
      id: r._id,
      user_id: r.userId,
      order_id: r.orderId,
      name: r.name,
      rating: r.rating,
      content: r.content,
      avatar: r.avatar,
      active: r.active,
      reply: r.reply,
      replied_at: r.repliedAt,
      created_at: r.createdAt,
    }))
    res.json({ reviews: mapped })
  } catch (err) {
    console.error('Get reviews error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.post('/reviews', async (req, res) => {
  try {
    const { name, rating, content } = req.body
    if (!name || !content) return res.status(400).json({ message: 'Nama dan konten wajib diisi' })

    const review = await Review.create({ name, rating: rating || 5, content })

    res.status(201).json({
      message: 'Testimonial berhasil ditambahkan',
      review: { id: review._id, user_id: review.userId, order_id: review.orderId, name: review.name, rating: review.rating, content: review.content, avatar: review.avatar, active: review.active, reply: review.reply, replied_at: review.repliedAt, created_at: review.createdAt },
    })
  } catch (err) {
    console.error('Create review error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.put('/reviews/:id', async (req, res) => {
  try {
    const { name, rating, content, active } = req.body

    const review = await Review.findById(req.params.id)
    if (!review) return res.status(404).json({ message: 'Testimonial tidak ditemukan' })

    review.name = name
    review.rating = rating || 5
    review.content = content
    review.active = active ?? true
    await review.save()

    res.json({
      message: 'Testimonial berhasil diperbarui',
      review: { id: review._id, user_id: review.userId, order_id: review.orderId, name: review.name, rating: review.rating, content: review.content, avatar: review.avatar, active: review.active, reply: review.reply, replied_at: review.repliedAt, created_at: review.createdAt },
    })
  } catch (err) {
    console.error('Update review error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.patch('/reviews/:id/reply', async (req, res) => {
  try {
    const { reply } = req.body
    if (reply === undefined) return res.status(400).json({ message: 'Balasan wajib diisi' })

    const review = await Review.findById(req.params.id)
    if (!review) return res.status(404).json({ message: 'Testimonial tidak ditemukan' })

    const replyValue = reply.trim() || null
    review.reply = replyValue
    review.repliedAt = replyValue ? new Date() : null
    await review.save()

    res.json({
      message: replyValue ? 'Balasan berhasil dikirim' : 'Balasan berhasil dihapus',
      review: { id: review._id, user_id: review.userId, order_id: review.orderId, name: review.name, rating: review.rating, content: review.content, avatar: review.avatar, active: review.active, reply: review.reply, replied_at: review.repliedAt, created_at: review.createdAt },
    })
  } catch (err) {
    console.error('Reply review error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.delete('/reviews/:id', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
    if (!review) return res.status(404).json({ message: 'Testimonial tidak ditemukan' })
    await Review.deleteOne({ _id: req.params.id })
    res.json({ message: 'Testimonial berhasil dihapus' })
  } catch (err) {
    console.error('Delete review error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

export default router
