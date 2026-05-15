import client from './client'
import type { Lead, LeadStatus } from '@/types'

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

export const apiGetLeads = (params?: { status?: LeadStatus }) =>
  client.get<Lead[]>('/leads', { params }).then((r) => r.data)

export const apiUpdateLead = (id: string, body: { status: LeadStatus }) =>
  client.patch<Lead>(`/leads/${id}`, body).then((r) => r.data)

export const apiDeleteLead = (id: string) =>
  client.delete(`/leads/${id}`)
