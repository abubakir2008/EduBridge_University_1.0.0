'use client'
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/store/authStore'
import { useBarashekStore } from '@/lib/store/barashekStore'
import { useTour } from './BarashekTour'
import { apiBarashekNextAction } from '@/lib/api/ai'
import type { BarashekMood } from './BarashekMascot'

const today = () => new Date().toISOString().slice(0, 10)
const oncePerDay = (key: string) => {
  if (typeof window === 'undefined') return false
  const k = `${key}_${today()}`
  if (localStorage.getItem(k)) return false
  localStorage.setItem(k, '1')
  return true
}

/**
 * Невидимый компонент: дневной чек-ин Барашка — раз в день встречает студента
 * и даёт ОДНО конкретное следующее действие (с кнопкой перехода и озвучкой).
 */
export function BarashekTriggers() {
  const { user } = useAuthStore()
  const say = useBarashekStore((s) => s.say)
  const { active: tourActive } = useTour()
  // Молчит, пока идёт гид — чтобы не было «голоса из ниоткуда» поверх тура
  const onboarded = !!user && user.role === 'student' && !!user.is_onboarded && !tourActive

  const wantCheckin = onboarded && typeof window !== 'undefined' && !localStorage.getItem(`barashek_checkin_${today()}`)

  const { data: action } = useQuery({
    queryKey: ['barashek-next-action', today()],
    queryFn: apiBarashekNextAction,
    enabled: wantCheckin,
    staleTime: Infinity,
    retry: false,
  })

  useEffect(() => {
    if (!action) return
    if (oncePerDay('barashek_checkin')) {
      const name = user?.full_name?.split(' ')[0] ?? ''
      say({
        variant: 'info',
        mood: (action.mood as BarashekMood) || 'talking',
        title: `С возвращением, ${name}! 🐑`,
        text: action.text,
        actionLabel: action.action_label,
        actionHref: action.action_href,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action])

  return null
}
