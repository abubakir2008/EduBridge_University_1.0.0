'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Pencil, Save, X } from 'lucide-react'
import { useAuthStore } from '@/lib/store/authStore'
import { apiGetUser, apiUpdateUser } from '@/lib/api/users'
import { apiGetUniversityCountries } from '@/lib/api/universities'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

// Countries that use RMB and require HSK
const CHINA_COUNTRIES = ['Китай', 'China', '中国']

// Currency label per country keyword
function getBudgetLabel(country: string): string {
  const c = country.toLowerCase()
  if (CHINA_COUNTRIES.some(x => x.toLowerCase() === c)) return 'Макс. бюджет (RMB/год)'
  if (['италия', 'германия', 'франция', 'испания', 'австрия', 'чехия', 'польша', 'нидерланды', 'бельгия'].some(x => c.includes(x))) return 'Макс. бюджет (EUR/год)'
  if (['великобритания', 'uk', 'england'].some(x => c.includes(x))) return 'Макс. бюджет (GBP/год)'
  if (['сша', 'usa', 'америка'].some(x => c.includes(x))) return 'Макс. бюджет (USD/год)'
  return 'Макс. бюджет/год'
}

const schema = z.object({
  full_name: z.string().min(2, 'Обязательное поле'),
  phone: z.string().optional(),
  email: z.string().email('Неверный email').optional().or(z.literal('')),
  citizenship: z.string().optional(),
  gpa: z.coerce.number().min(0).max(5).optional().or(z.literal('')),
  ielts_score: z.coerce.number().min(0).max(9).optional().or(z.literal('')),
  toefl_score: z.coerce.number().min(0).max(120).optional().or(z.literal('')),
  sat_score: z.coerce.number().min(0).max(1600).optional().or(z.literal('')),
  hsk_level: z.coerce.number().min(1).max(6).optional().or(z.literal('')),
  max_budget_rmb: z.coerce.number().min(0).optional().or(z.literal('')),
  wants_language_year: z.string().optional(),
  preferred_difficulty: z.string().optional(),
  program_level: z.string().optional(),
  achievements: z.string().optional(),
  desired_specialty: z.string().optional(),
  country_preference: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const SELECT_CLS = 'h-10 w-full rounded-input border border-slate-200 px-3 text-sm text-text-primary disabled:bg-slate-50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'

export default function ProfilePage() {
  const { user: authUser } = useAuthStore()
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', authUser?.id],
    queryFn: () => apiGetUser(authUser!.id),
    enabled: !!authUser,
  })

  const { data: countries = [] } = useQuery({
    queryKey: ['university-countries'],
    queryFn: apiGetUniversityCountries,
  })

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: user ? {
      full_name: user.full_name,
      phone: user.phone ?? '',
      email: user.email ?? '',
      citizenship: user.citizenship ?? '',
      gpa: user.gpa ?? '',
      ielts_score: user.ielts_score ?? '',
      toefl_score: (user as any).toefl_score ?? '',
      sat_score: user.sat_score ?? '',
      hsk_level: (user as any).hsk_level ?? '',
      max_budget_rmb: (user as any).max_budget_rmb ?? '',
      wants_language_year: (user as any).wants_language_year ?? '',
      preferred_difficulty: (user as any).preferred_difficulty ?? '',
      program_level: (user as any).program_level ?? '',
      achievements: user.achievements ?? '',
      desired_specialty: user.desired_specialty ?? '',
      country_preference: Array.isArray(user.country_preference)
        ? (user.country_preference[0] ?? '')
        : (user.country_preference as string) ?? '',
    } : undefined,
  })

  // Watch country to show/hide country-specific fields
  const selectedCountry = useWatch({ control, name: 'country_preference' }) ?? ''
  const isChina = CHINA_COUNTRIES.some(x => x.toLowerCase() === selectedCountry.toLowerCase())
  const budgetLabel = selectedCountry ? getBudgetLabel(selectedCountry) : 'Макс. бюджет/год'

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload: Record<string, any> = { full_name: data.full_name }
      if (data.phone) payload.phone = data.phone
      if (data.email) payload.email = data.email
      if (data.citizenship) payload.citizenship = data.citizenship
      if (data.achievements) payload.achievements = data.achievements
      if (data.desired_specialty) payload.desired_specialty = data.desired_specialty
      if (data.country_preference) payload.country_preference = [data.country_preference]
      if (data.wants_language_year) payload.wants_language_year = data.wants_language_year
      if (data.preferred_difficulty) payload.preferred_difficulty = data.preferred_difficulty
      if (data.program_level) payload.program_level = data.program_level
      if (data.gpa !== '' && data.gpa !== undefined) payload.gpa = Number(data.gpa)
      if (data.ielts_score !== '' && data.ielts_score !== undefined) payload.ielts_score = Number(data.ielts_score)
      if (data.toefl_score !== '' && data.toefl_score !== undefined) payload.toefl_score = Number(data.toefl_score)
      if (data.sat_score !== '' && data.sat_score !== undefined) payload.sat_score = Number(data.sat_score)
      if (isChina) {
        if (data.hsk_level !== '' && data.hsk_level !== undefined) payload.hsk_level = Number(data.hsk_level)
      } else {
        payload.hsk_level = null
      }
      if (data.max_budget_rmb !== '' && data.max_budget_rmb !== undefined) payload.max_budget_rmb = Number(data.max_budget_rmb)
      return apiUpdateUser(authUser!.id, payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user'] })
      toast.success('Профиль обновлён')
      setEditing(false)
    },
    onError: () => toast.error('Не удалось сохранить'),
  })

  if (isLoading) return (
    <div className="max-w-2xl space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-60 w-full" />
    </div>
  )

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Профиль</h1>
        {!editing ? (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" /> Редактировать
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => { setEditing(false); reset() }}>
            <X className="h-4 w-4" /> Отмена
          </Button>
        )}
      </div>

      <Card>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">

          {/* Личные данные */}
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Личные данные</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="ФИО *" disabled={!editing} error={errors.full_name?.message} {...register('full_name')} />
              <Input label="Телефон" disabled={!editing} {...register('phone')} />
              <Input label="Email" disabled={!editing} error={errors.email?.message} {...register('email')} />
              <Input label="Гражданство" disabled={!editing} {...register('citizenship')} />
            </div>
          </div>

          {/* Академические баллы */}
          <div className="border-t pt-4">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Академические показатели</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="GPA (0–5)" type="number" step="0.01" disabled={!editing} {...register('gpa')} />
              <Input label="IELTS (0–9)" type="number" step="0.5" disabled={!editing} {...register('ielts_score')} />
              <Input label="TOEFL (0–120)" type="number" disabled={!editing} {...register('toefl_score')} />
              <Input label="SAT (0–1600)" type="number" disabled={!editing} {...register('sat_score')} />
            </div>
          </div>

          {/* Предпочтения */}
          <div className="border-t pt-4">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Предпочтения для подбора университета</p>
            <div className="grid gap-4 sm:grid-cols-2">

              {/* Страна — select из реальных стран в системе */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-primary">Желаемая страна</label>
                <select disabled={!editing} {...register('country_preference')} className={SELECT_CLS}>
                  <option value="">— Не выбрано —</option>
                  {countries.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <Input label="Желаемая специальность" disabled={!editing} {...register('desired_specialty')} />

              {/* Бюджет — всегда видим, label зависит от страны */}
              <Input
                label={budgetLabel}
                type="number"
                placeholder="например 40000"
                disabled={!editing}
                {...register('max_budget_rmb')}
              />

              {/* HSK — только для Китая */}
              {isChina && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-primary">HSK (уровень 1–6)</label>
                  <select disabled={!editing} {...register('hsk_level')} className={SELECT_CLS}>
                    <option value="">— Не сдавал —</option>
                    <option value="1">HSK 1</option>
                    <option value="2">HSK 2</option>
                    <option value="3">HSK 3</option>
                    <option value="4">HSK 4</option>
                    <option value="5">HSK 5</option>
                    <option value="6">HSK 6</option>
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-primary">Уровень программы</label>
                <select disabled={!editing} {...register('program_level')} className={SELECT_CLS}>
                  <option value="">— Не выбрано —</option>
                  <option value="bachelor">Бакалавриат</option>
                  <option value="master">Магистратура</option>
                  <option value="language">Языковой год</option>
                </select>
              </div>

              {/* Языковой год — только для Китая (там это распространено) */}
              {isChina && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-primary">Языковой год</label>
                  <select disabled={!editing} {...register('wants_language_year')} className={SELECT_CLS}>
                    <option value="">— Не выбрано —</option>
                    <option value="yes">Да, хочу</option>
                    <option value="no">Нет, не нужен</option>
                    <option value="maybe">Возможно</option>
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-primary">Предпочитаемая сложность</label>
                <select disabled={!editing} {...register('preferred_difficulty')} className={SELECT_CLS}>
                  <option value="">— Не выбрано —</option>
                  <option value="Легко">Легко — хочу поступить наверняка</option>
                  <option value="Средний">Средний — готов постараться</option>
                  <option value="Сложно">Сложно — хочу топовый вуз</option>
                </select>
              </div>
            </div>
          </div>

          {/* Достижения */}
          <div className="border-t pt-4">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Достижения</p>
            <textarea
              disabled={!editing}
              {...register('achievements')}
              rows={3}
              placeholder="Олимпиады, награды, опыт работы..."
              className="w-full rounded-input border border-slate-200 px-3 py-2 text-sm text-text-primary disabled:bg-slate-50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-sm text-text-muted">
            <span>Логин: <span className="font-medium text-text-primary">{user?.login}</span></span>
            <span>Статус: <span className="font-medium text-text-primary">{user?.account_status}</span></span>
          </div>

          {editing && (
            <Button type="submit" loading={mutation.isPending} className="w-full">
              <Save className="h-4 w-4" /> Сохранить изменения
            </Button>
          )}
        </form>
      </Card>
    </div>
  )
}
