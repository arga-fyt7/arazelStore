import mongoose from 'mongoose'

const addressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  label: { type: String, required: true },
  recipientName: { type: String, required: true },
  recipientPhone: { type: String, required: true },
  streetAddress: { type: String, required: true },
  notes: { type: String, default: null },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true })

export default mongoose.model('Address', addressSchema)
