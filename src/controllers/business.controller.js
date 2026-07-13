const Business = require('../models/Business')
const Location = require('../models/Location')

exports.getAll = async (req, res) => {
  try {
    const businesses = await Business.find({ userId: req.userId })
    res.json({ businesses })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.create = async (req, res) => {
  try {
    const { name } = req.body
    if (!name) return res.status(400).json({ message: 'Название обязательно' })

    const business = await Business.create({ userId: req.userId, name })
    res.status(201).json({ business })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.update = async (req, res) => {
  try {
    const business = await Business.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { name: req.body.name },
      { new: true }
    )
    if (!business) return res.status(404).json({ message: 'Не найден' })
    res.json({ business })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.remove = async (req, res) => {
  try {
    await Business.findOneAndDelete({ _id: req.params.id, userId: req.userId })
    await Location.deleteMany({ businessId: req.params.id })
    res.json({ message: 'Удалено' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
