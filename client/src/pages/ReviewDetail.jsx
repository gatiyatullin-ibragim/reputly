import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reviewApi } from '../api'
import { useLanguageStore } from '../store/useLanguageStore'

function Avatar({ name, size = 40 }) {
  const letter = (name?.[0] || '?').toUpperCase()
  const code = letter.charCodeAt(0)
  let style = 'bg-[#fce7f3] text-[#be185d]'
  if (code >= 65 && code <= 70) style = 'bg-[#eef0ff] text-[#5B5FEF]'
  else if (code >= 71 && code <= 77) style = 'bg-[#e0f2fe] text-[#0284c7]'
  else if (code >= 78 && code <= 83) style = 'bg-[#fef3c7] text-[#d97706]'

  return (
    <div className={`rounded-full flex items-center justify-center font-medium flex-shrink-0 ${style}`} style={{ width: size, height: size, fontSize: 11 }}>
      {letter}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-[#e7ebf2] rounded-2xl p-6 animate-pulse">
      <div className="h-5 w-40 rounded-full bg-[#f3f4f6] mb-4" />
      <div className="h-4 w-3/4 rounded-full bg-[#f3f4f6] mb-2" />
      <div className="h-4 w-2/3 rounded-full bg-[#f3f4f6]" />
    </div>
  )
}

export default function ReviewDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useLanguageStore()
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

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <div className="xl:col-span-3 flex flex-col gap-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="xl:col-span-2 flex flex-col gap-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    )
  }

  const review = data
  const stars = '★'.repeat(review?.rating || 0) + '☆'.repeat(5 - (review?.rating || 0))

  const SENTIMENT_MAP = {
    POSITIVE: { label: t('reviews.sentiment') + ' (+)', cls: 'bg-[#dcfce7] text-[#16a34a]' },
    NEUTRAL: { label: 'Neutral', cls: 'bg-[#f3f4f6] text-[#6b7280]' },
    NEGATIVE: { label: t('reviews.sentiment') + ' (-)', cls: 'bg-[#fee2e2] text-[#dc2626]' },
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3 flex flex-col gap-4">
          <div className="bg-white border border-[#e7ebf2] rounded-2xl p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-3 mb-5">
              <button onClick={() => navigate(-1)} className="btn-ghost text-xs">← {t('onboarding.back')}</button>
              <h1 className="text-[20px] font-semibold text-[#111]">{t('reviews.title')}</h1>
              {review?.isReplied && <span className="badge-positive ml-auto">✓ {t('reviews.replied')}</span>}
            </div>

            <div className="flex items-start gap-3 mb-4">
              <Avatar name={review?.authorName} size={40} />
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[14px] font-medium text-[#111]">{review?.authorName}</span>
                  <span className="text-[11px] text-[#9ca3af]">{review?.platform}</span>
                  {review?.sentiment && (
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${SENTIMENT_MAP[review.sentiment]?.cls}`}>
                      {SENTIMENT_MAP[review.sentiment]?.label}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-[12px]">
                  <span className="text-[#f59e0b]">{stars.replace(/☆/g, '')}</span>
                  <span className="text-[#e5e7eb]">{stars.replace(/★/g, '')}</span>
                </div>
              </div>
            </div>

            <p className="text-[14px] text-[#374151] leading-relaxed whitespace-pre-wrap">
              {review?.text || <span className="text-[#9ca3af] italic">{t('reviews.draft')}</span>}
            </p>
            {review?.locationId?.name && <p className="text-[12px] text-[#9ca3af] mt-3">📍 {review.locationId.name}</p>}
          </div>

          <div className="bg-white border border-[#e7ebf2] rounded-2xl p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <h2 className="text-[14px] font-medium text-[#111] mb-4">{t('reviews.reply')}</h2>
            <div className="flex gap-2 mb-4">
              {[
                { value: 'friendly', label: t('reviews.styleFriendly') },
                { value: 'formal', label: t('reviews.styleFormal') },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setStyle(item.value)}
                  className={`btn-ghost text-[12px] ${style === item.value ? 'bg-[#111] text-white border-[#111] hover:bg-[#111]' : ''}`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="btn-brand w-full mb-4"
            >
              {generateMutation.isPending ? t('reviews.generating') : '✨ ' + t('reviews.generate')}
            </button>

            {(editedReply || review?.aiReply) && (
              <div className="flex flex-col gap-3">
                <textarea
                  value={editedReply || review?.aiReply || ''}
                  onChange={(e) => setEditedReply(e.target.value)}
                  rows={5}
                  className="input resize-none"
                  placeholder={t('reviews.draft')}
                />
                {!review?.isReplied && (
                  <button
                    onClick={() => replyMutation.mutate()}
                    disabled={replyMutation.isPending}
                    className="btn-ghost w-full"
                  >
                    {replyMutation.isPending ? t('reviews.generating') : '✓ ' + t('reviews.replied')}
                  </button>
                )}
              </div>
            )}

            {generateMutation.isError && (
              <p className="text-[12px] text-[#ef4444] mt-3">
                Error: {generateMutation.error?.response?.data?.message || 'Try again'}
              </p>
            )}
          </div>
        </div>

        <div className="xl:col-span-2 flex flex-col gap-4">
          <div className="bg-white border border-[#e7ebf2] rounded-2xl p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <h3 className="text-[14px] font-medium text-[#111] mb-4">Info</h3>
            <div className="flex flex-col gap-3 text-[13px] text-[#374151]">
              <div className="flex items-center justify-between">
                <span className="text-[#9ca3af]">Platform</span>
                <span>{review?.platform}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#9ca3af]">{t('reviews.rating')}</span>
                <span>{review?.rating} / 5</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#9ca3af]">Status</span>
                <span>{review?.isReplied ? t('reviews.replied') : t('reviews.unanswered')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#9ca3af]">Date</span>
                <span>{review?.publishedAt ? new Date(review.publishedAt).toLocaleDateString('ru') : '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#9ca3af]">Branch</span>
                <span className="text-right">{review?.locationId?.name || '—'}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#0f172a] rounded-2xl p-6 text-white shadow-[0_1px_2px_rgba(15,23,42,0.08)]">
            <p className="text-[11px] uppercase tracking-wider text-white/50 mb-2">Client</p>
            <div className="flex items-center gap-3">
              <Avatar name={review?.authorName} size={44} />
              <div>
                <p className="text-[16px] font-medium">{review?.authorName}</p>
                <p className="text-[12px] text-white/50">{review?.authorAvatar ? 'Has avatar' : 'No avatar'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

