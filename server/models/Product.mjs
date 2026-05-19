import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true },
  discountType: { type: String, enum: ['percentage', 'fixed', null], default: null },
  discountValue: { type: Number, default: null },
  image: { type: String, default: '' },
  category: { type: String, default: '' },
  tags: { type: [String], default: [] },
  weight: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
}, { timestamps: true })

export default mongoose.model('Product', productSchema)
