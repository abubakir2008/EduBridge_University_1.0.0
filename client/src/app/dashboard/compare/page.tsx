'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Check, ArrowLeft, Bot, Sparkles, Loader2, Trophy, AlertTriangle, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { apiGetUniversities } from '@/lib/api/universities'
import { getUniversityPhotoUrl } from '@/lib/api/universities'
import { apiAiCompareUniversities, type UniCompareResult } from '@/lib/api/ai'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import type { University } from '@/types'

const MAX_COMPARE = 3

const FIELDS: { label: string; key: keyof University; format?: (v: unknown) => string }[] = [
  { label: 'Страна', key: 'country' },
  { label: 'Город', key: 'city' },
  { label: 'Стоимость ($/год)', key: 'cost', format: (v) => v ? `$${(v as number).toLocaleString()}` : '—' },
  { label: 'Рейтинг', key: 'rating', format: (v) => v ? `#${v}` : '—' },
  { label: 'Специальности', key: 'specialties', format: (v) => {
    if (!v) return '—'
    const arr = Array.isArray(v) ? v : (typeof v === 'string' ? [v] : [])
    return arr.slice(0, 3).join(', ') + (arr.length > 3 ? ` +${arr.length - 3}` : '')
  }},
  { label: 'Описание', key: 'description', format: (v) => v ? String(v).slice(0, 120) + (String(v).length > 120 ? '…' : '') : '—' },
]

function UniCard({ uni, onRemove }: { uni: University; onRemove: () => void }) {
  const photoId = (uni.photo_file_ids ?? [])[0]
  const photoUrl = photoId ? getUniversityPhotoUrl(uni.id, photoId) : null

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="relative h-32 rounded-t-xl overflow-hidden bg-slate-100">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={uni.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-4xl font-bold">
            {uni.name[0]}
          </div>
        )}
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 flex items-center justify-center text-slate-500 hover:text-error hover:bg-white transition-colors shadow"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="bg-white border-x border-slate-100 px-3 py-2.5">
        <p className="font-semibold text-text-primary text-sm leading-tight line-clamp-2">{uni.name}</p>
        <p className="text-xs text-text-muted mt-0.5">{uni.country}, {uni.city}</p>
      </div>
    </div>
  )
}

