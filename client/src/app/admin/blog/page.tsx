'use client'
import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, ExternalLink, ImagePlus, Loader2, Tags, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { Skeleton } from '@/components/ui/skeleton'
import {
  apiGetAllPosts, apiCreatePost, apiUpdatePost, apiDeletePost, apiUploadPostCover, getPostCoverUrl,
} from '@/lib/api/posts'
import {
  apiGetCategories, apiCreateCategory, apiUpdateCategory, apiDeleteCategory,
} from '@/lib/api/categories'
import { CATEGORY_ICONS, CategoryIcon } from '@/lib/categoryIcons'
import type { Post, Category } from '@/types'
import { toast } from 'sonner'

type Draft = Partial<Post>

// Компактный выбор иконки рубрики
function IconPicker({ value, onChange }: { value: string; onChange: (k: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1">
      {CATEGORY_ICONS.map(({ key, Icon, label }) => (
        <button key={key} type="button" title={label} onClick={() => onChange(key)}
          className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
            value === key ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-white text-text-secondary hover:border-primary/40'
          }`}>
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  )
}

// ── Менеджер рубрик (полный CRUD) ──────────────────────────────────────────────
function CategoriesManager() {
  const qc = useQueryClient()
  const { data: cats, isLoading } = useQuery({ queryKey: ['categories'], queryFn: apiGetCategories })
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('graduation-cap')
  const [desc, setDesc] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [edit, setEdit] = useState<{ name: string; icon: string; description: string; sort_order: number }>({ name: '', icon: '', description: '', sort_order: 0 })

  const invalidate = () => { qc.invalidateQueries({ queryKey: ['categories'] }) }

  const create = useMutation({
    mutationFn: () => apiCreateCategory({ name: name.trim(), icon, description: desc.trim() || undefined, sort_order: (cats?.length ?? 0) + 1 }),
    onSuccess: () => { invalidate(); setName(''); setIcon('graduation-cap'); setDesc(''); toast.success('Рубрика добавлена') },
    onError: () => toast.error('Не удалось добавить'),
  })
  const update = useMutation({
    mutationFn: (id: string) => apiUpdateCategory(id, edit),
    onSuccess: () => { invalidate(); setEditId(null); toast.success('Рубрика обновлена') },
    onError: () => toast.error('Не удалось обновить'),
  })
  const del = useMutation({
    mutationFn: (id: string) => apiDeleteCategory(id),
    onSuccess: () => { invalidate(); toast.success('Рубрика удалена') },
    onError: () => toast.error('Не удалось удалить'),
  })

  const startEdit = (c: Category) => {
    setEditId(c.id)
    setEdit({ name: c.name, icon: c.icon ?? 'graduation-cap', description: c.description ?? '', sort_order: c.sort_order })
  }

  return (
    <div className="space-y-4 px-6 py-5">
      {/* Добавить новую */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
        <p className="mb-2 text-sm font-semibold text-text-secondary">Новая рубрика</p>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Название рубрики"
              className="min-w-[160px] flex-1 rounded-input border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
            <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Короткое описание (необязательно)"
              className="min-w-[160px] flex-1 rounded-input border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
            <Button size="sm" onClick={() => create.mutate()} loading={create.isPending} disabled={!name.trim()}>
              <Plus className="h-4 w-4" /> Добавить
            </Button>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-text-muted">Иконка</p>
            <IconPicker value={icon} onChange={setIcon} />
          </div>
        </div>
        <p className="mt-1.5 text-xs text-text-muted">URL-адрес (slug) создаётся автоматически из названия.</p>
      </div>

      {/* Список */}
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : !cats?.length ? (
        <p className="py-6 text-center text-sm text-text-muted">Рубрик пока нет.</p>
      ) : (
        <div className="space-y-2">
          {cats.map((c) => editId === c.id ? (
            <div key={c.id} className="space-y-2 rounded-xl border border-primary/30 bg-white p-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                  className="min-w-[140px] flex-1 rounded-input border border-slate-200 px-2 py-1.5 text-sm" />
                <input value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} placeholder="описание"
                  className="min-w-[140px] flex-1 rounded-input border border-slate-200 px-2 py-1.5 text-sm" />
                <input type="number" value={edit.sort_order} onChange={(e) => setEdit({ ...edit, sort_order: Number(e.target.value) })} title="Порядок"
                  className="w-16 rounded-input border border-slate-200 px-2 py-1.5 text-sm" />
                <button onClick={() => update.mutate(c.id)} className="rounded-lg bg-primary p-1.5 text-white hover:opacity-90" title="Сохранить"><Check className="h-4 w-4" /></button>
                <button onClick={() => setEditId(null)} className="rounded-lg bg-slate-100 p-1.5 text-text-muted hover:bg-slate-200" title="Отмена"><X className="h-4 w-4" /></button>
              </div>
              <IconPicker value={edit.icon} onChange={(k) => setEdit({ ...edit, icon: k })} />
            </div>
          ) : (
            <div key={c.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-2.5">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CategoryIcon icon={c.icon} className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-primary">{c.name}</p>
                <p className="truncate text-xs text-text-muted">/{c.slug}{c.description ? ` · ${c.description}` : ''}</p>
              </div>
              <button onClick={() => startEdit(c)} className="p-1.5 text-text-muted hover:text-primary" title="Изменить"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => del.mutate(c.id)} className="p-1.5 text-text-muted hover:text-error" title="Удалить"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-text-muted">
        Удаление рубрики не трогает статьи — они просто останутся без привязки. Переназначьте им рубрику при редактировании.
      </p>
    </div>
  )
}

function PostEditor({ initial, categories, onClose }: { initial: Draft; categories: Category[]; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<Draft>({
    title: '', category: initial.category ?? categories[0]?.slug ?? 'admission',
    excerpt: '', content: '', seo_title: '', seo_description: '', status: 'draft', ...initial,
  })
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const isEdit = !!initial.id

  const set = (k: keyof Draft, v: unknown) => setForm((f) => ({ ...f, [k]: v }))

  const faq = form.faq ?? []
  const setFaq = (next: NonNullable<Draft['faq']>) => set('faq', next)

  const save = useMutation({
    mutationFn: async (status: 'draft' | 'published') => {
      const cleanFaq = (form.faq ?? []).filter((f) => f.question?.trim() && f.answer?.trim())
      const body: Draft = { ...form, faq: cleanFaq, status }
      if (isEdit) return apiUpdatePost(initial.id!, body)
      return apiCreatePost(body)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-posts'] })
      toast.success(isEdit ? 'Статья сохранена' : 'Статья создана')
      onClose()
    },
    onError: () => toast.error('Не удалось сохранить'),
  })

  const onCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { file_id } = await apiUploadPostCover(file)
      set('cover_file_id', file_id)
      toast.success('Обложка загружена')
    } catch {
      toast.error('Не удалось загрузить обложку')
    } finally {
      setUploading(false)
    }
  }

  const canSave = !!form.title?.trim()

  return (
    <div className="space-y-4 overflow-y-auto px-6 py-5">
      <Input label="Заголовок *" value={form.title ?? ''} onChange={(e) => set('title', e.target.value)} placeholder="Как поступить в вузы Китая в 2026" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary">Рубрика</label>
          <select value={form.category} onChange={(e) => set('category', e.target.value)}
            className="rounded-input border border-slate-200 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
            {categories.length === 0 && <option value="">— нет рубрик —</option>}
            {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary">Обложка</label>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onCover} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="flex items-center gap-2 rounded-input border border-slate-200 px-3 py-2.5 text-sm text-text-secondary hover:border-primary/40 disabled:opacity-50">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            {form.cover_file_id ? 'Заменить обложку' : 'Загрузить обложку'}
          </button>
        </div>
      </div>

      {form.cover_file_id && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={getPostCoverUrl(form.cover_file_id)} alt="cover" className="h-32 w-full rounded-xl object-cover" />
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-secondary">Краткое описание (для карточки и SEO)</label>
        <textarea rows={2} value={form.excerpt ?? ''} onChange={(e) => set('excerpt', e.target.value)}
          placeholder="1–2 предложения о статье" maxLength={500}
          className="w-full rounded-input border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-secondary">Текст статьи</label>
        <RichTextEditor value={form.content ?? ''} onChange={(html) => set('content', html)} placeholder="Пишите статью…" minHeight="220px" />
      </div>

      {/* FAQ — вопросы и ответы (показываются на странице + FAQPage-разметка для Google/ИИ) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-text-secondary">Частые вопросы (FAQ)</label>
          <button type="button" onClick={() => setFaq([...faq, { question: '', answer: '' }])}
            className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20">
            <Plus className="h-3.5 w-3.5" /> Добавить вопрос
          </button>
        </div>
        {faq.length === 0 && (
          <p className="text-xs text-text-muted">Необязательно, но повышает шансы попасть в responses Google и ответы нейросетей.</p>
        )}
        {faq.map((item, idx) => (
          <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <input
                value={item.question}
                onChange={(e) => setFaq(faq.map((f, k) => k === idx ? { ...f, question: e.target.value } : f))}
                placeholder="Вопрос (например: Нужен ли китайский язык?)"
                className="flex-1 rounded-input border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button type="button" onClick={() => setFaq(faq.filter((_, k) => k !== idx))}
                className="p-1.5 text-text-muted hover:text-error" title="Удалить">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <textarea
              value={item.answer}
              onChange={(e) => setFaq(faq.map((f, k) => k === idx ? { ...f, answer: e.target.value } : f))}
              rows={2}
              placeholder="Короткий самодостаточный ответ"
              className="w-full rounded-input border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        ))}
      </div>

      <details className="rounded-xl border border-slate-100 bg-slate-50 p-3">
        <summary className="cursor-pointer text-sm font-semibold text-text-secondary">SEO (необязательно)</summary>
        <div className="mt-3 space-y-3">
          <Input label="SEO-заголовок (title)" value={form.seo_title ?? ''} onChange={(e) => set('seo_title', e.target.value)} placeholder="Если пусто — берётся заголовок" />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">SEO-описание (description)</label>
            <textarea rows={2} value={form.seo_description ?? ''} onChange={(e) => set('seo_description', e.target.value)} maxLength={500}
              className="w-full rounded-input border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
      </details>

      <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
        <Button variant="outline" onClick={() => save.mutate('draft')} loading={save.isPending} disabled={!canSave}>
          Сохранить черновик
        </Button>
        <Button onClick={() => save.mutate('published')} loading={save.isPending} disabled={!canSave}>
          Опубликовать
        </Button>
      </div>
    </div>
  )
}

export default function AdminBlogPage() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<Draft | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Post | null>(null)
  const [showCats, setShowCats] = useState(false)

  const { data: posts, isLoading } = useQuery({ queryKey: ['admin-posts'], queryFn: apiGetAllPosts })
  const { data: cats } = useQuery({ queryKey: ['categories'], queryFn: apiGetCategories })
  const catBy: Record<string, Category> = Object.fromEntries((cats ?? []).map((c) => [c.slug, c]))

  const del = useMutation({
    mutationFn: (id: string) => apiDeletePost(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-posts'] }); toast.success('Статья удалена'); setConfirmDelete(null) },
    onError: () => toast.error('Не удалось удалить'),
  })

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Блог</h1>
          <p className="text-sm text-text-muted">SEO-статьи для продвижения. Публичный раздел: /blog</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowCats(true)}>
            <Tags className="h-4 w-4" /> Рубрики
          </Button>
          <Button onClick={() => setEditing({})}>
            <Plus className="h-4 w-4" /> Новая статья
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : !posts?.length ? (
        <div className="rounded-2xl border border-slate-100 bg-white py-16 text-center text-text-muted">
          Пока нет статей. Нажмите «Новая статья».
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((p) => (
            <div key={p.id} className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-3">
              <div className="h-12 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {p.cover_file_id && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={getPostCoverUrl(p.cover_file_id)} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-text-primary">{p.title}</p>
                <div className="mt-0.5 flex items-center gap-2 text-xs">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                    {catBy[p.category]?.name ?? p.category}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 font-medium ${p.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {p.status === 'published' ? 'Опубликовано' : 'Черновик'}
                  </span>
                </div>
              </div>
              {p.status === 'published' && (
                <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer" title="Открыть" className="p-2 text-text-muted hover:text-primary">
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
              <button onClick={() => setEditing(p)} title="Редактировать" className="p-2 text-text-muted hover:text-primary">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => setConfirmDelete(p)} title="Удалить" className="p-2 text-text-muted hover:text-error">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Редактировать статью' : 'Новая статья'} maxWidth="max-w-2xl">
        {editing && <PostEditor initial={editing} categories={cats ?? []} onClose={() => setEditing(null)} />}
      </Modal>

      <Modal open={showCats} onClose={() => setShowCats(false)} title="Рубрики блога" maxWidth="max-w-2xl">
        <CategoriesManager />
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Удалить статью?">
        <div className="px-6 py-5">
          <p className="text-sm text-text-secondary">Статья «{confirmDelete?.title}» будет удалена. Действие необратимо.</p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Отмена</Button>
            <Button variant="danger" loading={del.isPending} onClick={() => confirmDelete && del.mutate(confirmDelete.id)}>Удалить</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
