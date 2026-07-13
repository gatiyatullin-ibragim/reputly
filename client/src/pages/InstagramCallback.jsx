import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { instagramApi } from '../api'
import { useLanguageStore } from '../store/useLanguageStore'

export default function InstagramCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { t } = useLanguageStore()
  const [status, setStatus] = useState('loading') // loading | success | error
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const code = searchParams.get('code')
    const locationId = searchParams.get('state')

    if (!code || !locationId) {
      setStatus('error')
      setErrorMsg('Missing code or state from callback URL')
      return
    }

    let cancelled = false

    instagramApi.connect(code, locationId)
      .then(() => {
        if (cancelled) return
        setStatus('success')
        setTimeout(() => navigate('/locations', { replace: true }), 1500)
      })
      .catch((err) => {
        if (cancelled) return
        setStatus('error')
        setErrorMsg(err?.response?.data?.message || 'Failed to connect Instagram')
      })

    return () => {
      cancelled = true
    }
  }, [navigate, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-page p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(91,95,239,0.08),transparent_28%)]" />
      <div className="relative w-full max-w-sm">
        <div className="bg-white border border-[#e7ebf2] rounded-2xl p-8 shadow-[0_2px_8px_rgba(15,23,42,0.06)] text-center">
          <div className="text-[40px] mb-4">
            {status === 'loading' && '⏳'}
            {status === 'success' && '✅'}
            {status === 'error' && '❌'}
          </div>
          <h1 className="text-[18px] font-semibold text-[#0f172a] mb-2">Instagram</h1>
          {status === 'loading' && (
            <p className="text-[13px] text-[#64748b]">Connecting Instagram...</p>
          )}
          {status === 'success' && (
            <p className="text-[13px] text-[#059669]">Instagram connected successfully! Redirecting...</p>
          )}
          {status === 'error' && (
            <>
              <p className="text-[13px] text-[#dc2626] mb-4">{errorMsg}</p>
              <button onClick={() => navigate('/locations')} className="btn-secondary text-xs">
                {t('onboarding.back')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}