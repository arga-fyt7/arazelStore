import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  productName: { type: String, required: true },
  productPrice: { type: Number, required: true },
  quantity: { type: Number, required: true },
  subtotal: { type: Number, required: true },
}, { _id: false })

const paymentSchema = new mongoose.Schema({
  method: { type: String, required: true },
  proofImage: { type: String, default: null },
  accountName: { type: String, default: null },
  accountNumber: { type: String, default: null },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
}, { _id: false, timestamps: true })

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderNumber: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  deliveryMethod: { type: String, enum: ['antar', 'jemput'], required: true },
  deliveryAddress: { type: String, default: null },
  paymentMethod: { type: String, enum: ['transfer', 'e-wallet', 'cod'], required: true },
  promoCode: { type: String, default: null },
  discountAmount: { type: Number, default: 0 },
  subtotal: { type: Number, required: true },
  shippingFee: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'paid', 'processing', 'done', 'cancelled'], default: 'pending' },
  notes: { type: String, default: null },
  items: { type: [orderItemSchema], default: [] },
  payment: { type: paymentSchema, default: null },
}, { timestamps: true })

export default mongoose.model('Order', orderSchema)
