'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, SkipForward } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from './button'
import { BarashekMascot, type BarashekMood } from './BarashekMascot'
import { MarkdownMessage } from './markdown-message'
import { Typewriter } from './Typewriter'
import { VoiceSettings } from './VoiceSettings'
import { useAuthStore } from '@/lib/store/authStore'
import { useBarashekStore } from '@/lib/store/barashekStore'
import { speak } from '@/lib/barashekVoice'
import { apiAiOnboardingChat, type ChatMessage, type OnboardingOption } from '@/lib/api/ai'

const KICKOFF = '__start__'

interface FieldMeta {
  field: string
  field_type: 'text' | 'number' | 'date' | 'choice'
  options: OnboardingOption[]
  skippable: boolean
  progress: { filled: number; total: number }
}

/** Пузырь Барашка: печатает текст (+озвучка), затем форматирует в markdown. */
function Bubble({ content }: { content: string }) {
  const [done, setDone] = useState(false)
  const muted = useBarashekStore((s) => s.muted)
  useEffect(() => { speak(content, muted); /* eslint-disable-next-line */ }, [])
  return done
    ? <MarkdownMessage content={content} />
    : <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700"><Typewriter text={content} onDone={() => setDone(true)} /></div>
}

export function OnboardingModal() {
  const { user, patchUser } = useAuthStore()
  const router = useRouter()

  const [history, setHistory] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [meta, setMeta] = useState<FieldMeta | null>(null)

  const startedRef = useRef(false)
  const skippedRef = useRef<string[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const active = !!user && user.role === 'student' && !user.is_onboarded

  // Приветствие один раз (ref-guard переживает StrictMode — не задвоит)
  useEffect(() => {
    if (!active || startedRef.current) return
    startedRef.current = true
    void send(KICKOFF, { isKickoff: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [history, loading])

  async function send(apiText: string, opts: { isKickoff?: boolean; display?: string } = {}) {
    if (loading) return
    const prior = history
    if (!opts.isKickoff) {
      setHistory((h) => [...h, { role: 'user', content: opts.display ?? apiText }])
    }
    setInput('')
    setLoading(true)
    try {
      const res = await apiAiOnboardingChat(apiText, prior, skippedRef.current)
      setHistory((h) => [...h, { role: 'assistant', content: res.reply }])
      setMeta({
        field: res.field, field_type: res.field_type, options: res.options,
        skippable: res.skippable, progress: res.progress,
      })
      if (res.completed) setCompleted(true)
    } catch {
      setHistory((h) => [...h, { role: 'assistant', content: 'Ой, я чуть-чуть запутался. Напиши ещё разок?' }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    void send(text)
  }

  function finish() {
    // сбрасываем «виденные» туры — чтобы Барашек заново провёл по каждой странице
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('barashek_tour_'))
        .forEach((k) => localStorage.removeItem(k))
    } catch { /* no-op */ }
    patchUser({ is_onboarded: true })
    router.push('/dashboard/universities')
  }

  if (!active) return null

  const visible = history.filter((m) => m.content !== KICKOFF)
  const mood: BarashekMood = completed ? 'happy' : loading ? 'thinking' : 'talking'
  const showChoices = !completed && !loading && meta?.field_type === 'choice' && meta.options.length > 0
  const showInput = !completed && !showChoices
  const pct = meta?.progress ? Math.round((meta.progress.filled / Math.max(1, meta.progress.total)) * 100) : 0

  const inputPlaceholder =
    meta?.field_type === 'number' ? 'Введи число…'
    : meta?.field_type === 'date' ? 'ГГГГ-ММ-ДД, напр. 2006-05-14'
    : 'Напиши Барашку…'

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-primary/30 via-black/40 to-primary/20 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        <motion.div
          className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
          style={{ height: 'min(88vh, 720px)' }}
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        >
          {/* Шапка */}
          <div className="relative flex flex-col items-center bg-gradient-to-br from-primary to-primary/80 px-6 pt-6 pb-5 text-white">
            <div className="absolute right-3 top-3"><VoiceSettings light /></div>
            <BarashekMascot mood={mood} size={88} />
            <h2 className="mt-2 text-lg font-bold">Барашек</h2>
            <p className="text-xs text-white/80">твой проводник в EduBridge</p>
            {/* Прогресс */}
            {!completed && meta?.progress && (
              <div className="mt-3 w-full max-w-xs">
                <div className="h-1.5 overflow-hidden rounded-full bg-white/25">
                  <div className="h-full rounded-full bg-white transition-all" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1 text-center text-[10px] text-white/70">{meta.progress.filled} из {meta.progress.total} заполнено</p>
              </div>
            )}
          </div>

          {/* Лента */}
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-slate-50 px-4 py-5">
            {visible.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="mr-2 mt-1 flex h-8 w-8 shrink-0 items-center justify-center self-end rounded-full bg-primary/10 text-lg">🐑</div>
                )}
                <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === 'user' ? 'rounded-br-md bg-primary text-white' : 'rounded-bl-md bg-white text-slate-700 shadow-sm'
                }`}>
                  {m.role === 'assistant' ? <Bubble content={m.content} /> : m.content}
                </div>
              </motion.div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="mr-2 mt-1 flex h-8 w-8 items-center justify-center self-end rounded-full bg-primary/10 text-lg">🐑</div>
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm">
                  {[0, 1, 2].map((i) => (
                    <motion.span key={i} className="h-2 w-2 rounded-full bg-slate-300"
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                      transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Низ */}
          <div className="border-t border-slate-100 bg-white p-3">
            {completed ? (
              <Button className="w-full gap-2" onClick={finish}>
                <Sparkles className="h-4 w-4" /> Подобрать мне университеты
              </Button>
            ) : (
              <div className="space-y-2">
                {/* Кнопки-варианты */}
                {showChoices && (
                  <div className="flex flex-wrap gap-2">
                    {meta!.options.map((o) => (
                      <button
                        key={o.value}
                        onClick={() => send(o.value, { display: o.label })}
                        className="rounded-full border border-primary/30 bg-primary-50 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white"
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Поле ввода */}
                {showInput && (
                  <form onSubmit={onSubmit} className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      disabled={loading}
                      inputMode={meta?.field_type === 'number' ? 'numeric' : 'text'}
                      placeholder={inputPlaceholder}
                      className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white disabled:opacity-60"
                    />
                    <button type="submit" disabled={loading || !input.trim()}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-opacity hover:opacity-90 disabled:opacity-40">
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                )}

                {/* Пропустить (для необязательных) */}
                {!loading && meta?.skippable && (
                  <button
                    onClick={() => {
                      if (meta?.field) skippedRef.current = [...skippedRef.current, meta.field]
                      send('пропустить, не сдавал', { display: 'Пропустить' })
                    }}
                    className="flex items-center gap-1 text-xs font-medium text-text-muted hover:text-text-secondary"
                  >
                    <SkipForward className="h-3.5 w-3.5" /> Пропустить / не сдавал
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
