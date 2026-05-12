'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { apiGetUniversities, apiCreateUniversity, apiDeleteUniversity } from '@/lib/api/universities'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { TableSkeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'

export default function AdminUniversitiesPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const { data: universities, isLoading } = useQuery({
    queryKey: ['universities', search],
    queryFn: () => apiGetUniversities(search ? { search } : undefined),
  })

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm()

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiCreateUniversity(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['universities'] })
      toast.success('Университет добавлен')
      setShowCreate(false)
      reset()
    },
    onError: () => toast.error('Ошибка создания'),
  })

  const deleteMutation = useMutation({
    mutationFn: apiDeleteUniversity,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['universities'] })
      toast.success('Удалено')
      setConfirmDelete(null)
    },
  })

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Университеты</h1>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> Добавить
        </Button>
      </div>

      <Input
        placeholder="Поиск по названию..."
        icon={<Search className="h-4 w-4" />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {isLoading ? (
        <TableSkeleton />
      ) : (
        <Card padding="none">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                {['Название', 'Страна', 'Рейтинг', 'Стоимость', 'Действия'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(universities ?? []).map((uni) => (
                <tr key={uni.id} className="hover:bg-surface">
                  <td className="px-4 py-3 font-medium text-text-primary">{uni.name}</td>
                  <td className="px-4 py-3 text-text-secondary">{uni.country}</td>
                  <td className="px-4 py-3 text-text-secondary">{uni.ranking ? `#${uni.ranking}` : '—'}</td>
                  <td className="px-4 py-3 text-text-secondary">{uni.tuition_fee ? `$${uni.tuition_fee.toLocaleString()}` : '—'}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => router.push(`/admin/universities/${uni.id}`)} className="text-primary hover:text-primary-hover">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => setConfirmDelete(uni.id)} className="text-error hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Добавить университет">
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d as Record<string, unknown>))} className="space-y-4">
          <Input label="Название *" {...register('name', { required: true })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Страна *" {...register('country', { required: true })} />
            <Input label="Город *" {...register('city', { required: true })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Рейтинг" type="number" {...register('ranking')} />
            <Input label="Стоимость ($/год)" type="number" {...register('tuition_fee')} />
          </div>
          <Input label="Специальности" {...register('specialties')} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Описание</label>
            <textarea rows={3} {...register('description')} className="w-full rounded-input border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <Button type="submit" className="w-full" loading={isSubmitting}>Создать</Button>
        </form>
      </Modal>

      {/* Confirm delete */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Удалить университет?">
        <p className="text-text-secondary mb-6">Это действие нельзя отменить.</p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setConfirmDelete(null)}>Отмена</Button>
          <Button variant="danger" className="flex-1" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(confirmDelete!)}>
            Удалить
          </Button>
        </div>
      </Modal>
    </div>
  )
}
