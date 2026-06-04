'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Download, FileUp } from 'lucide-react'
import { apiGetUser, apiGetContractBlob, apiUploadContract } from '@/lib/api/users'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

export default function ContractPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [studentName, setStudentName] = useState('')
  const [contractUrl, setContractUrl] = useState<string | null>(null)
  const [contractType, setContractType] = useState('')
  const [contractFilename, setContractFilename] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let objectUrl: string | null = null

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const user = await apiGetUser(id)
        setStudentName(user.full_name)

        if (!user.contract_file_id) {
          setError('Договор не загружен')
          return
        }

        const { blob, type, filename } = await apiGetContractBlob(id)
        objectUrl = URL.createObjectURL(blob)
        setContractUrl(objectUrl)
        setContractType(type)
        setContractFilename(filename)
      } catch {
        setError('Не удалось загрузить договор')
      } finally {
        setLoading(false)
      }
    }

    load()
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [id])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await apiUploadContract(id, file)
      const { blob, type, filename } = await apiGetContractBlob(id)
      setContractUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(blob) })
      setContractType(type)
      setContractFilename(filename)
      setError('')
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('Договор обновлён')
    } catch {
      toast.error('Ошибка загрузки')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleDownload = () => {
    if (!contractUrl) return
    const a = document.createElement('a')
    a.href = contractUrl
    a.download = contractFilename || 'contract'
    a.click()
  }

  const isImage = contractType.startsWith('image/')
  const isPdf = contractType === 'application/pdf'

  return (
    <div className="-m-6 flex flex-col" style={{ height: 'calc(100vh - 0px)', minHeight: '100vh' }}>
      {/* Шапка */}
      <div className="flex-shrink-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/users')}
            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Назад
          </button>
          <span className="text-slate-300">|</span>
          <div>
            <p className="text-sm font-semibold text-text-primary">{studentName || '...'}</p>
            <p className="text-xs text-text-muted">Договор</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            className="hidden"
            onChange={handleUpload}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-text-secondary hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <FileUp className="h-4 w-4" />
            {uploading ? 'Загружаем...' : contractUrl ? 'Заменить' : 'Загрузить'}
          </button>
          {contractUrl && (
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              <Download className="h-4 w-4" />
              Скачать
            </button>
          )}
        </div>
      </div>

      {/* Контент */}
      <div className="flex-1 bg-slate-100 overflow-auto">
        {loading && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-text-muted">
            <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm">Загружаем договор...</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-text-muted">
            <p className="text-sm">{error}</p>
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-text-secondary hover:bg-slate-50 transition-colors"
            >
              <FileUp className="h-4 w-4" />
              Загрузить скан
            </button>
          </div>
        )}

        {!loading && contractUrl && isPdf && (
          <iframe
            src={contractUrl}
            className="w-full h-full border-0"
            title="Договор"
          />
        )}

        {!loading && contractUrl && isImage && (
          <div className="flex items-center justify-center min-h-full p-6">
            <img
              src={contractUrl}
              alt="Договор"
              className="max-w-4xl w-full rounded-xl shadow-lg object-contain"
            />
          </div>
        )}

        {!loading && contractUrl && !isPdf && !isImage && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="rounded-xl bg-white border border-slate-200 px-8 py-6 text-center shadow-sm">
              <FileUp className="h-12 w-12 text-text-muted mx-auto mb-3" />
              <p className="font-medium text-text-primary">{contractFilename}</p>
              <p className="text-sm text-text-muted mt-1 mb-4">Предпросмотр для этого формата недоступен</p>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Download className="h-4 w-4" />
                Скачать файл
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
