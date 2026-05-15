'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Users, AlertTriangle, ClipboardList, UserCheck, Archive, BarChart3,
  TrendingDown, Bell, Plus, Check, Trash2, Calendar,
} from 'lucide-react'
import { apiGetDashboard, apiGetOverdueStudents, apiGetStudentRows, apiGetMonthlyStats } from '@/lib/api/admin'
import { apiGetReminders, apiCreateReminder, apiToggleReminder, apiDeleteReminder } from '@/lib/api/reminders'
import { apiGetUsers } from '@/lib/api/users'
import { TableSkeleton, Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  FunnelChart, Funnel, LabelList,
  LineChart, Line, Legend,
} from 'recharts'

const statusVariant = { active: 'success', archived: 'muted', enrolled: 'default' } as const

const CHART_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#94A3B8']
const FUNNEL_COLORS = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE']

export default function AdminDashboardPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [showAddReminder, setShowAddReminder] = useState(false)
  const [reminderText, setReminderText] = useState('')
  const [reminderStudent, setReminderStudent] = useState('')
  const [reminderDate, setReminderDate] = useState('')

  const { data: summary, isLoading: summaryLoading } = useQuery({ queryKey: ['admin-dashboard'], queryFn: apiGetDashboard })
  const { data: overdue } = useQuery({ queryKey: ['admin-overdue'], queryFn: apiGetOverdueStudents })
  const { data: students } = useQuery({ queryKey: ['admin-students'], queryFn: apiGetStudentRows })
  const { data: monthly } = useQuery({ queryKey: ['admin-monthly'], queryFn: apiGetMonthlyStats })
  const { data: reminders = [] } = useQuery({ queryKey: ['reminders'], queryFn: apiGetReminders })
  const { data: allUsers = [] } = useQuery({ queryKey: ['users'], queryFn: () => apiGetUsers() })
  const studentUsers = allUsers.filter((u) => u.role === 'student')

  const addReminderMutation = useMutation({
    mutationFn: () => apiCreateReminder({
      text: reminderText.trim(),
      student_id: reminderStudent || null,
      due_date: reminderDate || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reminders'] })
      toast.success('Напоминание добавлено')
      setShowAddReminder(false)
      setReminderText(''); setReminderStudent(''); setReminderDate('')
    },
    onError: () => toast.error('Ошибка'),
  })

  const toggleMutation = useMutation({
    mutationFn: (id: string) => apiToggleReminder(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reminders'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDeleteReminder(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reminders'] }),
  })

  const metrics = [
    { label: 'Всего студентов', value: summary?.total_students ?? 0, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Активных', value: summary?.active_students ?? 0, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Поступивших', value: summary?.enrolled_students ?? 0, icon: UserCheck, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'В архиве', value: summary?.archived_students ?? 0, icon: Archive, color: 'text-slate-500', bg: 'bg-slate-100' },
    { label: 'Новых заявок', value: summary?.new_leads ?? 0, icon: ClipboardList, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Просрочено', value: summary?.overdue_students ?? 0, icon: AlertTriangle, color: 'text-error', bg: 'bg-red-50' },
  ]

  const pendingReminders = reminders.filter((r) => !r.is_done)
  const doneReminders = reminders.filter((r) => r.is_done)

  const today = new Date().toISOString().slice(0, 10)
  const isOverdue = (r: { due_date: string | null; is_done: boolean }) =>
    r.due_date && r.due_date < today && !r.is_done

  return (
    <div className="max-w-6xl space-y-8">
      <h1 className="text-2xl font-bold text-text-primary">Дашборд</h1>

      {/* Stat cards */}
      {summaryLoading ? (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {metrics.map(({ label, value, icon: Icon, color, bg }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-white rounded-xl p-5 border border-slate-100 shadow-card">
              <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-text-muted mt-1 leading-tight">{label}</p>
              <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, value / Math.max(...metrics.map(m => m.value), 1) * 100)}%`, background: CHART_COLORS[i] }} />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Funnel */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white rounded-xl border border-slate-100 shadow-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingDown className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-text-primary">Воронка конверсии</h2>
          </div>
          {summary?.funnel && summary.funnel.length > 0 ? (
            <div className="space-y-2">
              {summary.funnel.map((step, i) => {
                const max = summary.funnel![0].value || 1
                const pct = Math.round((step.value / max) * 100)
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs text-text-muted mb-1">
                      <span>{step.label}</span>
                      <span className="font-semibold text-text-primary">{step.value}</span>
                    </div>
                    <div className="h-6 w-full bg-slate-100 rounded-lg overflow-hidden">
                      <div className="h-full rounded-lg flex items-center justify-end pr-2 transition-all duration-700"
                        style={{ width: `${Math.max(pct, 4)}%`, background: FUNNEL_COLORS[i % FUNNEL_COLORS.length] }}>
                        {pct > 15 && <span className="text-[10px] text-white font-semibold">{pct}%</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-text-muted">Нет данных</p>
          )}
        </motion.div>

        {/* Monthly chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-white rounded-xl border border-slate-100 shadow-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-text-primary">По месяцам</h2>
          </div>
          {monthly && monthly.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthly}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #f1f5f9', fontSize: 12 }} />
                <Legend />
                <Line type="monotone" dataKey="students" name="Студенты" stroke="#2563EB" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="leads" name="Заявки" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-text-muted">Загрузка...</p>
          )}
        </motion.div>
      </div>

      {/* Reminders */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className="bg-white rounded-xl border border-slate-100 shadow-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-text-primary">
              Напоминания
              {pendingReminders.length > 0 && (
                <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-white font-bold">
                  {pendingReminders.length}
                </span>
              )}
            </h2>
          </div>
          <button onClick={() => setShowAddReminder(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors">
            <Plus className="h-4 w-4" /> Добавить
          </button>
        </div>

        {reminders.length === 0 ? (
          <p className="text-sm text-text-muted">Нет напоминаний</p>
        ) : (
          <div className="space-y-2">
            {pendingReminders.map((r) => (
              <div key={r.id} className={`group flex items-start gap-3 rounded-lg border px-4 py-3 ${isOverdue(r) ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
                <button onClick={() => toggleMutation.mutate(r.id)} className="mt-0.5 flex-shrink-0 text-text-muted hover:text-primary">
                  <Check className="h-4 w-4" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">{r.text}</p>
                  <div className="flex gap-3 mt-1 flex-wrap">
                    {r.student_name && <span className="text-xs text-primary">👤 {r.student_name}</span>}
                    {r.due_date && (
                      <span className={`text-xs flex items-center gap-1 ${isOverdue(r) ? 'text-error font-medium' : 'text-text-muted'}`}>
                        <Calendar className="h-3 w-3" /> {r.due_date}
                        {isOverdue(r) && ' — просрочено!'}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => deleteMutation.mutate(r.id)}
                  className="opacity-0 group-hover:opacity-100 rounded p-1 text-text-muted hover:text-error transition-all">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {doneReminders.length > 0 && (
              <details className="mt-2">
                <summary className="text-xs text-text-muted cursor-pointer hover:text-text-secondary select-none">
                  Выполнено ({doneReminders.length})
                </summary>
                <div className="space-y-2 mt-2">
                  {doneReminders.map((r) => (
                    <div key={r.id} className="group flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 opacity-60">
                      <button onClick={() => toggleMutation.mutate(r.id)} className="mt-0.5 flex-shrink-0 text-emerald-500">
                        <Check className="h-4 w-4" />
                      </button>
                      <p className="flex-1 text-sm text-text-muted line-through">{r.text}</p>
                      <button onClick={() => deleteMutation.mutate(r.id)}
                        className="opacity-0 group-hover:opacity-100 rounded p-1 text-text-muted hover:text-error transition-all">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </motion.div>

      {/* Overdue */}
      {overdue && overdue.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-error" />
            Студенты с просроченными дедлайнами
          </h2>
          <div className="bg-white rounded-xl border border-slate-100 shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>{['ФИО', 'Логин', 'Этап', 'Университет'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-text-muted">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {overdue.map(s => (
                  <tr key={s.id} onClick={() => router.push(`/admin/users`)}
                    className="cursor-pointer hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-text-primary">{s.full_name}</td>
                    <td className="px-4 py-3 text-text-secondary">@{s.login}</td>
                    <td className="px-4 py-3 text-error font-medium">{s.current_stage ?? '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{s.university ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All students */}
      <div>
        <h2 className="text-base font-semibold text-text-primary mb-4">Все студенты</h2>
        {!students ? <TableSkeleton /> : (
          <div className="bg-white rounded-xl border border-slate-100 shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>{['ФИО', 'Логин', 'Статус', 'Этап', 'Дата'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-text-muted">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {students.map(s => (
                  <tr key={s.id} onClick={() => router.push(`/admin/users`)}
                    className="cursor-pointer hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-text-primary">{s.full_name}</td>
                    <td className="px-4 py-3 text-text-secondary">@{s.login}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[s.account_status as keyof typeof statusVariant] ?? 'muted'}>{s.account_status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{s.current_stage ?? '—'}</td>
                    <td className="px-4 py-3 text-text-muted">{formatDate(s.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add reminder modal */}
      <Modal open={showAddReminder} onClose={() => { setShowAddReminder(false); setReminderText(''); setReminderStudent(''); setReminderDate('') }} title="Добавить напоминание">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Текст *</label>
            <textarea rows={3} value={reminderText} onChange={(e) => setReminderText(e.target.value)}
              placeholder="Например: перезвонить через 3 дня..."
              className="w-full rounded-input border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Студент (необязательно)</label>
            <select value={reminderStudent} onChange={(e) => setReminderStudent(e.target.value)}
              className="w-full rounded-input border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">— без студента —</option>
              {studentUsers.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Дата (необязательно)</label>
            <input type="date" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)}
              className="w-full rounded-input border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <Button className="w-full" onClick={() => addReminderMutation.mutate()} loading={addReminderMutation.isPending}
            disabled={!reminderText.trim()}>
            Добавить
          </Button>
        </div>
      </Modal>
    </div>
  )
}
