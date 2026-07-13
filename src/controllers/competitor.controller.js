const mongoose = require('mongoose')
const Business = require('../models/Business')
const Review = require('../models/Review')
const Location = require('../models/Location')
const Competitor = require('../models/Competitor')
const CompetitorReview = require('../models/CompetitorReview')
const { syncCompetitor } = require('../services/competitor.sync.service')
const { findCompetitorsByAI } = require('../services/competitor.ai.service')
const { resolveCompetitorIds } = require('../services/competitor.lookup.service')

async function getUserBusinessIds(userId) {
  const businesses = await Business.find({ userId })
  return businesses.map((business) => business._id)
}

async function calculateBusinessStats(businessId) {
  const [stats] = await Review.aggregate([
    { $match: { businessId: new mongoose.Types.ObjectId(businessId) } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        positiveCount: { $sum: { $cond: [{ $eq: ['$sentiment', 'POSITIVE'] }, 1, 0] } },
        negativeCount: { $sum: { $cond: [{ $eq: ['$sentiment', 'NEGATIVE'] }, 1, 0] } },
      },
    },
  ])

  const totalReviews = stats?.totalReviews || 0

  return {
    avgRating: totalReviews ? Number((stats.avgRating || 0).toFixed(2)) : 0,
    totalReviews,
    positivePercent: totalReviews ? Math.round((stats.positiveCount / totalReviews) * 100) : 0,
    negativePercent: totalReviews ? Math.round((stats.negativeCount / totalReviews) * 100) : 0,
  }
}

function rankBusinesses(items) {
  const sorted = [...items].sort((left, right) => {
    if (right.avgRating !== left.avgRating) return right.avgRating - left.avgRating
    return right.totalReviews - left.totalReviews
  })

  const myIndex = sorted.findIndex((item) => item.isMine)

  return {
    rank: myIndex >= 0 ? myIndex + 1 : 1,
    total: sorted.length || 1,
    rows: sorted,
  }
}

function parseJsonBlock(rawText) {
  try {
    return JSON.parse(rawText)
  } catch {
    const objectMatch = rawText.match(/\{[\s\S]*\}/)
    if (objectMatch) return JSON.parse(objectMatch[0])

    const arrayMatch = rawText.match(/\[[\s\S]*\]/)
    if (arrayMatch) return JSON.parse(arrayMatch[0])

    throw new Error('Invalid JSON')
  }
}

