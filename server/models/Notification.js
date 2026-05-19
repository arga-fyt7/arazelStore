import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'promo', 'alert'], default: 'info' },
  link: { type: String, default: null },
  active: { type: Boolean, default: true },
  read: { type: Boolean, default: false },
}, { timestamps: true })

export default mongoose.model('Notification', notificationSchema)
