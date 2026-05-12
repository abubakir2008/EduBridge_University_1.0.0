'use client'
import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Send } from 'lucide-react'
import { apiGetAllNotifications, apiSendNotification } from '@/lib/api/notifications'
import { apiGetUsers } from '@/lib/api/users'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { TableSkeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  user_id: z.string().min(1, 'Выберите студента'),
  message: z.string().min(3, 'Введите сообщение'),
})
type FormData = z.infer<typeof schema>

const typeLabels: Record<string, string> = {
  account_created: 'Аккаунт создан',
  password_reset: 'Пароль сброшен',
  new_stage: 'Новый этап',
  deadline_at_risk: 'Дедлайн',
  deadline_overdue: 'Просрочено',
  manual: 'Вручную',
}

export default function AdminNotificationsPage() {
  const [showSend, setShowSend] = useState(false)
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: apiGetAllNotifications,
  })
  const { data: users } = useQuery({ queryKey: ['users'], queryFn: () => apiGetUsers() })

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const sendMutation = useMutation({
    mutationFn: (data: FormData) => apiSendNotification({ user_id: data.user_id, message: data.message }),
    onSuccess: () => { toast.success('Уведомление отправлено'); setShowSend(false); reset() },
    onError: () => toast.error('Ошибка отправки'),
  })

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Уведомления</h1>
        <Button size="sm" onClick={() => setShowSend(true)}>
          <Send className="h-4 w-4" /> Отправить
        </Button>
      </div>

      {isLoading ? <TableSkeleton /> : (
        <Card padding="none">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                {['Кому', 'Тип', 'Сообщение', 'Канал', 'Дата'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(notifications ?? []).map((n) => (
                <tr key={n.id} className="hover:bg-surface">
                  <td className="px-4 py-3 text-text-secondary">{n.user_id.slice(0, 8)}...</td>
                  <td className="px-4 py-3 text-text-secondary">{typeLabels[n.type] ?? n.type}</td>
                  <td className="px-4 py-3 text-text-primary max-w-xs truncate">{n.message}</td>
                  <td className="px-4 py-3 text-text-muted">{n.channel}</td>
                  <td className="px-4 py-3 text-text-muted">{formatDate(n.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={showSend} onClose={() => setShowSend(false)} title="Отправить уведомление">
        <form onSubmit={handleSubmit((d) => sendMutation.mutate(d))} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Студент *</label>
            <select
              {...register('user_id')}
              className="h-10 rounded-input border border-slate-200 px-3 text-sm focus:outline-none focus:border-primary"
            >
              <option value="">— выбрать студента —</option>
              {(users ?? []).filter(u => u.role === 'student').map((u) => (
                <option key={u.id} value={u.id}>{u.full_name} (@{u.login})</option>
              ))}
            </select>
            {errors.user_id && <p className="text-xs text-error">{errors.user_id.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Сообщение *</label>
            <textarea
              rows={4}
              {...register('message')}
              placeholder="Текст уведомления..."
              className="w-full rounded-input border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {errors.message && <p className="text-xs text-error">{errors.message.message}</p>}
          </div>

          <Button type="submit" className="w-full" loading={isSubmitting || sendMutation.isPending}>
            Отправить
          </Button>
        </form>
      </Modal>
    </div>
  )
}
