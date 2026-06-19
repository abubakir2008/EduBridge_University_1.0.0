'use client'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Clock, BookOpen, ChevronRight, ListChecks, Trophy, RefreshCw } from 'lucide-react'
import { useAuthStore } from '@/lib/store/authStore'
import { useBarashekStore } from '@/lib/store/barashekStore'
import { apiGetTraining, apiAdvanceStage, apiCompleteRequirement, apiCancelTraining } from '@/lib/api/training'
import { apiUploadFile } from '@/lib/api/files'
import { apiAiCheckDocument } from '@/lib/api/ai'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

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
  const say = useBarashekStore((s) => s.say)
  const qc = useQueryClient()
  const [note, setNote] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingReqId, setUploadingReqId] = useState<string | null>(null)
  const [showChangeModal, setShowChangeModal] = useState(false)
  const router = useRouter()

  const { data: progress, isLoading } = useQuery({
    queryKey: ['training', user?.id],
    queryFn: () => apiGetTraining(user!.id),
    enabled: !!user,
  })

  const advanceMutation = useMutation({
    mutationFn: () => apiAdvanceStage(user!.id),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['training'] })
      if (data?.status === 'completed') {
        say({
          variant: 'celebrate',
          title: 'Поступление завершено! 🎓',
          text: 'Ты прошёл весь путь до конца — я невероятно горжусь тобой! Ты большой молодец! 💚',
        })
      } else {
        say({
          variant: 'celebrate',
          title: 'Этап пройден! 🎉',
          text: `Умничка! Двигаемся дальше${data?.current_stage?.name ? `: «${data.current_stage.name}»` : ''}. Ты отлично справляешься! 🐑`,
        })
      }
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { detail?: string } } }
      const detail = err?.response?.data?.detail ?? 'Выполните все обязательные требования'
      if (detail.includes('уроки') || detail.includes('урок')) {
        say({
          variant: 'remind',
          mood: 'talking',
          title: 'Сначала уроки! 🎬',
          text: 'Эй-эй, не спеши 🐑 Сначала посмотри уроки этого этапа — это важно для тебя. Потом пойдём дальше!',
        })
      } else {
        toast.error(detail)
      }
    },
  })

  const completeMutation = useMutation({
    mutationFn: ({ reqId, fileId }: { reqId: string; fileId?: string }) =>
      apiCompleteRequirement(user!.id, reqId, fileId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['training'] }),
  })

  const cancelMutation = useMutation({
    mutationFn: () => apiCancelTraining(user!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['training'] })
      toast.success('Выбор университета сброшен')
      router.push('/dashboard/universities')
    },
    onError: () => toast.error('Ошибка при смене университета'),
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

  // Геймификация: общий прогресс по этапам + требованиям текущего этапа
  const currentIdx = allStages.findIndex((s) => s.id === (progress.current_stage_id ?? ''))
  const doneStages = Math.max(0, currentIdx)
  const totalStages = allStages.length
  const overallPct =
    progress.status === 'completed'
      ? 100
      : totalStages > 0
      ? Math.round((doneStages / totalStages) * 100)
      : 0
  const reqs = stage?.requirements ?? []
  const reqDone = reqs.filter((r) => r.is_done).length

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

      // Барашек честно (но мягко) проверяет документ — фото, PDF, DOCX, TXT
      const n = file.name.toLowerCase()
      const isCheckable = file.type.startsWith('image/') || file.type.startsWith('text/')
        || file.type === 'application/pdf' || file.type.includes('wordprocessingml')
        || n.endsWith('.pdf') || n.endsWith('.docx') || n.endsWith('.txt')
      if (isCheckable) {
        say({ variant: 'info', mood: 'thinking', title: 'Смотрю твой документ… 🐑', text: 'Секундочку, проверяю — хочу убедиться, что всё хорошо.' })
        try {
          const res = await apiAiCheckDocument(file)
          if (res.ok && res.issues.length === 0) {
            say({
              variant: 'celebrate',
              title: 'Документ отличный! ✅',
              text: `${res.verdict || 'Всё на месте.'} Ты молодец, так держать! 💚`,
            })
          } else {
            const points = [...res.issues, ...res.empty_fields.map((f) => `пустое поле: ${f}`)]
              .slice(0, 4).map((p) => `• ${p}`).join('\n')
            say({
              variant: 'info',
              mood: 'talking',
              title: 'Глянул твой документ 🐑',
              text: `${res.verdict || 'Почти отлично!'}\nДавай чуть подправим:\n${points || '• мелкие детали'}\nПоправишь — и будет супер, я в тебя верю! 💚`,
            })
          }
        } catch {
          say({
            variant: 'info', mood: 'talking', title: 'Документ получен 🐑',
            text: 'Я сохранил твой файл! Сейчас не получилось его разобрать, но ты молодец. Если хочешь, чтобы я честно проверил — загрузи фото (JPG/PNG) или PDF почётче.',
          })
        }
      } else {
        say({
          variant: 'info', mood: 'happy', title: 'Документ получен ✅',
          text: 'Файл сохранён! Я честно проверяю фото (JPG/PNG), PDF, DOCX и TXT — загрузи в таком формате, и я гляну, всё ли в порядке.',
        })
      }
    } catch {
      toast.error('Ошибка загрузки файла')
    } finally {
      setUploadingReqId(null)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Прогресс-герой (navy + геймификация) */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="gradient-brand rounded-3xl p-6 sm:p-7 text-white relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-1">
                Мой путь поступления
              </p>
              <h1 className="text-2xl font-extrabold leading-tight truncate">
                {progress.university?.name}
              </h1>
            </div>
            {progress.status !== 'completed' && (
              <button
                onClick={() => setShowChangeModal(true)}
                className="flex items-center gap-1.5 shrink-0 text-sm font-medium text-white/80 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-3 py-2 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Сменить</span>
              </button>
            )}
          </div>

          <div className="bg-white/10 rounded-2xl p-4 mt-5">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/70">Общий прогресс</span>
              <span className="font-bold">{overallPct}%</span>
            </div>
            <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-300 to-primary-light rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${overallPct}%` }}
                transition={{ duration: 1, delay: 0.3 }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="stat-tile">
              <p className="text-lg font-extrabold">
                {doneStages}/{totalStages}
              </p>
              <p className="text-xs text-white/60 mt-0.5">Этапов</p>
            </div>
            <div className="stat-tile">
              <p className="text-lg font-extrabold">
                {reqDone}/{reqs.length}
              </p>
              <p className="text-xs text-white/60 mt-0.5">Требований</p>
            </div>
            <div className="stat-tile">
              <p className="text-lg font-extrabold">
                {progress.status === 'completed'
                  ? '🎓'
                  : stage?.deadline_status === 'overdue'
                  ? '⚠️'
                  : stage?.days_left != null
                  ? stage.days_left
                  : '—'}
              </p>
              <p className="text-xs text-white/60 mt-0.5">
                {progress.status === 'completed' ? 'Готово' : 'Дней'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <Modal open={showChangeModal} onClose={() => setShowChangeModal(false)} title="Сменить университет?">
        <p className="text-text-secondary text-sm mb-6">
          Весь ваш текущий прогресс поступления будет удалён. Вы сможете выбрать другой университет и начать заново. Это действие необратимо.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setShowChangeModal(false)}>Отмена</Button>
          <Button
            variant="danger"
            loading={cancelMutation.isPending}
            onClick={() => cancelMutation.mutate()}
          >
            Да, сменить
          </Button>
        </div>
      </Modal>

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
          <div data-tour="tour-stage" className="flex items-start justify-between mb-4">
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
          {stage.lessons && stage.lessons.length > 0 && (() => {
            const unseen = stage.lessons.filter((l) => !l.viewed).length
            return (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Уроки</h3>
                {unseen > 0 ? (
                  <span className="text-[11px] font-medium text-amber-600">🐑 посмотри {unseen}, чтобы идти дальше</span>
                ) : (
                  <span className="text-[11px] font-medium text-success">все просмотрены ✓</span>
                )}
              </div>
              <div className="space-y-2">
                {stage.lessons.map((lesson, li) => (
                  <Link
                    key={lesson.id}
                    href={`/dashboard/lessons/${lesson.id}`}
                    {...(li === 0 ? { 'data-tour': 'tour-lesson' } : {})}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors',
                      lesson.viewed ? 'border-success/30 bg-emerald-50' : 'border-slate-200 hover:bg-surface'
                    )}
                  >
                    {lesson.viewed
                      ? <CheckCircle2 className="h-4 w-4 text-success" />
                      : <BookOpen className="h-4 w-4 text-primary" />}
                    <span className="text-sm font-medium text-text-primary">{lesson.title}</span>
                    <Badge variant="muted" className="ml-auto">{lesson.content_type}</Badge>
                    <ChevronRight className="h-4 w-4 text-text-muted" />
                  </Link>
                ))}
              </div>
            </div>
            )
          })()}

          {/* Requirements */}
          {stage.requirements && stage.requirements.length > 0 && (
            <div className="mb-6" data-tour="tour-requirement">
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
