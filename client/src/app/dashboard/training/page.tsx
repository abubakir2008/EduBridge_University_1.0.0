'use client'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Clock, BookOpen, ChevronRight, ListChecks, Trophy } from 'lucide-react'
import { useAuthStore } from '@/lib/store/authStore'
import { apiGetTraining, apiAdvanceStage, apiCompleteRequirement } from '@/lib/api/training'
import { apiUploadFile } from '@/lib/api/files'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useState, useRef } from 'react'

type StageReq = { is_done: boolean; requirement: { is_required: boolean } }
type MinStage = { id: string; name: string; deadline_status?: string; requirements?: StageReq[] }
type MinProgress = { current_stage_id?: string | null; status?: string; current_stage?: MinStage | null }

function StatusTracker({ progress, allStages }: { progress: MinProgress; allStages: { id: string; name: string }[] }) {
  const currentIdx = allStages.findIndex((s) => s.id === (progress.current_stage_id ?? ''))
  const doneCount = Math.max(0, currentIdx)
  const total = allStages.length
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0
  const stage = progress.current_stage
  const pendingRequired = stage?.requirements?.filter((r) => !r.is_done && r.requirement.is_required).length ?? 0

  let label: string
  let sublabel: string
  let colorClass: string
  let Icon: typeof ListChecks

  if (progress.status === 'completed') {
    label = 'Поступление завершено!'
    sublabel = 'Все этапы успешно пройдены'
    colorClass = 'border-success/40 bg-emerald-50 text-emerald-700'
    Icon = Trophy
  } else if (stage?.deadline_status === 'overdue') {
    label = stage?.name ?? 'Текущий этап'
    sublabel = 'Срок выполнения истёк — требуется срочное действие'
    colorClass = 'border-error/40 bg-red-50 text-error'
    Icon = AlertTriangle
  } else if (pendingRequired > 0) {
    label = stage?.name ?? 'Текущий этап'
    sublabel = `Ожидаем ${pendingRequired} обязательных ${pendingRequired === 1 ? 'требования' : 'требований'}`
    colorClass = 'border-warning/40 bg-amber-50 text-amber-700'
    Icon = ListChecks
  } else {
    label = stage?.name ?? 'Текущий этап'
    sublabel = 'Все требования выполнены — завершите этап'
    colorClass = 'border-primary/30 bg-primary/5 text-primary'
    Icon = CheckCircle2
  }

  return (
    <div className={`flex items-center justify-between gap-4 rounded-xl border px-5 py-4 ${colorClass}`}>
      <div className="flex items-center gap-3 min-w-0">
        <Icon className="h-5 w-5 shrink-0" />
        <div className="min-w-0">
          <p className="font-semibold text-sm leading-tight truncate">{label}</p>
          <p className="text-xs mt-0.5 opacity-75 leading-tight">{sublabel}</p>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs opacity-60 mb-1">Прогресс</p>
        <div className="flex items-center gap-2">
          <div className="w-24 h-1.5 rounded-full bg-current/20 overflow-hidden">
            <div className="h-full rounded-full bg-current transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-semibold">{doneCount}/{total}</span>
        </div>
      </div>
    </div>
  )
}