exports.getAll = async (req, res) => {
  try {
    const businessIds = await getUserBusinessIds(req.userId)
    const competitors = await Competitor.find({ businessId: { $in: businessIds } })
      .sort({ 'stats.avgRating': -1, createdAt: -1 })

    res.json({ competitors })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.create = async (req, res) => {
  try {
    const { businessId, name, googlePlaceId, twoGisId, city, district, niche } = req.body

    const business = await Business.findOne({ _id: businessId, userId: req.userId })
    if (!business) return res.status(403).json({ message: 'Нет доступа' })

    const competitor = await Competitor.create({
      businessId,
      name,
      googlePlaceId: googlePlaceId || null,
      twoGisId: twoGisId || null,
      city: city || null,
      district: district || null,
      niche: niche || 'other',
    })

    syncCompetitor(competitor._id).catch((err) => {
      console.error('[Competitor] Ошибка фоновой синхронизации:', err.message)
    })

    console.log('[Competitor] Создан конкурент:', competitor.name)
    res.status(201).json({ competitor })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.autoFind = async (req, res) => {
  try {
    const { businessId, city, district, niche } = req.body

    const business = await Business.findOne({ _id: businessId, userId: req.userId })
    if (!business) return res.status(403).json({ message: 'Нет доступа' })

    const aiCompetitors = await findCompetitorsByAI(business.name, city, niche || 'other', district)
    if (!aiCompetitors.length) {
      return res.json({ competitors: [], total: 0, message: 'Конкуренты не найдены' })
    }

    const created = []

    for (const item of aiCompetitors) {
      if (!item?.name) continue

      const exists = await Competitor.findOne({ businessId, name: item.name })
      if (exists) continue

      const lookup = await resolveCompetitorIds(item)

      const competitor = await Competitor.create({
        businessId,
        name: item.name,
        googlePlaceId: item.googlePlaceId || null,
        twoGisId: lookup.twoGisId || null,
        city: item.city || city || null,
        district: item.district || district || null,
        niche: item.niche || niche || 'other',
        foundByAI: true,
        aiReason: item.reason || null,
      })

      created.push(competitor)

      syncCompetitor(competitor._id).catch((err) => {
        console.error('[Competitor] Ошибка фоновой синхронизации:', err.message)
      })
    }

    res.status(201).json({
      competitors: created,
      total: created.length,
      message: `Добавлено ${created.length} AI-конкурентов`,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.sync = async (req, res) => {
  try {
    const businessIds = await getUserBusinessIds(req.userId)
    const competitor = await Competitor.findOne({ _id: req.params.id, businessId: { $in: businessIds } })
    if (!competitor) return res.status(404).json({ message: 'Не найден' })

    await syncCompetitor(competitor._id)
    res.json({ message: 'Синхронизация запущена' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.remove = async (req, res) => {
  try {
    const businessIds = await getUserBusinessIds(req.userId)
    const competitor = await Competitor.findOneAndDelete({ _id: req.params.id, businessId: { $in: businessIds } })
    if (!competitor) return res.status(404).json({ message: 'Не найден' })

    await CompetitorReview.deleteMany({ competitorId: competitor._id })
    console.log('[Competitor] Удалён конкурент:', competitor.name)
    res.json({ message: 'Удалено' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getComparison = async (req, res) => {
  try {
    const { businessId, city, district, niche } = req.query
    if (!businessId) return res.status(400).json({ message: 'businessId обязателен' })

    const business = await Business.findOne({ _id: businessId, userId: req.userId })
    if (!business) return res.status(403).json({ message: 'Нет доступа' })

    const businessStats = await calculateBusinessStats(businessId)
    const businessIds = await getUserBusinessIds(req.userId)

    const competitorQuery = { businessId: { $in: businessIds } }
    if (city) competitorQuery.city = city
    if (district) competitorQuery.district = district
    if (niche) competitorQuery.niche = niche

    const competitors = await Competitor.find(competitorQuery)
      .sort({ 'stats.avgRating': -1, 'stats.totalReviews': -1 })

    const competitorIds = competitors.map((competitor) => competitor._id)
    const reviewCounts = await CompetitorReview.aggregate([
      { $match: { competitorId: { $in: competitorIds } } },
      {
        $group: {
          _id: '$competitorId',
          totalReviews: { $sum: 1 },
          avgRating: { $avg: '$rating' },
          positiveCount: { $sum: { $cond: [{ $eq: ['$sentiment', 'POSITIVE'] }, 1, 0] } },
          negativeCount: { $sum: { $cond: [{ $eq: ['$sentiment', 'NEGATIVE'] }, 1, 0] } },
        },
      },
    ])

    const reviewStatsMap = new Map(reviewCounts.map((item) => [String(item._id), item]))

    const competitorRows = competitors.map((competitor) => {
      const stats = reviewStatsMap.get(String(competitor._id)) || {}
      const totalReviews = stats.totalReviews ?? competitor.stats?.totalReviews ?? 0
      const avgRating = totalReviews
        ? Number((stats.avgRating ?? competitor.stats?.avgRating ?? 0).toFixed(2))
        : 0

      return {
        name: competitor.name,
        avgRating,
        totalReviews,
        positivePercent: totalReviews
          ? Math.round(((stats.positiveCount ?? 0) / totalReviews) * 100)
          : 0,
        negativePercent: totalReviews
          ? Math.round(((stats.negativeCount ?? 0) / totalReviews) * 100)
          : 0,
        stats: competitor.stats,
      }
    })

    const cityPoolQuery = { businessId: { $in: businessIds } }
    if (city) cityPoolQuery.city = city
    if (niche) cityPoolQuery.niche = niche

    const districtPoolQuery = { businessId: { $in: businessIds } }
    if (district) districtPoolQuery.district = district
    if (niche) districtPoolQuery.niche = niche

    const cityCompetitors = await Competitor.find(cityPoolQuery)
    const districtCompetitors = await Competitor.find(districtPoolQuery)

    const cityRows = [
      { name: business.name, ...businessStats, isMine: true },
      ...cityCompetitors.map((competitor) => ({
        name: competitor.name,
        avgRating: competitor.stats?.avgRating || 0,
        totalReviews: competitor.stats?.totalReviews || 0,
        positivePercent: competitor.stats?.positivePercent || 0,
        negativePercent: competitor.stats?.negativePercent || 0,
        isMine: false,
      })),
    ]

    const districtRows = [
      { name: business.name, ...businessStats, isMine: true },
      ...districtCompetitors.map((competitor) => ({
        name: competitor.name,
        avgRating: competitor.stats?.avgRating || 0,
        totalReviews: competitor.stats?.totalReviews || 0,
        positivePercent: competitor.stats?.positivePercent || 0,
        negativePercent: competitor.stats?.negativePercent || 0,
        isMine: false,
      })),
    ]

    const cityRank = rankBusinesses(cityRows)
    const districtRank = rankBusinesses(districtRows)

    res.json({
      myBusiness: {
        name: business.name,
        ...businessStats,
      },
      competitors: competitorRows,
      cityRank: cityRank.rank,
      cityTotal: cityRank.total,
      districtRank: districtRank.rank,
      districtTotal: districtRank.total,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getAIInsights = async (req, res) => {
  try {
    const { businessId, city, district, niche } = req.query
    if (!businessId) return res.status(400).json({ message: 'businessId обязателен' })

    const business = await Business.findOne({ _id: businessId, userId: req.userId })
    if (!business) return res.status(403).json({ message: 'Нет доступа' })

    const locations = await Location.find({ businessId })
    const locationIds = locations.map((location) => location._id)
    const myReviews = await Review.find({ locationId: { $in: locationIds } })

    const myStats = {
      name: business.name,
      avgRating: myReviews.length
        ? Number((myReviews.reduce((sum, review) => sum + review.rating, 0) / myReviews.length).toFixed(2))
        : 0,
      totalReviews: myReviews.length,
      positivePercent: myReviews.length
        ? Math.round((myReviews.filter((review) => review.sentiment === 'POSITIVE').length / myReviews.length) * 100)
        : 0,
      negativePercent: myReviews.length
        ? Math.round((myReviews.filter((review) => review.sentiment === 'NEGATIVE').length / myReviews.length) * 100)
        : 0,
      unansweredCount: myReviews.filter((review) => !review.isReplied).length,
    }

    const competitorQuery = { businessId }
    if (city) competitorQuery.city = city
    if (district) competitorQuery.district = district
    if (niche) competitorQuery.niche = niche

    const competitors = await Competitor.find(competitorQuery).sort({ 'stats.avgRating': -1, 'stats.totalReviews': -1 }).limit(7)

    const competitorStats = competitors.map((competitor) => ({
      name: competitor.name,
      avgRating: competitor.stats?.avgRating || 0,
      totalReviews: competitor.stats?.totalReviews || 0,
      positivePercent: competitor.stats?.positivePercent || 0,
      negativePercent: competitor.stats?.negativePercent || 0,
      responseRate: competitor.stats?.responseRate || 0,
      foundByAI: competitor.foundByAI,
    }))

    const businessRank = rankBusinesses([
      { name: business.name, ...myStats, isMine: true },
      ...competitorStats.map((competitor) => ({ ...competitor, isMine: false })),
    ])

    const prompt = `Ты эксперт по репутации бизнеса и маркетингу.

Проанализируй данные о бизнесе и его конкурентах:

МОЙ БИЗНЕС:
- Название: ${myStats.name}
- Средний рейтинг: ${myStats.avgRating}/5
- Всего отзывов: ${myStats.totalReviews}
- Позитивных: ${myStats.positivePercent}%
- Негативных: ${myStats.negativePercent}%
- Отзывов без ответа: ${myStats.unansweredCount}
- Место среди конкурентов по рейтингу: ${businessRank.rank} из ${businessRank.total}

КОНКУРЕНТЫ:
${competitorStats.length ? competitorStats.map((competitor) => `- ${competitor.name}: рейтинг ${competitor.avgRating}/5, ${competitor.totalReviews} отзывов, ${competitor.positivePercent}% позитивных, ${competitor.responseRate}% ответов`).join('\n') : '- Конкуренты не найдены'}

Сделай анализ и дай конкретные выводы в формате JSON:
{
  "summary": "одно предложение — общий вывод о позиции бизнеса",
  "strongPoints": ["конкретная сильная сторона с цифрами"],
  "weakPoints": ["конкретная слабая сторона с цифрами и сравнением с конкурентами"],
  "actions": [
    {
      "priority": "high",
      "action": "конкретное действие что нужно сделать",
      "reason": "почему это важно, со ссылкой на данные"
    }
  ],
  "vsLeader": "сравнение с лидером рынка — что конкретно нужно сделать чтобы его обогнать"
}

Отвечай ТОЛЬКО валидным JSON без markdown и пояснений. Пиши на русском.`

    const Groq = require('groq-sdk')
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.4,
    })

    const raw = response.choices[0].message.content.trim()
    const insights = parseJsonBlock(raw)

    res.json({ insights, myStats, competitorStats, rank: businessRank.rank, total: businessRank.total })
  } catch (err) {
    console.error('[AI Insights] Ошибка:', err.message)
    res.status(500).json({ message: err.message })
  }
}