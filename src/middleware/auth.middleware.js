const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.split(' ')[1]

  if (!token)
    return res.status(401).json({ message: 'Требуется авторизация' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.userId
    next()
  } catch {
    return res.status(401).json({ message: 'Токен недействителен или истёк' })
  }
}
