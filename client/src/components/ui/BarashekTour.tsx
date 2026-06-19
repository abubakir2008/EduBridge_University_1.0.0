'use client'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, X, MousePointerClick } from 'lucide-react'
import { BarashekMascot } from './BarashekMascot'
import { Typewriter } from './Typewriter'
import { TOURS, type TourStep } from './tours'
import { useBarashekStore } from '@/lib/store/barashekStore'
import { speak, cancelSpeech } from '@/lib/barashekVoice'

interface TourContextValue {
  startTour: (steps: TourStep[]) => void
  startNamed: (name: string) => void
  stop: () => void
  active: boolean
}

const TourContext = createContext<TourContextValue | null>(null)

export function useTour() {
  const ctx = useContext(TourContext)
  if (!ctx) throw new Error('useTour must be used within TourProvider')
  return ctx
}

interface Rect { top: number; left: number; width: number; height: number }

const PAD = 8

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [steps, setSteps] = useState<TourStep[]>([])
  const [index, setIndex] = useState(0)
  const [active, setActive] = useState(false)
  const [rect, setRect] = useState<Rect | null>(null)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => setMounted(true), [])

  const startTour = useCallback((s: TourStep[]) => {
    if (!s.length) return
    setSteps(s)
    setIndex(0)
    setActive(true)
  }, [])

  const startNamed = useCallback((name: string) => {
    const s = TOURS[name]
    if (s) startTour(s)
  }, [startTour])

  const stop = useCallback(() => {
    setActive(false)
    setSteps([])
    setRect(null)
  }, [])

  const step = active ? steps[index] : undefined
  const isLast = index === steps.length - 1

  // Озвучка текущего шага
  const muted = useBarashekStore((s) => s.muted)
  useEffect(() => {
    if (active && step) speak(step.text, muted)
    else cancelSpeech()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, index])

  const next = useCallback(() => {
    setIndex((i) => {
      if (i < steps.length - 1) return i + 1
      // последний шаг — закрываем
      setActive(false)
      setSteps([])
      setRect(null)
      return i
    })
  }, [steps.length])

  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])

  // Поиск целевого элемента с поллингом (элемент может появиться не сразу:
  // после навигации, загрузки данных, открытия модалки).
  useEffect(() => {
    if (!active || !step) return
    if (!step.target) { setRect(null); return }

    let cancelled = false
    let tries = 0

    const measure = () => {
      const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`)
      if (el) {
        const r = el.getBoundingClientRect()
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
        return true
      }
      return false
    }

    const tick = () => {
      if (cancelled) return
      const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setTimeout(() => !cancelled && measure(), 300)
        return
      }
      tries += 1
      if (tries < 60) setTimeout(tick, 150) // ждём до ~9 сек
      else setRect(null)
    }
    tick()

    const onMove = () => measure()
    window.addEventListener('resize', onMove)
    window.addEventListener('scroll', onMove, true)
    const reMeasure = setInterval(measure, 600) // на случай анимаций/сдвигов
    return () => {
      cancelled = true
      clearInterval(reMeasure)
      window.removeEventListener('resize', onMove)
      window.removeEventListener('scroll', onMove, true)
    }
  }, [active, index, step])

  // Шаг с действием «click»: ждём реального клика по нужному элементу.
  useEffect(() => {
    if (!active || !step || step.action !== 'click' || !step.target) return
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null
      if (t && t.closest(`[data-tour="${step.target}"]`)) {
        // даём приложению обработать клик (открыть модалку / перейти), затем шагаем
        setTimeout(() => next(), 200)
      }
    }
    document.addEventListener('click', handler, true)
    return () => document.removeEventListener('click', handler, true)
  }, [active, index, step, next])

  // Шаг с действием «navigate»: ждём перехода на нужный маршрут.
  useEffect(() => {
    if (!active || !step || step.action !== 'navigate' || !step.route) return
    if (pathname.startsWith(step.route)) {
      const t = setTimeout(() => next(), 400)
      return () => clearTimeout(t)
    }
  }, [active, index, step, pathname, next])

  return (
    <TourContext.Provider value={{ startTour, startNamed, stop, active }}>
      {children}
      {mounted && createPortal(
        <AnimatePresence>
          {active && step && (
            <TourOverlay
              key="tour"
              step={step}
              rect={rect}
              index={index}
              total={steps.length}
              isLast={isLast}
              onNext={next}
              onPrev={prev}
              onSkip={stop}
            />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </TourContext.Provider>
  )
}

function TourOverlay({
  step, rect, index, total, isLast, onNext, onPrev, onSkip,
}: {
  step: TourStep
  rect: Rect | null
  index: number
  total: number
  isLast: boolean
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
}) {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024
  const vh = typeof window !== 'undefined' ? window.innerHeight : 768

  const CARD_W = Math.min(360, vw - 24)
  let cardTop = vh / 2 - 120
  let cardLeft = vw / 2 - CARD_W / 2
  let arrow: 'up' | 'down' | null = null

  if (rect) {
    const spaceBelow = vh - (rect.top + rect.height)
    cardLeft = Math.min(Math.max(12, rect.left + rect.width / 2 - CARD_W / 2), vw - CARD_W - 12)
    if (spaceBelow > 250) {
      cardTop = rect.top + rect.height + PAD + 14
      arrow = 'up'
    } else {
      cardTop = Math.max(12, rect.top - PAD - 14 - 240)
      arrow = 'down'
    }
  }

  const waitingClick = step.action === 'click'
  const waitingNav = step.action === 'navigate'
  const interactive = waitingClick || waitingNav

  return (
    // wrapper не перехватывает клики — «дырка» вокруг цели остаётся кликабельной
    <div className="fixed inset-0 z-[70] pointer-events-none">
      {/* Затемнение с «дыркой» вокруг цели (клики по затемнению гасим, по цели — проходят) */}
      {rect ? (
        <>
          <Dim top={0} left={0} width={vw} height={Math.max(0, rect.top - PAD)} />
          <Dim top={rect.top + rect.height + PAD} left={0} width={vw} height={Math.max(0, vh - (rect.top + rect.height + PAD))} />
          <Dim top={rect.top - PAD} left={0} width={Math.max(0, rect.left - PAD)} height={rect.height + PAD * 2} />
          <Dim top={rect.top - PAD} left={rect.left + rect.width + PAD} width={Math.max(0, vw - (rect.left + rect.width + PAD))} height={rect.height + PAD * 2} />
          {/* Светящаяся рамка вокруг цели */}
          <motion.div
            className="pointer-events-none absolute rounded-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, boxShadow: ['0 0 0 3px rgba(99,102,241,0.75)', '0 0 0 7px rgba(99,102,241,0.25)', '0 0 0 3px rgba(99,102,241,0.75)'] }}
            transition={{ boxShadow: { duration: 1.4, repeat: Infinity } }}
            style={{ top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }}
          />
          {/* Пульсирующий «нажми сюда» курсор для click-шагов */}
          {waitingClick && (
            <motion.div
              className="pointer-events-none absolute text-primary"
              style={{ top: rect.top + rect.height - 6, left: rect.left + rect.width - 6 }}
              animate={{ scale: [1, 1.25, 1], y: [0, 3, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <MousePointerClick className="h-7 w-7 drop-shadow" fill="white" />
            </motion.div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 bg-black/55 pointer-events-auto" />
      )}

      {/* Карточка Барашка */}
      <motion.div
        key={index}
        className="absolute pointer-events-auto"
        style={{ top: cardTop, left: cardLeft, width: CARD_W }}
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      >
        {arrow === 'up' && (
          <div className="mb-[-6px] h-3 w-3 rotate-45 rounded-sm bg-white" style={{ marginLeft: 28 }} />
        )}
        <div className="rounded-2xl bg-white p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="-mt-2 flex-shrink-0">
              <BarashekMascot mood={step.praise ? 'happy' : interactive ? 'talking' : 'idle'} size={64} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-text-primary">{step.title}</p>
                <button onClick={onSkip} className="text-slate-300 transition-colors hover:text-slate-500" aria-label="Закрыть гид">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="min-h-[56px] text-sm leading-relaxed text-text-secondary">
                <Typewriter text={step.text} />
              </div>
            </div>
          </div>

          {/* Подсказка действия */}
          {interactive && (
            <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-primary-50 px-2.5 py-1.5 text-xs font-medium text-primary">
              <MousePointerClick className="h-3.5 w-3.5" />
              {waitingClick ? 'Нажми на подсвеченный элемент' : 'Перейди в нужный раздел'}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between">
            <div className="flex gap-1">
              {Array.from({ length: total }).map((_, i) => (
                <span key={i} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-4 bg-primary' : 'w-1.5 bg-slate-200'}`} />
              ))}
            </div>
            <div className="flex items-center gap-2">
              {index > 0 && (
                <button onClick={onPrev} className="flex items-center gap-0.5 rounded-lg px-2 py-1.5 text-xs font-medium text-text-muted hover:bg-slate-100">
                  <ChevronLeft className="h-3.5 w-3.5" /> Назад
                </button>
              )}
              {interactive ? (
                <button onClick={onNext} className="rounded-lg px-2 py-1.5 text-xs font-medium text-text-muted hover:bg-slate-100">
                  Пропустить →
                </button>
              ) : (
                <button
                  onClick={onNext}
                  className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                >
                  {isLast ? 'Готово 🎉' : 'Дальше'}
                  {!isLast && <ChevronRight className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function Dim({ top, left, width, height }: Rect) {
  return (
    <div
      className="absolute bg-black/55 pointer-events-auto"
      style={{ top, left, width, height }}
    />
  )
}
