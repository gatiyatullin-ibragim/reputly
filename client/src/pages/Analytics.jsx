import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import { BrainCircuit, Sparkles, TrendingUp, MessageSquareMore, Target, ArrowUpRight } from 'lucide-react'
import { analyticsApi } from '../api'

const PLATFORM_COLORS = {
  GOOGLE: '#5B5FEF',
  TWOGIS: '#10B981',
  YANDEX: '#f0d433',
  AVITO: '#38BDF8',
  INSTAGRAM: '#EC4899',
}

const PLATFORM_LABELS = {
  GOOGLE: 'Google',
  TWOGIS: '2GIS',
  YANDEX: 'Яндекс',
  AVITO: 'Avito',
  INSTAGRAM: 'Instagram',
}

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-white border border-[#e7ebf2] rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`} />
}

function TooltipCard({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-2xl border border-[#e7ebf2] bg-white px-3 py-2 text-[12px] text-[#0f172a] shadow-[0_1px_8px_rgba(15,23,42,0.06)]">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey} style={{ color: item.color }}>{item.name}: {item.value}</p>
      ))}
    </div>
  )
}

function LightTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="rounded-2xl border border-[#e7ebf2] bg-white px-3 py-2 text-[12px] text-[#0f172a] shadow-[0_1px_8px_rgba(15,23,42,0.06)]">
      <p className="font-medium">{item.payload?.name || item.name}</p>
      <p className="text-[#64748b]">{item.value}</p>
    </div>
  )
}

function extractKeywords(reviews = []) {
  const stopWords = new Set(['the', 'and', 'или', 'это', 'очень', 'как', 'для', 'with', 'the', 'a', 'на', 'в', 'и', 'не', 'но', 'что', 'this', 'that'])
  const counts = new Map()

  reviews.forEach((review) => {
    const words = (review.text || '')
      .toLowerCase()
      .replace(/[^a-zа-я0-9\s]/gi, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 3 && !stopWords.has(word))

    words.forEach((word) => counts.set(word, (counts.get(word) || 0) + 1))
  })

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([word, count]) => ({ word, count }))
}

function toneLabel(percent) {
  if (percent >= 70) return 'Strong'
  if (percent >= 45) return 'Mixed'
  return 'At risk'
}

