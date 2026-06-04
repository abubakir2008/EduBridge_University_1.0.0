import client from './client'
import type { FileRecord } from '@/types'

export const apiUploadFile = (file: File, bucket: string) => {
  const form = new FormData()
  form.append('file', file)
  return client
    .post<FileRecord>(`/files/upload?bucket=${bucket}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data)
}

// Backend-proxied content URL. The browser sends the httpOnly auth cookie
// automatically (same-origin), so <img>/<iframe>/<video src> stay authenticated
// and the storage backend (MinIO) is never exposed to the client.
export const getFileContentUrl = (fileId: string) =>
  `/api/files/${fileId}/content`
