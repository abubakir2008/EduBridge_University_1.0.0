'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGetLeads, apiUpdateLead, apiDeleteLead } from '@/lib/api/leads'
import { apiCreateUser } from '@/lib/api/users'
import { apiGetLeadHistory } from '@/lib/api/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { TableSkeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { RefreshCw, Trash2, UserPlus, MessageCircle, History } from 'lucide-react'
import type { Lead } from '@/types'

const statusVariant = {
  new: 'warning',
  contacted: 'default',
  registered: 'success',
  rejected: 'danger',
} as const

const statusLabels: Record<string, string> = {
  new: 'Новая',
  contacted: 'Связались',
  registered: 'Одобрена',
  rejected: 'Отклонена',
}

function whatsappLink(contact: string) {
  const phone = contact.split('/')[0].trim()
  const digits = phone.replace(/\D/g, '')
  return digits ? `https://wa.me/${digits}` : null
}

// ─── History modal ───────────────────────────────────────────────────────────
function LeadHistoryModal({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['lead-history', lead.id],
    queryFn: () => apiGetLeadHistory(lead.id),
  })

  return (
    <Modal open onClose={onClose} title={`История: ${lead.name}`} maxWidth="max-w-md">
      <div className="space-y-3">
        <div className="mb-1">
          <p className="text-sm text-text-secondary">{lead.contact}</p>
        </div>
        {isLoading ? (
          <p className="text-sm text-text-muted">Загрузка...</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-text-muted">История пуста — статус не изменялся</p>
        ) : (
          <ol className="relative border-l border-slate-200 ml-3 space-y-4">
            {history.map((h, i) => (
              <li key={h.id} className="ml-4">
                <span className={`absolute -left-1.5 mt-1 h-3 w-3 rounded-full border-2 border-white ${i === history.length - 1 ? 'bg-primary' : 'bg-slate-300'}`} />
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={statusVariant[h.status as keyof typeof statusVariant] ?? 'muted'}>
                    {statusLabels[h.status] ?? h.status}
                  </Badge>
                  <span className="text-xs text-text-muted">
                    {new Date(h.created_at).toLocaleString('ru', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </Modal>
  )
}

function LeadsTable({
  leads, showActions, creatingId, onApprove, onReject, onDelete, onHistory,
}: {
  leads: Lead[]
  showActions: boolean
  creatingId: string | null
  onApprove: (lead: Lead) => void
  onReject: (id: string) => void
  onDelete: (id: string) => void
  onHistory: (lead: Lead) => void
}) {
  if (leads.length === 0) {
    return <p className="py-6 text-center text-sm text-text-muted">Нет заявок</p>
  }

  return (
    <div className="overflow-x-auto">
    <table className="w-full min-w-[760px] text-sm">
      <thead className="border-b border-slate-100">
        <tr>
          {['Имя', 'Телефон / Email', 'Интерес', 'Комментарий', 'Статус', 'Дата', 'Действия'].map((h) => (
            <th key={h} className="px-4 py-3 text-left text-xs font-medium text-text-muted">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {leads.map((lead) => {
          const waLink = whatsappLink(lead.contact)
          const parts = lead.contact.split('/')
          const phone = parts[0].trim()
          const email = parts[1]?.trim()
          return (
            <tr key={lead.id} className="hover:bg-slate-50/50">
              <td className="px-4 py-3 font-medium text-text-primary">{lead.name}</td>
              <td className="px-4 py-3 text-text-secondary">
                <div className="flex items-start gap-1.5">
                  <div>
                    <div className="flex items-center gap-1">
                      <span>{phone}</span>
                      {waLink && (
                        <a href={waLink} target="_blank" rel="noopener noreferrer"
                          className="rounded-full bg-green-50 p-0.5 text-green-600 hover:bg-green-100 transition-colors flex-shrink-0"
                          title="WhatsApp" onClick={(e) => e.stopPropagation()}>
                          <MessageCircle className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                    {email && <div className="text-xs text-text-muted">{email}</div>}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-text-secondary">{lead.country_interest ?? '—'}</td>
              <td className="px-4 py-3 text-text-secondary max-w-[180px] truncate">{lead.comment ?? '—'}</td>
              <td className="px-4 py-3">
                <Badge variant={statusVariant[lead.status]}>{statusLabels[lead.status]}</Badge>
              </td>
              <td className="px-4 py-3 text-text-muted">{formatDate(lead.created_at)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {showActions && (
                    <>
                      <button onClick={() => onApprove(lead)} disabled={creatingId === lead.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-wait">
                        <UserPlus className="h-3 w-3" />
                        {creatingId === lead.id ? 'Создаём...' : 'Добавить'}
                      </button>
                      <button onClick={() => onReject(lead.id)} disabled={creatingId === lead.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50">
                        Отклонить
                      </button>
                    </>
                  )}
                  <button onClick={() => onHistory(lead)} title="История"
                    className="rounded-lg p-1.5 text-text-muted hover:bg-slate-100 hover:text-primary transition-colors">
                    <History className="h-4 w-4" />
                  </button>
                  <button onClick={() => onDelete(lead.id)}
                    className="rounded-lg p-1.5 text-text-muted hover:bg-slate-100 hover:text-error transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
    </div>
  )
}

export default function LeadsPage() {
  const qc = useQueryClient()
  const [creatingId, setCreatingId] = useState<string | null>(null)
  const [createdCreds, setCreatedCreds] = useState<{ login: string; password: string } | null>(null)
  const [historyLead, setHistoryLead] = useState<Lead | null>(null)

  const { data: newLeadsPage, isLoading: loadingNew, refetch: refetchNew } = useQuery({
    queryKey: ['leads', 'new'],
    queryFn: () => apiGetLeads({ status: 'new', per_page: 100 }),
  })
  const { data: historyPage, isLoading: loadingHistory, refetch: refetchHistory } = useQuery({
    queryKey: ['leads', 'history'],
    queryFn: () => apiGetLeads({ per_page: 100 }),
  })

  const isLoading = loadingNew || loadingHistory
  const newLeads = newLeadsPage?.items ?? []
  const historyLeads = (historyPage?.items ?? []).filter((l) => l.status !== 'new')
  const refetch = () => { refetchNew(); refetchHistory() }

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Lead['status'] }) => apiUpdateLead(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  })

  const deleteLead = useMutation({
    mutationFn: (id: string) => apiDeleteLead(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leads'] }); toast.success('Заявка удалена') },
  })

  const handleApprove = async (lead: Lead) => {
    setCreatingId(lead.id)
    try {
      const parts = lead.contact.split('/')
      const phone = parts[0].trim()
      // В contact email может идти второй частью («телефон / email») — передаём, если он есть
      const email = parts[1]?.trim() || undefined
      const creds = await apiCreateUser({ full_name: lead.name, phone, email })
      await updateStatus.mutateAsync({ id: lead.id, status: 'registered' })
      setCreatedCreds(creds)
    } catch (e: unknown) {
      const detail =
        (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast.error(typeof detail === 'string' ? detail : 'Ошибка при создании аккаунта')
    } finally {
      setCreatingId(null)
    }
  }

  const handleReject = (id: string) => updateStatus.mutate({ id, status: 'rejected' })

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Входящие заявки</h1>
        <button onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors">
          <RefreshCw className="h-4 w-4" /> Обновить
        </button>
      </div>

      {isLoading ? <TableSkeleton /> : (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
              {newLeads.length > 0 && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-600">
                  {newLeads.length}
                </span>
              )}
              <h2 className="font-semibold text-text-primary">Новые заявки</h2>
            </div>
            <LeadsTable leads={newLeads} showActions creatingId={creatingId}
              onApprove={handleApprove} onReject={handleReject}
              onDelete={(id) => deleteLead.mutate(id)} onHistory={setHistoryLead} />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-text-primary">История</h2>
            </div>
            <LeadsTable leads={historyLeads} showActions={false} creatingId={null}
              onApprove={handleApprove} onReject={handleReject}
              onDelete={(id) => deleteLead.mutate(id)} onHistory={setHistoryLead} />
          </div>
        </>
      )}

      {historyLead && <LeadHistoryModal lead={historyLead} onClose={() => setHistoryLead(null)} />}

      <Modal open={!!createdCreds} onClose={() => setCreatedCreds(null)} title="Данные для входа">
        {createdCreds && (
          <div className="space-y-4">
            <p className="text-sm text-warning font-medium">Сохраните данные — пароль показывается один раз!</p>
            {[{ label: 'Логин', value: createdCreds.login }, { label: 'Пароль', value: createdCreds.password }].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-xs text-text-muted">{label}</p>
                  <p className="font-mono font-semibold text-text-primary">{value}</p>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(value); toast.success(`${label} скопирован`) }}
                  className="text-xs text-primary hover:underline">Копировать</button>
              </div>
            ))}
            <Button className="w-full" onClick={() => setCreatedCreds(null)}>Закрыть</Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
