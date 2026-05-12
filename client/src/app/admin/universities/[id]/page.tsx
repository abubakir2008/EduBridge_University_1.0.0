'use client'
import { use, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import {
  apiGetUniversity, apiUpdateUniversity, apiGetStages,
  apiCreateStage, apiUpdateStage, apiDeleteStage,
  apiGetRequirements, apiCreateRequirement, apiDeleteRequirement,
} from '@/lib/api/universities'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import type { Stage } from '@/types'

export default function AdminUniversityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const qc = useQueryClient()
  const [expandedStage, setExpandedStage] = useState<string | null>(null)
  const [showAddStage, setShowAddStage] = useState(false)
  const [showAddReq, setShowAddReq] = useState<string | null>(null)
  const [confirmDeleteStage, setConfirmDeleteStage] = useState<string | null>(null)

  const { data: uni, isLoading } = useQuery({ queryKey: ['uni', id], queryFn: () => apiGetUniversity(id) })
  const { data: stages } = useQuery({ queryKey: ['stages', id], queryFn: () => apiGetStages(id) })

  const uniForm = useForm({ values: uni ?? undefined })
  const stageForm = useForm()
  const reqForm = useForm()

  const updateUni = useMutation({
    mutationFn: (d: Record<string, unknown>) => apiUpdateUniversity(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['uni', id] }); toast.success('Сохранено') },
  })

  const createStage = useMutation({
    mutationFn: (d: Record<string, unknown>) => apiCreateStage({ ...d, university_id: id, order: (stages?.length ?? 0) + 1 }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stages', id] }); setShowAddStage(false); stageForm.reset() },
  })

  const deleteStage = useMutation({
    mutationFn: apiDeleteStage,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stages', id] }); setConfirmDeleteStage(null) },
  })

  const createReq = useMutation({
    mutationFn: ({ stageId, data }: { stageId: string; data: Record<string, unknown> }) =>
      apiCreateRequirement(stageId, data),
    onSuccess: (_, { stageId }) => {
      qc.invalidateQueries({ queryKey: ['requirements', stageId] })
      setShowAddReq(null)
      reqForm.reset()
    },
  })

  if (isLoading) return <Skeleton className="h-96 w-full" />

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/admin/universities" className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Назад
      </Link>

      <h1 className="text-2xl font-bold text-text-primary">{uni?.name}</h1>

      {/* Edit university form */}
      <Card>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Данные университета</h2>
        <form onSubmit={uniForm.handleSubmit((d) => updateUni.mutate(d as unknown as Record<string, unknown>))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Название" {...uniForm.register('name')} />
            <Input label="Страна" {...uniForm.register('country')} />
            <Input label="Город" {...uniForm.register('city')} />
            <Input label="Рейтинг" type="number" {...uniForm.register('ranking')} />
            <Input label="Стоимость ($/год)" type="number" {...uniForm.register('tuition_fee')} />
          </div>
          <Input label="Специальности" {...uniForm.register('specialties')} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Описание</label>
            <textarea rows={3} {...uniForm.register('description')} className="w-full rounded-input border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <Button type="submit" loading={updateUni.isPending}>Сохранить</Button>
        </form>
      </Card>

      {/* Stages */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Этапы поступления</h2>
          <Button size="sm" onClick={() => setShowAddStage(true)}>
            <Plus className="h-4 w-4" /> Добавить этап
          </Button>
        </div>

        <div className="space-y-3">
          {(stages ?? []).map((stage) => (
            <StageRow
              key={stage.id}
              stage={stage}
              expanded={expandedStage === stage.id}
              onToggle={() => setExpandedStage(expandedStage === stage.id ? null : stage.id)}
              onDelete={() => setConfirmDeleteStage(stage.id)}
              onAddReq={() => setShowAddReq(stage.id)}
            />
          ))}
        </div>
      </Card>

      {/* Add stage modal */}
      <Modal open={showAddStage} onClose={() => setShowAddStage(false)} title="Добавить этап">
        <form onSubmit={stageForm.handleSubmit((d) => createStage.mutate(d as unknown as Record<string, unknown>))} className="space-y-4">
          <Input label="Название *" {...stageForm.register('name', { required: true })} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Описание</label>
            <textarea rows={2} {...stageForm.register('description')} className="w-full rounded-input border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none" />
          </div>
          <Input label="Дедлайн" type="date" {...stageForm.register('deadline')} />
          <Button type="submit" className="w-full" loading={createStage.isPending}>Создать</Button>
        </form>
      </Modal>

      {/* Add requirement modal */}
      <Modal open={!!showAddReq} onClose={() => setShowAddReq(null)} title="Добавить требование">
        <form onSubmit={reqForm.handleSubmit((d) => createReq.mutate({ stageId: showAddReq!, data: d as unknown as Record<string, unknown> }))} className="space-y-4">
          <Input label="Название *" {...reqForm.register('name', { required: true })} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Тип</label>
            <select {...reqForm.register('type')} className="rounded-input border border-slate-200 px-3 py-2 text-sm focus:outline-none">
              <option value="checkbox">Чекбокс</option>
              <option value="file_upload">Загрузка файла</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...reqForm.register('is_required')} className="accent-primary" />
            Обязательное
          </label>
          <Button type="submit" className="w-full" loading={createReq.isPending}>Добавить</Button>
        </form>
      </Modal>

      {/* Confirm delete stage */}
      <Modal open={!!confirmDeleteStage} onClose={() => setConfirmDeleteStage(null)} title="Удалить этап?">
        <p className="text-text-secondary mb-6">Это действие нельзя отменить.</p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setConfirmDeleteStage(null)}>Отмена</Button>
          <Button variant="danger" className="flex-1" loading={deleteStage.isPending} onClick={() => deleteStage.mutate(confirmDeleteStage!)}>Удалить</Button>
        </div>
      </Modal>
    </div>
  )
}

