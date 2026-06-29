const Groq = require('groq-sdk')

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

async function analyzeReviewSentiment(reviewText) {
  try {
    const response = await groq.chat.completions.create({
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
  const tone = style === 'formal'
    ? 'официальный и профессиональный'
    : 'дружелюбный и тёплый'

  const response = await groq.chat.completions.create({
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
}

module.exports = { analyzeReviewSentiment, generateReply }