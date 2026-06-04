'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import {
  Plus, Search, Pencil, Trash2, MapPin, Star, DollarSign,
  GraduationCap, Image as ImageIcon,
} from 'lucide-react'
import {
  apiGetUniversities, apiCreateUniversity, apiDeleteUniversity,
  getUniversityPhotoUrl,
} from '@/lib/api/universities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Skeleton } from '@/components/ui/skeleton'
import { SpecialtiesInput } from '@/components/ui/SpecialtiesInput'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import type { University } from '@/types'

// ─── Карточка университета ────────────────────────────────────────────────────
function UniversityCard({
  uni,
  onEdit,
  onDelete,
}: {
  uni: University
  onEdit: () => void
  onDelete: () => void
}) {
  const coverPhotoId = uni.photo_file_ids?.[0]
  const coverUrl = coverPhotoId ? getUniversityPhotoUrl(uni.id, coverPhotoId) : null
  const specs = Array.isArray(uni.specialties)
    ? uni.specialties
    : uni.specialties
      ? [uni.specialties]
      : []
  const cost = uni.cost ?? uni.tuition_fee
  const rating = uni.rating ?? uni.ranking

  return (
    <div className="group bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      {/* Обложка */}
      <div className="relative h-44 bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={uni.name}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-8 w-8 text-primary/50" />
            </div>
            <span className="text-xs text-text-muted">Нет фото</span>
          </div>
        )}
        {/* Счётчик фото */}
        {(uni.photo_file_ids?.length ?? 0) > 1 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
            <ImageIcon className="h-3 w-3" /> {uni.photo_file_ids!.length}
          </div>
        )}
        {/* Видео бейдж */}
        {uni.video_url && (
          <div className="absolute top-2 right-2 rounded-full bg-red-500 px-2 py-0.5 text-[10px] text-white font-semibold">
            VIDEO
          </div>
        )}
        {/* Рейтинг */}
        {rating && (
          <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-white">
            <Star className="h-3 w-3 fill-white" /> #{rating}
          </div>
        )}
        {/* Кнопки действий при наведении */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
          <button onClick={onEdit}
            className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-primary shadow hover:bg-primary hover:text-white transition-colors flex items-center gap-1.5">
            <Pencil className="h-4 w-4" /> Редактировать
          </button>
          <button onClick={onDelete}
            className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-error shadow hover:bg-error hover:text-white transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Информация */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-text-primary text-base leading-tight line-clamp-1">{uni.name}</h3>
          <div className="flex items-center gap-1 mt-1 text-text-muted text-sm">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{uni.city}, {uni.country}</span>
          </div>
        </div>

        {/* Специальности */}
        {specs.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {specs.slice(0, 3).map((s, i) => (
              <span key={i} className="rounded-full bg-primary/8 text-primary px-2 py-0.5 text-[11px] font-medium truncate max-w-[120px]">
                {s}
              </span>
            ))}
            {specs.length > 3 && (
              <span className="rounded-full bg-slate-100 text-slate-500 px-2 py-0.5 text-[11px]">
                +{specs.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Стоимость */}
        {cost && (
          <div className="flex items-center gap-1.5 text-sm">
            <DollarSign className="h-4 w-4 text-emerald-500" />
            <span className="font-semibold text-emerald-600">${cost.toLocaleString()}</span>
            <span className="text-text-muted">/ год</span>
          </div>
        )}

        {/* Описание */}
        {uni.description && (
          <p className="text-xs text-text-muted line-clamp-2">{uni.description}</p>
        )}
      </div>
    </div>
  )
}

// ─── Главная страница ─────────────────────────────────────────────────────────
export default function AdminUniversitiesPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [specialties, setSpecialties] = useState<string[]>([])

  const { data: universities, isLoading } = useQuery({
    queryKey: ['universities', search],
    queryFn: () => apiGetUniversities(search ? { search } : undefined),
  })

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm()

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => {
      return apiCreateUniversity({
        ...data,
        specialties: specialties.length ? specialties : undefined,
        rating: data.rating ? Number(data.rating) : undefined,
        cost: data.cost ? Number(data.cost) : undefined,
      } as Partial<University>)
    },
    onSuccess: (uni) => {
      qc.invalidateQueries({ queryKey: ['universities'] })
      toast.success('Университет добавлен')
      setShowCreate(false)
      reset()
      setSpecialties([])
      router.push(`/admin/universities/${uni.id}`)
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
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Университеты</h1>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> Добавить
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <input
          placeholder="Поиск по названию, стране..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-input border border-slate-200 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : (universities ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <GraduationCap className="h-16 w-16 text-slate-200 mb-4" />
          <p className="text-text-muted font-medium">Университетов нет</p>
          <p className="text-sm text-text-muted mt-1">Нажмите «Добавить» чтобы создать первый</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(universities ?? []).map((uni) => (
            <UniversityCard
              key={uni.id}
              uni={uni}
              onEdit={() => router.push(`/admin/universities/${uni.id}`)}
              onDelete={() => setConfirmDelete(uni.id)}
            />
          ))}
        </div>
      )}

      {/* Создать */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); reset(); setSpecialties([]) }} title="Добавить университет">
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d as Record<string, unknown>))} className="space-y-4">
          <Input label="Название *" {...register('name', { required: true })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Страна *" {...register('country', { required: true })} />
            <Input label="Город *" {...register('city', { required: true })} />
          </div>
          <Input label="Провинция" placeholder="Shanghai, Jiangsu..." {...register('province')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Рейтинг" type="number" {...register('rating')} />
            <Input label="Стоимость ($/год)" type="number" {...register('cost')} />
          </div>
          <SpecialtiesInput value={specialties} onChange={setSpecialties} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Описание</label>
            <textarea rows={3} {...register('description')}
              className="w-full rounded-input border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <p className="text-xs text-text-muted">После создания вы сможете загрузить фото и видео</p>
          <Button type="submit" className="w-full" loading={isSubmitting}>Создать</Button>
        </form>
      </Modal>

      {/* Удалить */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Удалить университет?">
        <p className="text-text-secondary mb-6">Это действие нельзя отменить.</p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setConfirmDelete(null)}>Отмена</Button>
          <Button variant="danger" className="flex-1" loading={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate(confirmDelete!)}>Удалить</Button>
        </div>
      </Modal>
    </div>
  )
}
