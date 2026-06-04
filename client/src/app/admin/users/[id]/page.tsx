'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, RefreshCw, CalendarDays, X, GraduationCap, Bot, Loader2, Send, Sparkles, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import {
  apiGetUser, apiUpdateUser, apiUpdateUserStatus,
  apiGetStageDeadlines, apiSetStageDeadline, apiDeleteStageDeadline,
} from '@/lib/api/users'
import { apiGetUniversity } from '@/lib/api/universities'
import { apiResetPassword } from '@/lib/api/auth'
import { apiSendNotification } from '@/lib/api/notifications'
import { apiAiStudentSummary, apiAiAdmissionScore, apiAiReminderDraft } from '@/lib/api/ai'
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
                  <div className="flex flex-col items-end gap-0.5">
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
                    {!savedDeadline && stage.deadline_days && (
                      <span className="text-[10px] text-text-muted">
                        рек. +{stage.deadline_days} дн.
                      </span>
                    )}
                  </div>
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

// ─── AI блок ─────────────────────────────────────────────────────────────────
function AiSection({ userId }: { userId: string }) {
  const [summary, setSummary] = useState<{ summary: string; action_items: string[]; risk_level: string; recommendation: string } | null>(null)
  const [score, setScore] = useState<{ score: number; breakdown: Record<string, number>; verdict: string; weak_points: string[]; strong_points: string[]; recommendations: string[] } | null>(null)
  const [draft, setDraft] = useState<{ draft: string; user_name: string } | null>(null)
  const [editedDraft, setEditedDraft] = useState('')
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [scoreLoading, setScoreLoading] = useState(false)
  const [draftLoading, setDraftLoading] = useState(false)
  const [sendingDraft, setSendingDraft] = useState(false)
  const [showDraftModal, setShowDraftModal] = useState(false)

  const loadSummary = async () => {
    setSummaryLoading(true)
    try { setSummary(await apiAiStudentSummary(userId)) } catch { toast.error('Ошибка AI') } finally { setSummaryLoading(false) }
  }

  const loadScore = async () => {
    setScoreLoading(true)
    try { setScore(await apiAiAdmissionScore(userId)) } catch { toast.error('Ошибка AI') } finally { setScoreLoading(false) }
  }

  const generateDraft = async () => {
    setDraftLoading(true)
    try {
      const res = await apiAiReminderDraft(userId)
      setDraft(res)
      setEditedDraft(res.draft)
      setShowDraftModal(true)
    } catch { toast.error('Ошибка AI') } finally { setDraftLoading(false) }
  }

  const sendDraft = async () => {
    setSendingDraft(true)
    try {
      await apiSendNotification({ user_id: userId, message: editedDraft })
      toast.success('Уведомление отправлено')
      setShowDraftModal(false)
    } catch { toast.error('Ошибка отправки') } finally { setSendingDraft(false) }
  }

  const riskColor = (r: string) => r === 'high' ? 'text-red-600 bg-red-50 border-red-200' : r === 'medium' ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-emerald-600 bg-emerald-50 border-emerald-200'
  const riskLabel = (r: string) => r === 'high' ? 'Высокий риск' : r === 'medium' ? 'Средний риск' : 'Низкий риск'
  const scoreColor = (s: number) => s >= 70 ? 'text-emerald-600' : s >= 45 ? 'text-amber-600' : 'text-red-500'
  const scoreRing = (s: number) => s >= 70 ? 'bg-emerald-500' : s >= 45 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Bot className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-text-primary">AI-Анализ</h2>
        <span className="text-[10px] bg-primary/10 text-primary rounded-full px-2 py-0.5 font-semibold">Groq</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <button onClick={loadSummary} disabled={summaryLoading}
          className="rounded-xl border border-slate-200 p-3 text-left hover:border-primary/40 hover:bg-primary/3 transition-colors disabled:opacity-50">
          {summaryLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary mb-2" /> : <Sparkles className="h-5 w-5 text-primary mb-2" />}
          <p className="text-sm font-medium text-text-primary">Сводка</p>
          <p className="text-xs text-text-muted">Краткий анализ студента</p>
        </button>
        <button onClick={loadScore} disabled={scoreLoading}
          className="rounded-xl border border-slate-200 p-3 text-left hover:border-primary/40 hover:bg-primary/3 transition-colors disabled:opacity-50">
          {scoreLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary mb-2" /> : <TrendingUp className="h-5 w-5 text-primary mb-2" />}
          <p className="text-sm font-medium text-text-primary">Шансы поступления</p>
          <p className="text-xs text-text-muted">Балл и рекомендации</p>
        </button>
        <button onClick={generateDraft} disabled={draftLoading}
          className="rounded-xl border border-slate-200 p-3 text-left hover:border-primary/40 hover:bg-primary/3 transition-colors disabled:opacity-50">
          {draftLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary mb-2" /> : <Send className="h-5 w-5 text-primary mb-2" />}
          <p className="text-sm font-medium text-text-primary">Написать напоминание</p>
          <p className="text-xs text-text-muted">AI составит текст</p>
        </button>
      </div>

      {/* Summary result */}
      {summary && (
        <div className="rounded-xl border border-slate-200 p-4 space-y-3 mb-3">
          <div className="flex items-start gap-3">
            <span className={`text-xs font-semibold rounded-full border px-2.5 py-1 ${riskColor(summary.risk_level)}`}>{riskLabel(summary.risk_level)}</span>
          </div>
          <p className="text-sm text-text-primary leading-relaxed">{summary.summary}</p>
          {summary.recommendation && <p className="text-sm font-medium text-primary">→ {summary.recommendation}</p>}
          {summary.action_items.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-text-muted mb-1">Действия:</p>
              {summary.action_items.map((a, i) => <p key={i} className="text-xs text-text-secondary">• {a}</p>)}
            </div>
          )}
        </div>
      )}

      {/* Admission score result */}
      {score && (
        <div className="rounded-xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 flex-shrink-0">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                <circle cx="32" cy="32" r="28" fill="none" strokeWidth="6"
                  stroke={score.score >= 70 ? '#10b981' : score.score >= 45 ? '#f59e0b' : '#ef4444'}
                  strokeDasharray={`${score.score * 1.759} 175.9`}
                  strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-sm font-bold ${scoreColor(score.score)}`}>{score.score}</span>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-1.5">
              {Object.entries(score.breakdown).map(([k, v]) => (
                <div key={k}>
                  <div className="flex justify-between text-[10px] text-text-muted mb-0.5">
                    <span>{k.toUpperCase()}</span><span>{v}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full ${scoreRing(v)}`} style={{ width: `${v}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-sm text-text-primary leading-relaxed">{score.verdict}</p>
          {score.weak_points.length > 0 && (
            <div className="flex items-start gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>{score.weak_points.map((w, i) => <p key={i} className="text-xs text-text-secondary">{w}</p>)}</div>
            </div>
          )}
          {score.strong_points.length > 0 && (
            <div className="flex items-start gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>{score.strong_points.map((s, i) => <p key={i} className="text-xs text-text-secondary">{s}</p>)}</div>
            </div>
          )}
        </div>
      )}

      {/* Reminder draft modal */}
      <Modal open={showDraftModal} onClose={() => setShowDraftModal(false)} title="AI-напоминание для студента">
        <div className="space-y-4">
          <p className="text-sm text-text-muted">Проверьте текст и при необходимости отредактируйте перед отправкой.</p>
          <textarea
            value={editedDraft}
            onChange={e => setEditedDraft(e.target.value)}
            rows={5}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowDraftModal(false)}>Отмена</Button>
            <Button className="flex-1" loading={sendingDraft} onClick={sendDraft}>
              <Send className="h-4 w-4" /> Отправить
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  )
}

// ─── Главная страница студента ────────────────────────────────────────────────
export default function AdminUserPage({ params }: { params: { id: string } }) {
  const { id } = params
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

      {/* AI анализ */}
      <AiSection userId={id} />

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
