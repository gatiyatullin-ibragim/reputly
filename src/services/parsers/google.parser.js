// Google Maps парсер
// Для работы нужно установить Playwright:
//   npm install playwright-core
//   npx playwright install chromium
//
// Альтернатива (рекомендуется для продакшна):
//   Используй Google Places API — https://developers.google.com/maps/documentation/places/web-service
//   Стоимость: $2 за 1000 запросов, стабильно и без блокировок

async function parseGoogleReviews(placeId, limit = 50) {
  // Пробуем использовать Playwright если установлен
  try {
    const { chromium } = require('playwright-core')

    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    try {
      await page.goto(`https://www.google.com/maps/place/?q=place_id:${placeId}`, {
        waitUntil: 'networkidle',
        timeout: 30000,
      })

      // Кликаем на вкладку Отзывы
      const reviewsTab = await page.$('[data-tab-index="1"]')
      if (reviewsTab) {
        await reviewsTab.click()
        await page.waitForTimeout(2000)
      }

      // Скроллим для загрузки
      for (let i = 0; i < Math.ceil(limit / 10); i++) {
        await page.evaluate(() => {
          const el = document.querySelector('.DxyBCb')
          if (el) el.scrollTop += 2000
        })
        await page.waitForTimeout(1500)
      }

      // Парсим
      const reviews = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.jftiEf')).map(el => ({
          externalId:  el.getAttribute('data-review-id') || Math.random().toString(36).slice(2),
          authorName:  el.querySelector('.d4r55')?.textContent?.trim() || 'Аноним',
          authorAvatar: el.querySelector('.NBa7we')?.src || null,
          rating:      el.querySelectorAll('.kvMYJc').length || 3,
          text:        el.querySelector('.wiI7pd')?.textContent?.trim() || '',
          publishedAt: new Date().toISOString(),
        }))
      })

      return reviews
    } finally {
      await browser.close()
    }
  } catch (err) {
    // Playwright не установлен — возвращаем заглушку
    if (err.code === 'MODULE_NOT_FOUND') {
      console.warn('[Google Parser] Playwright не установлен. Запусти: npm install playwright-core && npx playwright install chromium')
      return []
    }
    console.error('[Google Parser] Ошибка:', err.message)
    return []
  }
}

module.exports = { parseGoogleReviews }