export default function Analytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => analyticsApi.getDashboard().then((r) => r.data),
  })

  if (isLoading) {
    return (
      <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    )
  }

  const { stats, weeklyReviews, byPlatform, recentReviews } = data || {}
  const totalReviews = stats?.totalReviews || 0
  const positivePercent = totalReviews ? Math.round((stats?.positiveCount || 0) / totalReviews * 100) : 0
  const negativePercent = totalReviews ? Math.round((stats?.negativeCount || 0) / totalReviews * 100) : 0
  const keywords = useMemo(() => extractKeywords(recentReviews), [recentReviews])

  const avgTrend = weeklyReviews?.length > 1
    ? Number((weeklyReviews[weeklyReviews.length - 1]?.avgRating - weeklyReviews[weeklyReviews.length - 2]?.avgRating).toFixed(1))
    : 0

  const strongestPlatform = [...(byPlatform || [])].sort((left, right) => right.avgRating - left.avgRating)[0]
  const complaintTopic = negativePercent > 0 ? (keywords[0]?.word || 'speed') : 'low complaint volume'
  const praiseTopic = keywords[0]?.word || 'service'

  return (
    <div className="p-6 flex flex-col gap-5">
      <header>
        <p className="text-[11px] uppercase tracking-[0.24em] text-[#94a3b8]">Understanding the signal</p>
        <h1 className="text-[28px] md:text-[34px] font-semibold tracking-tight text-[#0f172a] mt-2">Analytics that explain themselves</h1>
        <p className="text-[13px] text-[#64748b] mt-2 max-w-2xl">
          Revi turns sentiment and rating movement into clear narrative blocks so you know what to fix and what to double down on.
        </p>
      </header>

      <section className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#e7ebf2] bg-[#0f172a] p-5 text-white shadow-[0_1px_2px_rgba(15,23,42,0.06)] xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="rounded-xl bg-white/10 p-2"><BrainCircuit size={16} strokeWidth={1.8} /></div>
            <span className="text-[11px] uppercase tracking-[0.22em] text-white/45">AI insights</span>
          </div>
          <p className="text-[22px] font-semibold tracking-tight leading-tight">
            {totalReviews
              ? `Your reputation is ${toneLabel(positivePercent)}: ${positivePercent}% positive, ${negativePercent}% negative.`
              : 'Connect reviews to unlock insights.'}
          </p>
          <div className="grid sm:grid-cols-3 gap-3 mt-5">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">Trending</p>
              <p className="text-[14px] font-medium mt-2">{praiseTopic}</p>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">Complaint</p>
              <p className="text-[14px] font-medium mt-2">{complaintTopic}</p>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">Trend</p>
              <p className="text-[14px] font-medium mt-2">{avgTrend >= 0 ? `+${avgTrend}` : avgTrend} rating</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#e7ebf2] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="rounded-xl bg-[#eef0ff] p-2 text-[#5B5FEF] w-fit mb-4"><Sparkles size={16} strokeWidth={1.8} /></div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#94a3b8]">Most praised</p>
          <p className="text-[24px] font-semibold tracking-tight text-[#0f172a] mt-2">{praiseTopic}</p>
          <p className="text-[13px] text-[#64748b] mt-2">This theme appears most often in recent reviews.</p>
        </div>

        <div className="rounded-2xl border border-[#e7ebf2] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="rounded-xl bg-[#fff7ed] p-2 text-[#f59e0b] w-fit mb-4"><MessageSquareMore size={16} strokeWidth={1.8} /></div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#94a3b8]">Most common complaint</p>
          <p className="text-[24px] font-semibold tracking-tight text-[#0f172a] mt-2">{complaintTopic}</p>
          <p className="text-[13px] text-[#64748b] mt-2">Use this as the first operational fix.</p>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8 rounded-2xl border border-[#e7ebf2] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[14px] font-medium text-[#0f172a]">Rating movement</p>
              <p className="text-[12px] text-[#94a3b8] mt-0.5">How sentiment changed over the past four weeks</p>
            </div>
            <span className="text-[11px] uppercase tracking-[0.22em] text-[#94a3b8]">trend</span>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={weeklyReviews}>
              <XAxis dataKey="_id" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[1, 5]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<TooltipCard />} />
              <Line type="monotone" dataKey="avgRating" name="Average rating" stroke="#5B5FEF" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="xl:col-span-4 rounded-2xl border border-[#e7ebf2] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[14px] font-medium text-[#0f172a]">Sentiment balance</p>
              <p className="text-[12px] text-[#94a3b8] mt-0.5">Explains the share of reactions</p>
            </div>
            <Target size={16} className="text-[#94a3b8]" />
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Positive', value: positivePercent },
                  { name: 'Negative', value: negativePercent },
                  { name: 'Neutral', value: Math.max(0, 100 - positivePercent - negativePercent) },
                ]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={70}
                paddingAngle={2}
              >
                <Cell fill="#10B981" />
                <Cell fill="#EF4444" />
                <Cell fill="#CBD5E1" />
              </Pie>
              <Tooltip content={<LightTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#e7ebf2] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[14px] font-medium text-[#0f172a]">Trending keywords</p>
            <TrendingUp size={16} className="text-[#94a3b8]" />
          </div>
          <div className="flex flex-wrap gap-2">
            {keywords.length ? keywords.map((keyword) => (
              <span key={keyword.word} className="px-3 py-1.5 rounded-full bg-[#f8fafc] border border-[#e7ebf2] text-[12px] text-[#334155]">
                {keyword.word} <span className="text-[#94a3b8]">{keyword.count}</span>
              </span>
            )) : <p className="text-[13px] text-[#94a3b8]">No keyword patterns yet.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-[#e7ebf2] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[14px] font-medium text-[#0f172a]">Platform explanation</p>
            <ArrowUpRight size={16} className="text-[#94a3b8]" />
          </div>
          <div className="flex flex-col gap-3">
            {byPlatform?.slice(0, 4).map((item) => (
              <div key={item._id} className="rounded-2xl bg-[#f8fafc] border border-[#e7ebf2] p-4 flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-medium text-[#0f172a]">{PLATFORM_LABELS[item._id] || item._id}</p>
                  <p className="text-[12px] text-[#64748b] mt-0.5">{item.count} reviews</p>
                </div>
                <span className="text-[12px] font-medium text-[#5B5FEF]">{item.avgRating?.toFixed?.(1) || '0.0'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#e7ebf2] bg-[#0f172a] p-5 text-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[14px] font-medium">Recommended move</p>
            <BrainCircuit size={16} className="text-white/55" />
          </div>
          <p className="text-[20px] font-semibold tracking-tight leading-snug">
            {negativePercent > 25
              ? 'Fix the recurring complaint theme before pushing more acquisition.'
              : 'Double down on the strongest topic and reply faster to preserve momentum.'}
          </p>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="mt-4 text-[13px] font-medium text-white/80 inline-flex items-center gap-1">
            Jump to top <ArrowUpRight size={14} />
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-[#e7ebf2] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[14px] font-medium text-[#0f172a]">Review velocity</p>
            <p className="text-[12px] text-[#94a3b8] mt-0.5">Volume and sentiment by week</p>
          </div>
          <span className="text-[11px] uppercase tracking-[0.22em] text-[#94a3b8]">volume</span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={weeklyReviews} barSize={18}>
            <XAxis dataKey="_id" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<LightTooltip />} />
            <Bar dataKey="positive" name="Positive" stackId="a" fill="#10B981" />
            <Bar dataKey="neutral" name="Neutral" stackId="a" fill="#CBD5E1" />
            <Bar dataKey="negative" name="Negative" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>
    </div>
  )
}