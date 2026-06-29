const cron = require('node-cron')
const { syncAll } = require('../services/sync.service')

function startSyncJob() {
  // Каждые 2 часа
  cron.schedule('0 */2 * * *', async () => {
    console.log('[CRON] Запуск плановой синхронизации...')
    try {
      await syncAll()
    } catch (err) {
      console.error('[CRON] Ошибка:', err.message)
    }
  })

  console.log('✅ Cron задача запущена (каждые 2 часа)')
}

module.exports = { startSyncJob }
