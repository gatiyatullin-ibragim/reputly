const router = require('express').Router()
const auth = require('../middleware/auth.middleware')
const controller = require('../controllers/instagram.controller')
const webhook = require('../services/instagram.webhook')

router.post('/connect', auth, controller.handleOAuthCallback)
router.get('/webhook', webhook.verifyWebhook)
router.post('/webhook', webhook.receiveWebhook)

module.exports = router