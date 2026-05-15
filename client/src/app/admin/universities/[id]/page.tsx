'use client'
import { useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp,
  ImageIcon, Upload, X, Play, Save,
} from 'lucide-react'
import Link from 'next/link'
import {
  apiGetUniversity, apiUpdateUniversity, apiGetStages,
  apiCreateStage, apiDeleteStage,
  apiGetRequirements, apiCreateRequirement, apiDeleteRequirement,
  apiUploadUniversityPhoto, apiDeleteUniversityPhoto,
  getUniversityPhotoUrl,
  apiUploadUniversityVideo, apiDeleteUniversityVideo,
  getUniversityVideoUrl,
} from '@/lib/api/universities'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import type { Stage } from '@/types'

// ─── Галерея фото ─────────────────────────────────────────────────────────────
function PhotoGallery({ uniId, photoIds }: { uniId: string; photoIds: string[] }) {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        await apiUploadUniversityPhoto(uniId, file)
      }
      qc.invalidateQueries({ queryKey: ['uni', uniId] })
      toast.success('Фото загружены')
    } catch { toast.error('Ошибка загрузки') }
    finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const deleteMutation = useMutation({
    mutationFn: (fileId: string) => apiDeleteUniversityPhoto(uniId, fileId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['uni', uniId] }); toast.success('Фото удалено') },
    onError: () => toast.error('Ошибка удаления'),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-text-primary">Фотографии</h2>
          {photoIds.length > 0 && (
            <span className="text-sm text-text-muted">({photoIds.length})</span>
          )}
        </div>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {uploading ? 'Загружаем...' : 'Загрузить фото'}
          </button>
        </div>
      </div>

      {photoIds.length === 0 ? (
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center hover:border-primary/40 hover:bg-primary/2 transition-colors"
        >
          <ImageIcon className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-text-muted">Нажмите чтобы загрузить фото</p>
          <p className="text-xs text-text-muted mt-1">JPG, PNG, WEBP — несколько файлов сразу</p>
        </button>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photoIds.map((fileId, index) => {
            const url = getUniversityPhotoUrl(uniId, fileId)
            return (
              <div key={fileId} className="group relative aspect-video rounded-xl overflow-hidden bg-slate-100">
                <img
                  src={url}
                  alt={`Фото ${index + 1}`}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setPreview(url)}
                />
                {index === 0 && (
                  <span className="absolute top-1.5 left-1.5 rounded-full bg-primary text-white text-[10px] font-bold px-2 py-0.5">
                    Обложка
                  </span>
                )}
                <button
                  onClick={() => deleteMutation.mutate(fileId)}
                  className="absolute top-1.5 right-1.5 rounded-full bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}
          {/* Кнопка добавить ещё */}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="aspect-video rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 hover:border-primary/40 hover:bg-primary/3 transition-colors text-text-muted hover:text-primary disabled:opacity-50"
          >
            <Plus className="h-6 w-6" />
            <span className="text-xs font-medium">Добавить</span>
          </button>
        </div>
      )}

      {/* Просмотр фото */}
      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <button className="absolute top-4 right-4 text-white hover:text-slate-300">
            <X className="h-8 w-8" />
          </button>
          <img
            src={preview}
            alt="Просмотр"
            className="max-w-4xl max-h-[90vh] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

// ─── Секция видео ─────────────────────────────────────────────────────────────
function VideoSection({
  uniId, videoUrl, videoFileId, onSaveUrl, onRefresh,
}: {
  uniId: string
  videoUrl?: string
  videoFileId?: string
  onSaveUrl: (url: string) => void
  onRefresh: () => void
}) {
  const [tab, setTab] = useState<'url' | 'file'>(videoFileId ? 'file' : 'url')
  const [url, setUrl] = useState(videoUrl ?? '')
  const [progress, setProgress] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const getEmbedUrl = (raw: string) => {
    const yt = raw.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`
    return raw
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const MAX = 500 * 1024 * 1024
    if (file.size > MAX) {
      toast.error('Файл слишком большой. Максимум 500 МБ')
      return
    }
    setUploading(true)
    setProgress(0)
    try {
      await apiUploadUniversityVideo(uniId, file, (pct) => setProgress(pct))
      onRefresh()
      toast.success('Видео загружено')
    } catch {
      toast.error('Ошибка загрузки видео')
    } finally {
      setUploading(false)
      setProgress(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleDeleteFile = async () => {
    try {
      await apiDeleteUniversityVideo(uniId)
      onRefresh()
      toast.success('Видео удалено')
    } catch {
      toast.error('Ошибка удаления')
    }
  }

  const embed = url.trim() ? getEmbedUrl(url.trim()) : null
  const isYoutube = embed?.includes('youtube.com/embed')
  const uploadedVideoUrl = videoFileId ? getUniversityVideoUrl(uniId) : null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Play className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-text-primary">Видео</h2>
      </div>

      {/* Вкладки */}
      <div className="flex rounded-lg border border-slate-200 p-1 gap-1 w-fit">
        <button
          onClick={() => setTab('url')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'url' ? 'bg-primary text-white' : 'text-text-muted hover:text-text-primary'}`}
        >
          YouTube / Ссылка
        </button>
        <button
          onClick={() => setTab('file')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'file' ? 'bg-primary text-white' : 'text-text-muted hover:text-text-primary'}`}
        >
          Загрузить файл
        </button>
      </div>

      {tab === 'url' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="flex-1 rounded-input border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={() => onSaveUrl(url.trim())}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Save className="h-4 w-4" /> Сохранить
            </button>
            {url && (
              <button
                onClick={() => { setUrl(''); onSaveUrl('') }}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-text-muted hover:text-error hover:border-red-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {embed && (
            <div className="rounded-xl overflow-hidden aspect-video bg-black">
              {isYoutube ? (
                <iframe
                  src={embed}
                  title="Видео университета"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video src={embed} controls className="w-full h-full" />
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'file' && (
        <div className="space-y-3">
          <input
            ref={fileRef}
            type="file"
            accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo"
            className="hidden"
            onChange={handleFileChange}
          />

          {uploadedVideoUrl ? (
            <div className="space-y-3">
              <div className="rounded-xl overflow-hidden aspect-video bg-black">
                <video src={uploadedVideoUrl} controls className="w-full h-full" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" /> Заменить видео
                </button>
                <button
                  onClick={handleDeleteFile}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-error hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="h-4 w-4" /> Удалить
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center hover:border-primary/40 hover:bg-primary/2 transition-colors disabled:opacity-50"
            >
              <Play className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-text-muted font-medium">
                {uploading ? 'Загружаем...' : 'Нажмите чтобы загрузить видео'}
              </p>
              <p className="text-xs text-text-muted mt-1">MP4, WebM, MOV, AVI — до 500 МБ</p>
            </button>
          )}

          {/* Прогресс загрузки */}
          {progress !== null && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-text-muted">
                <span>Загрузка видео...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Главная страница ─────────────────────────────────────────────────────────
export default function AdminUniversityPage() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const [expandedStage, setExpandedStage] = useState<string | null>(null)
  const [showAddStage, setShowAddStage] = useState(false)
  const [showAddReq, setShowAddReq] = useState<string | null>(null)
  const [confirmDeleteStage, setConfirmDeleteStage] = useState<string | null>(null)

  const { data: uni, isLoading } = useQuery({ queryKey: ['uni', id], queryFn: () => apiGetUniversity(id) })
  const { data: stages } = useQuery({ queryKey: ['stages', id], queryFn: () => apiGetStages(id) })

  const uniForm = useForm({ values: uni ? {
    name: uni.name,
    country: uni.country,
    city: uni.city,
    rating: uni.rating ?? uni.ranking ?? '',
    cost: uni.cost ?? uni.tuition_fee ?? '',
    specialties: Array.isArray(uni.specialties) ? uni.specialties.join(', ') : (uni.specialties ?? ''),
    description: uni.description ?? '',
  } : undefined })

  const stageForm = useForm()
  const reqForm = useForm()

  const updateUni = useMutation({
    mutationFn: (d: Record<string, unknown>) => apiUpdateUniversity(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['uni', id] }); toast.success('Сохранено') },
    onError: () => toast.error('Ошибка сохранения'),
  })

  const handleSaveMain = (d: Record<string, unknown>) => {
    const specialtiesRaw = d.specialties as string
    const specialties = specialtiesRaw
      ? specialtiesRaw.split(',').map((s: string) => s.trim()).filter(Boolean)
      : []
    updateUni.mutate({ ...d, specialties })
  }

  const handleSaveVideo = (videoUrl: string) => {
    updateUni.mutate({ video_url: videoUrl || null })
    toast.success(videoUrl ? 'Видео сохранено' : 'Видео удалено')
  }

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

  if (isLoading) return (
    <div className="max-w-3xl space-y-4">
      {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
    </div>
  )

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/admin/universities" className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Назад к университетам
      </Link>

      <h1 className="text-2xl font-bold text-text-primary">{uni?.name}</h1>

      {/* Основные данные */}
      <Card>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Данные университета</h2>
        <form onSubmit={uniForm.handleSubmit((d) => handleSaveMain(d as unknown as Record<string, unknown>))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Input label="Название" {...uniForm.register('name')} />
            </div>
            <Input label="Страна" {...uniForm.register('country')} />
            <Input label="Город" {...uniForm.register('city')} />
            <Input label="Рейтинг" type="number" {...uniForm.register('rating')} />
            <Input label="Стоимость ($/год)" type="number" {...uniForm.register('cost')} />
            <div className="col-span-2">
              <Input label="Специальности (через запятую)" {...uniForm.register('specialties')} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Описание</label>
            <textarea rows={3} {...uniForm.register('description')}
              className="w-full rounded-input border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <Button type="submit" loading={updateUni.isPending}>
            <Save className="h-4 w-4" /> Сохранить
          </Button>
        </form>
      </Card>

      {/* Галерея фото */}
      <Card>
        <PhotoGallery
          uniId={id}
          photoIds={uni?.photo_file_ids ?? []}
        />
      </Card>

      {/* Видео */}
      <Card>
        <VideoSection
          uniId={id}
          videoUrl={uni?.video_url ?? ''}
          videoFileId={uni?.video_file_id}
          onSaveUrl={handleSaveVideo}
          onRefresh={() => qc.invalidateQueries({ queryKey: ['uni', id] })}
        />
      </Card>

      {/* Этапы поступления */}
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
          {(stages ?? []).length === 0 && (
            <p className="text-sm text-text-muted text-center py-4">Этапов нет</p>
          )}
        </div>
      </Card>

      {/* Модалки этапов */}
      <Modal open={showAddStage} onClose={() => setShowAddStage(false)} title="Добавить этап">
        <form onSubmit={stageForm.handleSubmit((d) => createStage.mutate(d as unknown as Record<string, unknown>))} className="space-y-4">
          <Input label="Название *" {...stageForm.register('name', { required: true })} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Описание</label>
            <textarea rows={2} {...stageForm.register('description')}
              className="w-full rounded-input border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none" />
          </div>
          <Input label="Дедлайн" type="date" {...stageForm.register('deadline')} />
          <Button type="submit" className="w-full" loading={createStage.isPending}>Создать</Button>
        </form>
      </Modal>

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

      <Modal open={!!confirmDeleteStage} onClose={() => setConfirmDeleteStage(null)} title="Удалить этап?">
        <p className="text-text-secondary mb-6">Это действие нельзя отменить.</p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setConfirmDeleteStage(null)}>Отмена</Button>
          <Button variant="danger" className="flex-1" loading={deleteStage.isPending}
            onClick={() => deleteStage.mutate(confirmDeleteStage!)}>Удалить</Button>
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
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {stage.order}
          </span>
          <span className="font-medium text-text-primary">{stage.name}</span>
          {stage.deadline && <span className="text-xs text-text-muted">{stage.deadline}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); onDelete() }} className="text-error hover:text-red-700 p-1">
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
              <button onClick={() => deleteReq.mutate({ stageId: stage.id, reqId: req.id })} className="text-error hover:text-red-700 p-1">
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
