'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { GraduationCap, Lock, User } from 'lucide-react'
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
      await login(data.login, data.password)
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
    <div className="flex min-h-screen items-center justify-center bg-background-elevated px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-text-primary">EduBridge</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-text-primary">Войти в кабинет</h1>
          <p className="mt-2 text-sm text-text-secondary">Введите логин и пароль, выданные администратором</p>
        </div>

        <div className="rounded-card border border-slate-200 bg-white p-8 shadow-card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Логин"
              placeholder="Ваш логин"
              icon={<User className="h-4 w-4" />}
              error={errors.login?.message}
              {...register('login')}
            />
            <Input
              label="Пароль"
              type="password"
              placeholder="••••••••"
              icon={<Lock className="h-4 w-4" />}
              error={errors.password?.message}
              {...register('password')}
            />

            {error && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-error">{error}</p>
            )}

            <Button type="submit" className="w-full" loading={isLoading}>
              Войти
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-text-muted">
          <Link href="/" className="text-primary hover:underline">← Вернуться на главную</Link>
        </p>
      </motion.div>
    </div>
  )
}
