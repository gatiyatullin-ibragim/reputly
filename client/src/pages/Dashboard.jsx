import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { analyticsApi } from '../api'

const PLATFORM_COLORS = {
  GOOGLE: '#4285F4',
  TWOGIS: '#1D9E75',
  YANDEX: '#FFCC00',
  AVITO:  '#00AAFF',
}

const SENTIMENT_LABELS = {
  POSITIVE: { label: 'Позитив', color: '#1D9E75' },
  NEUTRAL:  { label: 'Нейтраль', color: '#9ca3af' },
  NEGATIVE: { label: 'Негатив',  color: '#ef4444' },
}

function StatCard({ label, value, sub, urgent }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-gray-500 mb-1.5">{label}</p>
      <p className={`text-5xl font-semibold ${urgent ? 'text-red-500' : 'text-gray-900'}`}>
        {value ?? '—'}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => analyticsApi.getDashboard().then((r) => r.data),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Загрузка...
      </div>
    )
  }

  const { stats, weeklyReviews, byPlatform, recentReviews } = data || {}

  return (
    <div className="p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Дашборд</h1>
        <button
          onClick={() => navigate('/locations')}
          className="btn-secondary text-xs"
        >
          + Добавить точку
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Средний рейтинг"
          value={stats?.avgRating ? stats.avgRating.toFixed(1) + ' ★' : '—'}
        />
        <StatCard
          label="Всего отзывов"
          value={stats?.totalReviews ?? 0}
        />
        <StatCard
          label="Без ответа"
          value={stats?.unansweredCount ?? 0}
          urgent={stats?.unansweredCount > 0}
          sub={stats?.unansweredCount > 0 ? 'Нужна реакция' : undefined}
        />
        <StatCard
          label="Позитивных"
          value={
            stats?.totalReviews
              ? Math.round((stats.positiveCount / stats.totalReviews) * 100) + '%'
              : '0%'
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly chart */}
        <div className="card lg:col-span-2">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium">Отзывы за 4 недели</p>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={weeklyReviews} barSize={20}>
                <XAxis dataKey="_id" tick={{ fontSize: 15 }} />
                <YAxis tick={{ fontSize: 15 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="positive" name="Позитив"  stackId="a" fill="#1D9E75" />
                <Bar dataKey="neutral"  name="Нейтраль" stackId="a" fill="#9ca3af" />
                <Bar dataKey="negative" name="Негатив"  stackId="a" fill="#ef4444" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform pie */}
        <div className="card">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium">По платформам</p>
          </div>
          <div className="p-4 flex flex-col gap-3">
            {byPlatform?.length ? (
              <>
                <ResponsiveContainer width="100%" height={100}>
                  <PieChart>
                    <Pie data={byPlatform} dataKey="count" nameKey="_id" cx="50%" cy="50%" innerRadius={28} outerRadius={46}>
                      {byPlatform.map((entry) => (
                        <Cell key={entry._id} fill={PLATFORM_COLORS[entry._id] || '#ccc'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-1.5">
                  {byPlatform.map((p) => (
                    <div key={p._id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: PLATFORM_COLORS[p._id] }} />
                        <span className="text-gray-600">{p._id}</span>
                      </div>
                      <span className="font-medium">{p.count}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-gray-400 text-center py-6">Нет данных</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent reviews */}
      <div className="card">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-medium">Последние отзывы</p>
          <button
            onClick={() => navigate('/reviews?filter=unanswered')}
            className="text-3xl text-brand-500 hover:underline"
          >
            Без ответа →
          </button>
        </div>
        <div>
          {recentReviews?.length ? (
            recentReviews.map((review) => (
              <div
                key={review._id}
                onClick={() => navigate(`/reviews/${review._id}`)}
                className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-medium flex-shrink-0">
                  {review.authorName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{review.authorName}</span>
                    <span className="text-xs text-gray-400">{review.platform}</span>
                    <span className="text-xs text-amber-500 ml-auto">{'★'.repeat(review.rating)}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {review.text || 'Без текста'}
                  </p>
                </div>
                {!review.isReplied && (
                  <span className="flex-shrink-0 text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full">
                    без ответа
                  </span>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">
              Отзывов пока нет. <span
                className="text-brand-500 cursor-pointer hover:underline"
                onClick={() => navigate('/locations')}
              >Добавьте точку</span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
