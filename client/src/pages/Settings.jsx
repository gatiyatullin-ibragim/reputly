import { useAuthStore } from '../store/useAuthStore'

export default function Settings() {
  const { user } = useAuthStore()

  const telegramLink = `https://t.me/${import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'YourBot'}?start=${user?.id}`

  return (
    <div className="p-6 max-w-xl flex flex-col gap-5">
      <h1 className="text-lg font-semibold">Настройки</h1>

      {/* Profile */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold mb-4">Профиль</h2>
        <div className="flex flex-col gap-3">
          <div>
            <label className="label">Имя</label>
            <input className="input" value={user?.name || ''} readOnly />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" value={user?.email || ''} readOnly />
          </div>
          <div>
            <label className="label">Тариф</label>
            <input className="input" value={user?.plan || 'START'} readOnly />
          </div>
        </div>
      </div>

      {/* Telegram */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold mb-1">Telegram уведомления</h2>
        <p className="text-xs text-gray-500 mb-4">
          Подключите Telegram чтобы получать мгновенные уведомления о новых отзывах
        </p>
        {user?.telegramChatId ? (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <span>✅</span>
            <span>Telegram подключён (ID: {user.telegramChatId})</span>
          </div>
        ) : (
          <a
            href={telegramLink}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary inline-flex"
          >
            Connect Telegram
          </a>
        )}
      </div>

      {/* Plan */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold mb-4">Тарифный план</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { name: 'START',    price: '2 990',  locs: 1,  ai: 20  },
            { name: 'BUSINESS', price: '6 990',  locs: 5,  ai: 100 },
            { name: 'PRO',      price: '14 990', locs: 20, ai: 500 },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border p-3 text-center ${
                user?.plan === plan.name
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-gray-200'
              }`}
            >
              <p className="text-xs font-semibold text-gray-700 mb-1">{plan.name}</p>
              <p className="text-lg font-bold">{plan.price} ₽</p>
              <p className="text-xs text-gray-400 mt-1">{plan.locs} точек</p>
              <p className="text-xs text-gray-400">{plan.ai} AI ответов</p>
              {user?.plan === plan.name && (
                <p className="text-xs text-brand-500 font-medium mt-2">Текущий</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
