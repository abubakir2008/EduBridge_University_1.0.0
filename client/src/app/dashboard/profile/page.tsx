'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Pencil, Save, X } from 'lucide-react'
import { useAuthStore } from '@/lib/store/authStore'
import { apiGetUser, apiUpdateUser } from '@/lib/api/users'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

const schema = z.object({
  full_name: z.string().min(2, 'Обязательное поле'),
  phone: z.string().optional(),
  email: z.string().email('Неверный email').optional().or(z.literal('')),
  citizenship: z.string().optional(),
  gpa: z.coerce.number().min(0).max(5).optional(),
  ielts_score: z.coerce.number().min(0).max(9).optional(),
  sat_score: z.coerce.number().min(0).max(1600).optional(),
  achievements: z.string().optional(),
  desired_specialty: z.string().optional(),
  country_preference: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function ProfilePage() {
  const { user: authUser } = useAuthStore()
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', authUser?.id],
    queryFn: () => apiGetUser(authUser!.id),
    enabled: !!authUser,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: user
      ? {
          full_name: user.full_name,
          phone: user.phone ?? '',
          email: user.email ?? '',
          citizenship: user.citizenship ?? '',
          gpa: user.gpa,
          ielts_score: user.ielts_score,
          sat_score: user.sat_score,
          achievements: user.achievements ?? '',
          desired_specialty: user.desired_specialty ?? '',
          country_preference: user.country_preference ?? '',
        }
      : undefined,
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) => apiUpdateUser(authUser!.id, data),
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
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setEditing(false); reset() }}>
              <X className="h-4 w-4" /> Отмена
            </Button>
          </div>
        )}
      </div>

      <Card>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="ФИО *" disabled={!editing} error={errors.full_name?.message} {...register('full_name')} />
            <Input label="Телефон" disabled={!editing} {...register('phone')} />
            <Input label="Email" disabled={!editing} error={errors.email?.message} {...register('email')} />
            <Input label="Гражданство" disabled={!editing} {...register('citizenship')} />
            <Input label="GPA (0-5)" type="number" step="0.01" disabled={!editing} {...register('gpa')} />
            <Input label="IELTS" type="number" step="0.5" disabled={!editing} {...register('ielts_score')} />
            <Input label="SAT" type="number" disabled={!editing} {...register('sat_score')} />
            <Input label="Желаемая страна" disabled={!editing} {...register('country_preference')} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Желаемая специальность</label>
            <input
              disabled={!editing}
              {...register('desired_specialty')}
              className="h-10 w-full rounded-input border border-slate-200 px-3 text-sm text-text-primary disabled:bg-slate-50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Достижения</label>
            <textarea
              disabled={!editing}
              {...register('achievements')}
              rows={3}
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
