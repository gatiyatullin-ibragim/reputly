import { useAuthStore } from '../store/useAuthStore'

function Avatar({ name }) {
  const letter = (name?.[0] || '?').toUpperCase()
  const code = letter.charCodeAt(0)
  let style = 'bg-[#fce7f3] text-[#be185d]'
  if (code >= 65 && code <= 70) style = 'bg-[#eef0ff] text-[#5B5FEF]'
  else if (code >= 71 && code <= 77) style = 'bg-[#e0f2fe] text-[#0284c7]'
  else if (code >= 78 && code <= 83) style = 'bg-[#fff7ed] text-[#d97706]'

  return (
    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-[12px] font-semibold flex-shrink-0 ${style}`}>
      {letter}
    </div>
  )
}

export default function Settings() {
  const { user } = useAuthStore()
  const telegramLink = `https://t.me/${import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'YourBot'}?start=${user?.id}`

  const plans = [
    { name: 'START', price: '2 990', locs: 1, ai: 20, highlight: false },
    { name: 'BUSINESS', price: '6 990', locs: 5, ai: 100, highlight: user?.plan === 'BUSINESS' },
    { name: 'PRO', price: '14 990', locs: 20, ai: 500, highlight: user?.plan === 'PRO' },
  ]

  return (
    <div className="p-6 max-w-6xl flex flex-col gap-5">
      <header>
        <p className="text-[11px] uppercase tracking-[0.24em] text-[#94a3b8]">Workspace settings</p>
        <h1 className="text-[28px] md:text-[34px] font-semibold tracking-tight text-[#0f172a] mt-2">Premium controls for your account and integrations</h1>
        <p className="text-[13px] text-[#64748b] mt-2 max-w-2xl">
          Profile, Telegram alerts, and plan management are grouped into calm, spacious cards so the settings page feels as polished as the rest of Revi.
        </p>
      </header>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#e7ebf2] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] xl:col-span-2">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
            <div>
              <p className="text-[14px] font-medium text-[#0f172a]">Profile</p>
              <p className="text-[12px] text-[#94a3b8] mt-0.5">Your identity inside the command center</p>
            </div>
            <span className="badge-neutral">{user?.plan || 'START'}</span>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <Avatar name={user?.name} />
            <div>
              <p className="text-[16px] font-semibold text-[#0f172a]">{user?.name}</p>
              <p className="text-[13px] text-[#64748b]">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="label">Name</label>
              <input className="input" value={user?.name || ''} readOnly />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" value={user?.email || ''} readOnly />
            </div>
            <div>
              <label className="label">Plan</label>
              <input className="input" value={user?.plan || 'START'} readOnly />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#e7ebf2] bg-[#0f172a] p-5 text-white shadow-[0_1px_2px_rgba(15,23,42,0.06)] flex flex-col justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">Account status</p>
            <p className="text-[30px] font-semibold tracking-tight mt-3">{user?.plan || 'START'}</p>
            <p className="text-[13px] text-white/60 mt-2">Connected and ready to monitor reputation signals.</p>
          </div>
          <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 p-4">
            <p className="text-[12px] text-white/55">Active workspace</p>
            <p className="text-[14px] font-medium mt-1">Revi command center</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[#e7ebf2] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <div>
              <p className="text-[14px] font-medium text-[#0f172a]">Telegram notifications</p>
              <p className="text-[12px] text-[#94a3b8] mt-0.5">Receive a message the moment a review lands.</p>
            </div>
            <span className="badge-neutral">Low-latency alerts</span>
          </div>

          {user?.telegramChatId ? (
            <div className="rounded-2xl border border-[#dcfce7] bg-[#ecfdf5] px-4 py-3 text-[13px] text-[#059669] flex items-center gap-2">
              <span>✅</span>
              <span>Telegram connected: {user.telegramChatId}</span>
            </div>
          ) : (
            <a href={telegramLink} target="_blank" rel="noreferrer" className="btn-brand inline-flex">
              Connect Telegram
            </a>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 text-[13px]">
            <div className="rounded-2xl border border-[#e7ebf2] bg-[#f8fafc] p-4">
              <p className="text-[#94a3b8] text-[11px] uppercase tracking-[0.22em]">Alert type</p>
              <p className="font-medium text-[#0f172a] mt-2">Instant review ping</p>
            </div>
            <div className="rounded-2xl border border-[#e7ebf2] bg-[#f8fafc] p-4">
              <p className="text-[#94a3b8] text-[11px] uppercase tracking-[0.22em]">Channel</p>
              <p className="font-medium text-[#0f172a] mt-2">Telegram bot</p>
            </div>
            <div className="rounded-2xl border border-[#e7ebf2] bg-[#f8fafc] p-4">
              <p className="text-[#94a3b8] text-[11px] uppercase tracking-[0.22em]">Status</p>
              <p className="font-medium text-[#0f172a] mt-2">Ready</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#e7ebf2] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <div>
              <p className="text-[14px] font-medium text-[#0f172a]">Subscription plan</p>
              <p className="text-[12px] text-[#94a3b8] mt-0.5">Choose the plan that matches your growth stage.</p>
            </div>
            <span className="badge-neutral">Current plan highlighted</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-4 transition-colors ${
                  plan.highlight ? 'border-[#dadafe] bg-[#eef0ff]' : 'border-[#e7ebf2] bg-white'
                }`}
              >
                <p className="text-[11px] uppercase tracking-[0.22em] text-[#94a3b8]">{plan.name}</p>
                <p className="text-[24px] font-semibold tracking-tight text-[#0f172a] mt-2">{plan.price} ₽</p>
                <div className="mt-3 space-y-1 text-[13px] text-[#64748b]">
                  <p>{plan.locs} locations</p>
                  <p>{plan.ai} AI replies</p>
                </div>
                {plan.highlight && <p className="text-[11px] text-[#5B5FEF] font-medium mt-3">Current plan</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}