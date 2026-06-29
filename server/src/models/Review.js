const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema(
  {
    locationId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    businessId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
    platform:     { type: String, enum: ['GOOGLE', 'YANDEX', 'TWOGIS', 'AVITO'], required: true },
    externalId:   { type: String, required: true },
    authorName:   { type: String, required: true },
    authorAvatar: { type: String, default: null },
    rating:       { type: Number, min: 1, max: 5, required: true },
    text:         { type: String, default: '' },
    sentiment:    { type: String, enum: ['POSITIVE', 'NEUTRAL', 'NEGATIVE'], default: null },
    aiReply:      { type: String, default: null },
    isReplied:    { type: Boolean, default: false },
    repliedAt:    { type: Date, default: null },
    publishedAt:  { type: Date, required: true },
  },
  { timestamps: true }
)

// Не дублируем отзывы
reviewSchema.index({ externalId: 1, platform: 1 }, { unique: true })
// Быстрый поиск по бизнесу
reviewSchema.index({ businessId: 1, createdAt: -1 })
// Быстрый поиск без ответа
reviewSchema.index({ businessId: 1, isReplied: 1 })

module.exports = mongoose.model('Review', reviewSchema)
