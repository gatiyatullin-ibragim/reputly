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
    <div className="min-h-screen bg-page flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(29,158,117,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(17,17,17,0.05),transparent_30%)]" />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-semibold tracking-tight text-[#0f172a]">Revi</h1>
          <p className="text-[13px] text-[#64748b] mt-1">Быстрая настройка командного центра</p>
        </div>

        <div className="flex items-center justify-center gap-3 mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium border ${
                i <= step ? 'bg-[#111] text-white border-[#111]' : 'bg-white text-[#9ca3af] border-[#e5e7eb]'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-[12px] ${i === step ? 'text-[#111]' : 'text-[#9ca3af]'}`}>{s}</span>
              {i < STEPS.length - 1 && <div className="w-8 h-px bg-[#f0f0f0]" />}
            </div>
          ))}
        </div>

        <div className="bg-white border border-[#e7ebf2] rounded-2xl p-7 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          {/* Step 0 */}
          {step === 0 && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-[16px] font-medium mb-1 text-[#111]">Как называется ваш бизнес?</h2>
                <p className="text-[12px] text-[#6b7280] mb-3">Например: «Кофейня Аромат», «Клиника Здоровье»</p>
                <input className="input" placeholder="Название бизнеса"
                  value={bizName} onChange={(e) => setBizName(e.target.value)} />
              </div>
              {error && <p className="text-[12px] text-[#dc2626]">{error}</p>}
              <button onClick={handleCreateBusiness} disabled={!bizName || loading} className="btn-brand w-full">
                {loading ? 'Создаём...' : 'Далее →'}
              </button>
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-[16px] font-medium mb-1 text-[#111]">Добавьте первую точку</h2>
                <p className="text-[12px] text-[#6b7280] mb-3">Укажите ID из Google Maps и/или 2GIS</p>
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
                <p className="text-[12px] text-[#9ca3af] mt-1">
                  Найти: maps.google.com → ваше место → в URL параметр place_id
                </p>
              </div>
              <div>
                <label className="label">2GIS ID организации</label>
                <input className="input" placeholder="141265770..."
                  value={loc.twoGisId} onChange={(e) => setLoc({ ...loc, twoGisId: e.target.value })} />
              </div>
              {error && <p className="text-[12px] text-[#dc2626]">{error}</p>}
              <button onClick={handleCreateLocation} disabled={!loc.name || loading} className="btn-brand w-full">
                {loading ? 'Создаём...' : 'Создать и запустить синхронизацию →'}
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="text-4xl">🎉</div>
              <h2 className="text-[16px] font-medium text-[#111]">Всё готово!</h2>
              <p className="text-[13px] text-[#6b7280]">
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
