import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowUpRight, Bot, CheckCircle2, CircleDot, MessageSquareMore, Sparkles } from 'lucide-react'
import { reviewApi } from '../api'

const FILTERS = [
  { label: 'All', value: '' },
  { label: 'Needs reply', value: 'unanswered' },
  { label: 'Negative', value: 'negative' },
  { label: 'Positive', value: 'positive' },
]

const PLATFORM_BADGE = {
  GOOGLE: 'bg-[#eef0ff] text-[#5B5FEF]',
  TWOGIS: 'bg-[#ecfdf5] text-[#059669]',
  YANDEX: 'bg-[#fff7ed] text-[#d97706]',
  AVITO: 'bg-[#e0f2fe] text-[#0284c7]',
  INSTAGRAM: 'bg-[#fce7f3] text-[#be185d]',
}

const PLATFORM_LABELS = {
  GOOGLE: 'Google',
  TWOGIS: '2GIS',
  YANDEX: 'Яндекс',
  AVITO: 'Avito',
  INSTAGRAM: 'Instagram',
}

const SENTIMENT_META = {
  POSITIVE: {
    title: 'Positive',
    dot: 'bg-[#10B981]',
    pill: 'bg-[#ecfdf5] text-[#059669]',
    accent: 'border-l-[#10B981]',
  },
  NEUTRAL: {
    title: 'Neutral',
    dot: 'bg-[#94a3b8]',
    pill: 'bg-[#f8fafc] text-[#64748b]',
    accent: 'border-l-[#94a3b8]',
  },
  NEGATIVE: {
    title: 'Negative',
    dot: 'bg-[#ef4444]',
    pill: 'bg-[#fee2e2] text-[#dc2626]',
    accent: 'border-l-[#ef4444]',
  },
}

