'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Users, Building2, BookOpen, FileText,
  Bell, LogOut, GraduationCap, ClipboardList, Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/store/authStore'

const links = [
  { href: '/admin', label: 'Дашборд', icon: LayoutDashboard, exact: true },
  { href: '/admin/leads', label: 'Заявки', icon: ClipboardList },
  { href: '/admin/users', label: 'Студенты', icon: Users },
  { href: '/admin/universities', label: 'Университеты', icon: Building2 },
  { href: '/admin/cases', label: 'Кейсы', icon: FileText },
  { href: '/admin/lessons', label: 'Уроки', icon: BookOpen },
  { href: '/admin/notifications', label: 'Уведомления', icon: Bell },
  { href: '/admin/activity', label: 'Журнал действий', icon: Activity },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <aside className="flex flex-col w-64 min-h-screen sticky top-0 border-r border-slate-100 bg-white px-3 py-5">
      {/* Logo */}
      <Link href="/admin" className="flex items-center gap-2.5 mb-8 px-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
          <GraduationCap className="h-4.5 w-4.5 text-white" style={{ width: 18, height: 18 }} />
        </div>
        <div>
          <p className="text-sm font-bold text-text-primary leading-tight">EduBridge</p>
          <p className="text-[10px] text-text-muted uppercase tracking-widest">Admin Panel</p>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5">
        {links.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-secondary hover:bg-slate-50 hover:text-text-primary'
              )}
            >
              {active && (
                <motion.div
                  layoutId="admin-nav-indicator"
                  className="absolute inset-0 rounded-xl bg-primary/10"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              <Icon className={cn('relative h-4 w-4 flex-shrink-0', active ? 'text-primary' : 'text-text-muted')} />
              <span className="relative">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="mt-4 border-t border-slate-100 pt-4 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
            {user?.full_name?.charAt(0) ?? 'A'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{user?.full_name ?? 'Admin'}</p>
            <p className="text-xs text-text-muted">Администратор</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-red-50 hover:text-error transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Выйти
        </button>
      </div>
    </aside>
  )
}
