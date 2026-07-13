const Review = require('../models/Review')
const Business = require('../models/Business')
const { generateReply } = require('../services/ai.service')

const getUserBusinessIds = async (userId) => {
  const businesses = await Business.find({ userId })
  return businesses.map(b => b._id)
}

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, filter, platform, sentiment } = req.query
    const businessIds = await getUserBusinessIds(req.userId)

    const query = { businessId: { $in: businessIds } }
    if (filter === 'unanswered') query.isReplied = false
    if (filter === 'negative') query.sentiment = 'NEGATIVE'
    if (filter === 'positive') query.sentiment = 'POSITIVE'
    if (platform) query.platform = platform.toUpperCase()
    if (sentiment) query.sentiment = sentiment.toUpperCase()

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .sort({ publishedAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .populate('locationId', 'name'),
      Review.countDocuments(query),
    ])

    res.json({ reviews, total, page: Number(page), pages: Math.ceil(total / limit) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getOne = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('locationId', 'name')
      .populate('businessId', 'name')
    if (!review) return res.status(404).json({ message: 'Отзыв не найден' })
    res.json({ review })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.generateReply = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id).populate('businessId', 'name')
    if (!review) return res.status(404).json({ message: 'Отзыв не найден' })



    const { style = 'friendly' } = req.body
    const reply = await generateReply(
      review.text,
      review.rating,
      review.businessId?.name || 'Наш бизнес',
      style
    )

    await Review.findByIdAndUpdate(req.params.id, { aiReply: reply })
    res.json({ reply })
  } catch (err) {
    console.error('[generate] ПОЛНАЯ ОШИБКА:', err)
    res.status(500).json({ message: err.message })
  }
}

exports.markReplied = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isReplied: true, repliedAt: new Date() },
      { new: true }
    )
    res.json({ review })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
