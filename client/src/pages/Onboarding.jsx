import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { businessApi, locationApi } from '../api'
import { useLanguageStore } from '../store/useLanguageStore'

export default function Onboarding() {
  const navigate = useNavigate()
  const { t } = useLanguageStore()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [businessId, setBusinessId] = useState('')
  const [bizName, setBizName] = useState('')
  const [loc, setLoc] = useState({ name: '', googlePlaceId: '', twoGisId: '' })

  const STEPS = [t('onboarding.businessName'), t('onboarding.locationName'), '🎉']

  const handleCreateBusiness = async () => {
    if (!bizName) return
    setLoading(true); setError('')
    try {
      const { data } = await businessApi.create({ name: bizName })
      setBusinessId(data.business._id)
      setStep(1)
    } catch (err) {
      setError(err.response?.data?.message || t('auth.validationError'))
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
      setError(err.response?.data?.message || t('auth.validationError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-page flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(91,95,239,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(17,17,17,0.05),transparent_30%)]" />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-[34px] font-semibold tracking-tight text-[#0f172a]">Revi</h1>
          <p className="text-[13px] text-[#64748b] mt-1">{t('onboarding.subtitle')}</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium border transition-colors ${
                i < step
                  ? 'bg-[#5B5FEF] text-white border-[#5B5FEF]'
                  : i === step
                    ? 'bg-[#0f172a] text-white border-[#0f172a]'
                    : 'bg-white text-[#9ca3af] border-[#e5e7eb]'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              {i < 2 && <div className="w-8 h-px bg-[#e7ebf2]" />}
            </div>
          ))}
        </div>

        <div className="bg-white border border-[#e7ebf2] rounded-2xl p-7 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
          {/* Step 0 — Business */}
          {step === 0 && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-[18px] font-semibold mb-1 text-[#0f172a]">{t('onboarding.title')}</h2>
                <p className="text-[13px] text-[#64748b] mb-4">{t('onboarding.subtitle')}</p>
                <label className="label">{t('onboarding.businessName')}</label>
                <input
                  className="input"
                  placeholder={t('onboarding.businessNamePl')}
                  value={bizName}
                  onChange={(e) => setBizName(e.target.value)}
                />
              </div>
              {error && <p className="text-[12px] text-[#dc2626] bg-[#fee2e2] px-3 py-2 rounded-xl">{error}</p>}
              <button onClick={handleCreateBusiness} disabled={!bizName || loading} className="btn-brand w-full">
                {loading ? '...' : t('onboarding.continue') + ' →'}
              </button>
            </div>
          )}

          {/* Step 1 — Location */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-[18px] font-semibold mb-1 text-[#0f172a]">{t('onboarding.locationName')}</h2>
                <p className="text-[13px] text-[#64748b] mb-3">Connect Google Maps and/or 2GIS to start monitoring.</p>
              </div>
              <div>
                <label className="label">{t('onboarding.locationName')}</label>
                <input className="input" placeholder={t('onboarding.locationNamePl')}
                  value={loc.name} onChange={(e) => setLoc({ ...loc, name: e.target.value })} />
              </div>
              <div>
                <label className="label">{t('onboarding.googleId')}</label>
                <input className="input" placeholder="ChIJ..."
                  value={loc.googlePlaceId} onChange={(e) => setLoc({ ...loc, googlePlaceId: e.target.value })} />
                <p className="text-[11px] text-[#94a3b8] mt-1">
                  Find: maps.google.com → your place → place_id in URL
                </p>
              </div>
              <div>
                <label className="label">{t('onboarding.twoGisId')}</label>
                <input className="input" placeholder="141265770..."
                  value={loc.twoGisId} onChange={(e) => setLoc({ ...loc, twoGisId: e.target.value })} />
              </div>
              {error && <p className="text-[12px] text-[#dc2626] bg-[#fee2e2] px-3 py-2 rounded-xl">{error}</p>}
              <div className="flex gap-2">
                <button onClick={() => setStep(0)} className="btn-secondary">
                  {t('onboarding.back')}
                </button>
                <button onClick={handleCreateLocation} disabled={!loc.name || loading} className="btn-brand flex-1">
                  {loading ? '...' : t('onboarding.continue') + ' →'}
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Done */}
          {step === 2 && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="text-[48px]">🎉</div>
              <h2 className="text-[20px] font-semibold text-[#0f172a]">All set!</h2>
              <p className="text-[13px] text-[#64748b] max-w-xs">
                Sync is running. First reviews will appear in a few minutes.
              </p>
              <button onClick={() => navigate('/')} className="btn-brand w-full mt-2">
                Go to Dashboard →
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-[12px] text-[#94a3b8] mt-4">
          {t('onboarding.stepInfo').replace('{{current}}', step + 1).replace('{{total}}', 3)}
        </p>
      </div>
    </div>
  )
}
