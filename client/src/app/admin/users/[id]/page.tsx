'use client'
import { use, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { apiGetUser, apiUpdateUser, apiUpdateUserStatus } from '@/lib/api/users'
import { apiResetPassword } from '@/lib/api/auth'
import { apiGetNotifications } from '@/lib/api/notifications'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'

const statuses = ['active', 'archived', 'enrolled']

export default function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const qc = useQueryClient()
  const [resetCreds, setResetCreds] = useState<{ login: string; password: string } | null>(null)
  const [editing, setEditing] = useState(false)

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => apiGetUser(id),
  })

  const { register, handleSubmit } = useForm({ values: user ?? undefined })

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiUpdateUser(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['user', id] }); toast.success('Сохранено'); setEditing(false) },
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => apiUpdateUserStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user', id] }),
  })

  const resetMutation = useMutation({
    mutationFn: () => apiResetPassword(id),
    onSuccess: (creds) => setResetCreds(creds),
  })

  if (isLoading) return (
    <div className="max-w-2xl space-y-4">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-60 w-full" />
    </div>
  )

  if (!user) return <p className="text-text-secondary">Студент не найден</p>

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/admin/users" className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Назад к студентам
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">{user.full_name}</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" loading={resetMutation.isPending} onClick={() => resetMutation.mutate()}>
            <RefreshCw className="h-4 w-4" /> Сбросить пароль
          </Button>
          <Button size="sm" variant={editing ? 'primary' : 'outline'} onClick={() => setEditing(!editing)}>
            {editing ? 'Отмена' : 'Редактировать'}
          </Button>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit((d) => updateMutation.mutate(d as unknown as Record<string, unknown>))} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="ФИО" disabled={!editing} {...register('full_name')} />
            <Input label="Телефон" disabled={!editing} {...register('phone')} />
            <Input label="Email" disabled={!editing} {...register('email')} />
            <Input label="Гражданство" disabled={!editing} {...register('citizenship')} />
            <Input label="GPA" type="number" step="0.01" disabled={!editing} {...register('gpa')} />
            <Input label="IELTS" type="number" step="0.5" disabled={!editing} {...register('ielts_score')} />
          </div>

          <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-text-muted">Статус аккаунта:</span>
              <Badge variant={user.account_status === 'active' ? 'success' : user.account_status === 'enrolled' ? 'default' : 'muted'}>
                {user.account_status}
              </Badge>
              <select
                onChange={(e) => statusMutation.mutate(e.target.value)}
                defaultValue={user.account_status}
                className="rounded-input border border-slate-200 px-2 py-1 text-xs focus:outline-none"
              >
                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <span className="text-xs text-text-muted">@{user.login}</span>
          </div>

          {editing && (
            <Button type="submit" className="w-full" loading={updateMutation.isPending}>
              Сохранить
            </Button>
          )}
        </form>
      </Card>

      {/* Reset password modal */}
      <Modal open={!!resetCreds} onClose={() => setResetCreds(null)} title="Новый пароль">
        {resetCreds && (
          <div className="space-y-4">
            <p className="text-sm text-warning font-medium">⚠️ Сохраните — пароль показывается один раз!</p>
            {[{ label: 'Логин', value: resetCreds.login }, { label: 'Новый пароль', value: resetCreds.password }].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-xs text-text-muted">{label}</p>
                  <p className="font-mono font-semibold text-text-primary">{value}</p>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(value); toast.success('Скопировано') }} className="text-xs text-primary hover:underline">
                  Копировать
                </button>
              </div>
            ))}
            <Button className="w-full" onClick={() => setResetCreds(null)}>Закрыть</Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
