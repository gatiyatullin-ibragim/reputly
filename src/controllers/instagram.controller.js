const axios = require('axios')
const Location = require('../models/Location')

exports.handleOAuthCallback = async (req, res) => {
  try {
    const { code, locationId } = req.body

    if (!code || !locationId) {
      return res.status(400).json({ message: 'code и locationId обязательны' })
    }

    const location = await Location.findById(locationId).populate('businessId', 'userId name')
    if (!location) return res.status(404).json({ message: 'Точка не найдена' })

    if (String(location.businessId?.userId) !== String(req.userId)) {
      return res.status(403).json({ message: 'Нет доступа' })
    }

    const redirectUri = `${process.env.CLIENT_URL || 'http://localhost:5173'}/instagram/callback`

    console.log('[Instagram] Обмен кода на токен...')
    const shortTokenResponse = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
      params: {
        client_id: process.env.FB_APP_ID,
        client_secret: process.env.FB_APP_SECRET,
        redirect_uri: redirectUri,
        code,
      },
      timeout: 15000,
    })

    const shortLivedToken = shortTokenResponse.data.access_token

    const longTokenResponse = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: process.env.FB_APP_ID,
        client_secret: process.env.FB_APP_SECRET,
        fb_exchange_token: shortLivedToken,
      },
      timeout: 15000,
    })

    const longLivedToken = longTokenResponse.data.access_token

    const pagesResponse = await axios.get('https://graph.facebook.com/v19.0/me/accounts', {
      params: { access_token: longLivedToken },
      timeout: 15000,
    })

    const pages = pagesResponse.data.data || []
    let selectedPage = null
    let instagramBusinessId = null

    for (const page of pages) {
      if (!page.id) continue

      const pageResponse = await axios.get(`https://graph.facebook.com/v19.0/${page.id}`, {
        params: {
          access_token: longLivedToken,
          fields: 'instagram_business_account',
        },
        timeout: 15000,
      })

      if (pageResponse.data?.instagram_business_account?.id) {
        selectedPage = page
        instagramBusinessId = pageResponse.data.instagram_business_account.id
        break
      }
    }

    if (!instagramBusinessId || !selectedPage) {
      return res.status(400).json({ message: 'Привяжите Instagram к Facebook странице в настройках' })
    }

    await Location.findByIdAndUpdate(locationId, {
      instagramBusinessId,
      instagramPageAccessToken: selectedPage.access_token || longLivedToken,
      instagramConnectedAt: new Date(),
    })

    console.log('[Instagram] Подключена точка:', location.name)
    res.json({ message: 'Instagram успешно подключён' })
  } catch (err) {
    console.error('[Instagram] Ошибка OAuth:', err.response?.data || err.message)
    res.status(500).json({ message: err.response?.data?.error?.message || err.message })
  }
}