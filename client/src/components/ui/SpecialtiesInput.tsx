'use client'
import { useState, useRef, KeyboardEvent } from 'react'
import {
  X, Plus, Code2, Heart, Scale, TrendingUp, Wrench, Languages, Palette,
  Leaf, BookOpen, FlaskConical, Building2, Globe, Music, Camera, Cpu,
  Landmark, Stethoscope, BarChart3, Shield, Brain, Calculator, Atom,
  Newspaper, Brush, Truck, Plane, Coins, UserCheck,
} from 'lucide-react'

// ── Иконки доступные для выбора ──────────────────────────────────────────────
export const ICONS: { key: string; Icon: React.ElementType; label: string }[] = [
  { key: 'code',       Icon: Code2,       label: 'Программирование' },
  { key: 'cpu',        Icon: Cpu,         label: 'IT / ИБ / ИИ' },
  { key: 'shield',     Icon: Shield,      label: 'Безопасность' },
  { key: 'stethoscope',Icon: Stethoscope, label: 'Медицина' },
  { key: 'scale',      Icon: Scale,       label: 'Юриспруденция' },
  { key: 'bar',        Icon: BarChart3,   label: 'Экономика' },
  { key: 'coins',      Icon: Coins,       label: 'Финансы' },
  { key: 'trend',      Icon: TrendingUp,  label: 'Маркетинг' },
  { key: 'user',       Icon: UserCheck,   label: 'Менеджмент' },
  { key: 'wrench',     Icon: Wrench,      label: 'Инженерия' },
  { key: 'atom',       Icon: Atom,        label: 'Физика / Химия' },
  { key: 'flask',      Icon: FlaskConical,label: 'Наука / Биология' },
  { key: 'brain',      Icon: Brain,       label: 'Психология' },
  { key: 'book',       Icon: BookOpen,    label: 'Педагогика' },
  { key: 'lang',       Icon: Languages,   label: 'Лингвистика' },
  { key: 'calc',       Icon: Calculator,  label: 'Математика' },
  { key: 'palette',    Icon: Palette,     label: 'Дизайн / Арт' },
  { key: 'brush',      Icon: Brush,       label: 'Архитектура' },
  { key: 'building',   Icon: Building2,   label: 'Строительство' },
  { key: 'globe',      Icon: Globe,       label: 'Международные' },
  { key: 'landmark',   Icon: Landmark,    label: 'Политология' },
  { key: 'newspaper',  Icon: Newspaper,   label: 'Журналистика' },
  { key: 'music',      Icon: Music,       label: 'Музыка' },
  { key: 'camera',     Icon: Camera,      label: 'Медиа / Фото' },
  { key: 'plane',      Icon: Plane,       label: 'Авиация' },
  { key: 'truck',      Icon: Truck,       label: 'Логистика' },
  { key: 'leaf',       Icon: Leaf,        label: 'Экология' },
  { key: 'heart',      Icon: Heart,       label: 'Другое' },
]

const iconByKey = Object.fromEntries(ICONS.map(i => [i.key, i.Icon]))

function autoDetectIcon(name: string): string {
  const lower = name.toLowerCase()
  if (['иб', 'безопасн', 'security', 'кибер'].some(k => lower.includes(k))) return 'shield'
  if (['it', 'программ', 'код', 'разраб', 'software', 'cs'].some(k => lower.includes(k))) return 'code'
  if (['ии', 'ai', 'данн', 'data', 'нейр', 'робот', 'электрон', 'информ'].some(k => lower.includes(k))) return 'cpu'
  if (['медицин', 'врач', 'health', 'стоматол', 'фармац'].some(k => lower.includes(k))) return 'stethoscope'
  if (['юрид', 'право', 'закон', 'law'].some(k => lower.includes(k))) return 'scale'
  if (['финанс', 'бухгалт', 'банк', 'finance'].some(k => lower.includes(k))) return 'coins'
  if (['эконом', 'banking'].some(k => lower.includes(k))) return 'bar'
  if (['маркет', 'реклам'].some(k => lower.includes(k))) return 'trend'
  if (['менеджм', 'управл', 'бизнес', 'business'].some(k => lower.includes(k))) return 'user'
  if (['инженер', 'техник', 'механ', 'engineer'].some(k => lower.includes(k))) return 'wrench'
  if (['физик', 'атом'].some(k => lower.includes(k))) return 'atom'
  if (['биолог', 'химия', 'наука', 'biology'].some(k => lower.includes(k))) return 'flask'
  if (['психолог', 'brain'].some(k => lower.includes(k))) return 'brain'
  if (['педагог', 'образован', 'учитель'].some(k => lower.includes(k))) return 'book'
  if (['язык', 'перевод', 'лингвист', 'language'].some(k => lower.includes(k))) return 'lang'
  if (['матем', 'math', 'статист'].some(k => lower.includes(k))) return 'calc'
  if (['дизайн', 'графич', 'design'].some(k => lower.includes(k))) return 'palette'
  if (['архитект'].some(k => lower.includes(k))) return 'brush'
  if (['строит', 'строит'].some(k => lower.includes(k))) return 'building'
  if (['между', 'international', 'global'].some(k => lower.includes(k))) return 'globe'
  if (['полит'].some(k => lower.includes(k))) return 'landmark'
  if (['журнал', 'медиа', 'сми'].some(k => lower.includes(k))) return 'newspaper'
  if (['музык'].some(k => lower.includes(k))) return 'music'
  if (['фото', 'кино', 'film', 'photo', 'видео'].some(k => lower.includes(k))) return 'camera'
  if (['эколог', 'природ'].some(k => lower.includes(k))) return 'leaf'
  return 'heart'
}

