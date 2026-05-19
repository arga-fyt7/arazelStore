import mongoose from 'mongoose'

let cached = null

async function connectDB() {
  if (cached && mongoose.connection.readyState === 1) return cached
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/arazel_store'
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      tls: true,
      tlsInsecure: true,
    })
    console.log('MongoDB terhubung:', uri.replace(/\/\/.*@/, '//<credentials>@'))
    cached = conn
    return conn
  } catch (err) {
    console.error('MongoDB connection error:', err.message)
    throw err
  }
}

export default connectDB
