import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowUpRight, Bot, Gauge, Camera, MapPin, RefreshCw, ShieldCheck, Sparkles, TriangleAlert } from 'lucide-react'
import { locationApi, businessApi } from '../api'

function connectInstagram(locationId) {
  const appId = import.meta.env.VITE_FB_APP_ID
  if (!appId) {
    alert('Не задан VITE_FB_APP_ID')
    return
  }

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: `${window.location.origin}/instagram/callback`,
    scope: 'instagram_basic,instagram_manage_comments,pages_show_list,pages_read_engagement',
    response_type: 'code',
    state: locationId,
  })

  window.location.href = `https://www.facebook.com/v19.0/dialog/oauth?${params}`
}

function platformTags(location) {
  const tags = []
  if (location.googlePlaceId) tags.push({ label: 'Google', tone: 'bg-[#eef0ff] text-[#5B5FEF]' })
  if (location.twoGisId) tags.push({ label: '2GIS', tone: 'bg-[#ecfdf5] text-[#059669]' })
  if (location.yandexOrgId) tags.push({ label: 'Яндекс', tone: 'bg-[#fff7ed] text-[#d97706]' })
  if (location.avitoUrl) tags.push({ label: 'Avito', tone: 'bg-[#e0f2fe] text-[#0284c7]' })
  if (location.instagramBusinessId) tags.push({ label: 'Instagram', tone: 'bg-[#fce7f3] text-[#be185d]' })
  return tags
}

function healthScore(stats = {}) {
  const rating = Number(stats.avgRating || 0)
  const total = Number(stats.totalReviews || 0)
  const unanswered = Number(stats.unansweredCount || 0)
  const positive = Number(stats.positivePercent || 0)
  const baseline = rating ? rating * 18 : 0
  const activity = Math.min(total * 1.4, 22)
  const penalty = unanswered * 3
  return Math.max(0, Math.min(100, Math.round(baseline + activity + positive * 0.2 - penalty)))
}

function suggestAction(location) {
  const score = healthScore(location.stats)
  if (!location.stats?.totalReviews) return 'Connect reviews first, then track the first signal.'
  if (score < 60) return 'Prioritize replies on unresolved reviews and stabilize the rating.'
  if ((location.stats?.unansweredCount || 0) > 3) return 'Keep the inbox tight. Clear the unanswered queue today.'
  return 'The location is healthy. Keep momentum with fast reply habits.'
}

