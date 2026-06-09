'use client'
import { useState, useRef, useEffect } from 'react'
import { Bot, User, Loader2, FileText, Upload, Sparkles, Send, MessageCircle } from 'lucide-react'
import { apiAiChat, apiAiCheckLetter, apiAiCheckDocument, type ChatMessage } from '@/lib/api/ai'
import { toast } from 'sonner'

type Tab = 'chat' | 'letter' | 'document'

function MarkdownMessage({ content }: { content: string }) {
  const renderInline = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**'))
        return <strong key={i}>{part.slice(2, -2)}</strong>
      if (part.startsWith('*') && part.endsWith('*'))
        return <em key={i}>{part.slice(1, -1)}</em>
      if (part.startsWith('`') && part.endsWith('`'))
        return <code key={i} className="bg-slate-200 rounded px-1 text-[12px] font-mono">{part.slice(1, -1)}</code>
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
        <ul key={`ul-${elements.length}`} className="space-y-1 my-1.5 pl-1">
          {listItems.map((item, i) => (
            <li key={i} className="flex gap-2 items-start">
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
        <ol key={`ol-${elements.length}`} className="space-y-1 my-1.5 pl-1">
          {numberedItems.map((item, i) => (
            <li key={i} className="flex gap-2 items-start">
              <span className="text-primary font-semibold flex-shrink-0 min-w-[18px]">{i + 1}.</span>
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
    if (!trimmed) { flushList(); return }

    if (trimmed.startsWith('### ')) {
      flushList()
      elements.push(<p key={i} className="font-semibold text-text-primary mt-3 mb-1">{renderInline(trimmed.slice(4))}</p>)
      return
    }
    if (trimmed.startsWith('## ')) {
      flushList()
      elements.push(<p key={i} className="font-bold text-text-primary mt-3 mb-1 text-base">{renderInline(trimmed.slice(3))}</p>)
      return
    }
    if (/^[-•*]\s/.test(trimmed)) {
      numberedItems.length && flushList()
      listItems.push(trimmed.replace(/^[-•*]\s/, ''))
      return
    }
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

  return <div className="space-y-1">{elements}</div>
}

export default function AiPage() {
  const [tab, setTab] = useState<Tab>('chat')
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Привет! Я ваш AI-ассистент по поступлению в университет.\n\nЯ могу помочь:\n- **Ответить на вопросы** о поступлении и требованиях\n- **Проверить мотивационное письмо** и дать рекомендации\n- **Проанализировать документы** на правильность оформления\n\nЧем могу помочь?' },
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
    if (tab === 'chat') bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, tab])

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
    <div className="max-w-3xl mx-auto h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">AI-Ассистент</h1>
          <p className="text-sm text-text-muted">Groq · Llama 3.3 · Помощник по поступлению</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        {([
          { key: 'chat', label: 'Чат', short: 'Чат', Icon: MessageCircle },
          { key: 'letter', label: 'Проверка письма', short: 'Письмо', Icon: FileText },
          { key: 'document', label: 'Проверка документа', short: 'Документ', Icon: Upload },
        ] as { key: Tab; label: string; short: string; Icon: React.ElementType }[]).map(({ key, label, short, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-2 sm:px-3 rounded-lg text-sm font-medium transition-all ${
              tab === key ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{short}</span>
          </button>
        ))}
      </div>

      {/* Chat tab */}
      {tab === 'chat' && (
        <div className="flex flex-col flex-1 bg-white rounded-2xl border border-slate-200 overflow-hidden" style={{ minHeight: 480 }}>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-white leading-relaxed'
                    : 'bg-slate-50 border border-slate-200 text-text-primary'
                }`}>
                  {msg.role === 'assistant'
                    ? <MarkdownMessage content={msg.content} />
                    : msg.content
                  }
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
                  <span className="text-sm text-text-muted">Думаю...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div className="border-t border-slate-100 p-4 flex gap-3">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendChat())}
              placeholder="Введите сообщение... (Enter — отправить)"
              className="flex-1 text-sm rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={sendChat}
              disabled={!input.trim() || loading}
              className="px-5 h-11 bg-primary rounded-xl flex items-center gap-2 text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Send className="h-4 w-4" />
              Отправить
            </button>
          </div>
        </div>
      )}

      {/* Letter tab */}
      {tab === 'letter' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <p className="text-sm text-text-secondary">Вставьте текст мотивационного письма — AI оценит его по 10-балльной шкале и даст рекомендации.</p>
          <textarea
            value={letterText}
            onChange={e => setLetterText(e.target.value)}
            rows={8}
            placeholder="Вставьте текст мотивационного письма..."
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
          <div className="flex gap-3">
            <input
              value={translateTo}
              onChange={e => setTranslateTo(e.target.value)}
              placeholder="Перевести на язык (необязательно): английский"
              className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={checkLetter}
              disabled={!letterText.trim() || letterLoading}
              className="rounded-xl bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
            >
              {letterLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Проверить
            </button>
          </div>

          {letterResult && (
            <div className="space-y-4 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full ring-4 ${scoreRing(letterResult.score)} flex items-center justify-center`}>
                  <span className={`text-2xl font-bold ${scoreColor(letterResult.score)}`}>{letterResult.score}</span>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-1">Оценка из 10</p>
                  <p className="text-sm text-text-primary font-medium">{letterResult.verdict}</p>
                </div>
              </div>
              {letterResult.strengths.length > 0 && (
                <div className="bg-emerald-50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-emerald-700 mb-2">✓ Сильные стороны</p>
                  {letterResult.strengths.map((s, i) => <p key={i} className="text-sm text-emerald-800">• {s}</p>)}
                </div>
              )}
              {letterResult.weaknesses.length > 0 && (
                <div className="bg-red-50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-red-700 mb-2">✗ Слабые стороны</p>
                  {letterResult.weaknesses.map((s, i) => <p key={i} className="text-sm text-red-800">• {s}</p>)}
                </div>
              )}
              {letterResult.suggestions.length > 0 && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-primary mb-2">→ Рекомендации</p>
                  {letterResult.suggestions.map((s, i) => <p key={i} className="text-sm text-blue-800">• {s}</p>)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Document tab */}
      {tab === 'document' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <p className="text-sm text-text-secondary">Загрузите фото документа — AI проверит правильность заполнения и найдёт ошибки.</p>
          <input ref={docRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={checkDocument} />
          <button
            onClick={() => docRef.current?.click()}
            disabled={docLoading}
            className="w-full rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center hover:border-primary/40 hover:bg-primary/5 transition-colors disabled:opacity-50"
          >
            {docLoading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-text-muted">Анализирую документ...</p>
              </div>
            ) : (
              <>
                <Upload className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-text-muted">Нажмите чтобы загрузить фото документа</p>
                <p className="text-xs text-text-muted mt-1">JPG, PNG, WEBP · до 10 МБ</p>
              </>
            )}
          </button>

          {docResult && (
            <div className="space-y-4 border-t border-slate-100 pt-4">
              <div className={`rounded-xl px-5 py-4 ${docResult.ok ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                <p className={`text-sm font-semibold ${docResult.ok ? 'text-emerald-700' : 'text-red-700'}`}>
                  {docResult.ok ? '✓ Документ в порядке' : '✗ Найдены проблемы'}
                </p>
                <p className="text-sm text-text-secondary mt-1">{docResult.verdict}</p>
              </div>
              {docResult.empty_fields.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-amber-600 mb-2">Пустые поля</p>
                  {docResult.empty_fields.map((f, i) => <p key={i} className="text-sm text-text-secondary">• {f}</p>)}
                </div>
              )}
              {docResult.issues.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-red-600 mb-2">Проблемы</p>
                  {docResult.issues.map((f, i) => <p key={i} className="text-sm text-text-secondary">• {f}</p>)}
                </div>
              )}
              {docResult.recommendations.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-primary mb-2">Рекомендации</p>
                  {docResult.recommendations.map((f, i) => <p key={i} className="text-sm text-text-secondary">• {f}</p>)}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
