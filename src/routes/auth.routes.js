const router = require('express').Router()
const rateLimit = require('express-rate-limit')
const ctrl = require('../controllers/auth.controller')
const auth = require('../middleware/auth.middleware')

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Слишком много попыток, подождите 15 минут' },
})

router.post('/register', loginLimiter, ctrl.register)
router.post('/login',    loginLimiter, ctrl.login)
router.post('/refresh',  ctrl.refresh)
router.post('/logout',   ctrl.logout)
router.get('/me',        auth, ctrl.me)

module.exports = router
