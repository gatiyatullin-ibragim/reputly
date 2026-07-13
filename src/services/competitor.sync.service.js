const Competitor = require('../models/Competitor')
const CompetitorReview = require('../models/CompetitorReview')
const { parseGoogleReviews } = require('./parsers/google.parser')
const { parseTwoGisReviews } = require('./parsers/twogis.parser')
const { analyzeReviewSentiment } = require('./ai.service')

async function syncCompetitor(competitorId) {
  try {
    const competitor = await Competitor.findById(competitorId)
    if (!competitor) return 0

    const parsedReviews = []

    if (competitor.googlePlaceId) {
      console.log(`[Competitor] Google → ${competitor.name}`)
      const reviews = await parseGoogleReviews(competitor.googlePlaceId)
      parsedReviews.push(...reviews.map((review) => ({ ...review, platform: 'GOOGLE' })))
    }

    if (competitor.twoGisId) {
      console.log(`[Competitor] 2GIS → ${competitor.name}`)
      const reviews = await parseTwoGisReviews(competitor.twoGisId)
      parsedReviews.push(...reviews.map((review) => ({ ...review, platform: 'TWOGIS' })))
    }

    let newCount = 0

    for (const parsed of parsedReviews) {
      const exists = await CompetitorReview.findOne({
        externalId: parsed.externalId,
        platform: parsed.platform,
      })

      if (exists) continue

      const sentiment = parsed.text
        ? await analyzeReviewSentiment(parsed.text)
        : 'NEUTRAL'

      await CompetitorReview.create({
        competitorId: competitor._id,
        platform: parsed.platform,
        externalId: parsed.externalId,
        authorName: parsed.authorName || 'Аноним',
        rating: parsed.rating || 3,
        text: parsed.text || '',
        sentiment,
        hasReply: Boolean(parsed.hasReply),
        publishedAt: parsed.publishedAt || new Date(),
      })

      newCount++
    }

    const [summary] = await CompetitorReview.aggregate([
      { $match: { competitorId: competitor._id } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          positiveCount: {
            $sum: { $cond: [{ $eq: ['$sentiment', 'POSITIVE'] }, 1, 0] },
          },
          negativeCount: {
            $sum: { $cond: [{ $eq: ['$sentiment', 'NEGATIVE'] }, 1, 0] },
          },
          repliedCount: {
            $sum: { $cond: ['$hasReply', 1, 0] },
          },
        },
      },
    ])

    const totalReviews = summary?.totalReviews || 0
    const updatedStats = {
      avgRating: totalReviews ? Number((summary.avgRating || 0).toFixed(2)) : 0,
      totalReviews,
      positivePercent: totalReviews ? Math.round((summary.positiveCount / totalReviews) * 100) : 0,
      negativePercent: totalReviews ? Math.round((summary.negativeCount / totalReviews) * 100) : 0,
      responseRate: totalReviews ? Math.round(((summary.repliedCount || 0) / totalReviews) * 100) : 0,
      avgResponseTimeHours: 0,
    }

    await Competitor.findByIdAndUpdate(competitor._id, {
      stats: updatedStats,
      lastSyncAt: new Date(),
    })

    console.log(`[Competitor] ${competitor.name}: +${newCount} новых отзывов`)
    return newCount
  } catch (err) {
    console.error('[Competitor] Ошибка синхронизации:', err.message)
    return 0
  }
}

async function syncAllCompetitors() {
  const competitors = await Competitor.find({})
  console.log(`[Competitor] Запуск синхронизации ${competitors.length} конкурентов...`)

  for (const competitor of competitors) {
    try {
      await syncCompetitor(competitor._id)
    } catch (err) {
      console.error(`[Competitor] Ошибка конкурента ${competitor._id}:`, err.message)
    }
  }

  console.log('[Competitor] Синхронизация завершена')
}

module.exports = { syncCompetitor, syncAllCompetitors }