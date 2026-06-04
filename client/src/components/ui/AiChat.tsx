'use client'
import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, User, Loader2, FileText, Upload, Sparkles } from 'lucide-react'
import { apiAiChat, apiAiCheckLetter, apiAiCheckDocument, type ChatMessage } from '@/lib/api/ai'
import { toast } from 'sonner'

type Tab = 'chat' | 'letter' | 'document'

export function AiChat() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('chat')
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Привет! Я ваш AI-ассистент по поступлению. Могу помочь с вопросами о текущем этапе, проверить письмо или документы. Чем помочь?' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  // Letter checker
  const [letterText, setLetterText] = useState('')
  const [letterResult, setLetterResult] = useState<null | { score: number; verdict: string; strengths: string[]; weaknesses: string[]; suggestions: string[] }>(null)
  const [letterLoading, setLetterLoading] = useState(false)
  const [translateTo, setTranslateTo] = useState('')

  // Document checker
  const [docResult, setDocResult] = useState<null | { ok: boolean; verdict: string; issues: string[]; empty_fields: string[]; recommendations: string[] }>(null)
  const [docLoading, setDocLoading] = useState(false)
  const docRef = useRef<HTMLInputElement>(null)

  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && tab === 'chat') bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open, tab])

  const sendChat = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: userMsg }]
    setMessages(newMessages)
    setLoading(true)
    try {
      const res = await apiAiChat(userMsg, messages)
      setMessages([...newMessages, { role: 'assistant', content: res.reply }])
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Произошла ошибка. Проверьте подключение и попробуйте снова.' }])
    } finally {
      setLoading(false)
    }
  }

  const checkLetter = async () => {
    if (!letterText.trim()) return
    setLetterLoading(true)
    setLetterResult(null)
    try {
      const res = await apiAiCheckLetter(letterText, translateTo)
      setLetterResult(res)
    } catch {
      toast.error('Ошибка проверки письма')
    } finally {
      setLetterLoading(false)
    }
  }

  const checkDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setDocLoading(true)
    setDocResult(null)
    try {
      const res = await apiAiCheckDocument(file)
      setDocResult(res)
    } catch {
      toast.error('Ошибка проверки документа')
    } finally {
      setDocLoading(false)
      if (docRef.current) docRef.current.value = ''
    }
  }

  const scoreColor = (s: number) => s >= 7 ? 'text-emerald-600' : s >= 5 ? 'text-amber-600' : 'text-red-500'
  const scoreRing = (s: number) => s >= 7 ? 'ring-emerald-400' : s >= 5 ? 'ring-amber-400' : 'ring-red-400'

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary rounded-full shadow-xl flex items-center justify-center text-white hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
      >
        {open ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[360px] sm:w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
          style={{ height: 540 }}
        >
          {/* Header */}
          <div className="bg-primary px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">AI-Ассистент</p>
              <p className="text-[10px] text-white/70">Groq · Llama 3.3</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-100 flex-shrink-0">
            {([
              { key: 'chat', label: 'Чат', Icon: MessageCircle },
              { key: 'letter', label: 'Письмо', Icon: FileText },
              { key: 'document', label: 'Документ', Icon: Upload },
            ] as { key: Tab; label: string; Icon: React.ElementType }[]).map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${tab === key ? 'text-primary border-b-2 border-primary' : 'text-text-muted hover:text-text-primary'}`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* ── Chat tab ── */}
          {tab === 'chat' && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="h-3 w-3 text-primary" />
                      </div>
                    )}
                    <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-slate-100 text-text-primary'}`}>
                      {msg.content}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-2 items-center">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                      <Bot className="h-3 w-3 text-primary" />
                    </div>
                    <div className="bg-slate-100 rounded-2xl px-3 py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
              <div className="border-t border-slate-100 p-3 flex gap-2 flex-shrink-0">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendChat())}
                  placeholder="Введите сообщение..."
                  className="flex-1 text-sm rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  onClick={sendChat}
                  disabled={!input.trim() || loading}
                  className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </>
          )}

          {/* ── Letter tab ── */}
          {tab === 'letter' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <textarea
                value={letterText}
                onChange={e => setLetterText(e.target.value)}
                rows={5}
                placeholder="Вставьте текст мотивационного письма..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
              <div className="flex gap-2">
                <input
                  value={translateTo}
                  onChange={e => setTranslateTo(e.target.value)}
                  placeholder="Перевести на (необяз.): английский"
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  onClick={checkLetter}
                  disabled={!letterText.trim() || letterLoading}
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {letterLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  Проверить
                </button>
              </div>

              {letterResult && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full ring-4 ${scoreRing(letterResult.score)} flex items-center justify-center`}>
                      <span className={`text-lg font-bold ${scoreColor(letterResult.score)}`}>{letterResult.score}</span>
                    </div>
                    <p className="text-sm text-text-primary flex-1">{letterResult.verdict}</p>
                  </div>
                  {letterResult.strengths.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-emerald-600 mb-1">✓ Сильные стороны</p>
                      {letterResult.strengths.map((s, i) => <p key={i} className="text-xs text-text-secondary">• {s}</p>)}
                    </div>
                  )}
                  {letterResult.weaknesses.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-red-500 mb-1">✗ Слабые стороны</p>
                      {letterResult.weaknesses.map((s, i) => <p key={i} className="text-xs text-text-secondary">• {s}</p>)}
                    </div>
                  )}
                  {letterResult.suggestions.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-primary mb-1">→ Рекомендации</p>
                      {letterResult.suggestions.map((s, i) => <p key={i} className="text-xs text-text-secondary">• {s}</p>)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Document tab ── */}
          {tab === 'document' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <input ref={docRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={checkDocument} />
              <button
                onClick={() => docRef.current?.click()}
                disabled={docLoading}
                className="w-full rounded-2xl border-2 border-dashed border-slate-200 py-8 text-center hover:border-primary/40 hover:bg-primary/2 transition-colors disabled:opacity-50"
              >
                {docLoading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-text-muted">Анализирую документ...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-text-muted">Загрузите фото документа</p>
                    <p className="text-xs text-text-muted mt-1">JPG, PNG, WEBP</p>
                  </>
                )}
              </button>

              {docResult && (
                <div className="space-y-3">
                  <div className={`rounded-xl px-4 py-3 ${docResult.ok ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                    <p className={`text-sm font-semibold ${docResult.ok ? 'text-emerald-700' : 'text-red-700'}`}>
                      {docResult.ok ? '✓ Документ в порядке' : '✗ Найдены проблемы'}
                    </p>
                    <p className="text-xs text-text-secondary mt-1">{docResult.verdict}</p>
                  </div>
                  {docResult.empty_fields.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-amber-600 mb-1">Пустые поля</p>
                      {docResult.empty_fields.map((f, i) => <p key={i} className="text-xs text-text-secondary">• {f}</p>)}
                    </div>
                  )}
                  {docResult.issues.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-red-500 mb-1">Проблемы</p>
                      {docResult.issues.map((f, i) => <p key={i} className="text-xs text-text-secondary">• {f}</p>)}
                    </div>
                  )}
                  {docResult.recommendations.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-primary mb-1">Рекомендации</p>
                      {docResult.recommendations.map((f, i) => <p key={i} className="text-xs text-text-secondary">• {f}</p>)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}
