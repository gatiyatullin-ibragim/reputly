import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reviewApi } from '../api'

export default function ReviewDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [style, setStyle] = useState('friendly')
  const [editedReply, setEditedReply] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['review', id],
    queryFn: () => reviewApi.getOne(id).then((r) => r.data.review),
  })

  const generateMutation = useMutation({
    mutationFn: () => reviewApi.generate(id, style),
    onSuccess: ({ data }) => setEditedReply(data.reply),
  })

  const replyMutation = useMutation({
    mutationFn: () => reviewApi.markReplied(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review', id] })
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-full text-gray-400 text-sm">Загрузка...</div>
  )

  const review = data
  const stars = '★'.repeat(review?.rating || 0) + '☆'.repeat(5 - (review?.rating || 0))

  const SENTIMENT_MAP = {
    POSITIVE: { label: 'Позитивный', cls: 'bg-green-50 text-green-700' },
    NEUTRAL:  { label: 'Нейтральный', cls: 'bg-gray-100 text-gray-600' },
    NEGATIVE: { label: 'Негативный', cls: 'bg-red-50 text-red-600' },
  }

  return (
    <div className="p-6 max-w-2xl mx-auto flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-secondary text-xs">← Назад</button>
        <h1 className="text-base font-semibold">Отзыв</h1>
        {review?.isReplied && (
          <span className="ml-auto text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
            ✓ Отвечено
          </span>
        )}
      </div>

      {/* Review card */}
      <div className="card p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
            {review?.authorName?.[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{review?.authorName}</span>
              <span className="text-xs text-gray-400">{review?.platform}</span>
              {review?.sentiment && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${SENTIMENT_MAP[review.sentiment]?.cls}`}>
                  {SENTIMENT_MAP[review.sentiment]?.label}
                </span>
              )}
            </div>
            <div className="text-amber-500 text-sm mt-0.5">{stars}</div>
          </div>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">
          {review?.text || <span className="text-gray-400 italic">Без текста</span>}
        </p>
        {review?.locationId?.name && (
          <p className="text-xs text-gray-400 mt-2">📍 {review.locationId.name}</p>
        )}
      </div>

      {/* AI Reply section */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold mb-4">Ответить на отзыв</h2>

        {/* Style toggle */}
        <div className="flex gap-2 mb-4">
          {[
            { value: 'friendly', label: 'Дружелюбный' },
            { value: 'formal',   label: 'Официальный' },
          ].map((s) => (
            <button
              key={s.value}
              onClick={() => setStyle(s.value)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                style === s.value
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="btn-brand w-full mb-4"
        >
          {generateMutation.isPending ? 'Генерирую...' : '✨ Сгенерировать ответ'}
        </button>

        {(editedReply || review?.aiReply) && (
          <div className="flex flex-col gap-3">
            <textarea
              value={editedReply || review?.aiReply || ''}
              onChange={(e) => setEditedReply(e.target.value)}
              rows={4}
              className="input resize-none"
              placeholder="Ответ появится здесь..."
            />
            {!review?.isReplied && (
              <button
                onClick={() => replyMutation.mutate()}
                disabled={replyMutation.isPending}
                className="btn-secondary w-full"
              >
                {replyMutation.isPending ? 'Сохраняем...' : '✓ Отметить как отвеченный'}
              </button>
            )}
          </div>
        )}

        {generateMutation.isError && (
          <p className="text-xs text-red-500 mt-2">
            Ошибка: {generateMutation.error?.response?.data?.message || 'Попробуйте ещё раз'}
          </p>
        )}
      </div>
    </div>
  )
}