function AddSlot({ universities, selected, onAdd }: {
  universities: University[]
  selected: string[]
  onAdd: (uni: University) => void
}) {
  const [open, setOpen] = useState(false)
  const available = universities.filter((u) => !selected.includes(u.id))

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="h-32 rounded-xl border-2 border-dashed border-slate-200 w-full flex flex-col items-center justify-center gap-2 text-text-muted hover:border-primary/40 hover:text-primary transition-colors"
      >
        <Plus className="w-6 h-6" />
        <span className="text-sm font-medium">Добавить</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-100 shadow-xl z-20 max-h-60 overflow-y-auto">
          {available.length === 0 ? (
            <p className="px-4 py-3 text-sm text-text-muted">Все университеты добавлены</p>
          ) : (
            available.map((u) => (
              <button
                key={u.id}
                onClick={() => { onAdd(u); setOpen(false) }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between gap-2"
              >
                <span className="font-medium text-text-primary line-clamp-1">{u.name}</span>
                <span className="text-xs text-text-muted flex-shrink-0">{u.country}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function AiCompareBlock({ universities }: { universities: University[] }) {
  const [result, setResult] = useState<UniCompareResult | null>(null)
  const [loading, setLoading] = useState(false)

  const run = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await apiAiCompareUniversities(universities.map(u => u.id))
      setResult(res)
    } catch {
      toast.error('Ошибка AI анализа')
    } finally {
      setLoading(false)
    }
  }

  const chanceColor = (c: string) =>
    c === 'высокие' ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
    : c === 'средние' ? 'text-amber-600 bg-amber-50 border-amber-200'
    : 'text-red-600 bg-red-50 border-red-200'

  const scoreColor = (s: number) => s >= 70 ? 'bg-emerald-500' : s >= 45 ? 'bg-amber-500' : 'bg-red-400'

  return (
    <div className="bg-gradient-to-br from-primary/5 to-violet-50 rounded-2xl border border-primary/20 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-text-primary">AI-анализ сравнения</p>
            <p className="text-xs text-text-muted">Персональный разбор под ваш профиль · Groq</p>
          </div>
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60 transition-all hover:scale-105 active:scale-95"
        >
          {loading
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Анализирую...</>
            : <><Sparkles className="h-4 w-4" /> Сравнить через AI</>}
        </button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Winner */}
            <div className="flex items-start gap-3 rounded-xl bg-white border border-amber-200 px-4 py-3 shadow-sm">
              <Trophy className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-0.5">Лучший выбор для вас</p>
                <p className="font-bold text-text-primary">{result.winner}</p>
                <p className="text-sm text-text-secondary mt-1 leading-relaxed">{result.winner_reason}</p>
              </div>
            </div>

            {/* Per university */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {result.per_university.map((u) => (
                <div key={u.name} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-text-primary text-sm line-clamp-1">{u.name}</p>
                    <span className={`text-[10px] font-semibold rounded-full border px-2 py-0.5 flex-shrink-0 ${chanceColor(u.admission_chance)}`}>
                      {u.admission_chance}
                    </span>
                  </div>

                  {/* Fit score bar */}
                  <div>
                    <div className="flex justify-between text-[10px] text-text-muted mb-1">
                      <span>Совпадение с профилем</span>
                      <span className="font-semibold">{u.fit_score}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${u.fit_score}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-full rounded-full ${scoreColor(u.fit_score)}`}
                      />
                    </div>
                  </div>

                  {u.pros.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-emerald-600 mb-1">✓ Плюсы</p>
                      {u.pros.map((p, i) => <p key={i} className="text-xs text-text-secondary leading-relaxed">• {p}</p>)}
                    </div>
                  )}
                  {u.cons.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-red-500 mb-1">✗ Минусы</p>
                      {u.cons.map((c, i) => <p key={i} className="text-xs text-text-secondary leading-relaxed">• {c}</p>)}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Advice + Red flags */}
            <div className="grid gap-3 sm:grid-cols-2">
              {result.advice && (
                <div className="flex items-start gap-3 rounded-xl bg-white border border-primary/20 px-4 py-3">
                  <TrendingUp className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-primary mb-1">Совет</p>
                    <p className="text-sm text-text-secondary leading-relaxed">{result.advice}</p>
                  </div>
                </div>
              )}
              {result.red_flags.length > 0 && (
                <div className="flex items-start gap-3 rounded-xl bg-white border border-amber-200 px-4 py-3">
                  <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-amber-600 mb-1">На что обратить внимание</p>
                    {result.red_flags.map((f, i) => <p key={i} className="text-xs text-text-secondary">• {f}</p>)}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function ComparePage() {
  const [selected, setSelected] = useState<University[]>([])

  const { data: universities = [], isLoading } = useQuery({
    queryKey: ['universities-list'],
    queryFn: () => apiGetUniversities(),
  })

  const addUni = (uni: University) => {
    if (selected.length < MAX_COMPARE) setSelected((prev) => [...prev, uni])
  }

  const removeUni = (id: string) => setSelected((prev) => prev.filter((u) => u.id !== id))

  const slots = MAX_COMPARE - selected.length

  if (isLoading) return (
    <div className="max-w-5xl space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
      </div>
    </div>
  )

  return (
    <motion.div
      className="max-w-5xl space-y-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-center gap-3">
        <Link href="/dashboard/universities" className="text-text-muted hover:text-primary transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Сравнение университетов</h1>
          <p className="text-sm text-text-muted mt-0.5">Выберите до {MAX_COMPARE} университетов для сравнения</p>
        </div>
      </div>

      {/* Columns */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `160px repeat(${MAX_COMPARE}, 1fr)` }}>
        {/* Empty top-left */}
        <div />

        {/* University headers */}
        {selected.map((uni) => (
          <UniCard key={uni.id} uni={uni} onRemove={() => removeUni(uni.id)} />
        ))}
        {Array.from({ length: slots }).map((_, i) => (
          <AddSlot key={i} universities={universities} selected={selected.map((u) => u.id)} onAdd={addUni} />
        ))}
      </div>

      {selected.length === 0 && (
        <div className="text-center py-16 text-text-muted">
          <p className="text-base">Добавьте университеты выше для сравнения</p>
        </div>
      )}

      {/* Comparison table */}
      {selected.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-card overflow-hidden">
          {FIELDS.map((field, fi) => (
            <div
              key={field.key}
              className={`grid gap-0 ${fi % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
              style={{ gridTemplateColumns: `160px repeat(${MAX_COMPARE}, 1fr)` }}
            >
              {/* Row label */}
              <div className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide flex items-center border-r border-slate-100">
                {field.label}
              </div>

              {/* Values for selected unis */}
              {selected.map((uni) => {
                const raw = uni[field.key]
                const display = field.format ? field.format(raw) : (raw ?? '—')
                return (
                  <div key={uni.id} className="px-4 py-3 text-sm text-text-secondary border-r border-slate-100 last:border-r-0">
                    {String(display)}
                  </div>
                )
              })}

              {/* Empty slots */}
              {Array.from({ length: slots }).map((_, i) => (
                <div key={i} className="px-4 py-3 border-r border-slate-100 last:border-r-0" />
              ))}
            </div>
          ))}

          {/* Specialties full list */}
          {selected.some((u) => Array.isArray(u.specialties) && (u.specialties as string[]).length > 3) && (
            <div
              className="grid border-t border-slate-100"
              style={{ gridTemplateColumns: `160px repeat(${MAX_COMPARE}, 1fr)` }}
            >
              <div className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide flex items-start border-r border-slate-100">
                Все специальности
              </div>
              {selected.map((uni) => {
                const specs = Array.isArray(uni.specialties) ? uni.specialties as string[] : []
                return (
                  <div key={uni.id} className="px-4 py-3 text-sm text-text-secondary border-r border-slate-100 last:border-r-0">
                    {specs.length === 0 ? '—' : (
                      <ul className="space-y-1">
                        {specs.map((s, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <Check className="w-3 h-3 text-primary flex-shrink-0" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })}
              {Array.from({ length: slots }).map((_, i) => (
                <div key={i} className="px-4 py-3 border-r border-slate-100 last:border-r-0" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI сравнение */}
      {selected.length >= 2 && (
        <AiCompareBlock universities={selected} />
      )}
    </motion.div>
  )
}
