const router = require('express').Router()
const auth = require('../middleware/auth.middleware')
const ctrl = require('../controllers/analytics.controller')

router.use(auth)

router.get('/dashboard', ctrl.getDashboard)

module.exports = router
