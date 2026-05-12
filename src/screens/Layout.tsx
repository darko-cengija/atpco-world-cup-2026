import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { Home, Trophy, Target, Users, MessageCircle, ListOrdered, Shuffle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useUnreadChat } from '@/hooks/useUnreadChat'
import { useDrawConfig } from '@/hooks/useDrawConfig'

const liveNavItems = [
  { to: '/', icon: Home, label: 'Home', exact: true },
  { to: '/standings', icon: Trophy, label: 'Standings', exact: false },
  { to: '/predictions', icon: Target, label: 'Predictions', exact: false },
  { to: '/chat', icon: MessageCircle, label: 'Chat', exact: false },
  { to: '/players', icon: Users, label: 'Players', exact: false },
]

const preDrawNavItems = [
  { to: '/', icon: Home, label: 'Home', exact: true },
  { to: '/my-list', icon: ListOrdered, label: 'My List', exact: false },
  { to: '/draw', icon: Shuffle, label: 'Draw', exact: false },
  { to: '/chat', icon: MessageCircle, label: 'Chat', exact: false },
  { to: '/players', icon: Users, label: 'Players', exact: false },
]

export default function Layout() {
  const { user } = useAuth()
  const location = useLocation()
  const isOnChat = location.pathname === '/chat'
  const { unreadCount, mentionCount } = useUnreadChat(user?.uid, isOnChat)
  const { config } = useDrawConfig()
  const navItems = config.drawStatus === 'list_building' || config.drawStatus === 'draw_day'
    ? preDrawNavItems
    : liveNavItems

  return (
    <div className="flex flex-col min-h-screen bg-brand-bg">
      {/* Top bar */}
      <header className="px-6 pt-10 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="" className="w-7 h-7 rounded-md" aria-hidden="true" />
          <span className="text-xs text-gray-500 font-medium tracking-widest uppercase">
            World Cup 26
          </span>
        </div>
        <NavLink
          to="/profile"
          className="w-8 h-8 rounded-full bg-brand-card border border-brand-border overflow-hidden flex items-center justify-center"
        >
          {user?.avatarUrl?.startsWith('emoji:') ? (
            <span className="text-lg">{user.avatarUrl.replace('emoji:', '')}</span>
          ) : user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-bold text-brand-accent">
              {user?.displayName?.[0]?.toUpperCase() ?? '?'}
            </span>
          )}
        </NavLink>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-brand-card border-t border-brand-border px-2 pb-safe">
        <div className="flex">
          {navItems.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                  isActive ? 'text-brand-accent' : 'text-gray-500'
                }`
              }
            >
              <div className="relative">
                <Icon size={22} />

                {to === '/chat' && mentionCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center px-1 leading-none">
                    {mentionCount > 99 ? '99+' : mentionCount}
                  </span>
                )}

                {to === '/chat' && mentionCount === 0 && unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-brand-card" />
                )}
              </div>
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
