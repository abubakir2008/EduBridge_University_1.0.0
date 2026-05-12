'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGetLeads, apiUpdateLead } from '@/lib/api/leads'
import { apiCreateUser } from '@/lib/api/users'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { TableSkeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Lead } from '@/types'

const statusVariant = { new: 'warning', contacted: 'default', registered: 'success' } as const
const statusLabels = { new: 'Новая', contacted: 'Связались', registered: 'Зарегистрирован' }

const createSchema = z.object({
  full_name: z.string().min(2),
  phone: z.string().min(7),
  email: z.string().email().optional().or(z.literal('')),
  citizenship: z.string().optional(),
})

type CreateForm = z.infer<typeof createSchema>

export default function LeadsPage() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState('')
  const [createModal, setCreateModal] = useState<Lead | null>(null)
  const [createdCreds, setCreatedCreds] = useState<{ login: string; password: string } | null>(null)

  const { data: leads, isLoading } = useQuery({
    queryKey: ['leads', filter],
    queryFn: () => apiGetLeads(filter ? { status: filter } : undefined),
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiUpdateLead(id, { status: status as Lead['status'] }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  })

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
  })

  const onCreateAccount = async (data: CreateForm) => {
    const creds = await apiCreateUser(data)
    setCreatedCreds(creds)
    if (createModal) {
      await updateStatus.mutateAsync({ id: createModal.id, status: 'registered' })
    }
    reset()
    setCreateModal(null)
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Заявки</h1>
        <div className="flex gap-2">
          {(['', 'new', 'contacted', 'registered'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-button px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === s ? 'bg-primary text-white' : 'bg-white border border-slate-200 text-text-secondary hover:bg-surface'
              }`}
            >
              {s === '' ? 'Все' : statusLabels[s]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : (
        <Card padding="none">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                {['Имя', 'Контакт', 'Страна', 'Статус', 'Дата', 'Действия'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(leads ?? []).map((lead) => (
                <tr key={lead.id} className="hover:bg-surface">
                  <td className="px-4 py-3 font-medium text-text-primary">{lead.name}</td>
                  <td className="px-4 py-3 text-text-secondary">{lead.contact}</td>
                  <td className="px-4 py-3 text-text-secondary">{lead.country_interest ?? '—'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={lead.status}
                      onChange={(e) => updateStatus.mutate({ id: lead.id, status: e.target.value })}
                      className="rounded-input border border-slate-200 px-2 py-1 text-xs focus:outline-none"
                    >
                      <option value="new">Новая</option>
                      <option value="contacted">Связались</option>
                      <option value="registered">Зарегистрирован</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{formatDate(lead.created_at)}</td>
                  <td className="px-4 py-3">
                    {lead.status === 'contacted' && (
                      <Button size="sm" variant="outline" onClick={() => setCreateModal(lead)}>
                        Создать аккаунт
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Create student modal */}
      <Modal open={!!createModal} onClose={() => setCreateModal(null)} title="Создать аккаунт студента">
        <form onSubmit={handleSubmit(onCreateAccount)} className="space-y-4">
          <Input label="ФИО *" defaultValue={createModal?.name} error={errors.full_name?.message} {...register('full_name')} />
          <Input label="Телефон *" defaultValue={createModal?.contact} error={errors.phone?.message} {...register('phone')} />
          <Input label="Email" {...register('email')} />
          <Input label="Гражданство" {...register('citizenship')} />
          <Button type="submit" className="w-full" loading={isSubmitting}>Создать</Button>
        </form>
      </Modal>

      {/* Credentials modal */}
      <Modal open={!!createdCreds} onClose={() => setCreatedCreds(null)} title="Данные для входа">
        {createdCreds && (
          <div className="space-y-4">
            <p className="text-sm text-warning font-medium">⚠️ Сохраните данные — пароль показывается один раз!</p>
            {[
              { label: 'Логин', value: createdCreds.login },
              { label: 'Пароль', value: createdCreds.password },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-xs text-text-muted">{label}</p>
                  <p className="font-mono font-semibold text-text-primary">{value}</p>
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(value); toast.success(`${label} скопирован`) }}
                  className="text-xs text-primary hover:underline"
                >
                  Копировать
                </button>
              </div>
            ))}
            <Button className="w-full" onClick={() => setCreatedCreds(null)}>Закрыть</Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
