'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BookOpen, Building2, Heart, Bell, User, LogOut, GraduationCap, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/store/authStore'
import { useQuery } from '@tanstack/react-query'
import { apiGetNotifications } from '@/lib/api/notifications'

const links = [
  { href: '/dashboard/training', label: 'Мой путь', shortLabel: 'Путь', icon: BookOpen },
  { href: '/dashboard/universities', label: 'Университеты', shortLabel: 'Вузы', icon: Building2 },
  { href: '/dashboard/documents', label: 'Документы', shortLabel: 'Док-ты', icon: FileText },
  { href: '/dashboard/favourites', label: 'Избранное', shortLabel: 'Избранное', icon: Heart },
  { href: '/dashboard/notifications', label: 'Уведомления', shortLabel: 'Уведом.', icon: Bell },
  { href: '/dashboard/profile', label: 'Профиль', shortLabel: 'Профиль', icon: User },
]

export function StudentSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: apiGetNotifications,
    refetchInterval: 30_000,
  })

  const unread = notifications?.filter((n) => !n.is_read).length ?? 0

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const initial = (user?.full_name?.[0] ?? '·').toUpperCase()

  return (
    <>
      {/* ── Desktop sidebar (navy, как в Job) ── */}
      <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 self-start overflow-y-auto bg-navy py-6 z-30">
        <Link href="/" className="flex items-center gap-2 mb-6 px-5">
          <GraduationCap className="h-7 w-7 text-white" />
          <span className="text-lg font-bold text-white">EduBridge</span>
        </Link>
        <div className="mx-4 mb-4 h-px bg-white/10" />

        <nav className="flex-1 space-y-1 px-3">
          {links.map(({ href, label, icon: Icon }) => {
            const isNotif = href.includes('notifications')
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                data-tour={`nav-${href.split('/').pop()}`}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all',
                  active
                    ? 'bg-white/20 text-white shadow-sm ring-1 ring-white/25 scale-[1.01]'
                    : 'text-white/55 hover:bg-white/10 hover:text-white/90'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
                {isNotif && unread > 0 && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white">
                    {unread}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User card + logout */}
        <div className="px-3 space-y-1 mt-4">
          <Link
            href="/dashboard/profile"
            className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center flex-shrink-0 shadow-md shadow-primary/40">
              <span className="text-white text-sm font-bold">{initial}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.full_name}</p>
              <p className="text-[11px] text-white/50 truncate">@{user?.login}</p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors text-left"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wide">Выйти</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-100 bg-white px-1 pb-safe">
        <div className="flex">
          {links.map(({ href, shortLabel, label, icon: Icon }) => {
            const isNotif = href.includes('notifications')
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'relative flex flex-1 min-w-0 flex-col items-center gap-1 px-1 py-2',
                  active ? 'text-primary' : 'text-slate-400'
                )}
              >
                <div className={cn('w-8 h-8 flex items-center justify-center rounded-xl transition-colors', active && 'bg-primary/10')}>
                  <Icon className="h-5 w-5 flex-shrink-0" />
                </div>
                <span className="max-w-full truncate text-[10px] font-semibold uppercase tracking-wide leading-none">
                  {shortLabel ?? label}
                </span>
                {isNotif && unread > 0 && (
                  <span className="absolute top-0 right-1/4 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[9px] text-white">
                    {unread}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
