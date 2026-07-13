const router = require('express').Router()
const auth = require('../middleware/auth.middleware')
const ctrl = require('../controllers/review.controller')

router.use(auth)

router.get('/',                  ctrl.getAll)
router.get('/:id',               ctrl.getOne)
router.post('/:id/generate',     ctrl.generateReply)
router.patch('/:id/reply',       ctrl.markReplied)

module.exports = router
