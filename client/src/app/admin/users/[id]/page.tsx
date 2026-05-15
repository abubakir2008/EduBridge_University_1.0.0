'use client'
import { use, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, RefreshCw, CalendarDays, X, GraduationCap } from 'lucide-react'
import Link from 'next/link'
import {
  apiGetUser, apiUpdateUser, apiUpdateUserStatus,
  apiGetStageDeadlines, apiSetStageDeadline, apiDeleteStageDeadline,
} from '@/lib/api/users'
import { apiGetUniversity } from '@/lib/api/universities'
import { apiResetPassword } from '@/lib/api/auth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import type { StudentProgress, Stage } from '@/types'
import client from '@/lib/api/client'

const statuses = ['active', 'archived', 'enrolled']

// ─── Блок прогресса с индивидуальными дедлайнами ─────────────────────────────
function ProgressSection({ userId }: { userId: string }) {
  const qc = useQueryClient()

  const { data: progress, isLoading } = useQuery<StudentProgress>({
    queryKey: ['progress', userId],
    queryFn: () => client.get<StudentProgress>(`/training/${userId}`).then(r => r.data),
    retry: false,
  })

  const { data: deadlines } = useQuery<Record<string, string>>({
    queryKey: ['stage-deadlines', userId],
    queryFn: () => apiGetStageDeadlines(userId),
    enabled: !!progress,
  })

  const { data: allStages } = useQuery<Stage[]>({
    queryKey: ['stages', progress?.university_id],
    queryFn: () => client.get<Stage[]>(`/universities/${progress!.university_id}/stages`).then(r => r.data),
    enabled: !!progress?.university_id,
  })

  const { data: university } = useQuery({
    queryKey: ['uni', progress?.university_id],
    queryFn: () => apiGetUniversity(progress!.university_id),
    enabled: !!progress?.university_id,
  })

  const setDeadline = useMutation({
    mutationFn: ({ stageId, deadline }: { stageId: string; deadline: string }) =>
      apiSetStageDeadline(userId, stageId, deadline),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stage-deadlines', userId] }); toast.success('Дедлайн установлен') },
    onError: () => toast.error('Ошибка'),
  })

  const removeDeadline = useMutation({
    mutationFn: (stageId: string) => apiDeleteStageDeadline(userId, stageId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stage-deadlines', userId] }); toast.success('Дедлайн удалён') },
  })

  if (isLoading) return <Skeleton className="h-40 rounded-2xl" />
  if (!progress) return (
    <Card>
      <div className="flex items-center gap-3 text-text-muted py-4">
        <GraduationCap className="h-5 w-5" />
        <span className="text-sm">Студент ещё не зачислен в университет</span>
      </div>
    </Card>
  )

  return (
    <Card>
      <div className="flex items-center gap-2 mb-5">
        <GraduationCap className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-text-primary">Прогресс поступления</h2>
      </div>

      {university && (
        <div className="mb-4 rounded-xl bg-primary/5 border border-primary/10 px-4 py-3">
          <p className="text-sm font-semibold text-primary">{university.name}</p>
          <p className="text-xs text-text-muted mt-0.5">{university.city}, {university.country}</p>
        </div>
      )}

      <div className="space-y-3">
        {(allStages ?? []).map((stage) => {
          const isCurrent = progress.current_stage_id === stage.id
          const savedDeadline = deadlines?.[stage.id] ?? ''

          return (
            <div
              key={stage.id}
              className={`rounded-xl border px-4 py-3 ${isCurrent ? 'border-primary/30 bg-primary/3' : 'border-slate-200'}`}
            >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${isCurrent ? 'bg-primary text-white' : 'bg-slate-100 text-text-muted'}`}>
                    {stage.order}
                  </span>
                  <span className={`text-sm font-medium truncate ${isCurrent ? 'text-primary' : 'text-text-primary'}`}>
                    {stage.name}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-bold bg-primary text-white rounded-full px-2 py-0.5 flex-shrink-0">
                      ТЕКУЩИЙ
                    </span>
                  )}
                </div>

                {/* Индивидуальный дедлайн */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <CalendarDays className="h-4 w-4 text-text-muted" />
                  <input
                    type="date"
                    defaultValue={savedDeadline}
                    key={savedDeadline}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    onChange={(e) => {
                      if (e.target.value) {
                        setDeadline.mutate({ stageId: stage.id, deadline: e.target.value })
                      }
                    }}
                  />
                  {savedDeadline && (
                    <button
                      onClick={() => removeDeadline.mutate(stage.id)}
                      className="text-text-muted hover:text-error transition-colors"
                      title="Удалить дедлайн"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {(allStages ?? []).length === 0 && (
          <p className="text-sm text-text-muted text-center py-4">Этапов нет</p>
        )}
      </div>
    </Card>
  )
}

// ─── Главная страница студента ────────────────────────────────────────────────
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

      {/* Данные студента */}
      <Card>
        <form onSubmit={handleSubmit((d) => updateMutation.mutate(d as unknown as Record<string, unknown>))} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="ФИО" disabled={!editing} {...register('full_name')} />
            <Input label="Телефон" disabled={!editing} {...register('phone')} />
            <Input label="Email" disabled={!editing} {...register('email')} />
            <Input label="Гражданство" disabled={!editing} {...register('citizenship')} />
            <Input label="GPA" type="number" step="0.01" disabled={!editing} {...register('gpa')} />
            <Input label="IELTS" type="number" step="0.5" disabled={!editing} {...register('ielts_score')} />
            <Input label="SAT" type="number" disabled={!editing} {...register('sat_score')} />
            <Input label="Желаемая специальность" disabled={!editing} {...register('desired_specialty')} />
          </div>

          <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-text-muted">Статус:</span>
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

      {/* Прогресс с индивидуальными дедлайнами */}
      <ProgressSection userId={id} />

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
