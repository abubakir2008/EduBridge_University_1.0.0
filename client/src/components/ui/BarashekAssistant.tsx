'use client'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, X, Sparkles } from 'lucide-react'
import { BarashekMascot, type BarashekMood } from './BarashekMascot'
import { MarkdownMessage } from './markdown-message'
import { Typewriter } from './Typewriter'
import { VoiceSettings } from './VoiceSettings'
import { useTour } from './BarashekTour'
import { TOURS } from './tours'
import { useAuthStore } from '@/lib/store/authStore'
import { useBarashekStore } from '@/lib/store/barashekStore'
import { speak } from '@/lib/barashekVoice'
import { apiGetTraining } from '@/lib/api/training'
import { apiBarashekGuide, apiBarashekNextAction, apiBarashekInterview, type ChatMessage } from '@/lib/api/ai'

/** Определяем «ключ страницы» для контекста Барашка по текущему пути. */
function pageKeyFromPath(path: string): string {
  if (path.startsWith('/dashboard/training')) return 'training'
  if (/^\/dashboard\/universities\/[^/]+/.test(path)) return 'university_detail'
  if (path.startsWith('/dashboard/universities')) return 'universities'
  if (path.startsWith('/dashboard/compare')) return 'compare'
  if (path.startsWith('/dashboard/favourites')) return 'favourites'
  if (path.startsWith('/dashboard/notifications')) return 'notifications'
  if (path.startsWith('/dashboard/profile')) return 'profile'
  return 'training'
}

/** Пузырь ответа Барашка: сначала печатается (и озвучивается), потом markdown. */
function AssistantBubble({ content }: { content: string }) {
  const [done, setDone] = useState(false)
  const muted = useBarashekStore((s) => s.muted)
  useEffect(() => { speak(content, muted); /* eslint-disable-next-line */ }, [])
  return done
    ? <MarkdownMessage content={content} />
    : <div className="text-sm leading-relaxed text-text-primary"><Typewriter text={content} onDone={() => setDone(true)} /></div>
}

