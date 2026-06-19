'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { GraduationCap, Lock, User, Globe, FileText, Award, ArrowRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/lib/store/authStore'

const schema = z.object({
  login: z.string().min(2, 'Введите логин'),
  password: z.string().min(1, 'Введите пароль'),
})

type FormData = z.infer<typeof schema>

const highlights = [
  { icon: Globe, text: 'Университеты Китая, Италии, Турции, США' },
  { icon: FileText, text: 'Пошаговый план поступления и документы' },
  { icon: Award, text: 'Поддержка от заявки до диплома' },
]

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading } = useAuthStore()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      await login(data.login.trim(), data.password)
      const { user } = useAuthStore.getState()
      router.push(user?.role === 'admin' ? '/admin' : '/dashboard/training')
    } catch (e: unknown) {
      const err = e as { response?: { status?: number } }
      if (err?.response?.status === 401) {
        setError('Неверный логин или пароль')
      } else {
        setError('Ошибка сервера. Попробуйте позже.')
      }
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel (navy) ── */}
      <div className="hidden lg:flex lg:w-1/2 section-navy flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-20 bg-dot-grid pointer-events-none" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/15 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <div className="relative">
          <Link href="/" className="flex items-center gap-2 mb-12">
            <GraduationCap className="h-9 w-9 text-white" />
            <span className="text-2xl font-bold text-white">EduBridge</span>
          </Link>

          <h2 className="text-3xl font-bold text-white leading-snug mb-4">
            Твой путь к учёбе<br />за границей начинается здесь
          </h2>
          <p className="text-white/70 text-base leading-relaxed max-w-sm">
            Подбор вузов, документы, виза и адаптация — всё в одном личном кабинете.
          </p>

          <div className="mt-10 space-y-4">
            {highlights.map((h, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0">
                  <h.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-white/90 text-sm font-medium">{h.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="glass-card p-5">
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} className="text-amber-400 text-sm">★</span>
              ))}
            </div>
            <p className="text-white/90 text-sm leading-relaxed">
              «За полгода с EduBridge поступила в университет Цинхуа на грант — вели за руку на каждом шаге!»
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white text-xs font-bold">
                АК
              </div>
              <div>
                <p className="text-white text-xs font-semibold">Айгерим К.</p>
                <p className="text-white/50 text-xs">Бишкек → Пекин</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-text-primary">EduBridge</span>
          </Link>

          <h1 className="text-2xl font-bold text-text-primary mb-1">Добро пожаловать!</h1>
          <p className="text-text-secondary text-sm mb-8">
            Войдите в кабинет — логин и пароль выдаёт администратор
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Логин"
              placeholder="Ваш логин"
              icon={<User className="h-4 w-4" />}
              error={errors.login?.message}
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username"
              spellCheck={false}
              {...register('login')}
            />
            <Input
              label="Пароль"
              type="password"
              placeholder="••••••••"
              icon={<Lock className="h-4 w-4" />}
              error={errors.password?.message}
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="current-password"
              spellCheck={false}
              {...register('password')}
            />

            {error && (
              <div className="rounded-input bg-red-50 border border-red-200 px-4 py-3 text-sm text-error" role="alert">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full mt-1 group" loading={isLoading}>
              Войти
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary">
            Нет доступа?{' '}
            <Link href="/#contact" className="text-primary font-semibold hover:underline">
              Оставьте заявку
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
