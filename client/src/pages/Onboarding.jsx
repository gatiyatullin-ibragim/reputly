import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { businessApi, locationApi } from '../api'

const STEPS = ['Бизнес', 'Точка', 'Готово']

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [businessId, setBusinessId] = useState('')
  const [bizName, setBizName] = useState('')
  const [loc, setLoc] = useState({ name: '', googlePlaceId: '', twoGisId: '' })

  const handleCreateBusiness = async () => {
    if (!bizName) return
    setLoading(true); setError('')
    try {
      const { data } = await businessApi.create({ name: bizName })
      setBusinessId(data.business._id)
      setStep(1)
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLocation = async () => {
    if (!loc.name) return
    setLoading(true); setError('')
    try {
      await locationApi.create({ businessId, ...loc })
      setStep(2)
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold">Rep<span className="text-brand-500">Monitor</span></h1>
          <p className="text-sm text-gray-500 mt-1">Быстрая настройка</p>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                i <= step ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-xs ${i === step ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>{s}</span>
              {i < STEPS.length - 1 && <div className="w-8 h-px bg-gray-200" />}
            </div>
          ))}
        </div>

        <div className="card p-6">
          {/* Step 0 */}
          {step === 0 && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-base font-semibold mb-1">Как называется ваш бизнес?</h2>
                <p className="text-xs text-gray-500 mb-3">Например: «Кофейня Аромат», «Клиника Здоровье»</p>
                <input className="input" placeholder="Название бизнеса"
                  value={bizName} onChange={(e) => setBizName(e.target.value)} />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button onClick={handleCreateBusiness} disabled={!bizName || loading} className="btn-brand w-full">
                {loading ? 'Создаём...' : 'Далее →'}
              </button>
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-base font-semibold mb-1">Добавьте первую точку</h2>
                <p className="text-xs text-gray-500 mb-3">Укажите ID из Google Maps и/или 2GIS</p>
              </div>
              <div>
                <label className="label">Название точки</label>
                <input className="input" placeholder="Главный офис / Точка на Ленина"
                  value={loc.name} onChange={(e) => setLoc({ ...loc, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Google Place ID</label>
                <input className="input" placeholder="ChIJ..."
                  value={loc.googlePlaceId} onChange={(e) => setLoc({ ...loc, googlePlaceId: e.target.value })} />
                <p className="text-xs text-gray-400 mt-1">
                  Найти: maps.google.com → ваше место → в URL параметр place_id
                </p>
              </div>
              <div>
                <label className="label">2GIS ID организации</label>
                <input className="input" placeholder="141265770..."
                  value={loc.twoGisId} onChange={(e) => setLoc({ ...loc, twoGisId: e.target.value })} />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button onClick={handleCreateLocation} disabled={!loc.name || loading} className="btn-brand w-full">
                {loading ? 'Создаём...' : 'Создать и запустить синхронизацию →'}
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="text-4xl">🎉</div>
              <h2 className="text-base font-semibold">Всё готово!</h2>
              <p className="text-sm text-gray-500">
                Синхронизация запущена. Первые отзывы появятся через несколько минут.
              </p>
              <button onClick={() => navigate('/')} className="btn-brand w-full mt-2">
                Перейти в дашборд →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
