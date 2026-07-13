const router = require('express').Router()
const auth = require('../middleware/auth.middleware')
const ctrl = require('../controllers/location.controller')

router.use(auth)

router.get('/',            ctrl.getAll)
router.post('/',           ctrl.create)
router.post('/:id/sync',   ctrl.sync)
router.delete('/:id',      ctrl.remove)

module.exports = router
