'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Search, BookOpen, CheckCircle2, X } from 'lucide-react'
import { Button } from './button'
import { useRouter } from 'next/navigation'

const STORAGE_KEY = 'edubridge_onboarding_v1'

const STEPS = [
  {
    icon: Search,
    title: 'Выберите университет',
    desc: 'Просмотрите каталог и подберите университет по стране, стоимости и специальностям.',
  },
  {
    icon: BookOpen,
    title: 'Пройдите этапы поступления',
    desc: 'Система проведёт вас через все шаги: документы, тесты, подачу заявки.',
  },
  {
    icon: CheckCircle2,
    title: 'Получите место в университете',
    desc: 'Отслеживайте статус и получайте напоминания о дедлайнах.',
  },
]

export function OnboardingModal() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setOpen(true)
    }
  }, [])

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setOpen(false)
  }

  const goToUniversities = () => {
    dismiss()
    router.push('/dashboard/universities')
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
          />
          <motion.div
            className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          >
            <button
              onClick={dismiss}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="bg-gradient-to-br from-primary to-primary/80 px-8 pt-10 pb-8 text-white text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
                <GraduationCap className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold">Добро пожаловать!</h2>
              <p className="mt-2 text-white/80 text-sm leading-relaxed">
                EduBridge поможет вам пройти путь поступления в зарубежный университет шаг за шагом.
              </p>
            </div>

            {/* Steps */}
            <div className="px-8 py-6 space-y-5">
              {STEPS.map((step, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <step.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary text-sm">{step.title}</p>
                    <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="px-8 pb-8 flex flex-col gap-2">
              <Button className="w-full" onClick={goToUniversities}>
                Выбрать университет
              </Button>
              <button
                onClick={dismiss}
                className="text-sm text-text-muted hover:text-text-secondary transition-colors py-2"
              >
                Позже
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
