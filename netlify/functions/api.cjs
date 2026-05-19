const serverless = require('serverless-http')

let handler
let mongoose

async function createHandler() {
  const { default: app } = await import('../../server/index.mjs')
  const connectDB = (await import('../../server/config/db.mjs')).default
  mongoose = (await import('mongoose')).default

  if (mongoose.connection.readyState !== 1) {
    await connectDB()
  }

  handler = serverless(app)
}

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false

  if (!handler) {
    await createHandler()
  }

  return await handler(event, context)
}
