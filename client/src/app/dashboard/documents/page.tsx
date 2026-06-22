'use client'
import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  FileText, Upload, Trash2, RefreshCw, ExternalLink,
  CheckCircle2, XCircle, Clock, AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  apiListDocuments, apiUploadDocument, apiDeleteDocument,
  apiReverifyDocument, apiUpdateDocumentType, getDocumentContentUrl,
  DOCUMENT_TYPE_LABELS, DOCUMENT_TYPE_OPTIONS,
  type DocumentRecord, type DocumentType, type DocumentStatus,
} from '@/lib/api/documents'

const STATUS_META: Record<DocumentStatus, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  approved: { label: 'Принят', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle2 },
  rejected: { label: 'Отклонён', cls: 'bg-red-50 text-red-700 border-red-200', Icon: XCircle },
  pending: { label: 'На проверке', cls: 'bg-amber-50 text-amber-700 border-amber-200', Icon: Clock },
}

function DocCard({ doc }: { doc: DocumentRecord }) {
  const qc = useQueryClient()
  const meta = STATUS_META[doc.status] ?? STATUS_META.pending
  const StatusIcon = meta.Icon

  const invalidate = () => qc.invalidateQueries({ queryKey: ['documents'] })

  const reverify = useMutation({
    mutationFn: () => apiReverifyDocument(doc.id),
    onSuccess: () => { invalidate(); toast.success('Перепроверено') },
    onError: () => toast.error('Не удалось перепроверить'),
  })
  const changeType = useMutation({
    mutationFn: (t: DocumentType) => apiUpdateDocumentType(doc.id, t),
    onSuccess: () => { invalidate(); toast.success('Тип обновлён, документ перепроверен') },
    onError: () => toast.error('Не удалось обновить тип'),
  })
  const remove = useMutation({
    mutationFn: () => apiDeleteDocument(doc.id),
    onSuccess: () => { invalidate(); toast.success('Документ удалён') },
    onError: () => toast.error('Не удалось удалить'),
  })

  const busy = reverify.isPending || changeType.isPending || remove.isPending

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-text-primary">{DOCUMENT_TYPE_LABELS[doc.doc_type]}</h3>
            <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold', meta.cls)}>
              <StatusIcon className="h-3 w-3" /> {meta.label}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-text-muted">{doc.file?.original_name}</p>

          {doc.detected_type && (
            <p className="mt-2 text-xs text-text-secondary">
              <span className="text-text-muted">ИИ распознал:</span> {doc.detected_type}
            </p>
          )}
          {doc.ai_verdict && (
            <p className="mt-1 text-sm text-text-primary">{doc.ai_verdict}</p>
          )}

          {doc.ai_reasons && doc.ai_reasons.length > 0 && (
            <ul className="mt-2 space-y-1">
              {doc.ai_reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-text-secondary">
                  <AlertTriangle className={cn('mt-0.5 h-3 w-3 flex-shrink-0',
                    doc.status === 'approved' ? 'text-emerald-500' : 'text-amber-500')} />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Actions */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <a
              href={getDocumentContentUrl(doc.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border-2 border-primary/30 px-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
            >
              <ExternalLink className="h-4 w-4" /> Открыть
            </a>
            <Button size="sm" variant="ghost" loading={reverify.isPending} disabled={busy}
              onClick={() => reverify.mutate()}>
              <RefreshCw className="h-4 w-4" /> Перепроверить
            </Button>
            <select
              value={doc.doc_type}
              disabled={busy}
              onChange={(e) => changeType.mutate(e.target.value as DocumentType)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-sm text-text-secondary focus:border-primary focus:outline-none"
              title="Сменить заявленный тип"
            >
              {DOCUMENT_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <Button size="sm" variant="ghost" className="ml-auto text-error hover:bg-red-50"
              loading={remove.isPending} disabled={busy}
              onClick={() => remove.mutate()}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DocumentsPage() {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [docType, setDocType] = useState<DocumentType>('passport')

  const { data: docs, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: apiListDocuments,
  })

  const upload = useMutation({
    mutationFn: (file: File) => apiUploadDocument(file, docType),
    onSuccess: (doc) => {
      qc.invalidateQueries({ queryKey: ['documents'] })
      if (doc.status === 'approved') toast.success('Документ принят ✅')
      else if (doc.status === 'rejected') toast.error('Документ отклонён — смотри причины')
      else toast.info('Документ загружен, идёт проверка')
    },
    onError: () => toast.error('Ошибка загрузки документа'),
  })

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) upload.mutate(file)
    e.target.value = ''
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-1 flex items-center gap-2">
        <FileText className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-text-primary">Мои документы</h1>
      </div>
      <p className="mb-6 text-sm text-text-secondary">
        Укажи тип документа и загрузи файл — ИИ сверит содержимое с заявленным типом
        и скажет, всё ли в порядке, либо назовёт причины.
      </p>

      {/* Upload */}
      <div className="mb-6 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-5">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-text-secondary">
          Тип документа
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value as DocumentType)}
            className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-primary focus:outline-none"
          >
            {DOCUMENT_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept="image/*,application/pdf,.docx,.txt"
            onChange={onPick}
          />
          <Button loading={upload.isPending} onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" /> Загрузить
          </Button>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <p className="text-sm text-text-muted">Загрузка…</p>
      ) : !docs || docs.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center">
          <FileText className="mx-auto mb-2 h-8 w-8 text-text-muted/40" />
          <p className="text-sm text-text-secondary">Документов пока нет. Загрузи первый выше.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map((doc) => <DocCard key={doc.id} doc={doc} />)}
        </div>
      )}
    </div>
  )
}
