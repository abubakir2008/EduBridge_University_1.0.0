'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck } from 'lucide-react'
import { apiGetNotifications, apiMarkRead } from '@/lib/api/notifications'
import { Card } from '@/components/ui/card'
import { TableSkeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const typeLabels: Record<string, string> = {
  account_created: '👤 Аккаунт создан',
  password_reset: '🔑 Пароль сброшен',
  new_stage: '📋 Новый этап',
  deadline_at_risk: '⚠️ Дедлайн приближается',
  deadline_overdue: '🚨 Дедлайн просрочен',
  manual: '📬 Сообщение',
}

export default function NotificationsPage() {
  const qc = useQueryClient()

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: apiGetNotifications,
  })

  const markReadMutation = useMutation({
    mutationFn: apiMarkRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  if (isLoading) return (
    <div className="max-w-2xl">
      <TableSkeleton rows={6} />
    </div>
  )

  if (!notifications || notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-4">
        <Bell className="h-16 w-16 text-text-muted" />
        <h2 className="text-xl font-semibold text-text-primary">Нет уведомлений</h2>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold text-text-primary">Уведомления</h1>

      <div className="space-y-2">
        {notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => !n.is_read && markReadMutation.mutate(n.id)}
            className={cn(
              'flex items-start gap-4 rounded-xl border p-4 transition-colors cursor-pointer',
              n.is_read
                ? 'border-slate-200 bg-white'
                : 'border-primary/30 bg-primary-50'
            )}
          >
            <div className="shrink-0 text-lg">{typeLabels[n.type]?.split(' ')[0] ?? '📬'}</div>
            <div className="flex-1 min-w-0">
              <p
                className={cn('text-sm', n.is_read ? 'text-text-secondary' : 'text-text-primary font-medium')}
                dangerouslySetInnerHTML={{ __html: n.message }}
              />
              <p className="mt-1 text-xs text-text-muted">{formatDate(n.sent_at)}</p>
            </div>
            {n.is_read && <CheckCheck className="h-4 w-4 text-text-muted shrink-0 mt-0.5" />}
          </div>
        ))}
      </div>
    </div>
  )
}
