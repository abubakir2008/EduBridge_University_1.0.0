'use client'
import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'

interface User { id: string; full_name: string; login: string }

export function StudentSearch({ value, onChange, users, placeholder = 'Поиск по логину или имени...' }: {
  value: string
  onChange: (id: string) => void
  users: User[]
  placeholder?: string
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = users.find(u => u.id === value)
  const filtered = users.filter(u =>
    !query ||
    u.login.toLowerCase().includes(query.toLowerCase()) ||
    u.full_name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 50)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <div
        className="flex items-center h-10 rounded-input border border-slate-200 px-3 gap-2 cursor-pointer focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 bg-white"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 text-text-muted shrink-0" />
        {selected && !open ? (
          <span className="flex-1 text-sm text-text-primary truncate">
            {selected.full_name} <span className="text-text-muted">@{selected.login}</span>
          </span>
        ) : (
          <input
            autoFocus={open}
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-text-muted"
            placeholder={placeholder}
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
          />
        )}
        {selected && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onChange(''); setQuery(''); setOpen(false) }}
          >
            <X className="h-3.5 w-3.5 text-text-muted hover:text-error transition-colors" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
          {filtered.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-text-muted">Не найдено</p>
          ) : filtered.map(u => (
            <button
              key={u.id}
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-primary/5 text-left transition-colors"
              onClick={() => { onChange(u.id); setQuery(''); setOpen(false) }}
            >
              <span className="font-medium text-text-primary truncate">{u.full_name}</span>
              <span className="text-text-muted shrink-0 text-xs">@{u.login}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
