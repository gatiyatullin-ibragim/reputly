const Groq = require('groq-sdk')

async function findCompetitorsByAI(businessName, city, niche, district = null) {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    const prompt = `Ты помощник для анализа бизнеса.

Бизнес: "${businessName}" (${niche}) в городе ${city}${district ? ', район ' + district : ''}.

Найди 5-7 реальных конкурентов этого бизнеса в том же городе и нише.

Для каждого конкурента укажи:
- name: точное название заведения
- city: город
- district: район города если известен
- niche: ниша (${niche})
- googleMapsQuery: поисковый запрос для Google Maps (например "Кофейня Аромат Алматы")
- twoGisQuery: поисковый запрос для 2GIS
- reason: одна строка почему это конкурент

Отвечай ТОЛЬКО валидным JSON массивом без пояснений и без markdown.`

    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
      temperature: 0.3,
    })

    const raw = response.choices[0].message.content.trim()

    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      const match = raw.match(/\[[\s\S]*\]/)
      if (!match) return []
      const parsed = JSON.parse(match[0])
      return Array.isArray(parsed) ? parsed : []
    }
  } catch (err) {
    console.error('[Competitor AI] Ошибка:', err.message)
    return []
  }
}

module.exports = { findCompetitorsByAI }