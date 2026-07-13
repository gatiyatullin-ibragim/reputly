const axios = require('axios')

async function parseTwoGisReviews(orgId) {
  try {
    const url = `https://public-api.reviews.2gis.com/2.0/branches/${orgId}/reviews`
    const params = {
      limit: 50,
      sort_by: 'date_edited',
      key: process.env.TWOGIS_API_KEY || 'rumaps'
    }

    const { data } = await axios.get(url, { params, timeout: 10000 })

    return (data.reviews || []).map(r => ({
      externalId:   String(r.id),
      authorName:   r.user?.name || 'Аноним',
      authorAvatar: r.user?.photo_url || null,
      rating:       r.rating || 3,
      text:         r.text || '',
      publishedAt:  r.date_edited ? new Date(r.date_edited) : new Date(),
    }))
  } catch (err) {
    console.error('[2GIS Parser] Ошибка:', err.response ? JSON.stringify(err.response.data) : err.message)
    return []
  }
}

module.exports = { parseTwoGisReviews }

