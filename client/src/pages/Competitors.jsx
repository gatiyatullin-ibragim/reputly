import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { businessApi, competitorApi } from '../api'
import { useLanguageStore } from '../store/useLanguageStore'

const NICHES = [
  { value: 'cafe', label: 'Cafe' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'salon', label: 'Salon' },
  { value: 'clinic', label: 'Clinic' },
  { value: 'auto', label: 'Auto' },
  { value: 'other', label: 'Other' },
]

function shortLabel(value) {
  if (!value) return ''
  return value.length > 7 ? `${value.slice(0, 7)}…` : value
}

function extractGooglePlaceId(value) {
  if (!value) return ''
  const trimmed = value.trim()
  const placeIdMatch = trimmed.match(/[?&]place_id=([^&]+)/i)
  if (placeIdMatch) return decodeURIComponent(placeIdMatch[1])

  const qMatch = trimmed.match(/[?&]q=place_id:([^&]+)/i)
  if (qMatch) return decodeURIComponent(qMatch[1])

  const sharedIdMatch = trimmed.match(/!1s([^!/?]+)/i)
  if (sharedIdMatch) return decodeURIComponent(sharedIdMatch[1])

  if (!trimmed.includes('http') && !trimmed.includes('/')) return trimmed
  return ''
}

function extractTwoGisId(value) {
  if (!value) return ''
  const trimmed = value.trim()
  const match = trimmed.match(/\/firm\/(\d+)/i)
  if (match) return match[1]
  if (!trimmed.includes('http') && !trimmed.includes('/')) return trimmed
  return ''
}

function parseSourceLink(value) {
  return {
    googlePlaceId: extractGooglePlaceId(value),
    twoGisId: extractTwoGisId(value),
  }
}

function TooltipContent({ active, payload }) {
  if (!active || !payload?.length) return null

  const row = payload[0].payload

  return (
    <div className="rounded-xl border border-[#e7ebf2] bg-white px-3 py-2 shadow-[0_1px_8px_rgba(15,23,42,0.06)]">
      <p className="text-[12px] font-medium text-[#0f172a]">{row.name}</p>
      <p className="text-[12px] text-[#64748b]">{row.avgRating.toFixed(2)}</p>
    </div>
  )
}