function StageRow({ stage, expanded, onToggle, onDelete, onAddReq }: {
  stage: Stage; expanded: boolean; onToggle: () => void; onDelete: () => void; onAddReq: () => void
}) {
  const qc = useQueryClient()
  const { data: requirements } = useQuery({
    queryKey: ['requirements', stage.id],
    queryFn: () => apiGetRequirements(stage.id),
    enabled: expanded,
  })

  const deleteReq = useMutation({
    mutationFn: ({ stageId, reqId }: { stageId: string; reqId: string }) => apiDeleteRequirement(stageId, reqId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['requirements', stage.id] }),
  })

  return (
    <div className="rounded-xl border border-slate-200">
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-surface" onClick={onToggle}>
        <div className="flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary">
            {stage.order}
          </span>
          <span className="font-medium text-text-primary">{stage.name}</span>
          {stage.deadline && <span className="text-xs text-text-muted">{stage.deadline}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); onDelete() }} className="text-error hover:text-red-700">
            <Trash2 className="h-4 w-4" />
          </button>
          {expanded ? <ChevronUp className="h-4 w-4 text-text-muted" /> : <ChevronDown className="h-4 w-4 text-text-muted" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-text-secondary">Требования</p>
            <Button size="sm" variant="outline" onClick={onAddReq}>
              <Plus className="h-3.5 w-3.5" /> Добавить
            </Button>
          </div>
          {(requirements ?? []).map((req) => (
            <div key={req.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 mb-2">
              <div>
                <span className="text-sm font-medium text-text-primary">{req.name}</span>
                <span className="ml-2 text-xs text-text-muted">({req.type})</span>
                {req.is_required && <span className="ml-2 text-xs text-error">*обязательное</span>}
              </div>
              <button onClick={() => deleteReq.mutate({ stageId: stage.id, reqId: req.id })} className="text-error hover:text-red-700">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {requirements?.length === 0 && <p className="text-sm text-text-muted">Требований нет</p>}
        </div>
      )}
    </div>
  )
}
