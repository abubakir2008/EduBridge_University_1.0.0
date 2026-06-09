'use client'
import { useRef, useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import {
  Plus, KeyRound, ShieldCheck, Pencil, Trash2, FileUp, ExternalLink,
  Search, Download, Send, MessageCircle, CheckSquare, Square, X,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import {
  apiGetUsers, apiCreateUser, apiUpdateUser,
  apiUpdateUserStatus, apiDeleteUser, apiUploadContract,
  apiGetNotes, apiCreateNote, apiDeleteNote,
} from '@/lib/api/users'
import { apiResetPassword } from '@/lib/api/auth'
import { apiSendBulkNotification } from '@/lib/api/admin'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { TableSkeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { User, LanguageSkill } from '@/types'

const statusVariant = { active: 'success', archived: 'muted', enrolled: 'default' } as const
const statusLabels: Record<string, string> = { active: 'Активный', archived: 'Архив', enrolled: 'Поступил' }

const createSchema = z.object({
  full_name: z.string().min(2, 'Минимум 2 символа'),
  phone: z.string().min(7, 'Введите телефон'),
  email: z.string().email('Неверный email').optional().or(z.literal('')),
  citizenship: z.string().optional(),
})

const editSchema = z.object({
  full_name: z.string().min(2, 'Минимум 2 символа'),
  phone: z.string().optional(),
  email: z.string().email('Неверный email').optional().or(z.literal('')),
  citizenship: z.string().optional(),
  gpa: z.coerce.number().min(0).max(4).optional().or(z.literal('')),
  achievements: z.string().optional(),
  specialty_preference: z.string().optional(),
  contact_person: z.string().optional(),
  contact_person_phone: z.string().optional(),
  account_status: z.enum(['active', 'archived', 'enrolled']),
})

type CreateForm = z.infer<typeof createSchema>
type EditForm = z.infer<typeof editSchema>

const LANGUAGES = ['Английский', 'Немецкий', 'Французский', 'Испанский', 'Китайский', 'Японский', 'Арабский', 'Турецкий', 'Итальянский', 'Корейский']
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native']
const LEVEL_LABELS: Record<string, string> = {
  A1: 'A1 — Начальный', A2: 'A2 — Элементарный',
  B1: 'B1 — Средний', B2: 'B2 — Выше среднего',
  C1: 'C1 — Продвинутый', C2: 'C2 — Профессиональный', Native: 'Родной',
}
const LEVEL_BADGE: Record<string, string> = {
  A1: 'bg-slate-100 text-slate-600', A2: 'bg-blue-50 text-blue-600',
  B1: 'bg-cyan-50 text-cyan-700', B2: 'bg-teal-50 text-teal-700',
  C1: 'bg-emerald-50 text-emerald-700', C2: 'bg-green-100 text-green-700',
  Native: 'bg-purple-50 text-purple-700',
}

function whatsappLink(phone?: string | null) {
  if (!phone) return null
  const raw = phone.includes('/') ? phone.split('/')[0].trim() : phone
  const digits = raw.replace(/\D/g, '')
  if (!digits) return null
  return `https://wa.me/${digits}`
}

function LanguageSkillsEditor({ value, onChange }: { value: LanguageSkill[]; onChange: (v: LanguageSkill[]) => void }) {
  const [lang, setLang] = useState('')
  const [customLang, setCustomLang] = useState('')
  const [level, setLevel] = useState('B1')

  const add = () => {
    const language = lang === '__custom__' ? customLang.trim() : lang
    if (!language) return
    if (value.some((s) => s.language.toLowerCase() === language.toLowerCase())) return
    onChange([...value, { language, level }])
    setLang(''); setCustomLang(''); setLevel('B1')
  }
  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx))

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((s, i) => (
            <span key={i} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${LEVEL_BADGE[s.level] ?? 'bg-slate-100 text-slate-600'}`}>
              {s.language} · {s.level}
              <button type="button" onClick={() => remove(i)} className="ml-0.5 opacity-60 hover:opacity-100">×</button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2 flex-wrap">
        <select value={lang} onChange={(e) => setLang(e.target.value)}
          className="rounded-input border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 flex-1 min-w-[140px]">
          <option value="">Выберите язык</option>
          {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
          <option value="__custom__">Другой...</option>
        </select>
        {lang === '__custom__' && (
          <input value={customLang} onChange={(e) => setCustomLang(e.target.value)} placeholder="Название языка"
            className="rounded-input border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 flex-1 min-w-[130px]" />
        )}
        <select value={level} onChange={(e) => setLevel(e.target.value)}
          className="rounded-input border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
          {LEVELS.map((l) => <option key={l} value={l}>{LEVEL_LABELS[l]}</option>)}
        </select>
        <button type="button" onClick={add}
          disabled={!lang || (lang === '__custom__' && !customLang.trim())}
          className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-40">
          + Добавить
        </button>
      </div>
    </div>
  )
}

// ─── Notes section ────────────────────────────────────────────────────────────
function NotesSection({ userId }: { userId: string }) {
  const qc = useQueryClient()
  const [text, setText] = useState('')
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes', userId],
    queryFn: () => apiGetNotes(userId),
  })

  const addMutation = useMutation({
    mutationFn: () => apiCreateNote(userId, text.trim()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notes', userId] }); setText(''); toast.success('Заметка добавлена') },
    onError: () => toast.error('Ошибка'),
  })

  const deleteMutation = useMutation({
    mutationFn: (noteId: string) => apiDeleteNote(userId, noteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes', userId] }),
    onError: () => toast.error('Ошибка удаления'),
  })

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Заметки</p>
      {isLoading ? (
        <p className="text-xs text-text-muted">Загрузка...</p>
      ) : (
        <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
          {notes.length === 0 && <p className="text-xs text-text-muted">Заметок нет</p>}
          {notes.map((n) => (
            <div key={n.id} className="group flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
              <p className="flex-1 text-sm text-text-primary whitespace-pre-wrap">{n.text}</p>
              <div className="flex-shrink-0 flex items-center gap-1">
                <span className="text-xs text-text-muted">{new Date(n.created_at).toLocaleDateString('ru')}</span>
                <button
                  onClick={() => deleteMutation.mutate(n.id)}
                  className="opacity-0 group-hover:opacity-100 ml-1 rounded p-0.5 text-text-muted hover:text-error transition-all"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Добавить заметку..."
          rows={2}
          className="flex-1 rounded-input border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
        <button
          onClick={() => addMutation.mutate()}
          disabled={!text.trim() || addMutation.isPending}
          className="rounded-lg bg-primary text-white px-3 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-40 transition-colors"
        >
          +
        </button>
      </div>
    </div>
  )
}

// ─── Модалка детали студента ─────────────────────────────────────────────────
function StudentDetailModal({
  user, onClose, onEdit, onResetPassword,
}: { user: User; onClose: () => void; onEdit: (u: User) => void; onResetPassword: (id: string) => void }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const qc = useQueryClient()
  const [uploading, setUploading] = useState(false)
  const langs = user.language_skills ?? []
  const phone = user.phone?.includes('/') ? user.phone.split('/')[0].trim() : user.phone
  const waLink = whatsappLink(phone)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await apiUploadContract(user.id, file)
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('Договор загружен')
    } catch { toast.error('Ошибка загрузки договора') }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  const field = (label: string, value?: string | number | null) =>
    value != null && value !== '' ? (
      <div className="min-w-0">
        <p className="text-xs text-text-muted mb-0.5">{label}</p>
        <p className="text-sm font-medium text-text-primary break-all">{value}</p>
      </div>
    ) : null

  return (
    <Modal open onClose={onClose} title={user.full_name} maxWidth="max-w-xl">
      <div className="space-y-5">
        <div className="flex items-center justify-between -mt-1">
          <p className="text-sm font-mono text-text-muted">@{user.login}</p>
          <Badge variant={statusVariant[user.account_status] ?? 'muted'}>{statusLabels[user.account_status]}</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 rounded-xl bg-slate-50 p-4">
          <div className="min-w-0">
            <p className="text-xs text-text-muted mb-0.5">Телефон</p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-text-primary">{phone ?? '—'}</p>
              {waLink && (
                <a href={waLink} target="_blank" rel="noopener noreferrer"
                  className="flex-shrink-0 rounded-full bg-green-50 p-1 text-green-600 hover:bg-green-100 transition-colors"
                  title="Написать в WhatsApp" onClick={(e) => e.stopPropagation()}>
                  <MessageCircle className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
          {field('Email', user.email)}
          {field('Гражданство', user.citizenship)}
          {field('GPA', user.gpa)}
          {field('Специальность', user.specialty_preference)}
          {field('Достижения', user.achievements)}
          {field('Зарегистрирован', formatDate(user.created_at))}
        </div>

        {langs.length > 0 && (
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Знание языков</p>
            <div className="flex flex-wrap gap-2">
              {langs.map((s, i) => (
                <span key={i} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${LEVEL_BADGE[s.level] ?? 'bg-slate-100 text-slate-600'}`}>
                  {s.language} · {s.level}
                </span>
              ))}
            </div>
          </div>
        )}

        {(user.contact_person || user.contact_person_phone) && (
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Контактное лицо</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {field('ФИО', user.contact_person)}
              <div className="min-w-0">
                <p className="text-xs text-text-muted mb-0.5">Телефон</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-text-primary">{user.contact_person_phone ?? '—'}</p>
                  {whatsappLink(user.contact_person_phone) && (
                    <a href={whatsappLink(user.contact_person_phone)!} target="_blank" rel="noopener noreferrer"
                      className="flex-shrink-0 rounded-full bg-green-50 p-1 text-green-600 hover:bg-green-100"
                      onClick={(e) => e.stopPropagation()}>
                      <MessageCircle className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Договор</p>
          <div className="flex items-center gap-2 flex-wrap">
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="hidden" onChange={handleUpload} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-text-secondary hover:bg-slate-50 transition-colors disabled:opacity-50">
              <FileUp className="h-4 w-4" />
              {uploading ? 'Загружаем...' : user.contract_file_id ? 'Заменить' : 'Загрузить скан'}
            </button>
            {user.contract_file_id && (
              <button onClick={() => { onClose(); router.push(`/admin/users/${user.id}/contract`) }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors">
                <ExternalLink className="h-4 w-4" /> Открыть договор
              </button>
            )}
            {!user.contract_file_id && <span className="text-sm text-text-muted">Не загружен</span>}
          </div>
          <p className="mt-2 text-xs text-text-muted">Форматы: PDF, JPG, PNG, DOC, DOCX</p>
        </div>

        {/* Admin notes */}
        <NotesSection userId={user.id} />

        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={() => { onClose(); onEdit(user) }}>
            <Pencil className="h-3.5 w-3.5" /> Редактировать
          </Button>
          <Button variant="outline" size="sm" onClick={() => onResetPassword(user.id)}>
            <KeyRound className="h-3.5 w-3.5" /> Новый пароль
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Главная страница ─────────────────────────────────────────────────────────
export default function UsersPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [detailUser, setDetailUser] = useState<User | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [editLangs, setEditLangs] = useState<LanguageSkill[]>([])
  const [deleteUser, setDeleteUser] = useState<User | null>(null)
  const [createdCreds, setCreatedCreds] = useState<{ login: string; password: string } | null>(null)
  const [resetCreds, setResetCreds] = useState<{ login: string; password: string } | null>(null)
  const [resettingId, setResettingId] = useState<string | null>(null)
  const [showBulkSend, setShowBulkSend] = useState(false)
  const [bulkMessage, setBulkMessage] = useState('')
  const [sendingBulk, setSendingBulk] = useState(false)

  const { data: usersPage, isLoading } = useQuery({
    queryKey: ['users', statusFilter, search, page],
    queryFn: () => apiGetUsers({
      page,
      per_page: 50,
      ...(statusFilter ? { account_status: statusFilter } : {}),
      ...(search.trim() ? { search: search.trim() } : {}),
    }),
    placeholderData: (prev) => prev,
  })

  const students = useMemo(
    () => (usersPage?.items ?? []).filter((u) => u.role === 'student'),
    [usersPage],
  )
  const totalPages = usersPage?.pages ?? 1

  const allSelected = students.length > 0 && students.every((u) => selected.has(u.id))

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(students.map((u) => u.id)))
    }
  }

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const exportExcel = () => {
    const rows = students.map((u) => ({
      'ФИО': u.full_name,
      'Логин': u.login,
      'Email': u.email ?? '',
      'Телефон': u.phone?.includes('/') ? u.phone.split('/')[0].trim() : (u.phone ?? ''),
      'Гражданство': u.citizenship ?? '',
      'GPA': u.gpa ?? '',
      'Статус': statusLabels[u.account_status] ?? u.account_status,
      'Специальность': u.specialty_preference ?? '',
      'Контактное лицо': u.contact_person ?? '',
      'Договор': u.contract_file_id ? 'Есть' : 'Нет',
      'Дата создания': formatDate(u.created_at),
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Студенты')
    XLSX.writeFile(wb, `students_${new Date().toISOString().slice(0, 10)}.xlsx`)
    toast.success('Файл скачан')
  }

  const handleBulkSend = async () => {
    if (!bulkMessage.trim()) return
    setSendingBulk(true)
    try {
      await apiSendBulkNotification([...selected], bulkMessage.trim())
      toast.success(`Уведомление отправлено ${selected.size} студент(ам)`)
      setShowBulkSend(false)
      setBulkMessage('')
      setSelected(new Set())
    } catch { toast.error('Ошибка отправки') }
    finally { setSendingBulk(false) }
  }

  const createForm = useForm<CreateForm>({ resolver: zodResolver(createSchema) })
  const onCreateSubmit = async (data: CreateForm) => {
    try {
      const creds = await apiCreateUser(data)
      setCreatedCreds(creds)
      setShowCreate(false)
      createForm.reset()
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('Студент создан')
    } catch { toast.error('Не удалось создать студента') }
  }

  const editForm = useForm<EditForm>({ resolver: zodResolver(editSchema) })
  const openEdit = (user: User) => {
    setEditUser(user)
    setEditLangs(user.language_skills ?? [])
    editForm.reset({
      full_name: user.full_name,
      phone: user.phone ?? '',
      email: user.email ?? '',
      citizenship: user.citizenship ?? '',
      gpa: user.gpa ?? '',
      achievements: user.achievements ?? '',
      specialty_preference: user.specialty_preference ?? '',
      contact_person: user.contact_person ?? '',
      contact_person_phone: user.contact_person_phone ?? '',
      account_status: user.account_status as 'active' | 'archived' | 'enrolled',
    })
  }

  const editMutation = useMutation({
    mutationFn: (data: EditForm) => {
      const { account_status, gpa, ...rest } = data
      return Promise.all([
        apiUpdateUser(editUser!.id, { ...rest, gpa: gpa === '' ? undefined : gpa, language_skills: editLangs }),
        editUser!.account_status !== account_status
          ? apiUpdateUserStatus(editUser!.id, account_status)
          : Promise.resolve(),
      ])
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Данные сохранены'); setEditUser(null) },
    onError: () => toast.error('Ошибка сохранения'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDeleteUser(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Студент удалён'); setDeleteUser(null) },
    onError: () => toast.error('Ошибка удаления'),
  })

  const handleResetPassword = async (userId: string) => {
    setResettingId(userId)
    try {
      const creds = await apiResetPassword(userId)
      setDetailUser(null)
      setResetCreds(creds)
    } catch { toast.error('Не удалось сбросить пароль') }
    finally { setResettingId(null) }
  }

  const filterOptions = ['', 'active', 'archived', 'enrolled']
  const filterLabels: Record<string, string> = { '': 'Все', active: 'Активные', archived: 'Архив', enrolled: 'Поступившие' }

  const credBlock = (creds: { login: string; password: string }) => (
    <div className="space-y-4">
      <p className="text-sm text-warning font-medium">Сохраните данные — пароль показывается один раз!</p>
      {[{ label: 'Логин', value: creds.login }, { label: 'Пароль', value: creds.password }].map(({ label, value }) => (
        <div key={label} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
          <div>
            <p className="text-xs text-text-muted">{label}</p>
            <p className="font-mono font-semibold text-text-primary">{value}</p>
          </div>
          <button onClick={() => { navigator.clipboard.writeText(value); toast.success('Скопировано') }} className="text-xs text-primary hover:underline">Копировать</button>
        </div>
      ))}
    </div>
  )

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-text-primary">Студенты</h1>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button onClick={() => setShowBulkSend(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors">
              <Send className="h-4 w-4" /> Уведомить ({selected.size})
            </button>
          )}
          <button onClick={exportExcel}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-text-secondary hover:bg-slate-50 transition-colors">
            <Download className="h-4 w-4" /> Экспорт
          </button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> Создать студента
          </Button>
        </div>
      </div>

      {/* Filters + search */}
      <div className="flex gap-2 flex-wrap items-center">
        {filterOptions.map((s) => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`rounded-button px-3 py-1.5 text-sm font-medium transition-colors ${statusFilter === s ? 'bg-primary text-white' : 'bg-white border border-slate-200 text-text-secondary hover:bg-surface'}`}>
            {filterLabels[s]}
          </button>
        ))}
        <div className="relative ml-auto min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Поиск по имени, телефону..."
            className="w-full rounded-input border border-slate-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : (
        <Card padding="none" className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 w-10">
                  <button onClick={toggleAll} className="text-text-muted hover:text-primary">
                    {allSelected ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                  </button>
                </th>
                {['ФИО', 'Логин', 'Телефон', 'Контакт. лицо', 'Договор', 'Статус', 'Дата', 'Действия'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-text-muted">Нет студентов</td></tr>
              )}
              {students.map((user) => {
                const phone = user.phone?.includes('/') ? user.phone.split('/')[0].trim() : user.phone
                const waLink = whatsappLink(phone)
                return (
                  <tr key={user.id} onClick={() => setDetailUser(user)} className="cursor-pointer hover:bg-surface">
                    <td className="px-4 py-3 w-10" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => toggleOne(user.id)} className="text-text-muted hover:text-primary">
                        {selected.has(user.id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-medium text-text-primary">{user.full_name}</td>
                    <td className="px-4 py-3 text-text-secondary font-mono text-xs">@{user.login}</td>
                    <td className="px-4 py-3 text-text-secondary" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <span>{phone ?? '—'}</span>
                        {waLink && (
                          <a href={waLink} target="_blank" rel="noopener noreferrer"
                            className="rounded-full bg-green-50 p-1 text-green-600 hover:bg-green-100 transition-colors flex-shrink-0"
                            title="WhatsApp">
                            <MessageCircle className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{user.contact_person ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={user.contract_file_id ? 'success' : 'muted'}>
                        {user.contract_file_id ? 'Есть' : 'Нет'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[user.account_status] ?? 'muted'}>
                        {statusLabels[user.account_status] ?? user.account_status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-text-muted">{formatDate(user.created_at)}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEdit(user)} title="Редактировать"
                          className="rounded-lg p-1.5 text-text-muted hover:bg-slate-100 hover:text-primary transition-colors">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleResetPassword(user.id)} disabled={resettingId === user.id}
                          title="Новый пароль"
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50">
                          <KeyRound className="h-3 w-3" />
                          {resettingId === user.id ? '...' : 'Пароль'}
                        </button>
                        {user.account_status === 'archived' && (
                          <button
                            onClick={async () => { await apiUpdateUserStatus(user.id, 'active'); qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Аккаунт восстановлен') }}
                            title="Восстановить"
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors">
                            <ShieldCheck className="h-3 w-3" /> Восстановить
                          </button>
                        )}
                        <button onClick={() => setDeleteUser(user)} title="Удалить"
                          className="rounded-lg p-1.5 text-text-muted hover:bg-red-50 hover:text-error transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-text-secondary disabled:opacity-40 hover:bg-slate-50 transition-colors"
          >
            ← Назад
          </button>
          <span className="text-sm text-text-muted">
            Стр. {page} из {totalPages} · всего {usersPage?.total ?? 0}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-text-secondary disabled:opacity-40 hover:bg-slate-50 transition-colors"
          >
            Вперёд →
          </button>
        </div>
      )}

      {detailUser && (
        <StudentDetailModal
          user={detailUser}
          onClose={() => setDetailUser(null)}
          onEdit={openEdit}
          onResetPassword={handleResetPassword}
        />
      )}

      {/* Создать */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); createForm.reset() }} title="Создать студента">
        <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
          <Input label="ФИО *" error={createForm.formState.errors.full_name?.message} {...createForm.register('full_name')} />
          <Input label="Телефон *" type="tel" error={createForm.formState.errors.phone?.message} {...createForm.register('phone')} />
          <Input label="Email" error={createForm.formState.errors.email?.message} {...createForm.register('email')} />
          <Input label="Гражданство" {...createForm.register('citizenship')} />
          <Button type="submit" className="w-full" loading={createForm.formState.isSubmitting}>Создать</Button>
        </form>
      </Modal>

      {/* Редактировать */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title={`Редактировать: ${editUser?.full_name ?? ''}`}>
        <form onSubmit={editForm.handleSubmit((d) => editMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="col-span-2">
              <Input label="ФИО *" error={editForm.formState.errors.full_name?.message} {...editForm.register('full_name')} />
            </div>
            <Input label="Телефон" {...editForm.register('phone')} />
            <Input label="Email" {...editForm.register('email')} />
            <Input label="Гражданство" {...editForm.register('citizenship')} />
            <Input label="GPA (0–4)" type="number" step="0.01" {...editForm.register('gpa')} />
            <div className="col-span-2"><Input label="Достижения" {...editForm.register('achievements')} /></div>
            <div className="col-span-2"><Input label="Желаемая специальность" {...editForm.register('specialty_preference')} /></div>
          </div>
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Знание языков</p>
            <LanguageSkillsEditor value={editLangs} onChange={setEditLangs} />
          </div>
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Контактное лицо</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="ФИО контакта" {...editForm.register('contact_person')} />
              <Input label="Телефон контакта" {...editForm.register('contact_person_phone')} />
            </div>
          </div>
          <div className="border-t border-slate-100 pt-4">
            <label className="block text-sm font-medium text-text-primary mb-1.5">Статус аккаунта</label>
            <select {...editForm.register('account_status')}
              className="w-full rounded-input border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="active">Активный</option>
              <option value="archived">Архив</option>
              <option value="enrolled">Поступил</option>
            </select>
          </div>
          <Button type="submit" className="w-full" loading={editMutation.isPending}>Сохранить</Button>
        </form>
      </Modal>

      {/* Удалить */}
      <Modal open={!!deleteUser} onClose={() => setDeleteUser(null)} title="Удалить студента?">
        {deleteUser && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Вы уверены что хотите удалить <span className="font-semibold text-text-primary">{deleteUser.full_name}</span>? Это действие необратимо.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteUser(null)}>Отмена</Button>
              <Button className="flex-1 bg-error hover:bg-error/90 text-white" loading={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteUser.id)}>Удалить</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Bulk notification */}
      <Modal open={showBulkSend} onClose={() => { setShowBulkSend(false); setBulkMessage('') }} title={`Уведомление для ${selected.size} студент(ов)`}>
        <div className="space-y-4">
          <textarea rows={4} value={bulkMessage} onChange={(e) => setBulkMessage(e.target.value)}
            placeholder="Текст уведомления..."
            className="w-full rounded-input border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <Button className="w-full" onClick={handleBulkSend} loading={sendingBulk} disabled={!bulkMessage.trim()}>
            <Send className="h-4 w-4" /> Отправить
          </Button>
        </div>
      </Modal>

      {/* Credentials */}
      <Modal open={!!createdCreds} onClose={() => setCreatedCreds(null)} title="Данные для входа">
        {createdCreds && (
          <div className="space-y-4">
            {credBlock(createdCreds)}
            <Button className="w-full" onClick={() => setCreatedCreds(null)}>Закрыть</Button>
          </div>
        )}
      </Modal>
      <Modal open={!!resetCreds} onClose={() => setResetCreds(null)} title="Новый пароль студента">
        {resetCreds && (
          <div className="space-y-4">
            {credBlock(resetCreds)}
            <Button className="w-full" onClick={() => setResetCreds(null)}>Закрыть</Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
