import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

function Shell() {
  return (
    <div className="min-h-screen bg-page flex items-center justify-center px-4">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(29,158,117,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(17,17,17,0.05),transparent_30%)]" />
    </div>
  )
}

export default function Login() {
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-page flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(29,158,117,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(17,17,17,0.05),transparent_30%)]" />
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-semibold tracking-tight text-[#0f172a]">Revi</h1>
          <p className="text-[13px] text-[#64748b] mt-1">Reputation command center for modern businesses</p>
        </div>

        <div className="bg-white border border-[#e7ebf2] rounded-2xl p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="label">Пароль</label>
              <input type="password" className="input" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>

            {error && <p className="text-[13px] text-[#dc2626] bg-[#fee2e2] px-3 py-2 rounded-xl">{error}</p>}

            <button type="submit" className="btn-primary w-full mt-1" disabled={loading}>
              {loading ? 'Входим...' : 'Войти'}
            </button>
          </form>
        </div>

        <p className="text-center text-[13px] text-[#6b7280] mt-4">
          Нет аккаунта?{' '}
          <Link to="/register" className="text-brand-500 font-medium hover:underline">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  )
}
