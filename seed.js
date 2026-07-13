require('dotenv').config()
const mongoose = require('mongoose')

// Модели
const User     = require('./src/models/User')
const Business = require('./src/models/Business')
const Location = require('./src/models/Location')
const Review   = require('./src/models/Review')
const Competitor = require('./src/models/Competitor')
const CompetitorReview = require('./src/models/CompetitorReview')
const bcrypt   = require('bcryptjs')

// ── Тестовые данные ────────────────────────────────────────────────────────

const REVIEWS = [
  { authorName: 'Алина Романова',   rating: 5, text: 'Очень классный Instagram-формат общения. Быстро ответили в комментариях и помогли с выбором.', sentiment: 'POSITIVE', platform: 'INSTAGRAM', isReplied: true },
  { authorName: 'Кирилл Андреев',   rating: 3, text: 'Комментарий не очень полезный, но ответили довольно быстро.', sentiment: 'NEUTRAL', platform: 'INSTAGRAM', isReplied: false },
  // Позитивные
  { authorName: 'Мария Иванова',    rating: 5, text: 'Отличный сервис! Пришли всей семьёй, остались очень довольны. Персонал вежливый, атмосфера уютная. Обязательно вернёмся!', sentiment: 'POSITIVE', platform: 'GOOGLE',  isReplied: true  },
  { authorName: 'Дмитрий Козлов',   rating: 5, text: 'Лучшее заведение в районе. Всегда свежие продукты, быстрое обслуживание. Рекомендую всем друзьям!', sentiment: 'POSITIVE', platform: 'TWOGIS',  isReplied: true  },
  { authorName: 'Анна Смирнова',    rating: 4, text: 'Очень понравилось! Единственный минус — пришлось немного подождать столик. Но еда и обслуживание на высоте.', sentiment: 'POSITIVE', platform: 'GOOGLE',  isReplied: false },
  { authorName: 'Сергей Петров',    rating: 5, text: 'Прекрасное место для деловых встреч. Тихо, уютно, вкусный кофе. Wifi работает отлично.', sentiment: 'POSITIVE', platform: 'YANDEX',  isReplied: true  },
  { authorName: 'Елена Новикова',   rating: 4, text: 'Хорошее заведение, цены адекватные. Буду заходить регулярно.', sentiment: 'POSITIVE', platform: 'TWOGIS',  isReplied: false },
  { authorName: 'Алексей Морозов',  rating: 5, text: 'Мастер Ирина — просто волшебник! Сделала именно то, что я хотела. Результатом очень довольна!', sentiment: 'POSITIVE', platform: 'GOOGLE',  isReplied: true  },

  // Нейтральные
  { authorName: 'Ольга Федорова',   rating: 3, text: 'Обычное место, ничего особенного. Цены чуть выше среднего для такого уровня.', sentiment: 'NEUTRAL',  platform: 'GOOGLE',  isReplied: false },
  { authorName: 'Павел Волков',     rating: 3, text: 'Зашли случайно. Нормально, но ничего выдающегося. Может в другой раз будет лучше.', sentiment: 'NEUTRAL',  platform: 'AVITO',   isReplied: false },
  { authorName: 'Наталья Лебедева', rating: 3, text: 'Средне. Было лучше раньше. Надеюсь поправятся.', sentiment: 'NEUTRAL',  platform: 'YANDEX',  isReplied: false },

  // Негативные
  { authorName: 'Игорь Соколов',    rating: 1, text: 'Ужасный сервис! Ждали заказ больше часа, никто не объяснил причину задержки. Больше не придём.', sentiment: 'NEGATIVE', platform: 'GOOGLE',  isReplied: false },
  { authorName: 'Татьяна Попова',   rating: 2, text: 'Цены выросли, а качество осталось прежним. Порция маленькая, персонал грубит. Разочарована.', sentiment: 'NEGATIVE', platform: 'TWOGIS',  isReplied: false },
  { authorName: 'Виктор Кузнецов',  rating: 1, text: 'Отвратительно. Нашёл волос в блюде, администратор даже не извинился нормально. Санэпидстанцию вызову.', sentiment: 'NEGATIVE', platform: 'YANDEX',  isReplied: false },
  { authorName: 'Людмила Орлова',   rating: 2, text: 'Заказала доставку — привезли холодное и не то что заказывала. Деньги вернули, но осадок остался.', sentiment: 'NEGATIVE', platform: 'GOOGLE',  isReplied: false },
]

