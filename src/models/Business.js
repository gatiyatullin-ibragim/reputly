const mongoose = require('mongoose')

const businessSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name:   { type: String, required: true, trim: true },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Business', businessSchema)
