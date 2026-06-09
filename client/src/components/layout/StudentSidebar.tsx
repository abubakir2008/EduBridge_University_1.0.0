'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BookOpen, Building2, Heart, Bell, User, LogOut, GraduationCap, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/store/authStore'
import { useQuery } from '@tanstack/react-query'
import { apiGetNotifications } from '@/lib/api/notifications'

const links = [
  { href: '/dashboard/training', label: 'Мой путь', icon: BookOpen },
  { href: '/dashboard/universities', label: 'Университеты', icon: Building2 },
  { href: '/dashboard/favourites', label: 'Избранное', icon: Heart },
  { href: '/dashboard/notifications', label: 'Уведомления', icon: Bell },
  { href: '/dashboard/profile', label: 'Профиль', icon: User },
  { href: '/dashboard/ai', label: 'AI-Ассистент', icon: Sparkles },
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

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen sticky top-0 border-r border-slate-200 bg-white px-4 py-6">
        <Link href="/" className="flex items-center gap-2 mb-8 px-2">
          <GraduationCap className="h-7 w-7 text-primary" />
          <span className="text-lg font-bold text-text-primary">EduBridge</span>
        </Link>

        <nav className="flex-1 space-y-1">
          {links.map(({ href, label, icon: Icon }) => {
            const isNotif = href.includes('notifications')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-button px-3 py-2.5 text-sm font-medium transition-colors',
                  pathname.startsWith(href)
                    ? 'bg-primary-50 text-primary'
                    : 'text-text-secondary hover:bg-surface hover:text-text-primary'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
                {isNotif && unread > 0 && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white">
                    {unread}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="mt-6 border-t border-slate-100 pt-4">
          <div className="mb-3 px-2">
            <p className="text-sm font-medium text-text-primary truncate">{user?.full_name}</p>
            <p className="text-xs text-text-muted">@{user?.login}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-button px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface hover:text-error transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Выйти
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white px-2 pb-safe">
        <div className="flex justify-around">
          {links.slice(0, 5).map(({ href, label, icon: Icon }) => {
            const isNotif = href.includes('notifications')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'relative flex flex-col items-center gap-1 px-2 py-2 text-[10px] font-medium',
                  pathname.startsWith(href) ? 'text-primary' : 'text-text-muted'
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
                {isNotif && unread > 0 && (
                  <span className="absolute -top-0.5 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[9px] text-white">
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
