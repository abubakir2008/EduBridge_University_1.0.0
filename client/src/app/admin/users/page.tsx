'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { apiGetUsers, apiCreateUser, apiUpdateUserStatus } from '@/lib/api/users'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { TableSkeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const statusVariant = { active: 'success', archived: 'muted', enrolled: 'default' } as const

const schema = z.object({
  full_name: z.string().min(2),
  phone: z.string().min(7),
  email: z.string().email().optional().or(z.literal('')),
  citizenship: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function UsersPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [filter, setFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [createdCreds, setCreatedCreds] = useState<{ login: string; password: string } | null>(null)

  const { data: users, isLoading } = useQuery({
    queryKey: ['users', filter],
    queryFn: () => apiGetUsers(filter ? { account_status: filter } : undefined),
  })

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      const creds = await apiCreateUser(data)
      setCreatedCreds(creds)
      setShowCreate(false)
      reset()
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('Студент создан')
    } catch {
      toast.error('Не удалось создать студента')
    }
  }

  const statuses = ['', 'active', 'archived', 'enrolled']
  const statusLabels: Record<string, string> = { '': 'Все', active: 'Активные', archived: 'Архив', enrolled: 'Поступившие' }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Студенты</h1>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> Создать студента
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-button px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === s ? 'bg-primary text-white' : 'bg-white border border-slate-200 text-text-secondary hover:bg-surface'
            }`}
          >
            {statusLabels[s]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : (
        <Card padding="none">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                {['ФИО', 'Логин', 'Статус', 'Дата'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(users ?? []).filter((u) => u.role === 'student').map((user) => (
                <tr
                  key={user.id}
                  onClick={() => router.push(`/admin/users/${user.id}`)}
                  className="cursor-pointer hover:bg-surface"
                >
                  <td className="px-4 py-3 font-medium text-text-primary">{user.full_name}</td>
                  <td className="px-4 py-3 text-text-secondary">@{user.login}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[user.account_status] ?? 'muted'}>{user.account_status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{formatDate(user.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Создать студента">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="ФИО *" error={errors.full_name?.message} {...register('full_name')} />
          <Input label="Телефон *" type="tel" error={errors.phone?.message} {...register('phone')} />
          <Input label="Email" error={errors.email?.message} {...register('email')} />
          <Input label="Гражданство" {...register('citizenship')} />
          <Button type="submit" className="w-full" loading={isSubmitting}>Создать</Button>
        </form>
      </Modal>

      <Modal open={!!createdCreds} onClose={() => setCreatedCreds(null)} title="Данные для входа">
        {createdCreds && (
          <div className="space-y-4">
            <p className="text-sm text-warning font-medium">⚠️ Сохраните данные — пароль показывается один раз!</p>
            {[{ label: 'Логин', value: createdCreds.login }, { label: 'Пароль', value: createdCreds.password }].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-xs text-text-muted">{label}</p>
                  <p className="font-mono font-semibold text-text-primary">{value}</p>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(value); toast.success(`${label} скопирован`) }} className="text-xs text-primary hover:underline">
                  Копировать
                </button>
              </div>
            ))}
            <Button className="w-full" onClick={() => setCreatedCreds(null)}>Закрыть</Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
