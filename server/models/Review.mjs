import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  name: { type: String, required: true },
  rating: { type: Number, default: 5, min: 1, max: 5 },
  content: { type: String, required: true },
  avatar: { type: String, default: null },
  active: { type: Boolean, default: true },
  reply: { type: String, default: null },
  repliedAt: { type: Date, default: null },
}, { timestamps: true })

export default mongoose.model('Review', reviewSchema)
