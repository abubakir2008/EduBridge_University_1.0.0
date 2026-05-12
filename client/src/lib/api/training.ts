import client from './client'
import type { StudentProgress } from '@/types'

export const apiGetTraining = (userId: string) =>
  client.get<StudentProgress>(`/training/${userId}`).then((r) => r.data)

export const apiStartTraining = (userId: string, universityId: string) =>
  client.post<StudentProgress>(`/training/${userId}/start`, { university_id: universityId }).then((r) => r.data)

export const apiCompleteRequirement = (
  userId: string,
  requirementId: string,
  fileId?: string
) =>
  client
    .patch(`/training/${userId}/requirements/${requirementId}`, { file_id: fileId })
    .then((r) => r.data)

export const apiAdvanceStage = (userId: string) =>
  client.post<StudentProgress>(`/training/${userId}/stage/next`).then((r) => r.data)

export const apiSaveNote = (userId: string, stageId: string, note: string) =>
  client.post(`/training/${userId}/stage/${stageId}/notes`, { note }).then((r) => r.data)
