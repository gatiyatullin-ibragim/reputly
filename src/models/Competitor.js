const mongoose = require('mongoose')

const competitorSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
    name:       { type: String, required: true, trim: true },
    googlePlaceId: { type: String, default: null },
    twoGisId:   { type: String, default: null },
    city:       { type: String, default: null, trim: true },
    district:   { type: String, default: null, trim: true },
    niche:      { type: String, enum: ['cafe', 'restaurant', 'salon', 'clinic', 'auto', 'other'], default: 'other' },
    foundByAI:  { type: Boolean, default: false },
    aiReason:   { type: String, default: null },
    lastSyncAt: { type: Date, default: null },
    stats: {
      avgRating:          { type: Number, default: 0 },
      totalReviews:       { type: Number, default: 0 },
      positivePercent:    { type: Number, default: 0 },
      negativePercent:    { type: Number, default: 0 },
      responseRate:       { type: Number, default: 0 },
      avgResponseTimeHours: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Competitor', competitorSchema)