'use client'
import { useState } from 'react'
import { Bot, Send, Download, Sparkles, Loader2, BarChart3 } from 'lucide-react'
import { apiAiAnalytics, apiAiExport } from '@/lib/api/ai'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'

const EXAMPLES = [
  'Сколько студентов на каждом этапе поступления?',
  'Какой средний GPA и IELTS у студентов?',
  'Сколько студентов с просроченными дедлайнами?',
  'Какие университеты самые популярные?',
  'Сколько новых студентов за последний месяц?',
  'Сравни количество активных и поступивших студентов',
]

export default function AdminAiPage() {
  const [query, setQuery] = useState('')
  const [answer, setAnswer] = useState('')
  const [canExport, setCanExport] = useState(false)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  const ask = async (q?: string) => {
    const question = (q ?? query).trim()
    if (!question) return
    if (q) setQuery(q)
    setLoading(true)
    setAnswer('')
    setCanExport(false)
    try {
      const res = await apiAiAnalytics(question)
      setAnswer(res.answer)
      setCanExport(res.can_export)
    } catch {
      setAnswer('Произошла ошибка. Попробуйте снова.')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await apiAiExport()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'students_export.xlsx'
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Файл скачан')
    } catch {
      toast.error('Ошибка экспорта')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
          <Bot className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">AI-Аналитика</h1>
          <p className="text-sm text-text-muted">Задай вопрос — AI соберёт данные из базы и ответит</p>
        </div>
        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={handleExport} loading={exporting}>
            <Download className="h-4 w-4" /> Экспорт всех студентов в Excel
          </Button>
        </div>
      </div>

      {/* Query */}
      <Card>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <BarChart3 className="absolute left-3 top-3 h-4 w-4 text-text-muted" />
            <textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), ask())}
              placeholder="Например: Сколько студентов на этапе 2 дольше 30 дней?"
              rows={3}
              className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>
          <Button onClick={() => ask()} loading={loading} className="self-end">
            <Send className="h-4 w-4" />
            Спросить
          </Button>
        </div>

        {/* Examples */}
        <div className="mt-4">
          <p className="text-xs text-text-muted mb-2 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" /> Примеры запросов
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map(q => (
              <button
                key={q}
                onClick={() => ask(q)}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-text-secondary hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Response */}
      {(loading || answer) && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-text-primary">Ответ AI</span>
            </div>
            {canExport && !loading && (
              <Button size="sm" variant="outline" onClick={handleExport} loading={exporting}>
                <Download className="h-4 w-4" /> Скачать Excel
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center gap-3 text-text-muted py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm">Анализирую данные из базы...</span>
            </div>
          ) : (
            <div className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed bg-slate-50 rounded-xl p-4">
              {answer}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