export default function TrainingPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [note, setNote] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingReqId, setUploadingReqId] = useState<string | null>(null)

  const { data: progress, isLoading } = useQuery({
    queryKey: ['training', user?.id],
    queryFn: () => apiGetTraining(user!.id),
    enabled: !!user,
  })

  const advanceMutation = useMutation({
    mutationFn: () => apiAdvanceStage(user!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['training'] })
      toast.success('Переход на следующий этап!')
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { detail?: string } } }
      toast.error(err?.response?.data?.detail ?? 'Выполните все обязательные требования')
    },
  })

  const completeMutation = useMutation({
    mutationFn: ({ reqId, fileId }: { reqId: string; fileId?: string }) =>
      apiCompleteRequirement(user!.id, reqId, fileId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['training'] }),
  })

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-60 w-full" />
    </div>
  )

  if (!progress || !progress.university_id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-4">
        <BookOpen className="h-16 w-16 text-text-muted" />
        <h2 className="text-xl font-semibold text-text-primary">Вы ещё не выбрали университет</h2>
        <p className="text-text-secondary">Выберите университет, чтобы начать путь поступления</p>
        <Link href="/dashboard/universities">
          <Button>Выбрать университет</Button>
        </Link>
      </div>
    )
  }

  const stage = progress.current_stage
  const allStages = progress.all_stages ?? []

  const deadlineColor =
    stage?.deadline_status === 'overdue'
      ? 'text-error'
      : stage?.deadline_status === 'at_risk'
      ? 'text-warning'
      : 'text-success'

  const handleFileUpload = async (reqId: string, file: File) => {
    setUploadingReqId(reqId)
    try {
      const uploaded = await apiUploadFile(file, 'documents')
      await completeMutation.mutateAsync({ reqId, fileId: uploaded.id })
      toast.success('Файл загружен')
    } catch {
      toast.error('Ошибка загрузки файла')
    } finally {
      setUploadingReqId(null)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{progress.university?.name}</h1>
        <p className="text-text-secondary mt-1">Мой путь поступления</p>
      </div>

      {/* Status tracker */}
      <StatusTracker progress={progress} allStages={allStages} />

      {/* Stepper */}
      <Card padding="sm">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allStages.map((s, i) => {
            const isCurrent = s.id === progress.current_stage_id
            const isPast = allStages.findIndex((x) => x.id === progress.current_stage_id) > i
            return (
              <div key={s.id} className="flex items-center gap-1 shrink-0">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold border-2',
                    isCurrent && 'border-primary bg-primary text-white',
                    isPast && 'border-success bg-success/10 text-success',
                    !isCurrent && !isPast && 'border-slate-300 bg-white text-text-muted'
                  )}
                >
                  {isPast ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <span className={cn('text-xs', isCurrent ? 'font-semibold text-primary' : 'text-text-muted')}>
                  {s.name}
                </span>
                {i < allStages.length - 1 && <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Current stage */}
      {stage && (
        <Card>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">{stage.name}</h2>
              {stage.description && <p className="text-sm text-text-secondary mt-1">{stage.description}</p>}
            </div>
            {stage.deadline_status && (
              <div className={cn('flex items-center gap-1.5 text-sm font-medium', deadlineColor)}>
                {stage.deadline_status === 'overdue' ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
                {stage.deadline_status === 'overdue'
                  ? 'Просрочено'
                  : `Осталось ${stage.days_left} дн.`}
              </div>
            )}
          </div>

          {/* Lessons */}
          {stage.lessons && stage.lessons.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Уроки</h3>
              <div className="space-y-2">
                {stage.lessons.map((lesson) => (
                  <Link
                    key={lesson.id}
                    href={`/dashboard/lessons/${lesson.id}`}
                    className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 hover:bg-surface transition-colors"
                  >
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-text-primary">{lesson.title}</span>
                    <Badge variant="muted" className="ml-auto">{lesson.content_type}</Badge>
                    <ChevronRight className="h-4 w-4 text-text-muted" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Requirements */}
          {stage.requirements && stage.requirements.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Требования</h3>
              <div className="space-y-3">
                {stage.requirements.map((sr) => (
                  <div
                    key={sr.id}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border px-4 py-3',
                      sr.is_done ? 'border-success/30 bg-emerald-50' : 'border-slate-200 bg-white'
                    )}
                  >
                    {sr.requirement.type === 'checkbox' ? (
                      <input
                        type="checkbox"
                        checked={sr.is_done}
                        disabled={sr.is_done}
                        onChange={() => completeMutation.mutate({ reqId: sr.requirement_id })}
                        className="h-4 w-4 rounded accent-primary"
                      />
                    ) : (
                      <CheckCircle2 className={cn('h-4 w-4', sr.is_done ? 'text-success' : 'text-text-muted')} />
                    )}
                    <div className="flex-1">
                      <p className={cn('text-sm font-medium', sr.is_done ? 'line-through text-text-muted' : 'text-text-primary')}>
                        {sr.requirement.name}
                        {sr.requirement.is_required && !sr.is_done && (
                          <span className="ml-2 text-xs text-error">*обязательно</span>
                        )}
                      </p>
                    </div>
                    {sr.requirement.type === 'file_upload' && !sr.is_done && (
                      <>
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f) handleFileUpload(sr.requirement_id, f)
                          }}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          loading={uploadingReqId === sr.requirement_id}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Загрузить
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            className="w-full"
            loading={advanceMutation.isPending}
            onClick={() => advanceMutation.mutate()}
          >
            Перейти на следующий этап
          </Button>
        </Card>
      )}

      {progress.status === 'completed' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-card border border-success/30 bg-emerald-50 p-8 text-center"
        >
          <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4" />
          <h2 className="text-xl font-bold text-text-primary">Поздравляем! Путь завершён</h2>
          <p className="mt-2 text-text-secondary">Все этапы поступления пройдены успешно.</p>
        </motion.div>
      )}
    </div>
  )
}
