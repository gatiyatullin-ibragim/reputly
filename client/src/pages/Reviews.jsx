import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { reviewApi } from '../api'

const FILTERS = [
  { label: 'Все',        value: '' },
  { label: 'Без ответа', value: 'unanswered' },
  { label: 'Негативные', value: 'negative' },
  { label: 'Позитивные', value: 'positive' },
]

const PLATFORM_BADGE = {
  GOOGLE: 'bg-blue-50 text-blue-600',
  TWOGIS: 'bg-green-50 text-green-600',
  YANDEX: 'bg-yellow-50 text-yellow-700',
  AVITO:  'bg-sky-50 text-sky-600',
}

const SENTIMENT_DOT = {
  POSITIVE: 'bg-green-400',
  NEUTRAL:  'bg-gray-300',
  NEGATIVE: 'bg-red-400',
}

export default function Reviews() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [filter, setFilter] = useState(searchParams.get('filter') || '')
  const [page, setPage]     = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', { filter, page }],
    queryFn: () => reviewApi.getAll({ filter, page, limit: 20 }).then((r) => r.data),
  })

  return (
    <div className="p-6 flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Отзывы</h1>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setFilter(f.value); setPage(1) }}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
              filter === f.value
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
        {data?.total !== undefined && (
          <span className="ml-auto text-xs text-gray-400 self-center">
            {data.total} отзывов
          </span>
        )}
      </div>

      {/* List */}
      <div className="card">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-gray-400">Загрузка...</div>
        ) : !data?.reviews?.length ? (
          <div className="py-12 text-center text-sm text-gray-400">Отзывов не найдено</div>
        ) : (
          data.reviews.map((review) => (
            <div
              key={review._id}
              onClick={() => navigate(`/reviews/${review._id}`)}
              className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              {/* Sentiment dot */}
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${SENTIMENT_DOT[review.sentiment] || 'bg-gray-200'}`} />

              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                {review.authorName?.[0]}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium">{review.authorName}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${PLATFORM_BADGE[review.platform] || 'bg-gray-100 text-gray-500'}`}>
                    {review.platform}
                  </span>
                  <span className="text-xs text-gray-400 ml-auto">
                    {review.locationId?.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-amber-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                  <p className="text-xs text-gray-500 truncate">{review.text || 'Без текста'}</p>
                </div>
              </div>

              {/* Status */}
              {!review.isReplied ? (
                <span className="flex-shrink-0 text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full self-start mt-1">
                  без ответа
                </span>
              ) : (
                <span className="flex-shrink-0 text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full self-start mt-1">
                  ✓ отвечено
                </span>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {data?.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary text-xs"
          >
            ←
          </button>
          <span className="text-sm text-gray-500">{page} / {data.pages}</span>
          <button
            onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
            disabled={page === data.pages}
            className="btn-secondary text-xs"
          >
            →
          </button>
        </div>
      )}
    </div>
  )
}
