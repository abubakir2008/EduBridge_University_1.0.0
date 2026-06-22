import client from './client'

export type DocumentType =
  | 'passport'
  | 'certificate'
  | 'diploma'
  | 'transcript'
  | 'language_certificate'
  | 'motivation_letter'
  | 'recommendation'
  | 'photo'
  | 'medical'
  | 'other'

export type DocumentStatus = 'pending' | 'approved' | 'rejected'

export interface DocumentFile {
  id: string
  original_name: string
  mime_type?: string | null
}

export interface DocumentRecord {
  id: string
  user_id: string
  doc_type: DocumentType
  status: DocumentStatus
  detected_type?: string | null
  ai_verdict?: string | null
  ai_reasons?: string[] | null
  file?: DocumentFile | null
  created_at: string
  updated_at?: string | null
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  passport: 'Паспорт / удостоверение',
  certificate: 'Аттестат',
  diploma: 'Диплом',
  transcript: 'Транскрипт (оценки)',
  language_certificate: 'Языковой сертификат',
  motivation_letter: 'Мотивационное письмо',
  recommendation: 'Рекомендательное письмо',
  photo: 'Фото на документы',
  medical: 'Медицинская справка',
  other: 'Прочее',
}

export const DOCUMENT_TYPE_OPTIONS = (
  Object.keys(DOCUMENT_TYPE_LABELS) as DocumentType[]
).map((value) => ({ value, label: DOCUMENT_TYPE_LABELS[value] }))

export const apiListDocuments = () =>
  client.get<DocumentRecord[]>('/documents').then((r) => r.data)

export const apiUploadDocument = (file: File, docType: DocumentType) => {
  const form = new FormData()
  form.append('file', file)
  form.append('doc_type', docType)
  return client
    .post<DocumentRecord>('/documents', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data)
}

export const apiUpdateDocumentType = (id: string, docType: DocumentType) =>
  client.patch<DocumentRecord>(`/documents/${id}`, { doc_type: docType }).then((r) => r.data)

export const apiReverifyDocument = (id: string) =>
  client.post<DocumentRecord>(`/documents/${id}/reverify`).then((r) => r.data)

export const apiDeleteDocument = (id: string) =>
  client.delete(`/documents/${id}`).then((r) => r.data)

// Backend-proxied content URL (same-origin httpOnly cookie keeps it authenticated).
export const getDocumentContentUrl = (id: string) => `/api/documents/${id}/content`
