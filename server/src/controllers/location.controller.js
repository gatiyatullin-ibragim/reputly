const Location = require('../models/Location')
const Business = require('../models/Business')
const { syncLocation } = require('../services/sync.service')

exports.getAll = async (req, res) => {
  try {
    const businesses = await Business.find({ userId: req.userId })
    const businessIds = businesses.map(b => b._id)
    const locations = await Location.find({ businessId: { $in: businessIds } })
      .populate('businessId', 'name')
    res.json({ locations })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.create = async (req, res) => {
  try {
    const { businessId, name, googlePlaceId, yandexOrgId, twoGisId, avitoUrl } = req.body

    // Проверяем что бизнес принадлежит пользователю
    const business = await Business.findOne({ _id: businessId, userId: req.userId })
    if (!business) return res.status(403).json({ message: 'Нет доступа' })

    const location = await Location.create({
      businessId, name, googlePlaceId, yandexOrgId, twoGisId, avitoUrl
    })

    // Запускаем первую синхронизацию в фоне
    syncLocation(location._id).catch(err =>
      console.error('[sync] Ошибка первой синхронизации:', err.message)
    )

    res.status(201).json({ location })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.sync = async (req, res) => {
  try {
    await syncLocation(req.params.id)
    res.json({ message: 'Синхронизация запущена' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.remove = async (req, res) => {
  try {
    await Location.findByIdAndDelete(req.params.id)
    res.json({ message: 'Удалено' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
