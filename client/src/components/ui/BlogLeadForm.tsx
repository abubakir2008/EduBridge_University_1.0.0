'use client'
import { useState } from 'react'
import { Send, CheckCircle2, Loader2 } from 'lucide-react'
import { apiCreateLead } from '@/lib/api/leads'

const PREFIX = '+996'

/**
 * Форма заявки в конце статьи блога. Отправляет лид прямо с /blog
 * (эндпоинт /api/leads, публичный), без перехода на лендинг.
 */
export function BlogLeadForm({ source }: { source?: string }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState(PREFIX)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const onPhone = (v: string) => {
    let raw = v
    if (!raw.startsWith(PREFIX)) raw = PREFIX
    const digits = raw.slice(PREFIX.length).replace(/\D/g, '').slice(0, 9)
    setPhone(PREFIX + digits)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (name.trim().length < 2) { setError('Введите имя'); return }
    if (!/^\+996\d{9}$/.test(phone)) { setError('Введите телефон в формате +996 и 9 цифр'); return }
    setSubmitting(true)
    try {
      await apiCreateLead({
        full_name: name.trim(),
        phone,
        comment: [comment.trim(), source ? `Заявка из блога: ${source}` : ''].filter(Boolean).join(' · ') || undefined,
        country_interest: 'Из блога',
      })
      setDone(true)
    } catch {
      setError('Не удалось отправить. Попробуйте позже.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="gradient-brand mt-12 rounded-3xl p-8 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="relative">
        {done ? (
          <div className="text-center py-6">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-extrabold">Заявка отправлена!</h2>
            <p className="mt-2 text-white/70">Мы свяжемся с вами в ближайшее время и бесплатно подберём университет.</p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-extrabold">Не знаете, в какой вуз поступить?</h2>
            <p className="mt-2 text-white/70 max-w-lg">
              Оставьте заявку — бесплатно подберём университет под ваш балл и бюджет и проведём за руку до зачисления.
            </p>
            <form onSubmit={submit} className="mt-6 grid gap-3 sm:grid-cols-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ваше имя"
                maxLength={60}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 outline-none focus:border-white/50 focus:bg-white/15"
              />
              <input
                value={phone}
                onChange={(e) => onPhone(e.target.value)}
                inputMode="tel"
                placeholder="+996 700 123456"
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 outline-none focus:border-white/50 focus:bg-white/15"
              />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                placeholder="Комментарий (необязательно): страна, специальность, вопрос…"
                maxLength={1000}
                className="sm:col-span-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 outline-none focus:border-white/50 focus:bg-white/15"
              />
              {error && <p className="sm:col-span-2 text-sm font-medium text-amber-200">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-3.5 font-bold text-navy transition-all hover:bg-slate-100 disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {submitting ? 'Отправляем…' : 'Оставить заявку'}
              </button>
              <p className="sm:col-span-2 text-center text-xs text-white/50">
                Нажимая кнопку, вы соглашаетесь на обработку персональных данных
              </p>
            </form>
          </>
        )}
      </div>
    </section>
  )
}
