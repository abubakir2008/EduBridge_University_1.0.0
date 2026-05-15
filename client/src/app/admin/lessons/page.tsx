'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Plus, Pencil, Trash2, ArrowLeft, BookOpen, ChevronUp, ChevronDown,
  RefreshCw, CheckCircle, Video, FileText, Image, AlignLeft,
} from 'lucide-react'
import { apiGetLessons, apiCreateLesson, apiUpdateLesson, apiDeleteLesson } from '@/lib/api/lessons'
import { apiGetUniversities, apiGetStages } from '@/lib/api/universities'
import { apiUploadFile, apiGetFileUrl } from '@/lib/api/files'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { toast } from 'sonner'
import type { Lesson } from '@/types'

const CONTENT_TYPES = [
  { value: 'video', label: 'Видео', icon: Video, color: 'bg-amber-50 text-amber-600 border-amber-200' },
  { value: 'image', label: 'Фото / изображение', icon: Image, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  { value: 'document', label: 'Документ', icon: FileText, color: 'bg-violet-50 text-violet-600 border-violet-200' },
  { value: 'text', label: 'Только текст', icon: AlignLeft, color: 'bg-blue-50 text-blue-600 border-blue-200' },
] as const

type Stage = { id: string; name: string; order: number; university_id: string }
type University = { id: string; name: string; country: string }

export default function AdminLessonsPage() {
  const qc = useQueryClient()
  const [selectedUni, setSelectedUni] = useState<University | null>(null)
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Lesson | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const [formTitle, setFormTitle] = useState('')
  const [formStageId, setFormStageId] = useState('')
  const [formContentType, setFormContentType] = useState<Lesson['content_type']>('video')
  const [formContent, setFormContent] = useState('')
  const [formFileId, setFormFileId] = useState('')
  const [formOrder, setFormOrder] = useState(1)
  const [uploading, setUploading] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [formUniId, setFormUniId] = useState('')

  const { data: lessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ['lessons'],
    queryFn: () => apiGetLessons(),
  })
  const { data: universities = [] } = useQuery({
    queryKey: ['universities-list'],
    queryFn: () => apiGetUniversities(),
  })
  const { data: stages = [] } = useQuery({
    queryKey: ['stages-by-uni', selectedUni?.id],
    queryFn: () => apiGetStages(selectedUni!.id),
    enabled: !!selectedUni,
  })
  const { data: formStages = [] } = useQuery({
    queryKey: ['stages-by-uni', formUniId],
    queryFn: () => apiGetStages(formUniId),
    enabled: !!formUniId,
  })

  const saveMutation = useMutation({
    mutationFn: (d: Partial<Lesson>) =>
      editing ? apiUpdateLesson(editing.id, d) : apiCreateLesson(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lessons'] })
      toast.success(editing ? 'Урок обновлён' : 'Урок добавлен')
      setShowForm(false)
      setEditing(null)
    },
    onError: () => toast.error('Ошибка сохранения'),
  })

  const deleteMutation = useMutation({
    mutationFn: apiDeleteLesson,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lessons'] }); setConfirmDelete(null) },
  })

  const handleFileUpload = async (file: File) => {
    setUploading(true)
    try {
      const uploaded = await apiUploadFile(file, 'lessons')
      setFormFileId(uploaded.id)
      setUploadedFileName(file.name)
      toast.success('Файл загружен')
    } catch { toast.error('Ошибка загрузки') }
    finally { setUploading(false) }
  }

  const stageLessons = selectedStage
    ? [...lessons].filter(l => l.stage_id === selectedStage.id).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    : []

  const move = async (lesson: Lesson, direction: 'up' | 'down') => {
    const idx = stageLessons.findIndex(l => l.id === lesson.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= stageLessons.length) return
    const a = stageLessons[idx], b = stageLessons[swapIdx]
    await Promise.all([
      apiUpdateLesson(a.id, { order: b.order }),
      apiUpdateLesson(b.id, { order: a.order }),
    ])
    qc.invalidateQueries({ queryKey: ['lessons'] })
  }

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const openCreate = () => {
    setEditing(null)
    setFormTitle('')
    setFormStageId(selectedStage?.id ?? '')
    setFormUniId(selectedUni?.id ?? '')
    setFormContentType('video')
    setFormContent('')
    setFormFileId('')
    setFormOrder(stageLessons.length + 1)
    setUploadedFileName('')
    setShowForm(true)
  }

  const openEdit = (l: Lesson) => {
    setEditing(l)
    setFormTitle(l.title)
    setFormStageId(l.stage_id)
    setFormContentType(l.content_type)
    setFormContent(l.content ?? '')
    setFormFileId(l.file_id ?? '')
    setFormOrder(l.order)
    setUploadedFileName('')
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim()) { toast.error('Введите название'); return }
    saveMutation.mutate({
      title: formTitle,
      stage_id: formStageId || undefined,
      content_type: formContentType,
      content: ['text'].includes(formContentType) ? formContent : undefined,
      file_id: ['video', 'document', 'image'].includes(formContentType) ? (formFileId || undefined) : undefined,
      order: formOrder,
    } as Partial<Lesson>)
  }

  const ctInfo = (ct: string) => CONTENT_TYPES.find(t => t.value === ct)

  /* ── View: select university ── */
  if (!selectedUni) return (
    <div className="max-w-5xl space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Уроки — выберите университет</h1>
      {universities.length === 0 ? (
        <p className="text-text-muted text-center py-20">Университетов пока нет</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {universities.map(uni => (
            <motion.button
              key={uni.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedUni(uni)}
              className="bg-white border border-slate-100 rounded-card p-6 text-left hover:border-primary/40 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs bg-slate-100 text-text-muted px-2 py-1 rounded-full">{uni.country}</span>
              </div>
              <p className="font-semibold text-text-primary mb-1 line-clamp-2">{uni.name}</p>
              <p className="text-text-muted text-xs">{lessonsLoading ? '...' : `${lessons.length} уроков всего`}</p>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  )

  /* ── View: select stage ── */
  if (!selectedStage) return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => setSelectedUni(null)} className="text-text-muted hover:text-primary p-1.5 rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="text-xs text-text-muted">Университет</p>
          <h1 className="text-2xl font-bold text-text-primary">{selectedUni.name}</h1>
        </div>
      </div>

      {stages.length === 0 ? (
        <p className="text-text-muted text-center py-20">Этапов пока нет — добавьте в разделе Университеты</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {[...stages].sort((a, b) => a.order - b.order).map(stage => {
            const count = lessons.filter(l => l.stage_id === stage.id).length
            return (
              <motion.button
                key={stage.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedStage(stage)}
                className="bg-white border border-slate-100 rounded-card p-6 text-left hover:border-primary/40 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center font-bold text-primary group-hover:bg-primary/20 transition-colors">
                    {stage.order}
                  </div>
                </div>
                <p className="font-semibold text-text-primary mb-1">{stage.name}</p>
                <p className="text-text-muted text-xs">{count} {count === 1 ? 'урок' : count < 5 ? 'урока' : 'уроков'}</p>
              </motion.button>
            )
          })}
        </div>
      )}
    </div>
  )

  /* ── View: lessons table ── */
  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedStage(null)} className="text-text-muted hover:text-primary p-1.5 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-xs text-text-muted">{selectedUni.name} · Этап {selectedStage.order}</p>
            <h1 className="text-xl font-bold text-text-primary">{selectedStage.name}</h1>
          </div>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" /> Добавить урок</Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-card overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {['#', 'Название', 'Тип', 'ID', 'Файл', 'Действия'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium text-text-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stageLessons.map((l, idx) => {
              const ct = ctInfo(l.content_type)
              const Icon = ct?.icon ?? BookOpen
              return (
                <tr key={l.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-text-muted w-10">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-text-primary">{l.title}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border ${ct?.color ?? 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                      <Icon className="w-3 h-3" />
                      {ct?.label ?? l.content_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => copyId(l.id)}
                      className="flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-primary transition-colors"
                      title="Скопировать ID">
                      {l.id.slice(0, 8)}…
                      {copiedId === l.id
                        ? <CheckCircle className="w-3 h-3 text-emerald-500" />
                        : <RefreshCw className="w-3 h-3" />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${l.file_id ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      {l.file_id ? 'Есть' : 'Нет'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => move(l, 'up')} disabled={idx === 0}
                        className="p-1 text-slate-300 hover:text-primary disabled:opacity-20 rounded transition-colors">
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button onClick={() => move(l, 'down')} disabled={idx === stageLessons.length - 1}
                        className="p-1 text-slate-300 hover:text-primary disabled:opacity-20 rounded transition-colors">
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button onClick={() => openEdit(l)}
                        className="p-1.5 text-slate-400 hover:text-primary rounded transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setConfirmDelete(l.id)}
                        className="p-1.5 text-slate-400 hover:text-error rounded transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {stageLessons.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-text-muted">Уроков ещё нет</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Form modal */}
      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(null) }}
        title={editing ? 'Редактировать урок' : 'Добавить урок'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Название *"
            value={formTitle}
            onChange={e => setFormTitle(e.target.value)}
            placeholder="Название урока"
          />

          {/* University + stage selectors (only in create mode) */}
          {!editing && (
            <>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Курс</label>
                <select
                  value={formUniId}
                  onChange={e => { setFormUniId(e.target.value); setFormStageId('') }}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                >
                  <option value="">Выберите курс</option>
                  {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              {formUniId && (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Этап</label>
                  <select
                    value={formStageId}
                    onChange={e => setFormStageId(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                    disabled={formStages.length === 0}
                  >
                    <option value="">— выбрать этап —</option>
                    {formStages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}
            </>
          )}

          {/* Content type selector — 4 buttons */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Тип контента</label>
            <div className="grid grid-cols-2 gap-2">
              {CONTENT_TYPES.map(ct => {
                const Icon = ct.icon
                const active = formContentType === ct.value
                return (
                  <button
                    key={ct.value}
                    type="button"
                    onClick={() => { setFormContentType(ct.value); setFormFileId(''); setUploadedFileName('') }}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      active
                        ? 'border-primary bg-primary text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-primary/40 hover:bg-primary/5'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {ct.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Rich text editor for text type */}
          {formContentType === 'text' && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Текст урока</label>
              <RichTextEditor
                value={formContent}
                onChange={setFormContent}
                minHeight="200px"
              />
            </div>
          )}

          {/* File upload for video / document / image */}
          {(formContentType === 'video' || formContentType === 'document' || formContentType === 'image') && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {formContentType === 'video' && 'Видео — загрузить файл'}
                {formContentType === 'image' && 'Фото / изображение'}
                {formContentType === 'document' && 'Документ (PDF)'}
              </label>
              <label className={`flex items-center gap-3 cursor-pointer border border-dashed rounded-lg px-4 py-3 transition-colors ${
                uploadedFileName
                  ? 'border-emerald-300 bg-emerald-50'
                  : 'border-slate-300 hover:border-primary/50 hover:bg-primary/5'
              }`}>
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  {formContentType === 'video' && <Video className="w-4 h-4 text-primary" />}
                  {formContentType === 'image' && <Image className="w-4 h-4 text-primary" />}
                  {formContentType === 'document' && <FileText className="w-4 h-4 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {uploading ? 'Загрузка...' : uploadedFileName || 'Нажмите чтобы выбрать файл'}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {formContentType === 'video' && 'MP4, WebM — до 1GB'}
                    {formContentType === 'image' && 'JPG, PNG, WebP'}
                    {formContentType === 'document' && 'PDF'}
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept={
                    formContentType === 'video' ? 'video/*'
                    : formContentType === 'image' ? 'image/*'
                    : '.pdf'
                  }
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f) }}
                />
              </label>
              {uploading && (
                <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full animate-pulse w-2/3" />
                </div>
              )}
              {/* External URL for video */}
              {formContentType === 'video' && (
                <p className="text-xs text-text-muted mt-2 text-center">или вставьте внешний URL (YouTube и т.д.)</p>
              )}
            </div>
          )}

          <Input
            label="Порядок"
            type="number"
            value={formOrder}
            onChange={e => setFormOrder(Number(e.target.value))}
          />

          <Button type="submit" className="w-full" loading={saveMutation.isPending || uploading}>
            {editing ? 'Сохранить' : 'Создать урок'}
          </Button>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Удалить урок?">
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