export function BarashekAssistant() {
  const { user } = useAuthStore()
  const pathname = usePathname()
  const pageKey = pageKeyFromPath(pathname)
  const { startNamed, startTour, active: tourActive } = useTour()
  const say = useBarashekStore((s) => s.say)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [interview, setInterview] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const tourStartedRef = useRef<Set<string>>(new Set())
  const messagesRef = useRef<ChatMessage[]>([])
  messagesRef.current = messages

  // Статус обучения — чтобы на «Мой путь» выбрать нужный гид (выбран вуз или нет)
  const onboardedStudent = !!user && user.role === 'student' && !!user.is_onboarded
  const trainingQ = useQuery({
    queryKey: ['training', user?.id],
    queryFn: () => apiGetTraining(user!.id),
    enabled: onboardedStudent,
    retry: false,
  })
  const hasUniversity = !!trainingQ.data?.university_id

  // Контекстный гид: на «Мой путь» без выбранного вуза ведём выбирать университет
  const tourName = pageKey === 'training' ? (hasUniversity ? 'training' : 'training_empty') : pageKey
  const trainingSettled = pageKey !== 'training' || !trainingQ.isLoading

  const hasTour = !!TOURS[tourName]

  // Запуск тура. Для «Мой путь» убираем шаг про урок, если уроков на этапе нет.
  function startPageTour() {
    if (tourName === 'training') {
      const stage = trainingQ.data?.current_stage
      const hasLessons = (stage?.lessons?.length ?? 0) > 0
      const hasReqs = (stage?.requirements?.length ?? 0) > 0
      const steps = TOURS.training.filter((s) =>
        !(s.target === 'tour-lesson' && !hasLessons) &&
        !(s.target === 'tour-requirement' && !hasReqs)
      )
      startTour(steps)
    } else {
      startNamed(tourName)
    }
  }

  // Авто-запуск гида при первом заходе на раздел (один раз за сессию + помним в localStorage)
  useEffect(() => {
    if (!onboardedStudent) return
    if (!trainingSettled) return            // ждём статус обучения для «Мой путь»
    if (!TOURS[tourName]) return
    if (tourStartedRef.current.has(tourName)) return
    const seenKey = `barashek_tour_${tourName}`
    if (typeof window !== 'undefined' && localStorage.getItem(seenKey)) return
    tourStartedRef.current.add(tourName)
    const t = setTimeout(() => {
      startPageTour()
      try { localStorage.setItem(seenKey, '1') } catch {}
    }, 700)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourName, trainingSettled, onboardedStudent])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  // Когда запускается гид — закрываем мобильную шторку, чтобы не перекрывала подсветку
  useEffect(() => {
    if (tourActive) setMobileOpen(false)
  }, [tourActive])

  async function ask(text: string, opts: { kickoff?: boolean } = {}) {
    if (loading) return
    const prior = messagesRef.current
    if (!opts.kickoff) setMessages((m) => [...m, { role: 'user', content: text }])
    setLoading(true)
    try {
      const res = interview
        ? await apiBarashekInterview(text, prior)
        : await apiBarashekGuide({ message: text, history: prior, page: pageKey })
      setMessages((m) => [...m, { role: 'assistant', content: res.reply }])
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Ой, я чуть-чуть запутался 🐑 Спроси ещё разок?' }])
    } finally {
      setLoading(false)
    }
  }

  function startInterview() {
    setInterview(true)
    setMessages([])
    setMobileOpen(true)
    // kickoff (без пузыря пользователя) — interview уже true к моменту запроса
    setTimeout(() => { void askInterviewKickoff() }, 0)
  }
  async function askInterviewKickoff() {
    setLoading(true)
    try {
      const res = await apiBarashekInterview('Начнём интервью', [])
      setMessages([{ role: 'assistant', content: res.reply }])
    } catch {
      setMessages([{ role: 'assistant', content: 'Ой, не вышло начать интервью 🐑 Попробуй ещё разок.' }])
    } finally { setLoading(false) }
  }
  function exitInterview() {
    setInterview(false)
    setMessages([])
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    setInput('')
    void ask(text)
  }

  function replayTour() {
    if (hasTour) startPageTour()
  }

  async function whatNow() {
    try {
      const a = await apiBarashekNextAction()
      say({
        variant: 'info',
        mood: (a.mood as BarashekMood) || 'talking',
        title: `Твой следующий шаг ${a.emoji || '🎯'}`,
        text: a.text,
        actionLabel: a.action_label,
        actionHref: a.action_href,
      })
    } catch {
      say({ variant: 'info', mood: 'talking', title: 'Хм 🐑', text: 'Не получилось определить шаг. Попробуй ещё разок чуть позже.' })
    }
  }

  if (!user || user.role !== 'student') return null

  const overdue = trainingQ.data?.current_stage?.deadline_status === 'overdue'
  const mood: BarashekMood = loading ? 'thinking' : overdue ? 'sad' : 'idle'

  const inner = (
    <>
      {/* Шапка с Барашком */}
      <div className="flex items-center gap-3 bg-gradient-to-br from-primary to-primary/80 px-4 py-3">
        <BarashekMascot mood={mood} size={48} />
        <div className="flex-1">
          <p className="text-sm font-bold text-white">Барашек</p>
          <p className="text-[11px] text-white/80">я рядом и помогу 🐑</p>
        </div>
        <VoiceSettings light />
        <button
          onClick={() => setMobileOpen(false)}
          className="text-white/70 transition-colors hover:text-white lg:hidden"
          aria-label="Закрыть"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Кнопки-действия */}
      {interview ? (
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
          <span>🎤 Режим интервью</span>
          <button onClick={exitInterview} className="rounded-md px-2 py-1 text-amber-700 hover:bg-amber-100">Выйти</button>
        </div>
      ) : (
        <>
          <button
            onClick={whatNow}
            className="flex items-center justify-center gap-1.5 border-b border-slate-100 bg-primary py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
          >
            🎯 Что мне делать сейчас?
          </button>
          <div className="flex border-b border-slate-100">
            {hasTour && (
              <button
                onClick={replayTour}
                disabled={tourActive}
                className="flex flex-1 items-center justify-center gap-1.5 bg-primary-50 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary-50/70 disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" /> Покажи, что делать
              </button>
            )}
            <button
              onClick={startInterview}
              className="flex flex-1 items-center justify-center gap-1.5 bg-slate-50 py-2 text-xs font-semibold text-text-secondary transition-colors hover:bg-slate-100"
            >
              🎤 Тренировка интервью
            </button>
          </div>
        </>
      )}

      {/* Лента сообщений */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3">
        {messages.length === 0 && !loading && (
          <p className="px-2 pt-4 text-center text-xs text-text-muted">
            Спроси меня о чём угодно, или нажми «Покажи, что делать» наверху 🐑✨
          </p>
        )}
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'assistant' && (
              <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm">
                🐑
              </div>
            )}
            <div
              className={`max-w-[82%] rounded-2xl px-3 py-2 ${
                m.role === 'user'
                  ? 'rounded-br-md bg-primary text-sm leading-relaxed text-white'
                  : 'rounded-bl-md bg-white text-text-primary shadow-sm'
              }`}
            >
              {m.role === 'assistant' ? <AssistantBubble content={m.content} /> : m.content}
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-sm">
              🐑
            </div>
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-white px-3 py-2.5 shadow-sm">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-slate-300"
                  animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                  transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Ввод */}
      <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-slate-100 bg-white p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          placeholder={interview ? 'Твой ответ…' : 'Спроси Барашка…'}
          className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary focus:bg-white disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </>
  )

  return (
    <>
      {/* Desktop (lg+): постоянная фиксированная колонка слева */}
      <aside className="sticky top-0 hidden h-screen w-80 flex-shrink-0 flex-col border-l border-slate-200 bg-white lg:flex">
        {inner}
      </aside>

      {/* Mobile/планшет: плавающая кнопка + выезжающая панель */}
      {!mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg lg:hidden"
          aria-label="Открыть Барашка"
        >
          <BarashekMascot mood="idle" size={44} />
        </button>
      )}

      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <motion.div
              className="absolute inset-0 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              className="relative ml-auto flex h-full w-[88%] max-w-sm flex-col bg-white shadow-2xl"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {inner}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
