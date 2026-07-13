const Groq = require('groq-sdk')

let _groq = null
function getGroq() {
  if (!_groq) {
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'placeholder' })
  }
  return _groq
}


async function analyzeReviewSentiment(reviewText) {
  try {
    const response = await getGroq().chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{
        role: 'user',
        content: `Определи тональность отзыва. Ответь ТОЛЬКО одним словом: POSITIVE, NEUTRAL или NEGATIVE.

Отзыв: "${reviewText}"`
      }],
      max_tokens: 10,
      temperature: 0,
    })

    const text = response.choices[0].message.content.trim().toUpperCase()
    if (text.includes('POSITIVE')) return 'POSITIVE'
    if (text.includes('NEGATIVE')) return 'NEGATIVE'
    return 'NEUTRAL'

  } catch (err) {
    console.error('[AI] Ошибка тональности:', err.message)
    return 'NEUTRAL'
  }
}

async function generateReply(reviewText, rating, businessName, style = 'friendly') {
  try {
    

    const tone = style === 'formal'
      ? 'официальный и профессиональный'
      : 'дружелюбный и тёплый'

    const response = await getGroq().chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: `Ты — менеджер по работе с клиентами компании "${businessName}".
Правила:
- Тон: ${tone}
- НЕ начинай с "Спасибо за отзыв!"
- Упоминай детали из отзыва
- Для рейтинга 1-2 — предложи решение или компенсацию
- Для рейтинга 4-5 — вырази радость, пригласи снова
- Длина: 2-4 предложения
- Отвечай на том же языке что и отзыв
- Напиши ТОЛЬКО текст ответа без кавычек`
        },
        {
          role: 'user',
          content: `Напиши ответ на отзыв (рейтинг ${rating}/5): "${reviewText || 'Без текста'}"`
        }
      ],
      max_tokens: 300,
      temperature: 0.7,
    })

    return response.choices[0].message.content.trim()
  } catch (err) {
    console.warn('[AI] Ошибка генерации ответа ИИ, используется заглушка:', err.message)
    // Fallback template replies based on rating and style
    if (rating >= 4) {
      if (style === 'formal') {
        return `Благодарим Вас за положительный отзыв о ${businessName}! Мы рады, что Вы остались довольны качеством обслуживания. Будем рады видеть Вас снова.`
      }
      return `Спасибо большое за тёплые слова! Рады, что вам всё понравилось в ${businessName}. Ждём вас в гости снова, хорошего дня! 😊`
    } else {
      if (style === 'formal') {
        return `Приносим свои извинения за доставленные неудобства. Мы обязательно проведем внутреннюю проверку в ${businessName} и исправим ситуацию. Свяжитесь с нами для компенсации.`
      }
      return `Очень жаль, что посещение ${businessName} оставило неприятные впечатления. Мы обязательно исправимся! Напишите нам, чтобы мы могли загладить свою вину. 😔`
    }
  }
}

module.exports = { analyzeReviewSentiment, generateReply }