const Review = require('../models/Review')
const Location = require('../models/Location')
const User = require('../models/User')
const Business = require('../models/Business')
const { parseGoogleReviews } = require('./parsers/google.parser')
const { parseTwoGisReviews } = require('./parsers/twogis.parser')
const { analyzeReviewSentiment } = require('./ai.service')
const { sendReviewAlert } = require('./telegram.service')

async function syncLocation(locationId) {
  const location = await Location.findById(locationId)
  if (!location) return

  const business = await Business.findById(location.businessId)
  if (!business) return

  const user = await User.findById(business.userId)

  const allParsed = []

  if (location.googlePlaceId) {
    console.log(`[Sync] Google → ${location.name}`)
    const reviews = await parseGoogleReviews(location.googlePlaceId)
    allParsed.push(...reviews.map(r => ({ ...r, platform: 'GOOGLE' })))
  }

  if (location.twoGisId) {
    console.log(`[Sync] 2GIS → ${location.name}`)
    const reviews = await parseTwoGisReviews(location.twoGisId)
    allParsed.push(...reviews.map(r => ({ ...r, platform: 'TWOGIS' })))
  }

  let newCount = 0

  for (const parsed of allParsed) {
    // Пропускаем если уже есть
    const exists = await Review.findOne({
      externalId: parsed.externalId,
      platform: parsed.platform,
    })
    if (exists) continue

    // Анализируем тональность
    const sentiment = parsed.text
      ? await analyzeReviewSentiment(parsed.text)
      : 'NEUTRAL'

    // Сохраняем
    const review = await Review.create({
      locationId:   location._id,
      businessId:   business._id,
      platform:     parsed.platform,
      externalId:   parsed.externalId,
      authorName:   parsed.authorName,
      authorAvatar: parsed.authorAvatar,
      rating:       parsed.rating,
      text:         parsed.text,
      sentiment,
      publishedAt:  parsed.publishedAt || new Date(),
    })

    newCount++

    // Уведомление в Telegram
    if (user?.telegramChatId) {
      await sendReviewAlert(user.telegramChatId, {
        ...review.toObject(),
        locationName: location.name,
      })
    }
  }

  // Обновляем время последней синхронизации
  await Location.findByIdAndUpdate(locationId, { lastSyncAt: new Date() })

  console.log(`[Sync] ${location.name}: +${newCount} новых отзывов`)
  return newCount
}

async function syncAll() {
  const locations = await Location.find({})
  console.log(`[Sync] Запуск синхронизации ${locations.length} точек...`)

  for (const loc of locations) {
    try {
      await syncLocation(loc._id)
    } catch (err) {
      console.error(`[Sync] Ошибка точки ${loc._id}:`, err.message)
    }
  }

  console.log('[Sync] Синхронизация завершена')
}

module.exports = { syncLocation, syncAll }
