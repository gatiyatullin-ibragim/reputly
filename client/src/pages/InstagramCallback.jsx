import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { instagramApi } from '../api'

export default function InstagramCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [message, setMessage] = useState('Подключаем Instagram...')
  const [error, setError] = useState('')

  useEffect(() => {
    const code = searchParams.get('code')
    const locationId = searchParams.get('state')

    if (!code || !locationId) {
      setError('Не удалось получить code или state из callback URL')
      return
    }

    let cancelled = false

    instagramApi.connect(code, locationId)
      .then(() => {
        if (cancelled) return
        setMessage('Instagram успешно подключён!')
        setTimeout(() => navigate('/locations', { replace: true }), 1200)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err?.response?.data?.message || 'Не удалось подключить Instagram')
      })

    return () => {
      cancelled = true
    }
  }, [navigate, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="card w-full max-w-md p-6 text-center">
        <h1 className="text-lg font-semibold mb-2">Instagram</h1>
        {!error ? (
          <p className="text-sm text-gray-600">{message}</p>
        ) : (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    </div>
  )
}