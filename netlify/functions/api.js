import serverless from 'serverless-http'
import mongoose from 'mongoose'
import app from '../../server/index.js'
import connectDB from '../../server/config/db.js'

let connected = false
const baseHandler = serverless(app)

async function ensureDB() {
  if (!connected && mongoose.connection.readyState !== 1) {
    await connectDB()
    connected = true
  }
}

export const handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false
  await ensureDB()
  return await baseHandler(event, context)
}
