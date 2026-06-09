'use client'
import { useQuery } from '@tanstack/react-query'
import { Activity } from 'lucide-react'
import { apiGetActivityLog } from '@/lib/api/activity'
import { Card } from '@/components/ui/card'
import { TableSkeleton } from '@/components/ui/skeleton'

const actionLabels: Record<string, string> = {
  status_changed: 'Статус изменён',
  password_reset: 'Пароль сброшен',
}

const entityLabels: Record<string, string> = {
  user: 'Студент',
  lead: 'Заявка',
}

export default function ActivityPage() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['activity-log'],
    queryFn: apiGetActivityLog,
  })

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Activity className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-text-primary">Журнал действий</h1>
      </div>

      {isLoading ? <TableSkeleton /> : (
        <Card padding="none" className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                {['Дата', 'Администратор', 'Объект', 'Действие', 'Детали'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-text-muted">Журнал пуст</td></tr>
              )}
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('ru', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3 font-medium text-text-primary">{log.admin_name}</td>
                  <td className="px-4 py-3 text-text-secondary">
                    {entityLabels[log.entity_type] ?? log.entity_type}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      log.action === 'password_reset'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}>
                      {actionLabels[log.action] ?? log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{log.detail ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
