'use client'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight } from 'lucide-react'
import { BarashekMascot } from './BarashekMascot'
import { Typewriter } from './Typewriter'
import { useBarashekStore } from '@/lib/store/barashekStore'
import { speak } from '@/lib/barashekVoice'

/** Глобальная «сцена» Барашка: показывает всплывающие моменты (поздравления,
 *  напоминания, отзывы о документах) с озвучкой и эффектами. */
export function BarashekStage() {
  const { moment, muted, dismiss } = useBarashekStore()
  const router = useRouter()
  const dismissedIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!moment) return
    const id = moment.id
    // идемпотентное закрытие: один момент закрываем строго один раз
    const close = () => {
      if (dismissedIdRef.current === id) return
      dismissedIdRef.current = id
      dismiss()
    }
    // Поздравление ждёт пользователя; остальное закрывается, КОГДА голос договорит (+пауза на чтение)
    if (moment.variant === 'celebrate') {
      speak(`${moment.title}. ${moment.text}`, muted)
    } else {
      speak(`${moment.title}. ${moment.text}`, muted, () => setTimeout(close, 2800))
    }
    // страховка: если что-то пойдёт не так — закрыть через 60с
    const safety = setTimeout(close, 60000)
    return () => clearTimeout(safety)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moment?.id])

  // Ручное закрытие (крестик/кнопка) — тоже идемпотентно, чтобы не пропустить след. момент
  const manualClose = () => {
    if (!moment) return
    if (dismissedIdRef.current === moment.id) return
    dismissedIdRef.current = moment.id
    dismiss()
  }

  const goAction = () => {
    const href = moment?.actionHref
    manualClose()
    if (href) router.push(href)
  }

  if (!moment) return null

  const celebrate = moment.variant === 'celebrate'

  return (
    <AnimatePresence>
      <div
        className={
          celebrate
            ? 'fixed inset-0 z-[80] flex items-center justify-center p-4 pointer-events-none'
            : 'fixed bottom-24 right-4 z-[80] w-[92%] max-w-md lg:max-w-lg lg:bottom-6 lg:right-6 pointer-events-none'
        }
      >
        {/* Конфетти для поздравления */}
        {celebrate && (
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 24 }).map((_, i) => (
              <motion.span
                key={i}
                className="absolute text-lg"
                style={{ left: `${(i * 37) % 100}%`, top: '-5%' }}
                initial={{ y: -20, opacity: 0, rotate: 0 }}
                animate={{ y: '110vh', opacity: [0, 1, 1, 0], rotate: 360 }}
                transition={{ duration: 2.4 + (i % 5) * 0.3, delay: (i % 6) * 0.15, repeat: Infinity, repeatDelay: 1.5 }}
              >
                {['🎉', '✨', '💚', '⭐', '🐑'][i % 5]}
              </motion.span>
            ))}
          </div>
        )}

        <motion.div
          className={`pointer-events-auto rounded-2xl bg-white shadow-2xl ${celebrate ? 'max-w-md p-7 text-center' : 'p-5'}`}
          initial={{ opacity: 0, scale: celebrate ? 0.9 : 1, y: celebrate ? 10 : 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        >
          {celebrate ? (
            <div className="flex flex-col items-center">
              <BarashekMascot mood="happy" size={140} />
              <p className="mt-2 text-xl font-bold text-text-primary">{moment.title}</p>
              <div className="mt-1.5 text-base text-text-secondary">
                <Typewriter text={moment.text} />
              </div>
              <button
                onClick={manualClose}
                className="mt-5 rounded-xl bg-primary px-6 py-2.5 text-base font-semibold text-white transition-opacity hover:opacity-90"
              >
                Ура! 🎉
              </button>
            </div>
          ) : (
            <div className="flex items-start gap-3.5">
              <div className="-mt-1 flex-shrink-0">
                <BarashekMascot mood={moment.mood ?? 'talking'} size={72} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-base font-bold text-text-primary">{moment.title}</p>
                  <button onClick={manualClose} className="text-slate-300 hover:text-slate-500" aria-label="Закрыть">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="text-[15px] leading-relaxed text-text-secondary">
                  <Typewriter text={moment.text} />
                </div>
                {moment.actionHref && moment.actionLabel && (
                  <button
                    onClick={goAction}
                    className="mt-2.5 inline-flex items-center gap-1 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    {moment.actionLabel} <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
