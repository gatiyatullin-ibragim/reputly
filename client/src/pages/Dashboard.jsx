import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line,
} from 'recharts'
import { ArrowUpRight, BrainCircuit, Clock3, MessageSquareMore, Sparkles, TriangleAlert, TrendingUp, Activity } from 'lucide-react'
import { analyticsApi } from '../api'
import { useLanguageStore } from '../store/useLanguageStore'

const PLATFORM_COLORS = {
  GOOGLE: '#5B5FEF',
  TWOGIS: '#10B981',
  YANDEX: '#F59E0B',
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

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (typeof value !== 'number') {
      setDisplay(value)
      return undefined
    }

    let raf
    const startedAt = performance.now()

    const tick = (now) => {
      const progress = Math.min((now - startedAt) / 700, 1)
      setDisplay(Number((value * progress).toFixed(1)))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])

  return <>{typeof value === 'number' ? display : value}</>
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function StatCard({ icon: Icon, label, value, sub, tone = 'light', className = '' }) {
  const base = `rounded-2xl border p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`

  if (tone === 'dark') {
    return (
      <div className={`${base} bg-[#0f172a] border-[#0f172a] text-white flex flex-col justify-between min-h-[160px]`}>
        <div className="flex items-center justify-between mb-4">
          <div className="rounded-xl bg-white/10 p-2">
            <Icon size={16} strokeWidth={1.8} />
          </div>
          {sub && <span className="text-[11px] text-white/50">{sub}</span>}
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">{label}</p>
          <p className="text-[40px] font-semibold leading-none mt-3"><AnimatedNumber value={value} /></p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${base} bg-white border-[#e7ebf2] flex flex-col justify-between min-h-[160px]`}>
      <div className="flex items-center justify-between mb-4">
        <div className="rounded-xl bg-[#eef0ff] text-[#5B5FEF] p-2">
          <Icon size={16} strokeWidth={1.8} />
        </div>
        {sub && <span className="text-[11px] text-[#94a3b8]">{sub}</span>}
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#94a3b8]">{label}</p>
        <p className="text-[38px] font-semibold leading-none mt-3 text-[#0f172a]"><AnimatedNumber value={value} /></p>
      </div>
    </div>
  )
}

function TooltipCard({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-2xl border border-[#e7ebf2] bg-white px-3 py-2 text-[12px] text-[#0f172a] shadow-[0_1px_8px_rgba(15,23,42,0.06)]">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey} style={{ color: item.color }}>
          {item.name}: {item.value}
        </p>
      ))}
    </div>
  )
}

