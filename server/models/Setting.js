import mongoose from 'mongoose'

const settingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, default: '' },
})

export default mongoose.model('Setting', settingSchema)
