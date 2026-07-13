require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const connectDB = require('./src/config/database')
const { startSyncJob } = require('./src/jobs/sync.job')

const app = express()

// ── Middleware ─────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())
app.use(morgan('dev'))

// ── Routes ─────────────────────────────────────────────
app.use('/api/auth',       require('./src/routes/auth.routes'))
app.use('/api/businesses', require('./src/routes/business.routes'))
app.use('/api/locations',  require('./src/routes/location.routes'))
app.use('/api/reviews',    require('./src/routes/review.routes'))
app.use('/api/analytics',  require('./src/routes/analytics.routes'))
app.use('/api/instagram',  require('./src/routes/instagram.routes'))
app.use('/api/competitors', require('./src/routes/competitor.routes'))

// ── Health check ───────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

// ── Global error handler ───────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Внутренняя ошибка сервера' })
})

// ── Start ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Сервер запущен: http://localhost:${PORT}`)
    startSyncJob()
  })
})
