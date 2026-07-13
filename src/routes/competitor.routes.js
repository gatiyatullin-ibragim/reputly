const router = require('express').Router()
const auth = require('../middleware/auth.middleware')
const ctrl = require('../controllers/competitor.controller')

router.use(auth)

router.get('/comparison', ctrl.getComparison)
router.get('/insights', ctrl.getAIInsights)
router.post('/auto-find', ctrl.autoFind)
router.get('/', ctrl.getAll)
router.post('/', ctrl.create)
router.post('/:id/sync', ctrl.sync)
router.delete('/:id', ctrl.remove)

module.exports = router