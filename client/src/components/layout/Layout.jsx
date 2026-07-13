import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard,
  MessageSquareMore,
  ChartColumn,
  MapPinned,
  Users,
  Settings2,
  LogOut,
  Globe,
} from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'
import { useLanguageStore } from '../../store/useLanguageStore'

function avatarStyles(name) {
  const letter = (name?.[0] || '').toUpperCase()
  if ('ABCDEF'.includes(letter)) return 'bg-[#eef0ff] text-[#5B5FEF]'
  if ('GHIJKLM'.includes(letter)) return 'bg-[#e0f2fe] text-[#0284c7]'
  if ('NOPQRS'.includes(letter)) return 'bg-[#fef3c7] text-[#d97706]'
  return 'bg-[#fce7f3] text-[#be185d]'
}

export default function Layout() {
  const { user, logout } = useAuthStore()
  const { language, setLanguage, t } = useLanguageStore()
  const location = useLocation()
  const navigate = useNavigate()

  const nav = [
    { to: '/', label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/reviews', label: t('nav.reviews'), icon: MessageSquareMore },
    { to: '/analytics', label: t('nav.analytics'), icon: ChartColumn },
    { to: '/locations', label: t('nav.locations'), icon: MapPinned },
    { to: '/competitors', label: t('nav.competitors'), icon: Users },
    { to: '/settings', label: t('nav.settings'), icon: Settings2 },
  ]

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-page text-[#0f172a]">
      {/* Sidebar */}
      <aside className="w-[212px] bg-white/90 backdrop-blur-xl border-r border-border flex flex-col flex-shrink-0">
        {/* Logo and Language Dropdown */}
        <div className="px-5 py-5 border-b border-border flex items-center justify-between">
          <span className="text-[16px] font-semibold tracking-tight text-[#0f172a]">
            Revi
          </span>
          <div className="relative">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="appearance-none bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[12px] font-medium py-1 pl-2 pr-6 rounded-lg cursor-pointer focus:outline-none border border-transparent transition-all"
            >
              <option value="ru">RU</option>
              <option value="en">EN</option>
              <option value="kk">KK</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-[#64748b]">
              <Globe size={11} />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 flex flex-col gap-1.5">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className="relative overflow-hidden"
            >
              {({ isActive }) => (
                <motion.div
                   className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-[14px] text-[13px] border border-transparent transition-colors ${
                    isActive
                      ? 'text-[#0f172a]'
                      : 'text-[#94a3b8] hover:text-[#0f172a]'
                  }`}
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.18 }}
                >
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-[14px] bg-[#eef0ff] border border-[#dadafe]"
                      transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                    />
                  )}
                  <span className={`relative z-10 flex items-center justify-center ${isActive ? 'text-brand-500' : ''}`}>
                    <Icon size={16} strokeWidth={1.8} />
                  </span>
                  <span className="relative z-10 font-medium">{label}</span>
                </motion.div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-border bg-[#fbfcfe]">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 ${avatarStyles(user?.name)}`}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium truncate text-[#0f172a]">{user?.name}</p>
              <p className="text-[12px] text-[#9ca3af] truncate">{user?.plan}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-[#9ca3af] hover:text-[#0f172a] transition-colors"
              title={t('nav.logout')}
            >
              <LogOut size={15} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="min-h-screen"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

