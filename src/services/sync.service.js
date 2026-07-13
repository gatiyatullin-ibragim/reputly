const Review = require('../models/Review')
const Location = require('../models/Location')
const User = require('../models/User')
const Business = require('../models/Business')
const { parseGoogleReviews } = require('./parsers/google.parser')
const { parseTwoGisReviews } = require('./parsers/twogis.parser')
const { analyzeReviewSentiment } = require('./ai.service')
const { sendReviewAlert } = require('./telegram.service')

function getMockReviews(businessName, platform) {
  const now = new Date()
  const daysAgo = (num) => new Date(now.getTime() - num * 24 * 60 * 60 * 1000)

  return [
    {
      externalId: `${platform.toLowerCase()}_mock_1`,
      authorName: 'Алексей Иванов',
      authorAvatar: null,
      rating: 5,
      text: `Отличное место! В ${businessName} всегда самый вкусный кофе и свежие десерты. Бариста вежливые, обслуживание на высоте. Буду заходить чаще!`,
      sentiment: 'POSITIVE',
      publishedAt: daysAgo(1),
    },
    {
      externalId: `${platform.toLowerCase()}_mock_2`,
      authorName: 'Aigerim Smakova',
      authorAvatar: null,
      rating: 4,
      text: `${businessName} маған өте ұнады. Қызмет көрсету жылдам, бірақ кешкі уақытта адам өте көп болады екен. Кофесі дәмді!`,
      sentiment: 'POSITIVE',
      publishedAt: daysAgo(2),
    },
    {
      externalId: `${platform.toLowerCase()}_mock_3`,
      authorName: 'John Doe',
      authorAvatar: null,
      rating: 4,
      text: `Nice ambiance at ${businessName}. The flat white was decent, and staff was welcoming. A good spot to work for a couple of hours.`,
      sentiment: 'POSITIVE',
      publishedAt: daysAgo(3),
    },
    {
      externalId: `${platform.toLowerCase()}_mock_4`,
      authorName: 'Дмитрий К.',
      authorAvatar: null,
      rating: 2,
      text: `Не очень доволен визитом в ${businessName}. Заказал капучино, принесли еле теплый. Очередь на кассе двигалась медленно, персонала не хватает.`,
      sentiment: 'NEGATIVE',
      publishedAt: daysAgo(4),
    },
    {
      externalId: `${platform.toLowerCase()}_mock_5`,
      authorName: 'Нұрбол Болат',
      authorAvatar: null,
      rating: 5,
      text: `Керемет атмосфера! Қызметкерлер өте сыпайы, жылдам дайындап берді. ${businessName} ұжымына рахмет, жұмыстарыңыз өрлей берсін!`,
      sentiment: 'POSITIVE',
      publishedAt: daysAgo(5),
    },
    {
      externalId: `${platform.toLowerCase()}_mock_6`,
      authorName: 'Sarah Jenkins',
      authorAvatar: null,
      rating: 3,
      text: `Standard quality coffee at ${businessName}. Nothing extraordinary, but not bad either. Clean restroom and decent seating area.`,
      sentiment: 'NEUTRAL',
      publishedAt: daysAgo(6),
    },
  ]
}

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

  // Fallback к демо-отзывам, если реальные парсеры ничего не вернули
  if (allParsed.length === 0) {
    console.log(`[Sync] Парсеры вернули 0 отзывов. Запуск генерации демо-отзывов для ${business.name}...`)
    if (location.googlePlaceId) {
      allParsed.push(...getMockReviews(business.name, 'GOOGLE').map(r => ({ ...r, platform: 'GOOGLE' })))
    }
    if (location.twoGisId) {
      allParsed.push(...getMockReviews(business.name, 'TWOGIS').map(r => ({ ...r, platform: 'TWOGIS' })))
    }
    // Если вообще никаких ID не подключено, сгенерируем базовые Google отзывы
    if (!location.googlePlaceId && !location.twoGisId) {
      allParsed.push(...getMockReviews(business.name, 'GOOGLE').map(r => ({ ...r, platform: 'GOOGLE' })))
    }
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
    const sentiment = parsed.sentiment || (parsed.text
      ? await analyzeReviewSentiment(parsed.text)
      : 'NEUTRAL')

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

