'use client'
import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, User, Loader2, FileText, Upload, Sparkles } from 'lucide-react'
import { apiAiChat, apiAiCheckLetter, apiAiCheckDocument, type ChatMessage } from '@/lib/api/ai'
import { toast } from 'sonner'

type Tab = 'chat' | 'letter' | 'document'

// Simple markdown renderer: bold, italic, bullets, numbered lists, headers
function MarkdownMessage({ content }: { content: string }) {
  const renderInline = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**'))
        return <strong key={i}>{part.slice(2, -2)}</strong>
      if (part.startsWith('*') && part.endsWith('*'))
        return <em key={i}>{part.slice(1, -1)}</em>
      if (part.startsWith('`') && part.endsWith('`'))
        return <code key={i} className="bg-slate-200 rounded px-1 text-[11px] font-mono">{part.slice(1, -1)}</code>
      return part
    })
  }

  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let listItems: string[] = []
  let numberedItems: string[] = []

  const flushList = () => {
    if (listItems.length) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="space-y-0.5 my-1 pl-1">
          {listItems.map((item, i) => (
            <li key={i} className="flex gap-1.5 items-start">
              <span className="text-primary mt-0.5 flex-shrink-0">•</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      )
      listItems = []
    }
    if (numberedItems.length) {
      elements.push(
        <ol key={`ol-${elements.length}`} className="space-y-0.5 my-1 pl-1">
          {numberedItems.map((item, i) => (
            <li key={i} className="flex gap-1.5 items-start">
              <span className="text-primary font-medium flex-shrink-0">{i + 1}.</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      )
      numberedItems = []
    }
  }

  lines.forEach((line, i) => {
    const trimmed = line.trim()

    if (!trimmed) {
      flushList()
      return
    }

    // Headers
    if (trimmed.startsWith('### ')) {
      flushList()
      elements.push(<p key={i} className="font-semibold text-text-primary mt-2 mb-0.5">{renderInline(trimmed.slice(4))}</p>)
      return
    }
    if (trimmed.startsWith('## ')) {
      flushList()
      elements.push(<p key={i} className="font-bold text-text-primary mt-2 mb-0.5">{renderInline(trimmed.slice(3))}</p>)
      return
    }

    // Bullet list
    if (/^[-•*]\s/.test(trimmed)) {
      numberedItems.length && flushList()
      listItems.push(trimmed.replace(/^[-•*]\s/, ''))
      return
    }

    // Numbered list
    const numMatch = trimmed.match(/^(\d+)\.\s(.+)/)
    if (numMatch) {
      listItems.length && flushList()
      numberedItems.push(numMatch[2])
      return
    }

    flushList()
    elements.push(<p key={i} className="leading-relaxed">{renderInline(trimmed)}</p>)
  })

  flushList()

  return <div className="space-y-1 text-sm">{elements}</div>
}

export function AiChat({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('chat')
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Привет! Я ваш AI-ассистент по поступлению. Могу помочь с вопросами о текущем этапе, проверить письмо или документы. Чем помочь?' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const [letterText, setLetterText] = useState('')
  const [letterResult, setLetterResult] = useState<null | { score: number; verdict: string; strengths: string[]; weaknesses: string[]; suggestions: string[] }>(null)
  const [letterLoading, setLetterLoading] = useState(false)
  const [translateTo, setTranslateTo] = useState('')

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

  if (!open) return null

  return (
    <>
      {/* Desktop: panel docked next to sidebar */}
      <div className="hidden md:flex fixed left-64 top-0 bottom-0 w-[380px] z-40 flex-col bg-white border-r border-slate-200 shadow-xl">
        {/* Header */}
        <div className="bg-primary px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">AI-Ассистент</p>
            <p className="text-[10px] text-white/70">Groq · Llama 3.3</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
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

        {/* Chat tab */}
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
                  <div className={`max-w-[82%] rounded-2xl px-3 py-2 ${msg.role === 'user' ? 'bg-primary text-white text-sm leading-relaxed' : 'bg-slate-100 text-text-primary'}`}>
                    {msg.role === 'assistant'
                      ? <MarkdownMessage content={msg.content} />
                      : msg.content
                    }
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

        {/* Letter tab */}
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

        {/* Document tab */}
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

      {/* Mobile: floating panel (unchanged) */}
      <div className="md:hidden fixed bottom-24 right-4 left-4 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden" style={{ height: 480 }}>
        <div className="bg-primary px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">AI-Ассистент</p>
            <p className="text-[10px] text-white/70">Groq · Llama 3.3</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

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
                  <div className={`max-w-[82%] rounded-2xl px-3 py-2 ${msg.role === 'user' ? 'bg-primary text-white text-sm leading-relaxed' : 'bg-slate-100 text-text-primary'}`}>
                    {msg.role === 'assistant'
                      ? <MarkdownMessage content={msg.content} />
                      : msg.content
                    }
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
      </div>
    </>
  )
}
