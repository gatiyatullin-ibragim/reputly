const Review = require('../models/Review')
const Business = require('../models/Business')
const mongoose = require('mongoose')

const getUserBusinessIds = async (userId) => {
  const businesses = await Business.find({ userId })
  return businesses.map(b => b._id)
}

exports.getDashboard = async (req, res) => {
  try {
    const businessIds = await getUserBusinessIds(req.userId)

    // Общая статистика
    const [stats] = await Review.aggregate([
      { $match: { businessId: { $in: businessIds } } },
      {
        $group: {
          _id: null,
          avgRating:       { $avg: '$rating' },
          totalReviews:    { $sum: 1 },
          unansweredCount: { $sum: { $cond: [{ $eq: ['$isReplied', false] }, 1, 0] } },
          positiveCount:   { $sum: { $cond: [{ $eq: ['$sentiment', 'POSITIVE'] }, 1, 0] } },
          negativeCount:   { $sum: { $cond: [{ $eq: ['$sentiment', 'NEGATIVE'] }, 1, 0] } },
        },
      },
    ])

    // Отзывы по неделям (последние 4 недели)
    const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
    const weeklyReviews = await Review.aggregate([
      {
        $match: {
          businessId: { $in: businessIds },
          publishedAt: { $gte: fourWeeksAgo },
        },
      },
      {
        $group: {
          _id: { $week: '$publishedAt' },
          count:    { $sum: 1 },
          avgRating: { $avg: '$rating' },
          positive: { $sum: { $cond: [{ $eq: ['$sentiment', 'POSITIVE'] }, 1, 0] } },
          negative: { $sum: { $cond: [{ $eq: ['$sentiment', 'NEGATIVE'] }, 1, 0] } },
          neutral:  { $sum: { $cond: [{ $eq: ['$sentiment', 'NEUTRAL'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ])

    // По платформам
    const byPlatform = await Review.aggregate([
      { $match: { businessId: { $in: businessIds } } },
      { $group: { _id: '$platform', count: { $sum: 1 }, avgRating: { $avg: '$rating' } } },
      { $sort: { count: -1 } },
    ])

    // Последние 5 отзывов
    const recentReviews = await Review.find({ businessId: { $in: businessIds } })
      .sort({ publishedAt: -1 })
      .limit(5)
      .populate('locationId', 'name')

    res.json({
      stats: stats || {
        avgRating: 0, totalReviews: 0, unansweredCount: 0,
        positiveCount: 0, negativeCount: 0
      },
      weeklyReviews,
      byPlatform,
      recentReviews,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
