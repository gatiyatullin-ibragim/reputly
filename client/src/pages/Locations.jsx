import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { locationApi, businessApi } from '../api'

export default function Locations() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    businessId: '', name: '', googlePlaceId: '', twoGisId: '', yandexOrgId: ''
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
      setForm({ businessId: '', name: '', googlePlaceId: '', twoGisId: '', yandexOrgId: '' })
    },
  })

  const syncMutation = useMutation({
    mutationFn: (id) => locationApi.sync(id),
  })

  const removeMutation = useMutation({
    mutationFn: (id) => locationApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['locations'] }),
  })

  const businesses = bizData?.businesses || []
  const locations  = locData?.locations  || []

  // Если бизнесов нет — предлагаем создать
  const createBizMutation = useMutation({
    mutationFn: (name) => businessApi.create({ name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['businesses'] }),
  })

  const [bizName, setBizName] = useState('')

  return (
    <div className="p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Точки</h1>
        <button onClick={() => setShowForm(true)} className="btn-brand text-xs">
          + Добавить точку
        </button>
      </div>

      {/* Create business if none */}
      {businesses.length === 0 && (
        <div className="card p-5 border-dashed">
          <p className="text-sm font-medium mb-3">Сначала создайте бизнес</p>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Название бизнеса"
              value={bizName}
              onChange={(e) => setBizName(e.target.value)}
            />
            <button
              onClick={() => { createBizMutation.mutate(bizName); setBizName('') }}
              className="btn-primary"
              disabled={!bizName || createBizMutation.isPending}
            >
              Создать
            </button>
          </div>
        </div>
      )}

      {/* Add location form */}
      {showForm && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold mb-4">Новая точка</h2>
          <div className="flex flex-col gap-3">
            <div>
              <label className="label">Бизнес</label>
              <select
                className="input"
                value={form.businessId}
                onChange={(e) => setForm({ ...form, businessId: e.target.value })}
              >
                <option value="">Выберите бизнес</option>
                {businesses.map((b) => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Название точки</label>
              <input className="input" placeholder="Кофейня на Ленина"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Google Place ID</label>
              <input className="input" placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
                value={form.googlePlaceId} onChange={(e) => setForm({ ...form, googlePlaceId: e.target.value })} />
            </div>
            <div>
              <label className="label">ID организации в 2GIS</label>
              <input className="input" placeholder="141265770336798"
                value={form.twoGisId} onChange={(e) => setForm({ ...form, twoGisId: e.target.value })} />
            </div>
            <div>
              <label className="label">ID организации в Яндекс</label>
              <input className="input" placeholder="1234567890"
                value={form.yandexOrgId} onChange={(e) => setForm({ ...form, yandexOrgId: e.target.value })} />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => createMutation.mutate()}
                disabled={!form.businessId || !form.name || createMutation.isPending}
                className="btn-primary flex-1"
              >
                {createMutation.isPending ? 'Создаём...' : 'Создать'}
              </button>
              <button onClick={() => setShowForm(false)} className="btn-secondary">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Locations list */}
      {locations.length === 0 ? (
        <div className="card p-10 text-center text-sm text-gray-400">
          Точек пока нет. Добавьте первую.
        </div>
      ) : (
        <div className="card">
          {locations.map((loc) => (
            <div key={loc._id}
              className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0"
            >
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center text-xs flex-shrink-0">
                📍
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{loc.name}</p>
                <p className="text-xs text-gray-400">
                  {loc.businessId?.name}
                  {loc.lastSyncAt && ` · синхр. ${new Date(loc.lastSyncAt).toLocaleDateString('ru')}`}
                </p>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {loc.googlePlaceId && <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">Google</span>}
                  {loc.twoGisId      && <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded">2GIS</span>}
                  {loc.yandexOrgId   && <span className="text-xs bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded">Яндекс</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => syncMutation.mutate(loc._id)}
                  disabled={syncMutation.isPending}
                  className="btn-secondary text-xs"
                >
                  {syncMutation.isPending ? '...' : '↻ Синхр.'}
                </button>
                <button
                  onClick={() => { if (confirm('Удалить точку?')) removeMutation.mutate(loc._id) }}
                  className="btn-secondary text-xs text-red-500 hover:text-red-600"
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
