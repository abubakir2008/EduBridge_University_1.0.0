import client from './client'
import type { Lead } from '@/types'

export const apiCreateLead = (body: {
  full_name: string
  phone: string
  email?: string
  country_interest?: string
  comment?: string
}) => client.post<Lead>('/leads', {
  name: body.full_name,
  contact: body.email ? `${body.phone} / ${body.email}` : body.phone,
  country_interest: body.country_interest,
  comment: body.comment,
}).then((r) => r.data)

export const apiGetLeads = (params?: Record<string, string>) =>
  client.get<Lead[]>('/leads', { params }).then((r) => r.data)

export const apiUpdateLead = (id: string, body: Partial<Lead>) =>
  client.patch<Lead>(`/leads/${id}`, body).then((r) => r.data)
