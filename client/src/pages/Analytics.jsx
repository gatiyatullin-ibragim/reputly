import { useQuery } from '@tanstack/react-query'
import {
  LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { analyticsApi } from '../api'

const PLATFORM_COLORS = {
  GOOGLE: '#4285F4', TWOGIS: '#1D9E75', YANDEX: '#FFCC00', AVITO: '#00AAFF'
}

export default function Analytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => analyticsApi.getDashboard().then((r) => r.data),
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-full text-gray-400 text-sm">Загрузка...</div>
  )

  const { stats, weeklyReviews, byPlatform } = data || {}

  return (
    <div className="p-6 flex flex-col gap-5">
      <h1 className="text-lg font-semibold">Аналитика</h1>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Средний рейтинг', value: stats?.avgRating?.toFixed(2) || '—' },
          { label: 'Всего отзывов',   value: stats?.totalReviews || 0 },
          { label: 'Позитивных',      value: stats?.positiveCount || 0 },
          { label: 'Негативных',      value: stats?.negativeCount || 0 },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className="text-2xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Rating trend */}
      <div className="card">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-medium">Динамика рейтинга</p>
        </div>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={weeklyReviews}>
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
              <YAxis domain={[1, 5]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="avgRating"
                name="Рейтинг"
                stroke="#1D9E75"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly count + platform pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium">Отзывы по неделям</p>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={weeklyReviews} barSize={16}>
                <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="positive" name="Позитив"  stackId="a" fill="#1D9E75" />
                <Bar dataKey="neutral"  name="Нейтраль" stackId="a" fill="#9ca3af" />
                <Bar dataKey="negative" name="Негатив"  stackId="a" fill="#ef4444" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium">По платформам</p>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={byPlatform}
                  dataKey="count"
                  nameKey="_id"
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={60}
                  label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {byPlatform?.map((entry) => (
                    <Cell key={entry._id} fill={PLATFORM_COLORS[entry._id] || '#ccc'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
