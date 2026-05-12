import client from './client'
import type { FileRecord } from '@/types'

export const apiUploadFile = (file: File, bucket: string) => {
  const form = new FormData()
  form.append('file', file)
  form.append('bucket', bucket)
  return client
    .post<FileRecord>('/files/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data)
}

export const apiGetFileUrl = (fileId: string) =>
  client.get<{ url: string }>(`/files/${fileId}/url`).then((r) => r.data.url)
