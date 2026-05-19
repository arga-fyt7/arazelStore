import { Router } from 'express'
import Order from '../models/Order.mjs'
import Promo from '../models/Promo.mjs'
import Setting from '../models/Setting.mjs'
import Review from '../models/Review.mjs'
import { verifyToken } from '../middleware/auth.mjs'

const router = Router()

function toOrderResponse(order) {
  return {
    id: order._id,
    user_id: order.userId,
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
}

function toItemResponse(item) {
  return {
    id: item._id,
    product_id: item.productId,
    product_name: item.productName,
    product_price: item.productPrice,
    quantity: item.quantity,
    subtotal: item.subtotal,
  }
}

function toPaymentResponse(payment) {
  if (!payment) return null
  return {
    id: payment._id,
    method: payment.method,
    proof_image: payment.proofImage,
    account_name: payment.accountName,
    account_number: payment.accountNumber,
    amount: payment.amount,
    status: payment.status,
    created_at: payment.createdAt,
  }
}

function toReviewResponse(review) {
  if (!review) return null
  return {
    id: review._id,
    rating: review.rating,
    content: review.content,
    reply: review.reply,
    replied_at: review.repliedAt,
    created_at: review.createdAt,
  }
}

async function generateOrderNumber() {
  const lastOrder = await Order.findOne({ orderNumber: /^ARZ-/ }).sort({ createdAt: -1 })
  let num = 1
  if (lastOrder) {
    const last = parseInt(lastOrder.orderNumber.replace('ARZ-', ''), 10)
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

    const shipSettings = await Setting.find({ key: { $in: ['shipping_fee', 'free_shipping_minimum'] } })
    const shipCfg = { shipping_fee: 10000, free_shipping_minimum: 50000 }
    shipSettings.forEach(r => {
      if (r.key === 'shipping_fee') shipCfg.shipping_fee = Number(r.value) || 0
      else if (r.key === 'free_shipping_minimum') shipCfg.free_shipping_minimum = Number(r.value) || 0
    })

    let shippingFee = deliveryMethod === 'antar' ? shipCfg.shipping_fee : 0
    if (deliveryMethod === 'antar' && shipCfg.free_shipping_minimum > 0 && subtotal >= shipCfg.free_shipping_minimum) {
      shippingFee = 0
    }
    let discountAmount = 0

    if (promoCode) {
      const now = new Date()
      const promo = await Promo.findOne({
        code: promoCode,
        active: true,
        $or: [{ endDate: null }, { endDate: { $gte: now } }],
        $expr: { $or: [{ $eq: ['$usageLimit', null] }, { $lt: ['$usedCount', '$usageLimit'] }] },
      })
      if (!promo) {
        return res.status(400).json({ message: 'Kode promo tidak valid atau sudah habis' })
      }
      if (subtotal < promo.minPurchase) {
        return res.status(400).json({ message: `Minimal pembelian Rp${promo.minPurchase.toLocaleString()} untuk promo ini` })
      }
      if (promo.type === 'percentage') {
        discountAmount = (subtotal * promo.value) / 100
        if (promo.maxDiscount) discountAmount = Math.min(discountAmount, promo.maxDiscount)
      } else if (promo.type === 'fixed') {
        discountAmount = promo.value
      } else if (promo.type === 'free_shipping') {
        shippingFee = 0
      }
      await Promo.updateOne({ _id: promo._id }, { $inc: { usedCount: 1 } })
    }

    const total = Math.max(0, subtotal - discountAmount + shippingFee)
    const orderNumber = await generateOrderNumber()

    const orderItems = items.map(item => ({
      productId: item.productId || null,
      productName: item.productName,
      productPrice: item.productPrice,
      quantity: item.quantity,
      subtotal: item.productPrice * item.quantity,
    }))

    const order = await Order.create({
      userId: req.user.id,
      orderNumber,
      customerName,
      customerPhone,
      deliveryMethod,
      deliveryAddress: deliveryAddress || null,
      paymentMethod,
      promoCode: promoCode || null,
      discountAmount,
      subtotal,
      shippingFee,
      total,
      notes: notes || null,
      items: orderItems,
    })

    res.status(201).json({
      message: 'Pesanan berhasil dibuat',
      order: toOrderResponse(order),
    })
  } catch (err) {
    console.error('Create order error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.get('/', verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 })
    res.json({ orders: orders.map(toOrderResponse) })
  } catch (err) {
    console.error('Get orders error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user.id })
    if (!order) {
      return res.status(404).json({ message: 'Pesanan tidak ditemukan' })
    }
    const review = await Review.findOne({ orderId: order._id }).select('id rating content reply repliedAt createdAt')
    res.json({
      order: toOrderResponse(order),
      items: order.items.map(toItemResponse),
      payment: toPaymentResponse(order.payment),
      review: toReviewResponse(review),
    })
  } catch (err) {
    console.error('Get order error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

export default router
