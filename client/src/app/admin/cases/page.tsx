'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { apiGetCases, apiCreateCase, apiUpdateCase, apiDeleteCase } from '@/lib/api/cases'
import { apiGetUniversities } from '@/lib/api/universities'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { TableSkeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import type { Case } from '@/types'

export default function AdminCasesPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Case | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const { data: cases, isLoading } = useQuery({ queryKey: ['cases'], queryFn: () => apiGetCases() })
  const { data: universities } = useQuery({ queryKey: ['universities-list'], queryFn: () => apiGetUniversities() })

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({ values: editing ?? undefined })

  const saveMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) =>
      editing ? apiUpdateCase(editing.id, d) : apiCreateCase(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cases'] })
      toast.success(editing ? 'Кейс обновлён' : 'Кейс добавлен')
      setShowForm(false)
      setEditing(null)
      reset()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: apiDeleteCase,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cases'] }); setConfirmDelete(null); toast.success('Удалено') },
  })

  const openEdit = (c: Case) => { setEditing(c); setShowForm(true) }
  const openCreate = () => { setEditing(null); reset(); setShowForm(true) }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Кейсы</h1>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" /> Добавить</Button>
      </div>

      {isLoading ? <TableSkeleton /> : (
        <Card padding="none" className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                {['Заголовок', 'Студент', 'Университет', 'Страна', 'Дата', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(cases ?? []).map((c) => (
                <tr key={c.id} className="hover:bg-surface">
                  <td className="px-4 py-3 font-medium text-text-primary">{c.title}</td>
                  <td className="px-4 py-3 text-text-secondary">{c.student_name}</td>
                  <td className="px-4 py-3 text-text-secondary">{c.university?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-text-secondary">{c.country}</td>
                  <td className="px-4 py-3 text-text-muted">{formatDate(c.created_at)}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => openEdit(c)} className="text-primary hover:text-primary-hover"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => setConfirmDelete(c.id)} className="text-error hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null) }} title={editing ? 'Редактировать кейс' : 'Добавить кейс'}>
        <form onSubmit={handleSubmit((d) => saveMutation.mutate(d as unknown as Record<string, unknown>))} className="space-y-4">
          <Input label="Заголовок *" {...register('title', { required: true })} />
          <Input label="Имя студента *" {...register('student_name', { required: true })} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Университет</label>
            <select {...register('university_id')} className="h-10 rounded-input border border-slate-200 px-3 text-sm focus:outline-none focus:border-primary">
              <option value="">— выбрать —</option>
              {(universities ?? []).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Страна *" {...register('country', { required: true })} />
            <Input label="Специальность *" {...register('specialty', { required: true })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Описание</label>
            <textarea rows={3} {...register('description')} className="w-full rounded-input border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
          <Button type="submit" className="w-full" loading={isSubmitting || saveMutation.isPending}>
            {editing ? 'Сохранить' : 'Создать'}
          </Button>
        </form>
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Удалить кейс?">
        <p className="text-text-secondary mb-6">Это действие нельзя отменить.</p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setConfirmDelete(null)}>Отмена</Button>
          <Button variant="danger" className="flex-1" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(confirmDelete!)}>Удалить</Button>
        </div>
      </Modal>
    </div>
  )
}