async function seed() {
  try {
    console.log('🌱 Подключение к MongoDB...')
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Подключено\n')

    // ── Очистка старых тестовых данных ──────────────────────────────────
    console.log('🧹 Очищаем старые тестовые данные...')
    await Review.deleteMany({})
    await CompetitorReview.deleteMany({})
    await Competitor.deleteMany({})
    await Location.deleteMany({})
    await Business.deleteMany({})
    await User.deleteMany({ email: 'test@revi.ru' })
    console.log('✅ Очищено\n')

    // ── Создаём тестового пользователя ──────────────────────────────────
    console.log('👤 Создаём тестового пользователя...')
    const hashedPassword = await bcrypt.hash('test1234', 12)
    const user = await User.create({
      name:     'Тестовый Пользователь',
      email:    'test@revi.ru',
      password: hashedPassword,
      plan:     'BUSINESS',
      telegramChatId: '123456789',
    })
    console.log(`✅ Пользователь: ${user.email} / пароль: test1234\n`)

    // ── Создаём бизнес ───────────────────────────────────────────────────
    console.log('🏢 Создаём бизнес...')
    const business = await Business.create({
      userId: user._id,
      name:   'Кофейня «Аромат»',
    })
    console.log(`✅ Бизнес: ${business.name}\n`)

    // ── Создаём точки ────────────────────────────────────────────────────
    console.log('📍 Создаём точки...')
    const location1 = await Location.create({
      businessId:    business._id,
      name:          'Главная — ул. Ленина, 15',
      googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
      twoGisId:      '141265770336798',
      yandexOrgId:   '1234567890',
      instagramBusinessId: '17841400000000000',
      instagramPageAccessToken: 'demo_instagram_page_token',
      instagramConnectedAt: new Date(),
      lastSyncAt:    new Date(),
    })

    const location2 = await Location.create({
      businessId:    business._id,
      name:          'Филиал — ТЦ «Мегаполис»',
      googlePlaceId: 'ChIJrTLr-GyuEmsRBfy61i59si0',
      twoGisId:      '141265770336799',
      lastSyncAt:    new Date(Date.now() - 3600000),
    })
    console.log(`✅ Точки: ${location1.name}, ${location2.name}\n`)

    // ── Создаём конкурентов ─────────────────────────────────────────────
    console.log('⚔️ Создаём конкурентов...')
    const competitor1 = await Competitor.create({
      businessId: business._id,
      name: 'Coffeetime',
      googlePlaceId: 'ChIJ_competitor_1',
      city: 'Москва',
      district: 'Центральный',
      niche: 'cafe',
      lastSyncAt: new Date(),
      stats: {
        avgRating: 4.7,
        totalReviews: 328,
        positivePercent: 89,
        negativePercent: 6,
        responseRate: 78,
        avgResponseTimeHours: 3.2,
      },
    })

    const competitor2 = await Competitor.create({
      businessId: business._id,
      name: 'Bean Brothers',
      twoGisId: '141265770336800',
      city: 'Москва',
      district: 'Центральный',
      niche: 'cafe',
      lastSyncAt: new Date(),
      stats: {
        avgRating: 4.4,
        totalReviews: 214,
        positivePercent: 83,
        negativePercent: 10,
        responseRate: 64,
        avgResponseTimeHours: 5.1,
      },
    })

    await CompetitorReview.insertMany([
      {
        competitorId: competitor1._id,
        platform: 'GOOGLE',
        externalId: 'comp_1_google_1',
        authorName: 'Павел',
        rating: 5,
        text: 'Очень быстрый ответ и хороший капучино.',
        sentiment: 'POSITIVE',
        hasReply: true,
        publishedAt: new Date(),
      },
      {
        competitorId: competitor2._id,
        platform: 'TWOGIS',
        externalId: 'comp_2_twogis_1',
        authorName: 'Марина',
        rating: 4,
        text: 'Нормально, но по вечерам очереди.',
        sentiment: 'NEUTRAL',
        hasReply: false,
        publishedAt: new Date(),
      },
    ])
    console.log(`✅ Конкуренты: ${competitor1.name}, ${competitor2.name}\n`)

    // ── Создаём отзывы ───────────────────────────────────────────────────
    console.log('💬 Создаём отзывы...')

    const now = Date.now()
    const day = 24 * 60 * 60 * 1000

    const reviews = await Review.insertMany(
      REVIEWS.map((r, i) => ({
        ...r,
        locationId:  i % 3 === 0 ? location2._id : location1._id,
        businessId:  business._id,
        externalId:  `test_ext_${i}_${Date.now()}`,
        publishedAt: new Date(now - i * day * 2),  // разброс по датам
        aiReply: r.isReplied
          ? `Благодарим за ваш отзыв! Мы рады, что вы остались довольны нашим сервисом. Ждём вас снова!`
          : null,
        repliedAt: r.isReplied ? new Date(now - i * day * 2 + 3600000) : null,
      }))
    )
    console.log(`✅ Создано ${reviews.length} отзывов\n`)

    // ── Итог ─────────────────────────────────────────────────────────────
    const positive = reviews.filter(r => r.sentiment === 'POSITIVE').length
    const neutral  = reviews.filter(r => r.sentiment === 'NEUTRAL').length
    const negative = reviews.filter(r => r.sentiment === 'NEGATIVE').length
    const replied  = reviews.filter(r => r.isReplied).length

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🎉 База данных заполнена тестовыми данными!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('')
    console.log('📧 Логин:    test@revi.ru')
    console.log('🔑 Пароль:   test1234')
    console.log('')
    console.log(`🏢 Бизнес:   ${business.name}`)
    console.log(`📍 Точек:    2`)
    console.log(`💬 Отзывов:  ${reviews.length}`)
    console.log(`⚔️ Конкурентов: 2`)
    console.log(`   😊 Позитивных:  ${positive}`)
    console.log(`   😐 Нейтральных: ${neutral}`)
    console.log(`   😡 Негативных:  ${negative}`)
    console.log(`   ✅ С ответом:   ${replied}`)
    console.log(`   ⚠️  Без ответа: ${reviews.length - replied}`)
    console.log('')
    console.log('🚀 Открывай http://localhost:5173 и входи!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  } catch (err) {
    console.error('❌ Ошибка:', err.message)
  } finally {
    await mongoose.disconnect()
    process.exit(0)
  }
}

seed()
