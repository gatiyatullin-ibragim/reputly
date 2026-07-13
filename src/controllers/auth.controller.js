const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')

const makeTokens = (userId) => ({
  accessToken: jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' }),
  refreshToken: jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' }),
})

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 30 * 24 * 60 * 60 * 1000,
}

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body

    const exists = await User.findOne({ email })
    if (exists) return res.status(400).json({ message: 'Email уже занят' })

    const hashed = await bcrypt.hash(password, 12)
    const user = await User.create({ name, email, password: hashed })

    const tokens = makeTokens(user._id)
    res.cookie('refreshToken', tokens.refreshToken, cookieOptions)

    res.status(201).json({
      accessToken: tokens.accessToken,
      user: { id: user._id, name: user.name, email: user.email, plan: user.plan },
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) return res.status(401).json({ message: 'Неверный email или пароль' })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ message: 'Неверный email или пароль' })

    const tokens = makeTokens(user._id)
    res.cookie('refreshToken', tokens.refreshToken, cookieOptions)

    res.json({
      accessToken: tokens.accessToken,
      user: { id: user._id, name: user.name, email: user.email, plan: user.plan },
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.refresh = async (req, res) => {
  try {
    const token = req.cookies.refreshToken
    if (!token) return res.status(401).json({ message: 'Нет refresh токена' })

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET)
    const tokens = makeTokens(decoded.userId)
    res.cookie('refreshToken', tokens.refreshToken, cookieOptions)

    res.json({ accessToken: tokens.accessToken })
  } catch {
    res.status(401).json({ message: 'Токен недействителен' })
  }
}

exports.logout = (req, res) => {
  res.clearCookie('refreshToken')
  res.json({ message: 'Выход выполнен' })
}

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password')
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' })
    res.json({ user })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
