const mongoose = require('mongoose')

const competitorReviewSchema = new mongoose.Schema(
  {
    competitorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Competitor', required: true },
    platform:     { type: String, enum: ['GOOGLE', 'TWOGIS'], required: true },
    externalId:   { type: String, required: true },
    authorName:   { type: String, default: 'Аноним' },
    rating:       { type: Number, min: 1, max: 5, required: true },
    text:         { type: String, default: '' },
    sentiment:    { type: String, enum: ['POSITIVE', 'NEUTRAL', 'NEGATIVE'], default: null },
    hasReply:     { type: Boolean, default: false },
    publishedAt:  { type: Date, default: null },
  },
  { timestamps: true }
)

competitorReviewSchema.index({ externalId: 1, platform: 1 }, { unique: true })
competitorReviewSchema.index({ competitorId: 1, createdAt: -1 })

module.exports = mongoose.model('CompetitorReview', competitorReviewSchema)