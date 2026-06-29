const mongoose = require('mongoose')

const locationSchema = new mongoose.Schema(
  {
    businessId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
    name:          { type: String, required: true, trim: true },
    googlePlaceId: { type: String, default: null },
    yandexOrgId:   { type: String, default: null },
    twoGisId:      { type: String, default: null },
    avitoUrl:      { type: String, default: null },
    lastSyncAt:    { type: Date, default: null },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Location', locationSchema)
