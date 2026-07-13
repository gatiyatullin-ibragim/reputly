const Location = require('../models/Location')
const Review = require('../models/Review')
const Business = require('../models/Business')
const User = require('../models/User')
const { analyzeReviewSentiment } = require('./ai.service')
const { sendReviewAlert } = require('./telegram.service')

exports.verifyWebhook = (req, res) => {
  try {
    const mode = req.query['hub.mode']
    const token = req.query['hub.verify_token']
    const challenge = req.query['hub.challenge']

    if (mode === 'subscribe' && token === process.env.FB_WEBHOOK_VERIFY_TOKEN) {
      return res.status(200).send(challenge)
    }

    return res.sendStatus(403)
  } catch (err) {
    console.error('[Instagram] Ошибка проверки webhook:', err.message)
    return res.sendStatus(403)
  }
}

exports.receiveWebhook = (req, res) => {
  res.sendStatus(200)

  void Promise.resolve().then(async () => {
    try {
      const entries = Array.isArray(req.body?.entry) ? req.body.entry : []

      for (const entry of entries) {
        const instagramBusinessId = entry.id
        const changes = Array.isArray(entry.changes) ? entry.changes : []

        for (const change of changes) {
          if (change.field !== 'comments') continue
          await processNewComment(instagramBusinessId, change.value || {})
        }
      }
    } catch (err) {
      console.error('[Instagram] Ошибка обработки webhook:', err.message)
    }
  })
}

async function processNewComment(instagramBusinessId, comment) {
  try {
    console.log('[Instagram] Новый комментарий:', comment.id)

    const location = await Location.findOne({ instagramBusinessId })
    if (!location) return

    const exists = await Review.findOne({ externalId: comment.id, platform: 'INSTAGRAM' })
    if (exists) return

    const business = await Business.findById(location.businessId)
    if (!business) return

    const sentiment = comment.text
      ? await analyzeReviewSentiment(comment.text)
      : 'NEUTRAL'

    const rating = sentiment === 'POSITIVE' ? 5 : sentiment === 'NEGATIVE' ? 2 : 3

    const review = await Review.create({
      locationId: location._id,
      businessId: location.businessId,
      platform: 'INSTAGRAM',
      externalId: comment.id,
      authorName: comment.from?.username || 'Подписчик',
      authorAvatar: comment.from?.profile_pic || null,
      rating,
      text: comment.text || '',
      sentiment,
      publishedAt: new Date(),
    })

    const user = await User.findById(business.userId)
    if (user?.telegramChatId) {
      await sendReviewAlert(user.telegramChatId, {
        ...review.toObject(),
        locationName: location.name,
      })
    }

    console.log('[Instagram] Сохранён комментарий:', review._id)
  } catch (err) {
    console.error('[Instagram] Ошибка комментария:', err.message)
  }
}

module.exports.processNewComment = processNewComment