export default function Locations() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    businessId: '', name: '', googlePlaceId: '', twoGisId: '', yandexOrgId: '', avitoUrl: '',
  })

  const { data: locData } = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationApi.getAll().then((r) => r.data),
  })

  const { data: bizData } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => businessApi.getAll().then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: () => locationApi.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] })
      setShowForm(false)
      setForm({ businessId: '', name: '', googlePlaceId: '', twoGisId: '', yandexOrgId: '', avitoUrl: '' })
    },
  })

  const syncMutation = useMutation({ mutationFn: (id) => locationApi.sync(id) })

  const removeMutation = useMutation({
    mutationFn: (id) => locationApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['locations'] }),
  })

  const businesses = bizData?.businesses || []
  const locations = locData?.locations || []

  const createBizMutation = useMutation({
    mutationFn: (name) => businessApi.create({ name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['businesses'] }),
  })

  const [bizName, setBizName] = useState('')

  const overview = useMemo(() => {
    const total = locations.length
    const avg = total ? locations.reduce((sum, location) => sum + healthScore(location.stats), 0) / total : 0
    const connected = locations.reduce((sum, location) => sum + platformTags(location).length, 0)
    return {
      total,
      avg: Math.round(avg),
      connected,
    }
  }, [locations])

  return (
    <div className="p-6 flex flex-col gap-5">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#94a3b8]">Operations</p>
          <h1 className="text-[28px] md:text-[34px] font-semibold tracking-tight text-[#0f172a] mt-2">Every location as a health card</h1>
          <p className="text-[13px] text-[#64748b] mt-2 max-w-2xl">
            Revi shows rating health, platform connections, and the exact action each branch needs next.
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-brand">
          + Add location
        </button>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#e7ebf2] bg-[#0f172a] p-5 text-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">Locations</p>
          <p className="text-[34px] font-semibold tracking-tight mt-2">{overview.total}</p>
          <p className="text-[13px] text-white/60 mt-2">Tracked branches across all businesses.</p>
        </div>
        <div className="rounded-2xl border border-[#e7ebf2] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="rounded-xl bg-[#eef0ff] p-2 text-[#5B5FEF] w-fit mb-4"><Gauge size={16} strokeWidth={1.8} /></div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#94a3b8]">Average health</p>
          <p className="text-[34px] font-semibold tracking-tight text-[#0f172a] mt-2">{overview.avg}</p>
          <p className="text-[13px] text-[#64748b] mt-2">Measured from rating, activity, and unanswered review load.</p>
        </div>
        <div className="rounded-2xl border border-[#e7ebf2] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="rounded-xl bg-[#ecfdf5] p-2 text-[#059669] w-fit mb-4"><ShieldCheck size={16} strokeWidth={1.8} /></div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#94a3b8]">Connected platforms</p>
          <p className="text-[34px] font-semibold tracking-tight text-[#0f172a] mt-2">{overview.connected}</p>
          <p className="text-[13px] text-[#64748b] mt-2">The more channels connected, the more complete the signal.</p>
        </div>
      </section>

      {businesses.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#dbe2ef] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-[14px] font-medium mb-3 text-[#0f172a]">Start with a business</p>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Business name"
              value={bizName}
              onChange={(e) => setBizName(e.target.value)}
            />
            <button
              onClick={() => { createBizMutation.mutate(bizName); setBizName('') }}
              className="btn-primary"
              disabled={!bizName || createBizMutation.isPending}
            >
              Create
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="rounded-2xl border border-[#e7ebf2] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <h2 className="text-[14px] font-medium mb-4 text-[#0f172a]">New location</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label">Business</label>
              <select
                className="input"
                value={form.businessId}
                onChange={(e) => setForm({ ...form, businessId: e.target.value })}
              >
                <option value="">Choose business</option>
                {businesses.map((business) => (
                  <option key={business._id} value={business._id}>{business.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Location name</label>
              <input className="input" placeholder="Flagship store"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Google Place ID</label>
              <input className="input" placeholder="ChIJ..."
                value={form.googlePlaceId} onChange={(e) => setForm({ ...form, googlePlaceId: e.target.value })} />
            </div>
            <div>
              <label className="label">2GIS ID</label>
              <input className="input" placeholder="141265..."
                value={form.twoGisId} onChange={(e) => setForm({ ...form, twoGisId: e.target.value })} />
            </div>
            <div>
              <label className="label">Yandex ID</label>
              <input className="input" placeholder="123456789"
                value={form.yandexOrgId} onChange={(e) => setForm({ ...form, yandexOrgId: e.target.value })} />
            </div>
            <div>
              <label className="label">Avito URL</label>
              <input className="input" placeholder="https://www.avito.ru/..."
                value={form.avitoUrl} onChange={(e) => setForm({ ...form, avitoUrl: e.target.value })} />
            </div>
            <div className="flex gap-2 pt-1 md:col-span-2">
              <button
                onClick={() => createMutation.mutate()}
                disabled={!form.businessId || !form.name || createMutation.isPending}
                className="btn-primary flex-1"
              >
                {createMutation.isPending ? 'Creating...' : 'Create location'}
              </button>
              <button onClick={() => setShowForm(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {locations.length === 0 ? (
        <div className="rounded-2xl border border-[#e7ebf2] bg-white p-12 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="text-[34px] mb-2">📍</div>
          <h3 className="text-[16px] font-medium text-[#0f172a]">No locations yet</h3>
          <p className="text-[13px] text-[#64748b] mt-1">Add your first branch to start monitoring reputation.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {locations.map((location) => {
            const score = healthScore(location.stats)
            const tags = platformTags(location)
            const suggestion = suggestAction(location)

            return (
              <motion.article
                key={location._id}
                whileHover={{ y: -2, scale: 1.01 }}
                transition={{ duration: 0.18 }}
                className="rounded-2xl border border-[#e7ebf2] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-[#eef0ff] text-[#5B5FEF] p-3 border border-[#dadafe]">
                    <MapPin size={18} strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-[15px] font-semibold text-[#0f172a]">{location.name}</p>
                        <p className="text-[12px] text-[#94a3b8] mt-0.5">
                          {location.businessId?.name}
                          {location.lastSyncAt && ` · synced ${new Date(location.lastSyncAt).toLocaleDateString('ru')}`}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[12px] font-medium ${score >= 75 ? 'bg-[#ecfdf5] text-[#059669]' : score >= 50 ? 'bg-[#fff7ed] text-[#d97706]' : 'bg-[#fee2e2] text-[#dc2626]'}`}>
                        Health {score}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                      <div className="rounded-2xl bg-[#f8fafc] border border-[#e7ebf2] p-3">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-[#94a3b8]">Rating</p>
                        <p className="text-[18px] font-semibold text-[#0f172a] mt-1">{location.stats?.avgRating?.toFixed?.(1) || '0.0'}</p>
                      </div>
                      <div className="rounded-2xl bg-[#f8fafc] border border-[#e7ebf2] p-3">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-[#94a3b8]">Pending</p>
                        <p className="text-[18px] font-semibold text-[#0f172a] mt-1">{location.stats?.unansweredCount || 0}</p>
                      </div>
                      <div className="rounded-2xl bg-[#f8fafc] border border-[#e7ebf2] p-3">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-[#94a3b8]">Reviews</p>
                        <p className="text-[18px] font-semibold text-[#0f172a] mt-1">{location.stats?.totalReviews || 0}</p>
                      </div>
                      <div className="rounded-2xl bg-[#f8fafc] border border-[#e7ebf2] p-3">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-[#94a3b8]">Pos%</p>
                        <p className="text-[18px] font-semibold text-[#0f172a] mt-1">{location.stats?.positivePercent || 0}%</p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4 flex-wrap">
                      {tags.length ? tags.map((tag) => (
                        <span key={tag.label} className={`text-[11px] px-2.5 py-1 rounded-full ${tag.tone}`}>{tag.label}</span>
                      )) : <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#f8fafc] text-[#64748b] border border-[#e7ebf2]">No platforms connected</span>}
                    </div>

                    <div className="rounded-2xl bg-[#f8fafc] border border-[#e7ebf2] p-4 mt-4">
                      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[#94a3b8] mb-2">
                        <Bot size={13} /> AI suggestion
                      </div>
                      <p className="text-[13px] text-[#0f172a] leading-relaxed">{suggestion}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-4">
                      <button
                        onClick={() => syncMutation.mutate(location._id)}
                        disabled={syncMutation.isPending}
                        className="btn-secondary text-xs inline-flex items-center gap-2"
                      >
                        <RefreshCw size={14} /> Sync
                      </button>
                      <button
                        type="button"
                        onClick={() => connectInstagram(location._id)}
                        className="btn-ghost text-xs inline-flex items-center gap-2"
                      >
                        <Camera size={14} /> Instagram
                      </button>
                      <button
                        onClick={() => { if (confirm('Delete location?')) removeMutation.mutate(location._id) }}
                        className="btn-ghost text-xs text-[#dc2626] hover:text-[#b91c1c]"
                      >
                        Delete
                      </button>
                      <span className="ml-auto text-[12px] text-[#94a3b8] inline-flex items-center gap-1">
                        Reputation ops <ArrowUpRight size={13} />
                      </span>
                    </div>
                  </div>
                </div>
              </motion.article>
            )
          })}
        </div>
      )}
    </div>
  )
}