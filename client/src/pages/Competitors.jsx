import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { businessApi, competitorApi } from '../api'

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
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-gray-900">{row.name}</p>
      <p className="text-xs text-gray-500">Рейтинг: {row.avgRating.toFixed(2)}</p>
    </div>
  )
}

export default function Competitors() {
  const queryClient = useQueryClient()
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
        name: comparisonData.myBusiness?.name || 'Мой бизнес',
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
    <div className="p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-lg font-semibold">Конкуренты</h1>
        <div className="flex gap-2">
          {['mine', 'comparison'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                activeTab === tab
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab === 'mine' ? 'Мои конкуренты' : 'Сравнение'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'mine' ? (
        <>
          <div className="card p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
              <div>
                <h2 className="text-sm font-semibold">AI-автопоиск конкурентов</h2>
                <p className="text-xs text-gray-500 mt-1">Revi предложит и добавит конкурентов по названию бизнеса, городу и нише.</p>
              </div>
              <button
                onClick={handleAutoFind}
                className="btn-brand text-xs"
                disabled={autoFindMutation.isPending || !autoFindForm.businessId || !autoFindForm.city}
              >
                {autoFindMutation.isPending ? 'Ищем...' : 'Найти конкурентов'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="label">Бизнес</label>
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
                  <option value="">Выберите бизнес</option>
                  {businesses.map((business) => (
                    <option key={business._id} value={business._id}>{business.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Город</label>
                <input
                  className="input"
                  value={autoFindForm.city}
                  onChange={(e) => setAutoFindForm((current) => ({ ...current, city: e.target.value }))}
                  placeholder="Алматы"
                />
              </div>
              <div>
                <label className="label">Район</label>
                <input
                  className="input"
                  value={autoFindForm.district}
                  onChange={(e) => setAutoFindForm((current) => ({ ...current, district: e.target.value }))}
                  placeholder="Центральный"
                />
              </div>
              <div>
                <label className="label">Ниша</label>
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
              <div className="mt-4 rounded-xl border border-[#e8ecea] bg-[#f8f9fa] px-4 py-3 text-sm text-[#111]">
                <p className="font-medium">{autoFindResult.message || 'AI-поиск завершён'}</p>
                <p className="text-xs text-gray-500 mt-1">Добавлено конкурентов: {autoFindResult.total || 0}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button onClick={() => setShowForm((current) => !current)} className="btn-brand text-xs">
              + Добавить конкурента
            </button>
          </div>

          {showForm && (
            <div className="card p-5">
              <h2 className="text-sm font-semibold mb-4">Новый конкурент</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="label">Бизнес</label>
                  <select
                    className="input"
                    value={createForm.businessId}
                    onChange={(e) => setCreateForm((current) => ({ ...current, businessId: e.target.value }))}
                  >
                    <option value="">Выберите бизнес</option>
                    {businesses.map((business) => (
                      <option key={business._id} value={business._id}>{business.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Название</label>
                  <input
                    className="input"
                    value={createForm.name}
                    onChange={(e) => setCreateForm((current) => ({ ...current, name: e.target.value }))}
                    placeholder="Кофе Хаус"
                  />
                </div>
                <div>
                  <label className="label">Google Maps ссылка / 2GIS ссылка</label>
                  <input
                    className="input"
                    value={createForm.sourceLink}
                    onChange={(e) => handleSourceLinkChange(e.target.value)}
                    placeholder="https://maps.google.com/..."
                  />
                </div>
                <div>
                  <label className="label">Город</label>
                  <input
                    className="input"
                    value={createForm.city}
                    onChange={(e) => setCreateForm((current) => ({ ...current, city: e.target.value }))}
                    placeholder="Москва"
                  />
                </div>
                <div>
                  <label className="label">Район</label>
                  <input
                    className="input"
                    value={createForm.district}
                    onChange={(e) => setCreateForm((current) => ({ ...current, district: e.target.value }))}
                    placeholder="Центральный"
                  />
                </div>
                <div>
                  <label className="label">Ниша</label>
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
                  {createMutation.isPending ? 'Сохраняем...' : 'Создать'}
                </button>
                <button onClick={() => setShowForm(false)} className="btn-secondary">
                  Отмена
                </button>
              </div>
            </div>
          )}

          <div className="grid gap-3">
            {competitors.length === 0 ? (
              <div className="card p-10 text-center text-sm text-gray-400">Конкурентов пока нет.</div>
            ) : competitors.map((competitor) => (
              <div key={competitor._id} className="card p-4 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold">{competitor.name}</p>
                    <span className="text-xs bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full">
                      {competitor.niche}
                    </span>
                    {competitor.foundByAI && (
                      <span className="text-xs bg-[#eef0ff] text-[#5B5FEF] px-2 py-0.5 rounded-full">AI</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {competitor.city || '—'} · {competitor.district || '—'}
                  </p>
                  {competitor.aiReason && (
                    <p className="text-xs text-gray-500 mt-2 max-w-2xl">{competitor.aiReason}</p>
                  )}
                  <div className="flex gap-2 mt-3 flex-wrap text-xs">
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{competitor.stats?.avgRating?.toFixed?.(1) || '0.0'} ★</span>
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{competitor.stats?.totalReviews || 0} отзывов</span>
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{competitor.stats?.positivePercent || 0}% позитивных</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => syncMutation.mutate(competitor._id)}
                    disabled={syncMutation.isPending}
                    className="btn-secondary text-xs"
                  >
                    Синхронизировать
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Удалить конкурента?')) deleteMutation.mutate(competitor._id)
                    }}
                    className="btn-secondary text-xs text-red-500 hover:text-red-600"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="card p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="label">Бизнес</label>
                <select
                  className="input"
                  value={selectedBusinessId}
                  onChange={(e) => setSelectedBusinessId(e.target.value)}
                >
                  <option value="">Выберите бизнес</option>
                  {businesses.map((business) => (
                    <option key={business._id} value={business._id}>{business.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Город</label>
                <select
                  className="input"
                  value={filterForm.city}
                  onChange={(e) => setFilterForm((current) => ({ ...current, city: e.target.value }))}
                >
                  <option value="">Все города</option>
                  {cityOptions.map((city) => <option key={city} value={city}>{city}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Район</label>
                <select
                  className="input"
                  value={filterForm.district}
                  onChange={(e) => setFilterForm((current) => ({ ...current, district: e.target.value }))}
                >
                  <option value="">Все районы</option>
                  {districtOptions.map((district) => <option key={district} value={district}>{district}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Ниша</label>
                <select
                  className="input"
                  value={filterForm.niche}
                  onChange={(e) => setFilterForm((current) => ({ ...current, niche: e.target.value }))}
                >
                  <option value="">Все ниши</option>
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
                {insightsMutation.isPending ? 'Анализируем...' : 'AI-инсайты'}
              </button>
              <button onClick={handleCompare} className="btn-brand text-xs" disabled={!selectedBusinessId || comparisonLoading}>
                {comparisonLoading ? 'Сравниваем...' : 'Сравнить'}
              </button>
            </div>
          </div>

          {insightsResult?.insights && (
            <div className="card p-5">
              <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                <h2 className="text-sm font-semibold">AI-инсайты</h2>
                <span className="text-xs bg-[#eef0ff] text-[#5B5FEF] px-2 py-0.5 rounded-full">
                  Revi analysis
                </span>
              </div>

              <p className="text-sm text-gray-700">{insightsResult.insights.summary}</p>

              <div className="grid md:grid-cols-2 gap-4 mt-4 text-sm">
                <div className="rounded-xl border border-gray-200 p-4 bg-white">
                  <p className="text-xs font-medium text-gray-500 mb-2">Сильные стороны</p>
                  <ul className="space-y-2 text-gray-700">
                    {(insightsResult.insights.strongPoints || []).map((point, index) => (
                      <li key={point + index}>• {point}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 bg-white">
                  <p className="text-xs font-medium text-gray-500 mb-2">Слабые стороны</p>
                  <ul className="space-y-2 text-gray-700">
                    {(insightsResult.insights.weakPoints || []).map((point, index) => (
                      <li key={point + index}>• {point}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-gray-200 p-4 bg-white text-sm">
                <p className="text-xs font-medium text-gray-500 mb-2">Что делать</p>
                <div className="space-y-3">
                  {(insightsResult.insights.actions || []).map((action, index) => (
                    <div key={`${action.action}-${index}`} className="rounded-lg bg-[#f8f9fa] px-3 py-2">
                      <p className="font-medium">{action.action}</p>
                      <p className="text-xs text-gray-500 mt-1">{action.reason}</p>
                    </div>
                  ))}
                </div>
              </div>

              {insightsResult.insights.vsLeader && (
                <div className="mt-4 rounded-xl border border-gray-200 p-4 bg-white text-sm text-gray-700">
                  <p className="text-xs font-medium text-gray-500 mb-2">До лидера рынка</p>
                  {insightsResult.insights.vsLeader}
                </div>
              )}
            </div>
          )}

          {!comparisonData ? (
            <div className="card p-10 text-center text-sm text-gray-400">
              Выберите бизнес и нажмите «Сравнить».
            </div>
          ) : (
            <>
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium">Название</th>
                        <th className="text-left px-4 py-3 font-medium">Рейтинг</th>
                        <th className="text-left px-4 py-3 font-medium">Отзывов</th>
                        <th className="text-left px-4 py-3 font-medium">Позитивных %</th>
                        <th className="text-left px-4 py-3 font-medium">Негативных %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((row) => (
                        <tr
                          key={row.name}
                          className={`${row.isMine ? 'bg-brand-50 border-brand-500' : 'hover:bg-gray-50'} border-b border-gray-100 last:border-0`}
                        >
                          <td className="px-4 py-3 font-medium">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span>{row.name}</span>
                              {row.foundByAI && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#eef0ff] text-[#5B5FEF]">AI</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3">{row.avgRating.toFixed(2)}</td>
                          <td className="px-4 py-3">{row.totalReviews}</td>
                          <td className="px-4 py-3">{row.positivePercent}%</td>
                          <td className="px-4 py-3">{row.negativePercent}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <span className="text-xs bg-white border border-gray-200 rounded-full px-3 py-1">
                  Ваше место в городе: {comparisonData.cityRank} из {comparisonData.cityTotal || tableRows.length}
                </span>
                <span className="text-xs bg-white border border-gray-200 rounded-full px-3 py-1">
                  Ваше место в районе: {comparisonData.districtRank} из {comparisonData.districtTotal || tableRows.length}
                </span>
              </div>

              <div className="card p-4">
                <p className="text-sm font-medium mb-4">Сравнение рейтингов</p>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="shortName" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                    <Tooltip content={<TooltipContent />} />
                    <Bar dataKey="avgRating" radius={[4, 4, 0, 0]}>
                      {chartData.map((row) => (
                        <Cell key={row.name} fill={row.isMine ? '#5B5FEF' : '#9ca3af'} />
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