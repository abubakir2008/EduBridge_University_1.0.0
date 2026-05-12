'use client'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Users, AlertTriangle, ClipboardList, UserCheck, Archive, BarChart3 } from 'lucide-react'
import { apiGetDashboard, apiGetOverdueStudents, apiGetStudentRows } from '@/lib/api/admin'
import { TableSkeleton, Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

const statusVariant = {
  active: 'success',
  archived: 'muted',
  enrolled: 'default',
} as const

const CHART_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#94A3B8']

export default function AdminDashboardPage() {
  const router = useRouter()
  const { data: summary, isLoading: summaryLoading } = useQuery({ queryKey: ['admin-dashboard'], queryFn: apiGetDashboard })
  const { data: overdue } = useQuery({ queryKey: ['admin-overdue'], queryFn: apiGetOverdueStudents })
  const { data: students } = useQuery({ queryKey: ['admin-students'], queryFn: apiGetStudentRows })

  const metrics = [
    { label: 'Всего студентов', value: summary?.total_students ?? 0, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Активных', value: summary?.active_students ?? 0, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Поступивших', value: summary?.enrolled_students ?? 0, icon: UserCheck, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'В архиве', value: summary?.archived_students ?? 0, icon: Archive, color: 'text-slate-500', bg: 'bg-slate-100' },
    { label: 'Новых заявок', value: summary?.new_leads ?? 0, icon: ClipboardList, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Просрочено', value: summary?.overdue_students ?? 0, icon: AlertTriangle, color: 'text-error', bg: 'bg-red-50' },
  ]

  const chartData = metrics.map(m => ({ name: m.label.split(' ')[0], value: m.value }))

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
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-white rounded-xl p-5 border border-slate-100 shadow-card"
            >
              <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-text-muted mt-1 leading-tight">{label}</p>
              <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, value / Math.max(...metrics.map(m => m.value), 1) * 100)}%`,
                    background: CHART_COLORS[i],
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl border border-slate-100 shadow-card p-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-text-primary">Обзор платформы</h2>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barSize={40}>
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: '10px', border: '1px solid #f1f5f9', fontSize: 13, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
              cursor={{ fill: '#f8fafc' }}
            />
            <Bar dataKey="value" name="Значение" radius={[6, 6, 0, 0]}>
              {chartData.map((_, index) => (
                <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
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
                <tr>
                  {['ФИО', 'Логин', 'Этап', 'Университет'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {overdue.map(s => (
                  <tr key={s.id} onClick={() => router.push(`/admin/users/${s.id}`)}
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
                <tr>
                  {['ФИО', 'Логин', 'Статус', 'Этап', 'Дата'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {students.map(s => (
                  <tr key={s.id} onClick={() => router.push(`/admin/users/${s.id}`)}
                    className="cursor-pointer hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-text-primary">{s.full_name}</td>
                    <td className="px-4 py-3 text-text-secondary">@{s.login}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[s.account_status] ?? 'muted'}>{s.account_status}</Badge>
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
    </div>
  )
}
