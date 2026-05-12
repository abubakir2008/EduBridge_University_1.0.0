import client from './client'
import type { University, Stage, Requirement } from '@/types'

export const apiGetUniversities = (params?: Record<string, string>) =>
  client.get<University[]>('/universities', { params }).then((r) => r.data)

export const apiGetUniversity = (id: string) =>
  client.get<University>(`/universities/${id}`).then((r) => r.data)

export const apiMatchUniversities = () =>
  client.get<University[]>('/universities/match').then((r) => r.data)

export const apiCreateUniversity = (body: Partial<University>) =>
  client.post<University>('/universities', body).then((r) => r.data)

export const apiUpdateUniversity = (id: string, body: Partial<University>) =>
  client.patch<University>(`/universities/${id}`, body).then((r) => r.data)

export const apiDeleteUniversity = (id: string) =>
  client.delete(`/universities/${id}`)

export const apiGetStages = (universityId: string) =>
  client.get<Stage[]>(`/stages`, { params: { university_id: universityId } }).then((r) => r.data)

export const apiCreateStage = (body: Partial<Stage>) =>
  client.post<Stage>('/stages', body).then((r) => r.data)

export const apiUpdateStage = (id: string, body: Partial<Stage>) =>
  client.patch<Stage>(`/stages/${id}`, body).then((r) => r.data)

export const apiDeleteStage = (id: string) =>
  client.delete(`/stages/${id}`)

export const apiGetRequirements = (stageId: string) =>
  client.get<Requirement[]>(`/stages/${stageId}/requirements`).then((r) => r.data)

export const apiCreateRequirement = (stageId: string, body: Partial<Requirement>) =>
  client.post<Requirement>(`/stages/${stageId}/requirements`, body).then((r) => r.data)

export const apiDeleteRequirement = (stageId: string, reqId: string) =>
  client.delete(`/stages/${stageId}/requirements/${reqId}`)
