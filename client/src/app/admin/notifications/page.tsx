'use client'
import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Send } from 'lucide-react'
import { StudentSearch } from '@/components/ui/StudentSearch'
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

const TEMPLATES = [
  { label: 'Напоминание о дедлайне', text: 'Напоминаем, что дедлайн по текущему этапу приближается. Пожалуйста, выполните все требования вовремя.' },
  { label: 'Документы готовы', text: 'Ваши документы готовы к отправке. Пожалуйста, свяжитесь с нами для получения инструкций.' },
  { label: 'Новый этап', text: 'Поздравляем! Вы перешли на следующий этап поступления. Ознакомьтесь с новыми требованиями в личном кабинете.' },
  { label: 'Позвонить', text: 'Пожалуйста, свяжитесь с вашим менеджером по телефону или в мессенджере — нам нужно уточнить несколько деталей.' },
  { label: 'Одобрение', text: 'Отличная новость! Ваша заявка одобрена. Ожидайте дальнейших инструкций от нашего менеджера.' },
]


export default function AdminNotificationsPage() {
  const [showSend, setShowSend] = useState(false)
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: apiGetAllNotifications,
  })
  const { data: usersPage } = useQuery({ queryKey: ['users', '', '', 1], queryFn: () => apiGetUsers({ per_page: 200 }) })
  const users = usersPage?.items
  const userMap = new Map(users?.map(u => [u.id, u]))

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch } = useForm<FormData>({
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
                  <td className="px-4 py-3 text-text-secondary">
                    {userMap.get(n.user_id)
                      ? <span>@{userMap.get(n.user_id)!.login}</span>
                      : <span className="text-text-muted">{n.user_id.slice(0, 8)}…</span>}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{typeLabels[n.type] ?? n.type}</td>
                  <td className="px-4 py-3 text-text-primary max-w-xs truncate" dangerouslySetInnerHTML={{ __html: n.message }} />
                  <td className="px-4 py-3 text-text-muted">{n.channel}</td>
                  <td className="px-4 py-3 text-text-muted">{formatDate(n.sent_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={showSend} onClose={() => { setShowSend(false); reset() }} title="Отправить уведомление" maxWidth="max-w-lg">
        <form onSubmit={handleSubmit((d) => sendMutation.mutate(d))} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Студент *</label>
            <StudentSearch
              value={watch('user_id') ?? ''}
              onChange={(id) => setValue('user_id', id, { shouldValidate: true })}
              users={(users ?? []).filter(u => u.role === 'student')}
            />
            {errors.user_id && <p className="text-xs text-error">{errors.user_id.message}</p>}
          </div>

          {/* Templates */}
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Шаблоны</p>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((t) => (
                <button key={t.label} type="button"
                  onClick={() => setValue('message', t.text, { shouldValidate: true })}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${watch('message') === t.text ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 bg-white text-text-secondary hover:border-primary/40 hover:text-primary'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Сообщение *</label>
            <textarea rows={4} {...register('message')} placeholder="Текст уведомления..."
              className="w-full rounded-input border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
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
