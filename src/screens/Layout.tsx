import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { Home, Trophy, Target, Users, MessageCircle, ListOrdered, Shuffle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useUnreadChat } from '@/hooks/useUnreadChat'
import { useDrawConfig } from '@/hooks/useDrawConfig'
import { TicketMark } from '@/components/TicketMark'

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
  const { user, firebaseUser } = useAuth()
  const location = useLocation()
  const isOnChat = location.pathname === '/chat'
  const { unreadCount, mentionCount } = useUnreadChat(user?.uid, isOnChat)
  const { config } = useDrawConfig()
  const navItems = config.drawStatus === 'list_building' || config.drawStatus === 'draw_day'
    ? preDrawNavItems
    : liveNavItems
  const avatarUrl = user?.avatarUrl ?? firebaseUser?.photoURL ?? null

  return (
    <div className="flex flex-col min-h-screen bg-brand-bg">
      {/* Top bar */}
      <header className="px-5 pt-8 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TicketMark className="h-10 w-10" />
          <div>
            <p className="ticket-meta">Pool · admit one</p>
            <p className="font-display text-base leading-none text-brand-ink">World Cup 26</p>
          </div>
        </div>
        <NavLink
          to="/profile"
          className="w-9 h-9 rounded-full bg-brand-ink text-brand-ticket ring-2 ring-brand-paper overflow-hidden flex items-center justify-center shadow-sm"
        >
          {avatarUrl?.startsWith('emoji:') ? (
            <span className="text-lg">{avatarUrl.replace('emoji:', '')}</span>
          ) : avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-bold text-brand-ticket">
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
      <nav className="fixed bottom-0 left-0 right-0 bg-brand-bg border-t border-brand-border px-2 pb-safe">
        <div className="flex">
          {navItems.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `relative flex-1 flex flex-col items-center gap-1 py-3 font-mono text-[9px] uppercase tracking-[0.12em] transition-colors after:absolute after:bottom-1 after:left-1/2 after:h-0.5 after:w-4 after:-translate-x-1/2 after:bg-current ${
                  isActive ? 'text-brand-stamp after:opacity-100' : 'text-brand-muted after:opacity-0'
                }`
              }
            >
              <div className="relative">
                <Icon size={22} />

                {to === '/chat' && mentionCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-brand-stamp rounded-full text-brand-ticket text-[9px] font-bold flex items-center justify-center px-1 leading-none ring-2 ring-brand-paper">
                    {mentionCount > 99 ? '99+' : mentionCount}
                  </span>
                )}

                {to === '/chat' && mentionCount === 0 && unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-brand-stamp rounded-full ring-2 ring-brand-paper" />
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
