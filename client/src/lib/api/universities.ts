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
  client.get<Stage[]>(`/universities/${universityId}/stages`).then((r) => r.data)

export const apiCreateStage = (body: Partial<Stage> & { university_id: string }) =>
  client.post<Stage>(`/universities/${body.university_id}/stages`, body).then((r) => r.data)

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

// Фото университета
export const apiUploadUniversityPhoto = (universityId: string, file: File) => {
  const form = new FormData()
  form.append('file', file)
  return client.post<{ file_id: string }>(
    `/universities/${universityId}/photos`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  ).then((r) => r.data)
}

export const getUniversityPhotoUrl = (universityId: string, fileId: string) =>
  `/api/universities/${universityId}/photos/${fileId}`

export const apiDeleteUniversityPhoto = (universityId: string, fileId: string) =>
  client.delete(`/universities/${universityId}/photos/${fileId}`)

// Видео университета
export const apiUploadUniversityVideo = (
  universityId: string,
  file: File,
  onProgress?: (pct: number) => void,
) => {
  const form = new FormData()
  form.append('file', file)
  return client.post<{ file_id: string }>(
    `/universities/${universityId}/video`,
    form,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total))
      },
    },
  ).then((r) => r.data)
}

export const getUniversityVideoUrl = (universityId: string) =>
  `/api/universities/${universityId}/video`

export const apiDeleteUniversityVideo = (universityId: string) =>
  client.delete(`/universities/${universityId}/video`)