export default function Competitors() {
  const queryClient = useQueryClient()
  const { t } = useLanguageStore()
  const [activeTab, setActiveTab] = useState('mine')
  const [showForm, setShowForm] = useState(false)
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [createForm, setCreateForm] = useState({
    businessId: '',
    name: '',
    sourceLink: '',
    googlePlaceId: '',
    twoGisId: '',
    city: '',
    district: '',
    niche: 'other',
  })
  const [autoFindForm, setAutoFindForm] = useState({
    businessId: '',
    city: '',
    district: '',
    niche: 'other',
  })
  const [filterForm, setFilterForm] = useState({ city: '', district: '', niche: '' })
  const [comparisonRequest, setComparisonRequest] = useState(null)
  const [autoFindResult, setAutoFindResult] = useState(null)
  const [insightsResult, setInsightsResult] = useState(null)

  const { data: businessData } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => businessApi.getAll().then((response) => response.data),
  })

  const { data: competitorsData } = useQuery({
    queryKey: ['competitors'],
    queryFn: () => competitorApi.getAll().then((response) => response.data),
  })

  const { data: comparisonData, isFetching: comparisonLoading } = useQuery({
    queryKey: ['competitorComparison', comparisonRequest],
    queryFn: () => competitorApi.getComparison(comparisonRequest).then((response) => response.data),
    enabled: Boolean(comparisonRequest),
  })

  const businesses = businessData?.businesses || []
  const competitors = competitorsData?.competitors || []
  const cityOptions = Array.from(new Set(competitors.map((item) => item.city).filter(Boolean)))
  const districtOptions = Array.from(new Set(competitors.map((item) => item.district).filter(Boolean)))

  useEffect(() => {
    if (!selectedBusinessId && businesses[0]?._id) {
      const firstBusinessId = businesses[0]._id
      setSelectedBusinessId(firstBusinessId)
      setCreateForm((current) => ({ ...current, businessId: firstBusinessId }))
      setAutoFindForm((current) => ({ ...current, businessId: firstBusinessId }))
    }
  }, [businesses, selectedBusinessId])

  const createMutation = useMutation({
    mutationFn: (data) => competitorApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitors'] })
      queryClient.invalidateQueries({ queryKey: ['competitorComparison'] })
      setShowForm(false)
      setCreateForm({
        businessId: selectedBusinessId || '',
        name: '',
        sourceLink: '',
        googlePlaceId: '',
        twoGisId: '',
        city: '',
        district: '',
        niche: 'other',
      })
    },
  })

  const syncMutation = useMutation({
    mutationFn: (id) => competitorApi.sync(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitors'] })
      queryClient.invalidateQueries({ queryKey: ['competitorComparison'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => competitorApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitors'] })
      queryClient.invalidateQueries({ queryKey: ['competitorComparison'] })
    },
  })

  const autoFindMutation = useMutation({
    mutationFn: (data) => competitorApi.autoFind(data).then((response) => response.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['competitors'] })
      queryClient.invalidateQueries({ queryKey: ['competitorComparison'] })
      setAutoFindResult(data)
    },
  })

  const insightsMutation = useMutation({
    mutationFn: (params) => competitorApi.getInsights(params).then((response) => response.data),
    onSuccess: (data) => {
      setInsightsResult(data)
    },
  })

  const tableRows = comparisonData
    ? [
      {
        name: comparisonData.myBusiness?.name || t('competitors.title'),
        avgRating: comparisonData.myBusiness?.avgRating || 0,
        totalReviews: comparisonData.myBusiness?.totalReviews || 0,
        positivePercent: comparisonData.myBusiness?.positivePercent || 0,
        negativePercent: comparisonData.myBusiness?.negativePercent || 0,
        isMine: true,
      },
      ...(comparisonData.competitors || []).map((item) => ({ ...item, isMine: false })),
    ].sort((left, right) => {
      if (right.avgRating !== left.avgRating) return right.avgRating - left.avgRating
      return right.totalReviews - left.totalReviews
    })
    : []

  const chartData = tableRows.map((row) => ({
    ...row,
    shortName: shortLabel(row.name),
  }))

  const handleSourceLinkChange = (value) => {
    const parsed = parseSourceLink(value)
    setCreateForm((current) => ({
      ...current,
      sourceLink: value,
      googlePlaceId: parsed.googlePlaceId,
      twoGisId: parsed.twoGisId,
    }))
  }

  const handleCreate = () => {
    createMutation.mutate({
      businessId: createForm.businessId,
      name: createForm.name,
      googlePlaceId: createForm.googlePlaceId || null,
      twoGisId: createForm.twoGisId || null,
      city: createForm.city || null,
      district: createForm.district || null,
      niche: createForm.niche,
    })
  }

  const handleCompare = () => {
    if (!selectedBusinessId) return

    setInsightsResult(null)
    setComparisonRequest({
      businessId: selectedBusinessId,
      city: filterForm.city || undefined,
      district: filterForm.district || undefined,
      niche: filterForm.niche || undefined,
    })
  }

  const handleAutoFind = () => {
    autoFindMutation.mutate({
      businessId: autoFindForm.businessId,
      city: autoFindForm.city,
      district: autoFindForm.district || undefined,
      niche: autoFindForm.niche,
    })
  }

  const handleInsights = () => {
    if (!selectedBusinessId) return

    insightsMutation.mutate({
      businessId: selectedBusinessId,
      city: filterForm.city || undefined,
      district: filterForm.district || undefined,
      niche: filterForm.niche || undefined,
    })
  }

  return (
    <div className="p-6 flex flex-col gap-5">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#94a3b8]">{t('competitors.title')}</p>
          <h1 className="text-[28px] md:text-[34px] font-semibold tracking-tight text-[#0f172a] mt-2">Competitor Intelligence</h1>
          <p className="text-[13px] text-[#64748b] mt-2 max-w-2xl">{t('competitors.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          {['mine', 'comparison'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-[12px] rounded-xl border transition-colors ${
                activeTab === tab
                  ? 'bg-[#0f172a] text-white border-[#0f172a]'
                  : 'bg-white text-[#64748b] border-[#e7ebf2] hover:bg-[#f8fafc]'
              }`}
            >
              {tab === 'mine' ? t('competitors.addCompetitor').replace('Add', 'My') : 'Comparison'}
            </button>
          ))}
        </div>
      </header>

      {activeTab === 'mine' ? (
        <>
          <div className="rounded-2xl border border-[#e7ebf2] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
              <div>
                <h2 className="text-[14px] font-medium text-[#0f172a]">AI Auto-find</h2>
                <p className="text-[12px] text-[#94a3b8] mt-0.5">Revi will suggest and add competitors by business name, city, and niche.</p>
              </div>
              <button
                onClick={handleAutoFind}
                className="btn-brand text-xs"
                disabled={autoFindMutation.isPending || !autoFindForm.businessId || !autoFindForm.city}
              >
                {autoFindMutation.isPending ? 'Searching...' : 'Find Competitors'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="label">{t('onboarding.businessName')}</label>
                <select
                  className="input"
                  value={autoFindForm.businessId}
                  onChange={(e) => {
                    const businessId = e.target.value
                    setAutoFindForm((current) => ({ ...current, businessId }))
                    setSelectedBusinessId(businessId)
                    setCreateForm((current) => ({ ...current, businessId }))
                  }}
                >
                  <option value="">{t('onboarding.businessName')}</option>
                  {businesses.map((business) => (
                    <option key={business._id} value={business._id}>{business.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">City</label>
                <input
                  className="input"
                  value={autoFindForm.city}
                  onChange={(e) => setAutoFindForm((current) => ({ ...current, city: e.target.value }))}
                  placeholder="Almaty"
                />
              </div>
              <div>
                <label className="label">District</label>
                <input
                  className="input"
                  value={autoFindForm.district}
                  onChange={(e) => setAutoFindForm((current) => ({ ...current, district: e.target.value }))}
                  placeholder="Central"
                />
              </div>
              <div>
                <label className="label">Niche</label>
                <select
                  className="input"
                  value={autoFindForm.niche}
                  onChange={(e) => setAutoFindForm((current) => ({ ...current, niche: e.target.value }))}
                >
                  {NICHES.map((niche) => (
                    <option key={niche.value} value={niche.value}>{niche.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {autoFindResult && (
              <div className="mt-4 rounded-2xl border border-[#e7ebf2] bg-[#f8fafc] px-4 py-3 text-[13px] text-[#0f172a]">
                <p className="font-medium">{autoFindResult.message || 'AI search completed'}</p>
                <p className="text-[12px] text-[#64748b] mt-1">Competitors added: {autoFindResult.total || 0}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button onClick={() => setShowForm((current) => !current)} className="btn-brand text-xs">
              {t('competitors.addCompetitor')}
            </button>
          </div>

          {showForm && (
            <div className="rounded-2xl border border-[#e7ebf2] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-[14px] font-medium text-[#0f172a] mb-4">{t('competitors.addCompetitor')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="label">{t('onboarding.businessName')}</label>
                  <select
                    className="input"
                    value={createForm.businessId}
                    onChange={(e) => setCreateForm((current) => ({ ...current, businessId: e.target.value }))}
                  >
                    <option value="">{t('onboarding.businessName')}</option>
                    {businesses.map((business) => (
                      <option key={business._id} value={business._id}>{business.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">{t('competitors.name')}</label>
                  <input
                    className="input"
                    value={createForm.name}
                    onChange={(e) => setCreateForm((current) => ({ ...current, name: e.target.value }))}
                    placeholder="Coffee House"
                  />
                </div>
                <div>
                  <label className="label">Google Maps / 2GIS link</label>
                  <input
                    className="input"
                    value={createForm.sourceLink}
                    onChange={(e) => handleSourceLinkChange(e.target.value)}
                    placeholder="https://maps.google.com/..."
                  />
                </div>
                <div>
                  <label className="label">City</label>
                  <input
                    className="input"
                    value={createForm.city}
                    onChange={(e) => setCreateForm((current) => ({ ...current, city: e.target.value }))}
                    placeholder="Almaty"
                  />
                </div>
                <div>
                  <label className="label">District</label>
                  <input
                    className="input"
                    value={createForm.district}
                    onChange={(e) => setCreateForm((current) => ({ ...current, district: e.target.value }))}
                    placeholder="Central"
                  />
                </div>
                <div>
                  <label className="label">Niche</label>
                  <select
                    className="input"
                    value={createForm.niche}
                    onChange={(e) => setCreateForm((current) => ({ ...current, niche: e.target.value }))}
                  >
                    {NICHES.map((niche) => (
                      <option key={niche.value} value={niche.value}>{niche.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleCreate}
                  className="btn-primary"
                  disabled={!createForm.businessId || !createForm.name || createMutation.isPending}
                >
                  {createMutation.isPending ? t('reviews.generating') : t('competitors.addCompetitor')}
                </button>
                <button onClick={() => setShowForm(false)} className="btn-secondary">
                  {t('onboarding.back')}
                </button>
              </div>
            </div>
          )}

          <div className="grid gap-3">
            {competitors.length === 0 ? (
              <div className="rounded-2xl border border-[#e7ebf2] bg-white p-12 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <div className="text-[34px] mb-2">🏆</div>
                <h3 className="text-[16px] font-medium text-[#0f172a]">{t('competitors.noCompetitors')}</h3>
              </div>
            ) : competitors.map((competitor) => (
              <div key={competitor._id} className="rounded-2xl border border-[#e7ebf2] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[15px] font-semibold text-[#0f172a]">{competitor.name}</p>
                    <span className="text-[11px] bg-[#eef0ff] text-[#5B5FEF] px-2 py-0.5 rounded-full">
                      {competitor.niche}
                    </span>
                    {competitor.foundByAI && (
                      <span className="text-[11px] bg-[#eef0ff] text-[#5B5FEF] px-2 py-0.5 rounded-full">AI</span>
                    )}
                  </div>
                  <p className="text-[12px] text-[#94a3b8] mt-1">
                    {competitor.city || '—'} · {competitor.district || '—'}
                  </p>
                  {competitor.aiReason && (
                    <p className="text-[12px] text-[#64748b] mt-2 max-w-2xl">{competitor.aiReason}</p>
                  )}
                  <div className="flex gap-2 mt-3 flex-wrap text-[12px]">
                    <span className="bg-[#f8fafc] border border-[#e7ebf2] text-[#0f172a] px-2.5 py-1 rounded-full">{competitor.stats?.avgRating?.toFixed?.(1) || '0.0'} ★</span>
                    <span className="bg-[#f8fafc] border border-[#e7ebf2] text-[#0f172a] px-2.5 py-1 rounded-full">{competitor.stats?.totalReviews || 0} {t('analytics.totalReviews').toLowerCase()}</span>
                    <span className="bg-[#ecfdf5] text-[#059669] px-2.5 py-1 rounded-full">{competitor.stats?.positivePercent || 0}% positive</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => syncMutation.mutate(competitor._id)}
                    disabled={syncMutation.isPending}
                    className="btn-secondary text-xs"
                  >
                    {t('locations.syncNow')}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(t('locations.deleteConfirm'))) deleteMutation.mutate(competitor._id)
                    }}
                    className="btn-ghost text-xs text-[#dc2626] hover:text-[#b91c1c]"
                  >
                    {t('locations.disconnect')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-[#e7ebf2] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="label">{t('onboarding.businessName')}</label>
                <select
                  className="input"
                  value={selectedBusinessId}
                  onChange={(e) => setSelectedBusinessId(e.target.value)}
                >
                  <option value="">{t('onboarding.businessName')}</option>
                  {businesses.map((business) => (
                    <option key={business._id} value={business._id}>{business.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">City</label>
                <select
                  className="input"
                  value={filterForm.city}
                  onChange={(e) => setFilterForm((current) => ({ ...current, city: e.target.value }))}
                >
                  <option value="">All cities</option>
                  {cityOptions.map((city) => <option key={city} value={city}>{city}</option>)}
                </select>
              </div>
              <div>
                <label className="label">District</label>
                <select
                  className="input"
                  value={filterForm.district}
                  onChange={(e) => setFilterForm((current) => ({ ...current, district: e.target.value }))}
                >
                  <option value="">All districts</option>
                  {districtOptions.map((district) => <option key={district} value={district}>{district}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Niche</label>
                <select
                  className="input"
                  value={filterForm.niche}
                  onChange={(e) => setFilterForm((current) => ({ ...current, niche: e.target.value }))}
                >
                  <option value="">All niches</option>
                  {NICHES.map((niche) => (
                    <option key={niche.value} value={niche.value}>{niche.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-4">
              <button
                onClick={handleInsights}
                className="btn-secondary text-xs"
                disabled={!selectedBusinessId || insightsMutation.isPending}
              >
                {insightsMutation.isPending ? 'Analyzing...' : 'AI Insights'}
              </button>
              <button onClick={handleCompare} className="btn-brand text-xs" disabled={!selectedBusinessId || comparisonLoading}>
                {comparisonLoading ? 'Comparing...' : 'Compare'}
              </button>
            </div>
          </div>

          {insightsResult?.insights && (
            <div className="rounded-2xl border border-[#e7ebf2] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                <h2 className="text-[14px] font-medium text-[#0f172a]">AI Insights</h2>
                <span className="text-[11px] bg-[#eef0ff] text-[#5B5FEF] px-2.5 py-1 rounded-full">
                  Revi analysis
                </span>
              </div>

              <p className="text-[13px] text-[#64748b]">{insightsResult.insights.summary}</p>

              <div className="grid md:grid-cols-2 gap-4 mt-4 text-[13px]">
                <div className="rounded-2xl border border-[#e7ebf2] p-4 bg-[#f8fafc]">
                  <p className="text-[11px] font-medium text-[#94a3b8] uppercase tracking-[0.22em] mb-2">{t('competitors.strength')}</p>
                  <ul className="space-y-2 text-[#0f172a]">
                    {(insightsResult.insights.strongPoints || []).map((point, index) => (
                      <li key={point + index}>• {point}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-[#e7ebf2] p-4 bg-[#f8fafc]">
                  <p className="text-[11px] font-medium text-[#94a3b8] uppercase tracking-[0.22em] mb-2">{t('competitors.weakness')}</p>
                  <ul className="space-y-2 text-[#0f172a]">
                    {(insightsResult.insights.weakPoints || []).map((point, index) => (
                      <li key={point + index}>• {point}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-[#e7ebf2] p-4 bg-[#f8fafc] text-[13px]">
                <p className="text-[11px] font-medium text-[#94a3b8] uppercase tracking-[0.22em] mb-2">Action plan</p>
                <div className="space-y-3">
                  {(insightsResult.insights.actions || []).map((action, index) => (
                    <div key={`${action.action}-${index}`} className="rounded-xl bg-white border border-[#e7ebf2] px-3 py-2">
                      <p className="font-medium text-[#0f172a]">{action.action}</p>
                      <p className="text-[12px] text-[#64748b] mt-1">{action.reason}</p>
                    </div>
                  ))}
                </div>
              </div>

              {insightsResult.insights.vsLeader && (
                <div className="mt-4 rounded-2xl border border-[#e7ebf2] p-4 bg-[#f8fafc] text-[13px] text-[#64748b]">
                  <p className="text-[11px] font-medium text-[#94a3b8] uppercase tracking-[0.22em] mb-2">vs Market leader</p>
                  {insightsResult.insights.vsLeader}
                </div>
              )}
            </div>
          )}

          {!comparisonData ? (
            <div className="rounded-2xl border border-[#e7ebf2] bg-white p-12 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="text-[34px] mb-2">📊</div>
              <p className="text-[14px] font-medium text-[#0f172a]">Select a business and click Compare.</p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-[#e7ebf2] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead className="bg-[#f8fafc] text-[#64748b]">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium">Name</th>
                        <th className="text-left px-4 py-3 font-medium">{t('competitors.rating')}</th>
                        <th className="text-left px-4 py-3 font-medium">{t('competitors.reviewsCount')}</th>
                        <th className="text-left px-4 py-3 font-medium">Positive %</th>
                        <th className="text-left px-4 py-3 font-medium">Negative %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((row) => (
                        <tr
                          key={row.name}
                          className={`${row.isMine ? 'bg-[#eef0ff] border-[#5B5FEF]' : 'hover:bg-[#f8fafc]'} border-b border-[#e7ebf2] last:border-0`}
                        >
                          <td className="px-4 py-3 font-medium text-[#0f172a]">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span>{row.name}</span>
                              {row.foundByAI && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#eef0ff] text-[#5B5FEF]">AI</span>}
                              {row.isMine && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ecfdf5] text-[#059669]">You</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[#0f172a]">{row.avgRating.toFixed(2)}</td>
                          <td className="px-4 py-3 text-[#0f172a]">{row.totalReviews}</td>
                          <td className="px-4 py-3 text-[#059669]">{row.positivePercent}%</td>
                          <td className="px-4 py-3 text-[#dc2626]">{row.negativePercent}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <span className="text-[12px] bg-white border border-[#e7ebf2] rounded-full px-3 py-1 text-[#64748b]">
                  City rank: {comparisonData.cityRank} of {comparisonData.cityTotal || tableRows.length}
                </span>
                <span className="text-[12px] bg-white border border-[#e7ebf2] rounded-full px-3 py-1 text-[#64748b]">
                  District rank: {comparisonData.districtRank} of {comparisonData.districtTotal || tableRows.length}
                </span>
              </div>

              <div className="rounded-2xl border border-[#e7ebf2] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <p className="text-[14px] font-medium text-[#0f172a] mb-4">Rating comparison</p>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="shortName" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 5]} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<TooltipContent />} />
                    <Bar dataKey="avgRating" radius={[6, 6, 0, 0]}>
                      {chartData.map((row) => (
                        <Cell key={row.name} fill={row.isMine ? '#5B5FEF' : '#CBD5E1'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}