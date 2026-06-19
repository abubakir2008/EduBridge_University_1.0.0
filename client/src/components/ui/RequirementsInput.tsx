'use client'
import { useState } from 'react'
import { X, Plus, Languages, GraduationCap, BarChart3, CalendarClock } from 'lucide-react'

export type ReqValue = Record<string, number>

// Типы требований. Ключи совпадают с тем, что читает подбор
// (matching_service / requirements_parser): min_IELTS, min_TOEFL, min_HSK, min_SAT, min_gpa, max_age.
const REQ_TYPES = [
  { key: 'min_IELTS', label: 'IELTS', op: '≥', icon: Languages,     min: 0,   max: 9,    step: 0.5, placeholder: '5.5' },
  { key: 'min_TOEFL', label: 'TOEFL', op: '≥', icon: Languages,     min: 0,   max: 120,  step: 1,   placeholder: '80' },
  { key: 'min_HSK',   label: 'HSK',   op: '≥', icon: Languages,     min: 1,   max: 6,    step: 1,   placeholder: '4' },
  { key: 'min_SAT',   label: 'SAT',   op: '≥', icon: BarChart3,     min: 400, max: 1600, step: 10,  placeholder: '1200' },
  { key: 'min_gpa',   label: 'GPA',   op: '≥', icon: GraduationCap, min: 0,   max: 100,  step: 0.1, placeholder: '3.5' },
  { key: 'max_age',   label: 'Возраст', op: '≤', icon: CalendarClock, min: 14, max: 80,  step: 1,   placeholder: '25', suffix: 'лет' },
] as const

const BY_KEY = Object.fromEntries(REQ_TYPES.map((t) => [t.key, t]))

interface Props {
  value: ReqValue
  onChange: (v: ReqValue) => void
  label?: string
}

export function RequirementsInput({ value, onChange, label }: Props) {
  const available = REQ_TYPES.filter((t) => !(t.key in value))
  const [type, setType] = useState<string>('')
  const [num, setNum] = useState('')

  const activeKey = type || available[0]?.key || ''
  const cfg = BY_KEY[activeKey]

  const add = () => {
    if (!activeKey || num === '') return
    onChange({ ...value, [activeKey]: Number(num) })
    setType('')
    setNum('')
  }

  const remove = (k: string) => {
    const next = { ...value }
    delete next[k]
    onChange(next)
  }

  const entries = Object.entries(value).filter(([k]) => BY_KEY[k])

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-text-primary">{label ?? 'Минимальные требования'}</label>

      {/* Чипы добавленных требований */}
      {entries.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {entries.map(([k, v]) => {
            const t = BY_KEY[k]
            const Icon = t.icon
            return (
              <span key={k} className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                <Icon className="h-3 w-3 shrink-0" />
                {t.label} {t.op} {v}{'suffix' in t && t.suffix ? ` ${t.suffix}` : ''}
                <button type="button" onClick={() => remove(k)} className="ml-0.5 transition-opacity hover:opacity-60">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )
          })}
        </div>
      )}

      {/* Добавление: тип + значение */}
      {available.length > 0 && (
        <div className="flex items-center gap-2">
          <select
            value={activeKey}
            onChange={(e) => setType(e.target.value)}
            className="rounded-input border border-slate-200 px-2.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {available.map((t) => (
              <option key={t.key} value={t.key}>{t.label} {t.op}</option>
            ))}
          </select>
          <input
            type="number"
            value={num}
            onChange={(e) => setNum(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
            placeholder={cfg?.placeholder}
            step={cfg?.step}
            min={cfg?.min}
            max={cfg?.max}
            className="w-24 rounded-input border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="button"
            onClick={add}
            disabled={num === ''}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" /> Добавить
          </button>
        </div>
      )}

      <p className="text-xs text-text-muted">
        Эти пороги используются в подборе напрямую (без разбора текста) — самый точный способ.
      </p>
    </div>
  )
}
