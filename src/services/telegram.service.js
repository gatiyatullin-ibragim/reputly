const TelegramBot = require('node-telegram-bot-api')
const User = require('../models/User')

let bot = null

function getBot() {
  if (!bot && process.env.TELEGRAM_BOT_TOKEN) {
    bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true })

    // /start <userId> — пользователь подключает Telegram
    bot.onText(/\/start (.+)/, async (msg, match) => {
      const chatId = msg.chat.id
      const userId = match[1]
      try {
        await User.findByIdAndUpdate(userId, { telegramChatId: chatId.toString() })
        await bot.sendMessage(chatId,
          '✅ Telegram успешно подключён!\n\nТеперь буду присылать уведомления о новых отзывах.'
        )
      } catch (err) {
        console.error('[Telegram] Ошибка привязки:', err.message)
      }
    })

    bot.on('polling_error', (err) => {
      console.error('[Telegram] Ошибка polling:', err.message)
    })

    console.log('✅ Telegram бот запущен')
  }
  return bot
}

async function sendReviewAlert(chatId, review) {
  const b = getBot()
  if (!b) return

  const stars = '⭐'.repeat(review.rating) + '☆'.repeat(5 - review.rating)
  const emoji = review.rating >= 4 ? '😊' : review.rating === 3 ? '😐' : '😡'
  const shortText = review.text
    ? review.text.slice(0, 200) + (review.text.length > 200 ? '...' : '')
    : 'Без текста'

  const message = [
    `${emoji} *Новый отзыв — ${review.locationName}*`,
    ``,
    `📍 ${review.platform} | ${stars}`,
    `👤 ${review.authorName}`,
    ``,
    `_"${shortText}"_`,
  ].join('\n')

  try {
    await b.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          {
            text: '👁 Открыть в дашборде',
            url: `${process.env.CLIENT_URL}/reviews/${review._id}`,
          },
        ]],
      },
    })
  } catch (err) {
    console.error('[Telegram] Ошибка отправки:', err.message)
  }
}

module.exports = { getBot, sendReviewAlert }
