const Location = require('../models/Location')
const Business = require('../models/Business')
const { syncLocation } = require('../services/sync.service')

exports.getAll = async (req, res) => {
  try {
    const businesses = await Business.find({ userId: req.userId })
    const businessIds = businesses.map(b => b._id)

    const [locations, reviewStats] = await Promise.all([
      Location.find({ businessId: { $in: businessIds } }).populate('businessId', 'name'),
      require('../models/Review').aggregate([
        { $match: { businessId: { $in: businessIds } } },
        {
          $group: {
            _id: '$locationId',
            avgRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
            unansweredCount: { $sum: { $cond: [{ $eq: ['$isReplied', false] }, 1, 0] } },
            positiveCount: { $sum: { $cond: [{ $eq: ['$sentiment', 'POSITIVE'] }, 1, 0] } },
            negativeCount: { $sum: { $cond: [{ $eq: ['$sentiment', 'NEGATIVE'] }, 1, 0] } },
            lastReviewAt: { $max: '$publishedAt' },
          },
        },
      ]),
    ])

    const reviewStatsMap = new Map(reviewStats.map((item) => [String(item._id), item]))
    const enrichedLocations = locations.map((location) => {
      const stats = reviewStatsMap.get(String(location._id)) || null
      const totalReviews = stats?.totalReviews || 0

      return {
        ...location.toObject(),
        stats: stats ? {
          avgRating: totalReviews ? Number((stats.avgRating || 0).toFixed(2)) : 0,
          totalReviews,
          unansweredCount: stats.unansweredCount || 0,
          positivePercent: totalReviews ? Math.round((stats.positiveCount / totalReviews) * 100) : 0,
          negativePercent: totalReviews ? Math.round((stats.negativeCount / totalReviews) * 100) : 0,
          lastReviewAt: stats.lastReviewAt,
        } : {
          avgRating: 0,
          totalReviews: 0,
          unansweredCount: 0,
          positivePercent: 0,
          negativePercent: 0,
          lastReviewAt: null,
        },
      }
    })

    res.json({ locations: enrichedLocations })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.create = async (req, res) => {
  try {
    const { businessId, name, googlePlaceId, yandexOrgId, twoGisId, avitoUrl } = req.body

    // Проверяем что бизнес принадлежит пользователю
    const business = await Business.findOne({ _id: businessId, userId: req.userId })
    if (!business) return res.status(403).json({ message: 'Нет доступа' })

    const location = await Location.create({
      businessId, name, googlePlaceId, yandexOrgId, twoGisId, avitoUrl
    })

    // Запускаем первую синхронизацию в фоне
    syncLocation(location._id).catch(err =>
      console.error('[sync] Ошибка первой синхронизации:', err.message)
    )

    res.status(201).json({ location })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.sync = async (req, res) => {
  try {
    await syncLocation(req.params.id)
    res.json({ message: 'Синхронизация запущена' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.remove = async (req, res) => {
  try {
    await Location.findByIdAndDelete(req.params.id)
    res.json({ message: 'Удалено' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
