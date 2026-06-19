'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard, Users, Building2, BookOpen, FileText,
  Bell, LogOut, GraduationCap, ClipboardList, Activity, Bot, Menu, X, Newspaper,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/store/authStore'

const links = [
  { href: '/admin', label: 'Дашборд', icon: LayoutDashboard, exact: true },
  { href: '/admin/leads', label: 'Заявки', icon: ClipboardList },
  { href: '/admin/users', label: 'Студенты', icon: Users },
  { href: '/admin/universities', label: 'Университеты', icon: Building2 },
  { href: '/admin/cases', label: 'Кейсы', icon: FileText },
  { href: '/admin/blog', label: 'Блог', icon: Newspaper },
  { href: '/admin/lessons', label: 'Уроки', icon: BookOpen },
  { href: '/admin/notifications', label: 'Уведомления', icon: Bell },
  { href: '/admin/activity', label: 'Журнал действий', icon: Activity },
  { href: '/admin/ai', label: 'AI-Аналитика', icon: Bot },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Закрывать drawer при смене маршрута
  useEffect(() => { setMobileOpen(false) }, [pathname])

  // Блокировать скролл body, пока drawer открыт
  useEffect(() => {
    if (!mobileOpen) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const renderBody = (indicatorId: string) => (
    <>
      {/* Logo */}
      <Link href="/admin" className="flex items-center gap-2.5 mb-6 px-3">
        <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0">
          <GraduationCap className="text-white" style={{ width: 18, height: 18 }} />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight">EduBridge</p>
          <p className="text-[10px] text-white/50 uppercase tracking-widest">Admin Panel</p>
        </div>
      </Link>
      <div className="mx-1 mb-4 h-px bg-white/10" />

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {links.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex items-center gap-3 rounded-xl px-4 py-3 transition-all',
                active
                  ? 'bg-white/20 text-white shadow-sm ring-1 ring-white/25 scale-[1.01]'
                  : 'text-white/55 hover:bg-white/10 hover:text-white/90'
              )}
            >
              {active && (
                <motion.div
                  layoutId={indicatorId}
                  className="absolute inset-0 rounded-xl bg-white/10"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              <Icon className="relative h-5 w-5 flex-shrink-0" />
              <span className="relative text-xs font-bold uppercase tracking-wide">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="mt-4 space-y-1">
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white/10 mb-1">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md shadow-primary/40">
            {user?.full_name?.charAt(0) ?? 'A'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.full_name ?? 'Admin'}</p>
            <p className="text-[11px] text-white/50">Администратор</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-white/40 hover:bg-red-500/10 hover:text-red-400 transition-colors text-left"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wide">Выйти</span>
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Мобильный топбар */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 h-14 border-b border-slate-100 bg-white/95 backdrop-blur px-4">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Открыть меню"
          className="rounded-lg p-1.5 text-text-secondary hover:bg-slate-100 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
            <GraduationCap className="text-white" style={{ width: 16, height: 16 }} />
          </div>
          <span className="text-sm font-bold text-text-primary">EduBridge</span>
        </Link>
      </header>

      {/* Десктопный сайдбар */}
      <aside className="hidden md:flex fixed left-0 top-0 flex-col w-64 h-screen overflow-y-auto bg-navy px-3 py-6 z-40">
        {renderBody('admin-nav-indicator-desktop')}
      </aside>

      {/* Мобильный drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="md:hidden fixed left-0 top-0 z-50 flex flex-col w-72 max-w-[85vw] h-screen overflow-y-auto bg-navy px-3 py-6"
            >
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Закрыть меню"
                className="absolute right-3 top-4 rounded-lg p-1.5 text-white/60 hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              {renderBody('admin-nav-indicator-mobile')}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