function Avatar({ name }) {
  const letter = (name?.[0] || '?').toUpperCase()
  const code = letter.charCodeAt(0)
  let style = 'bg-[#fce7f3] text-[#be185d]'
  if (code >= 65 && code <= 70) style = 'bg-[#eef0ff] text-[#5B5FEF]'
  else if (code >= 71 && code <= 77) style = 'bg-[#e0f2fe] text-[#0284c7]'
  else if (code >= 78 && code <= 83) style = 'bg-[#fff7ed] text-[#d97706]'

  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 ${style}`}>
      {letter}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-[#e7ebf2] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-[#e7ebf2]" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-40 rounded-full bg-[#e7ebf2]" />
          <div className="h-3 w-24 rounded-full bg-[#e7ebf2]" />
        </div>
      </div>
      <div className="h-4 w-full rounded-full bg-[#e7ebf2] mb-2" />
      <div className="h-4 w-4/5 rounded-full bg-[#e7ebf2] mb-4" />
      <div className="h-10 w-full rounded-xl bg-[#eef0ff]" />
    </div>
  )
}

function buildAiSummary(review) {
  const text = review?.text || ''
  if (!text) return 'Customer left a short signal without text.'

  const lower = text.toLowerCase()
  const topics = []
  if (lower.includes('speed') || lower.includes('быстро') || lower.includes('fast')) topics.push('fast service')
  if (lower.includes('staff') || lower.includes('персонал')) topics.push('staff')
  if (lower.includes('clean') || lower.includes('чист')) topics.push('cleanliness')
  if (lower.includes('coffee') || lower.includes('еда') || lower.includes('food')) topics.push('product quality')

  const topic = topics[0] || 'overall experience'
  const tone = review.sentiment === 'NEGATIVE' ? 'needs attention' : review.sentiment === 'POSITIVE' ? 'looks strong' : 'is balanced'

  return `${topic} ${tone}.`
}

export default function Reviews() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [filter, setFilter] = useState(searchParams.get('filter') || '')
  const [page, setPage] = useState(1)
  const [generatedReplies, setGeneratedReplies] = useState({})
  const [pendingReplyId, setPendingReplyId] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', { filter, page }],
    queryFn: () => reviewApi.getAll({ filter, page, limit: 20 }).then((r) => r.data),
  })

  const generateReplyMutation = useMutation({
    mutationFn: ({ id, style = 'friendly' }) => reviewApi.generate(id, style).then((r) => ({ id, reply: r.data.reply })),
    onMutate: ({ id }) => setPendingReplyId(id),
    onSuccess: ({ id, reply }) => {
      setGeneratedReplies((current) => ({ ...current, [id]: reply }))
      setPendingReplyId(null)
      queryClient.invalidateQueries({ queryKey: ['review', id] })
    },
    onError: () => setPendingReplyId(null),
  })

  const markRepliedMutation = useMutation({
    mutationFn: (id) => reviewApi.markReplied(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['review', id] })
    },
  })

  const stats = useMemo(() => {
    const reviews = data?.reviews || []
    return {
      total: data?.total || 0,
      positive: reviews.filter((review) => review.sentiment === 'POSITIVE').length,
      negative: reviews.filter((review) => review.sentiment === 'NEGATIVE').length,
      unanswered: reviews.filter((review) => !review.isReplied).length,
    }
  }, [data])

  return (
    <div className="p-6 flex flex-col gap-5">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#94a3b8]">Customer inbox</p>
          <h1 className="text-[28px] md:text-[34px] font-semibold tracking-tight text-[#0f172a] mt-2">Conversation cards, not table rows</h1>
          <p className="text-[13px] text-[#64748b] mt-2 max-w-2xl">
            Read the sentiment, generate the reply, and resolve the conversation without losing context.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="badge-neutral">{stats.total} total</span>
          <span className="badge-pending">{stats.unanswered} waiting</span>
          <button onClick={() => navigate('/locations')} className="btn-brand">
            + Add location
          </button>
        </div>
      </header>

      <div className="flex gap-2 flex-wrap items-center">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            onClick={() => { setFilter(item.value); setPage(1) }}
            className={`px-4 py-2 text-[12px] rounded-xl border transition-all duration-200 ${
              filter === item.value
                ? 'bg-[#0f172a] text-white border-[#0f172a]'
                : 'bg-white text-[#64748b] border-[#e7ebf2] hover:bg-[#f8fafc]'
            }`}
          >
            {item.label}
          </button>
        ))}
        <span className="ml-auto text-[12px] text-[#94a3b8] self-center">{data?.total !== undefined ? `${data.total} reviews` : ' '}</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#e7ebf2] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#94a3b8]">Positive</p>
          <p className="text-[32px] font-semibold tracking-tight text-[#0f172a] mt-2">{stats.positive}</p>
          <p className="text-[13px] text-[#64748b] mt-2">Reviews with a good signal and little friction.</p>
        </div>
        <div className="rounded-2xl border border-[#e7ebf2] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#94a3b8]">Negative</p>
          <p className="text-[32px] font-semibold tracking-tight text-[#0f172a] mt-2">{stats.negative}</p>
          <p className="text-[13px] text-[#64748b] mt-2">Pay attention to these conversations first.</p>
        </div>
        <div className="rounded-2xl border border-[#e7ebf2] bg-[#0f172a] p-5 text-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">Reply queue</p>
          <p className="text-[32px] font-semibold tracking-tight mt-2">{stats.unanswered}</p>
          <p className="text-[13px] text-white/60 mt-2">Reviews waiting for a human or AI response.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : !data?.reviews?.length ? (
          <div className="rounded-2xl border border-dashed border-[#dbe2ef] bg-white p-12 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="text-[34px] mb-2">💬</div>
            <h3 className="text-[16px] font-medium text-[#0f172a]">No reviews yet</h3>
            <p className="text-[13px] text-[#64748b] mt-1 max-w-sm mx-auto">
              Connect a location to start filling this inbox with real customer feedback.
            </p>
            <button onClick={() => navigate('/locations')} className="btn-brand mt-4">
              Add location
            </button>
          </div>
        ) : (
          data.reviews.map((review) => {
            const meta = SENTIMENT_META[review.sentiment] || SENTIMENT_META.NEUTRAL
            const aiReply = generatedReplies[review._id] || review.aiReply || ''

            return (
              <motion.article
                key={review._id}
                whileHover={{ y: -2, scale: 1.01 }}
                transition={{ duration: 0.18 }}
                onClick={() => navigate(`/reviews/${review._id}`)}
                className={`cursor-pointer rounded-2xl border border-[#e7ebf2] border-l-4 ${meta.accent} bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-2.5 h-2.5 rounded-full mt-2 flex-shrink-0 ${meta.dot}`} />
                  <Avatar name={review.authorName} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[14px] font-semibold text-[#0f172a]">{review.authorName}</span>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full ${PLATFORM_BADGE[review.platform] || 'bg-[#f8fafc] text-[#64748b]'}`}>
                            {PLATFORM_LABELS[review.platform] || review.platform}
                          </span>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full ${meta.pill}`}>{meta.title}</span>
                        </div>
                        <p className="text-[12px] text-[#94a3b8] mt-1">
                          {review.locationId?.name || 'Location'} · {review.publishedAt ? new Date(review.publishedAt).toLocaleDateString('ru') : '—'}
                        </p>
                      </div>

                      <div className="ml-auto flex items-center gap-1 text-[#f59e0b] text-[12px] font-medium">
                        {'★'.repeat(review.rating)}<span className="text-[#dbe2ef]">{'★'.repeat(5 - review.rating)}</span>
                      </div>
                    </div>

                    <p className="text-[14px] text-[#334155] leading-relaxed mt-4 whitespace-pre-wrap">
                      {review.text || <span className="text-[#94a3b8] italic">No text provided</span>}
                    </p>

                    <div className="grid md:grid-cols-2 gap-3 mt-4">
                      <div className="rounded-2xl border border-[#e7ebf2] bg-[#f8fafc] p-4">
                        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[#94a3b8] mb-2">
                          <Sparkles size={13} /> AI Summary
                        </div>
                        <p className="text-[13px] text-[#0f172a] leading-relaxed">{buildAiSummary(review)}</p>
                      </div>
                      <div className="rounded-2xl border border-[#e7ebf2] bg-[#f8fafc] p-4">
                        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[#94a3b8] mb-2">
                          <Bot size={13} /> AI Reply
                        </div>
                        <p className="text-[13px] text-[#0f172a] leading-relaxed line-clamp-4">
                          {aiReply || 'Generate a suggested answer and keep the tone aligned to your brand.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      {review.isReplied ? <span className="badge-positive inline-flex items-center gap-1"><CheckCircle2 size={11} /> replied</span> : <span className="badge-pending inline-flex items-center gap-1"><CircleDot size={11} /> waiting</span>}
                      {review.sentiment === 'NEGATIVE' && <span className="badge-negative">negative attention</span>}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          generateReplyMutation.mutate({ id: review._id, style: 'friendly' })
                        }}
                        disabled={pendingReplyId === review._id}
                        className="btn-brand text-xs"
                      >
                        {pendingReplyId === review._id ? 'Generating...' : 'AI Reply'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/reviews/${review._id}`)
                        }}
                        className="btn-secondary text-xs"
                      >
                        Open detail
                      </button>
                      {!review.isReplied && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            markRepliedMutation.mutate(review._id)
                          }}
                          className="btn-ghost text-xs"
                        >
                          Mark replied
                        </button>
                      )}
                      <span className="ml-auto text-[12px] text-[#94a3b8] inline-flex items-center gap-1">
                        Quick actions <ArrowUpRight size={13} />
                      </span>
                    </div>
                  </div>
                </div>
              </motion.article>
            )
          })
        )}
      </div>

      {data?.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-ghost text-xs"
          >
            ←
          </button>
          <span className="text-[13px] text-[#64748b]">{page} / {data.pages}</span>
          <button
            onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
            disabled={page === data.pages}
            className="btn-ghost text-xs"
          >
            →
          </button>
        </div>
      )}
    </div>
  )
}