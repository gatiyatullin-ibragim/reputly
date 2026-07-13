const axios = require('axios')

async function resolveCompetitorIds(competitor) {
  try {
    const cityId = 141265769474028
    const { data } = await axios.get('https://catalog.api.2gis.com/3.0/items', {
      params: {
        q: competitor.twoGisQuery || competitor.name,
        city_id: cityId,
        type: 'branch',
        fields: 'items.reviews,items.ratings,items.external_content',
        key: process.env.TWOGIS_API_KEY || 'rumaps',
      },
      timeout: 15000,
    })

    const firstItem = data?.result?.items?.[0] || data?.items?.[0] || null
    return { twoGisId: firstItem?.id ? String(firstItem.id) : null }
  } catch (err) {
    console.error('[Competitor Lookup] Ошибка:', err.message)
    return { twoGisId: null }
  }
}

module.exports = { resolveCompetitorIds }