const COLORS = [
  { bg: 'bg-blue-100',    text: 'text-blue-700',    border: 'border-blue-200' },
  { bg: 'bg-violet-100',  text: 'text-violet-700',  border: 'border-violet-200' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  { bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-200' },
  { bg: 'bg-rose-100',    text: 'text-rose-700',    border: 'border-rose-200' },
  { bg: 'bg-cyan-100',    text: 'text-cyan-700',    border: 'border-cyan-200' },
  { bg: 'bg-orange-100',  text: 'text-orange-700',  border: 'border-orange-200' },
  { bg: 'bg-pink-100',    text: 'text-pink-700',    border: 'border-pink-200' },
  { bg: 'bg-teal-100',    text: 'text-teal-700',    border: 'border-teal-200' },
  { bg: 'bg-indigo-100',  text: 'text-indigo-700',  border: 'border-indigo-200' },
]

const SUGGESTIONS = [
  'IT / Программирование', 'Специалист ИБ', 'Медицина', 'Юриспруденция', 'Экономика',
  'Финансы', 'Маркетинг', 'Менеджмент', 'Инженерия', 'Дизайн', 'Биология',
  'Педагогика', 'Архитектура', 'Международные отношения', 'Журналистика',
  'Психология', 'Лингвистика', 'Математика', 'Физика', 'Политология',
]

interface Props {
  value: string[]
  onChange: (v: string[]) => void
  label?: string
}

export function SpecialtiesInput({ value, onChange, label }: Props) {
  const [input, setInput] = useState('')
  const [focused, setFocused] = useState(false)
  const [iconMap, setIconMap] = useState<Record<string, string>>({})
  const [pickedIcon, setPickedIcon] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)
  const pickedIconRef = useRef<string>('')

  const currentIcon = pickedIcon || (input.trim() ? autoDetectIcon(input) : 'heart')

  const add = (name: string, iconKey?: string) => {
    const trimmed = name.trim()
    if (!trimmed || value.includes(trimmed)) return
    const key = iconKey ?? (pickedIconRef.current || autoDetectIcon(trimmed))
    setIconMap(prev => ({ ...prev, [trimmed]: key }))
    onChange([...value, trimmed])
    setInput('')
    setPickedIcon('')
    pickedIconRef.current = ''
  }

  const remove = (name: string) => {
    onChange(value.filter(v => v !== name))
    setIconMap(prev => { const n = { ...prev }; delete n[name]; return n })
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault()
      add(input)
    } else if (e.key === 'Backspace' && !input && value.length) {
      remove(value[value.length - 1])
    }
  }

  const filtered = SUGGESTIONS.filter(s =>
    !value.includes(s) && (!input || s.toLowerCase().includes(input.toLowerCase()))
  ).slice(0, 8)

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-text-primary">{label ?? 'Специальности'}</label>

      {/* Чипы добавленных */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((name, i) => {
            const c = COLORS[i % COLORS.length]
            const iconKey = iconMap[name] ?? autoDetectIcon(name)
            const Icon = iconByKey[iconKey] ?? Heart
            return (
              <span key={name} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${c.bg} ${c.text} ${c.border}`}>
                <Icon className="h-3 w-3 shrink-0" />
                {name}
                <button type="button" onClick={() => remove(name)} className="ml-0.5 hover:opacity-60 transition-opacity">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )
          })}
        </div>
      )}

      {/* Инпут */}
      <div className="relative">
        <div className={`flex items-center gap-2 rounded-input border px-3 py-2 transition-all ${focused ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200'}`}>
          <Plus className="h-4 w-4 text-text-muted shrink-0" />
          <input
            ref={inputRef}
            value={input}
            onChange={e => { setInput(e.target.value); setPickedIcon(''); pickedIconRef.current = '' }}
            onKeyDown={onKey}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder="Введите специальность..."
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-text-muted"
          />
          {input.trim() && (
            <div className="flex items-center gap-1.5 shrink-0">
              {(() => { const Icon = iconByKey[currentIcon] ?? Heart; return <Icon className="h-4 w-4 text-primary" /> })()}
              <button
                type="button"
                onClick={() => add(input)}
                className="rounded-lg bg-primary px-2.5 py-1 text-xs font-medium text-white hover:bg-primary/90 transition-colors"
              >
                + Добавить
              </button>
            </div>
          )}
        </div>

        {/* Выбор иконки — показывается когда что-то введено */}
        {input.trim() && (
          <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3 shadow-md">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2">Выбери иконку</p>
            <div className="flex flex-wrap gap-1.5">
              {ICONS.map(({ key, Icon, label }) => {
                const active = currentIcon === key
                return (
                  <button
                    key={key}
                    type="button"
                    title={label}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      setPickedIcon(key)
                      pickedIconRef.current = key
                      inputRef.current?.focus()
                    }}
                    className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] transition-all ${
                      active
                        ? 'border-primary bg-primary text-white shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-text-secondary hover:border-primary/40 hover:bg-primary/5'
                    }`}
                  >
                    <Icon className="h-3 w-3 shrink-0" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Подсказки — когда поле пустое */}
        {focused && !input.trim() && filtered.length > 0 && (
          <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
            <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Популярные</p>
            <div className="flex flex-wrap gap-1.5 px-3 pb-3">
              {filtered.map((s, i) => {
                const c = COLORS[(value.length + i) % COLORS.length]
                const iconKey = autoDetectIcon(s)
                const Icon = iconByKey[iconKey] ?? Heart
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => add(s, iconKey)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-opacity hover:opacity-80 ${c.bg} ${c.text} ${c.border}`}
                  >
                    <Icon className="h-3 w-3 shrink-0" />
                    {s}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-text-muted">Выбери иконку → нажми Enter или «+ Добавить»</p>
    </div>
  )
}