function buildAiSummary(stats, weeklyReviews, recentReviews, t) {
  const totalReviews = stats?.totalReviews || 0
  const unanswered = stats?.unansweredCount || 0
  const latestWeek = weeklyReviews?.[weeklyReviews.length - 1]
  const previousWeek = weeklyReviews?.[weeklyReviews.length - 2]
  const delta = latestWeek && previousWeek ? Number((latestWeek.avgRating - previousWeek.avgRating).toFixed(1)) : 0
  const latestPlatform = recentReviews?.[0]?.platform

  if (!totalReviews) {
    return t('dashboard.noReviews')
  }

  const firstSentence = delta >= 0
    ? t('dashboard.sentimentAware') + ': ' + t('dashboard.ratingTrend') + ' +' + delta
    : t('dashboard.sentimentAware') + ': ' + t('dashboard.ratingTrend') + ' ' + delta

  const secondSentence = latestPlatform
    ? `Platform: ${PLATFORM_LABELS[latestPlatform] || latestPlatform}.`
    : ''

  const thirdSentence = unanswered > 0
    ? t('reviews.unanswered') + ': ' + unanswered
    : t('dashboard.replyReady')

  return `${firstSentence}. ${secondSentence} ${thirdSentence}`
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { t } = useLanguageStore()

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => analyticsApi.getDashboard().then((r) => r.data),
  })

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col gap-5">
        <div className="h-8 w-56 rounded-full bg-[#e7ebf2] animate-pulse" />
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <div className="xl:col-span-5 h-[280px] rounded-2xl bg-white border border-[#e7ebf2] animate-pulse" />
          <div className="xl:col-span-4 h-[280px] rounded-2xl bg-white border border-[#e7ebf2] animate-pulse" />
          <div className="xl:col-span-3 h-[280px] rounded-2xl bg-white border border-[#e7ebf2] animate-pulse" />
        </div>
      </div>
    )
  }

  const { stats, weeklyReviews, byPlatform, recentReviews } = data || {}
  const unansweredCount = stats?.unansweredCount ?? 0
  const positivePercent = stats?.totalReviews ? Math.round((stats.positiveCount / stats.totalReviews) * 100) : 0
  const score = clamp(Math.round((stats?.avgRating || 0) * 20 + positivePercent * 0.35 - unansweredCount * 1.2), 0, 100)
  const weeklyDelta = weeklyReviews?.length > 1
    ? Number((weeklyReviews[weeklyReviews.length - 1]?.avgRating - weeklyReviews[weeklyReviews.length - 2]?.avgRating).toFixed(1))
    : 0
  const aiSummary = buildAiSummary(stats, weeklyReviews, recentReviews, t)
  const urgentReviews = recentReviews?.filter((review) => !review.isReplied).length || 0

  return (
    <div className="p-6 flex flex-col gap-5">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#94a3b8]">{t('header.reputationCenter')}</p>
          <h1 className="text-[28px] md:text-[34px] font-semibold tracking-tight text-[#0f172a] mt-2">{t('header.title')}</h1>
          <p className="text-[13px] text-[#64748b] mt-2 max-w-2xl">
            {t('header.subtitle')}
          </p>
        </div>
        <button onClick={() => navigate('/locations')} className="btn-brand">
          {t('header.addLocation')}
        </button>
      </header>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <StatCard
          className="xl:col-span-5"
          icon={Sparkles}
          label={t('dashboard.reputationScore')}
          value={score}
          sub={`${weeklyDelta >= 0 ? '+' : ''}${weeklyDelta || 0} ${t('dashboard.ratingTrend')}`}
          tone="dark"
        />

        <div className="xl:col-span-4 rounded-2xl border border-[#e7ebf2] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between min-h-[160px]">
          <div className="flex items-center justify-between mb-4">
            <div className="rounded-xl bg-[#eef0ff] p-2 text-[#5B5FEF]">
              <BrainCircuit size={16} strokeWidth={1.8} />
            </div>
            <span className="text-[11px] uppercase tracking-[0.22em] text-[#94a3b8]">{t('dashboard.aiSummary')}</span>
          </div>
          <p className="text-[16px] md:text-[18px] font-semibold tracking-tight text-[#0f172a] leading-tight">
            {aiSummary}
          </p>
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="badge-neutral">{t('dashboard.sentimentAware')}</span>
            <span className="badge-neutral">{t('dashboard.autoPrioritized')}</span>
            <span className="badge-neutral">{t('dashboard.replyReady')}</span>
          </div>
        </div>

        <div className="xl:col-span-3 rounded-2xl border border-[#e7ebf2] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between min-h-[160px]">
          <div className="flex items-center justify-between mb-4">
            <div className="rounded-xl bg-[#fff7ed] p-2 text-[#f59e0b]">
              <TriangleAlert size={16} strokeWidth={1.8} />
            </div>
            <span className="text-[11px] uppercase tracking-[0.22em] text-[#94a3b8]">{t('dashboard.urgent')}</span>
          </div>
          <div>
            <p className="text-[36px] font-semibold tracking-tight text-[#0f172a] leading-none">{urgentReviews}</p>
            <p className="text-[13px] text-[#64748b] mt-3">{t('dashboard.urgentSub')}</p>
          </div>
          <button onClick={() => navigate('/reviews?filter=unanswered')} className="mt-4 text-[13px] font-medium text-brand-500 inline-flex items-center gap-1">
            {t('dashboard.openInbox')} <ArrowUpRight size={14} />
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8 rounded-2xl border border-[#e7ebf2] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[14px] font-medium text-[#0f172a]">{t('dashboard.recentChanges')}</p>
              <p className="text-[12px] text-[#94a3b8] mt-0.5">{t('dashboard.recentChangesSub')}</p>
            </div>
            <span className="text-[11px] uppercase tracking-[0.22em] text-[#94a3b8]">{t('dashboard.live')}</span>
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
              <p className="text-[14px] font-medium text-[#0f172a]">{t('dashboard.recentReviews')}</p>
              <p className="text-[12px] text-[#94a3b8] mt-0.5">{t('dashboard.recentReviewsSub')}</p>
            </div>
            <Clock3 size={16} className="text-[#94a3b8]" />
          </div>

          <div className="flex flex-col gap-3">
            {latestActivities.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="rounded-2xl border border-[#e7ebf2] bg-[#f8fafc] p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-white p-2 text-[#5B5FEF] border border-[#e7ebf2]">
                      <Icon size={15} strokeWidth={1.8} />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-[#0f172a]">{item.title}</p>
                      <p className="text-[12px] text-[#64748b] mt-0.5">{item.subtitle}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#e7ebf2] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[14px] font-medium text-[#0f172a]">{t('dashboard.platformShare')}</p>
            <span className="text-[11px] uppercase tracking-[0.22em] text-[#94a3b8]">{t('dashboard.platformShareSub')}</span>
          </div>

          {byPlatform?.length ? (
            <>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie data={byPlatform} dataKey="count" nameKey="_id" cx="50%" cy="50%" innerRadius={36} outerRadius={60} paddingAngle={2}>
                    {byPlatform.map((entry) => (
                      <Cell key={entry._id} fill={PLATFORM_COLORS[entry._id] || '#cbd5e1'} />
                    ))}
                  </Pie>
                  <Tooltip content={<TooltipCard />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 flex flex-col gap-2">
                {byPlatform.map((item) => (
                  <div key={item._id} className="flex items-center justify-between text-[12px]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: PLATFORM_COLORS[item._id] || '#cbd5e1' }} />
                      <span className="text-[#475569]">{PLATFORM_LABELS[item._id] || item._id}</span>
                    </div>
                    <span className="font-medium text-[#0f172a]">{item.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-10 text-center text-[13px] text-[#94a3b8]">{t('dashboard.noReviews')}</div>
          )}
        </div>

        <div className="rounded-2xl border border-[#e7ebf2] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[14px] font-medium text-[#0f172a]">{t('dashboard.waitingReply')}</p>
            <Sparkles size={16} className="text-brand-500" />
          </div>
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl bg-[#eef0ff] p-4 border border-[#dadafe]">
              <p className="text-[12px] text-[#5B5FEF] uppercase tracking-[0.22em]">{t('reviews.unanswered')}</p>
              <p className="text-[30px] font-semibold text-[#0f172a] mt-2">{unansweredCount}</p>
            </div>
            <div className="rounded-2xl bg-[#f8fafc] p-4 border border-[#e7ebf2]">
              <p className="text-[12px] text-[#64748b]">{t('dashboard.waitingReplySub')}</p>
              <p className="text-[15px] font-medium text-[#0f172a] mt-1">Reply within 1 hour keeps the inbox calm.</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#e7ebf2] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[14px] font-medium text-[#0f172a]">{t('dashboard.recentReviews')}</p>
            <button onClick={() => navigate('/reviews')} className="text-[13px] font-medium text-brand-500 inline-flex items-center gap-1">
              {t('reviews.viewDetail')} <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {recentReviews?.length ? recentReviews.map((review) => (
              <button
                key={review._id}
                onClick={() => navigate(`/reviews/${review._id}`)}
                className="rounded-2xl border border-[#e7ebf2] bg-[#f8fafc] p-4 text-left hover:border-[#dadafe] hover:bg-[#eef0ff] transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-medium text-[#0f172a]">{review.authorName}</p>
                    <p className="text-[12px] text-[#64748b] mt-0.5">{PLATFORM_LABELS[review.platform] || review.platform}</p>
                  </div>
                  <span className="text-[12px] text-[#f59e0b] font-medium">{'★'.repeat(review.rating)}</span>
                </div>
                <p className="text-[12px] text-[#64748b] mt-3 line-clamp-2">{review.text || 'No text provided'}</p>
                <div className="mt-3 flex items-center gap-2">
                  {review.isReplied ? <span className="badge-positive">{t('reviews.replied')}</span> : <span className="badge-pending">{t('reviews.unanswered')}</span>}
                  {review.sentiment === 'NEGATIVE' && <span className="badge-negative">{t('reviews.sentiment')} (-)</span>}
                </div>
              </button>
            )) : (
              <div className="rounded-2xl border border-dashed border-[#dbe2ef] p-8 text-center text-[13px] text-[#94a3b8]">
                {t('dashboard.noReviews')}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}