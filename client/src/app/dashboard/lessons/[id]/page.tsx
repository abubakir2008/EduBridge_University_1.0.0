'use client'
import { use, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, FileText, Video, BookOpen, Play, Eye, X, Clock, AlertCircle,
} from 'lucide-react'
import { apiGetLesson } from '@/lib/api/lessons'
import { apiGetFileUrl } from '@/lib/api/files'
import { Skeleton } from '@/components/ui/skeleton'

const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

function readingMinutes(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ')
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

function renderContent(content: string) {
  return content.split('\n').map((line, index) => {
    if (line.startsWith('## '))
      return <h2 key={index} className="text-xl font-bold text-text-primary mt-6 mb-3">{line.replace('## ', '')}</h2>
    if (line.startsWith('### '))
      return <h3 key={index} className="text-lg font-semibold text-text-primary mt-4 mb-2">{line.replace('### ', '')}</h3>
    const m1 = line.match(/^(\d+)\.\s\*\*(.+?)\*\*\s*-\s*(.+)/)
    if (m1) return (
      <div key={index} className="flex gap-2 py-1.5">
        <span className="text-primary font-medium min-w-[24px]">{m1[1]}.</span>
        <div><span className="text-primary font-semibold">{m1[2]}</span><span className="text-text-secondary"> - {m1[3]}</span></div>
      </div>
    )
    const m2 = line.match(/^\*\*(.+?)\*\*\s*-\s*(.+)/)
    if (m2) return (
      <div key={index} className="py-1.5 pl-2 border-l-2 border-primary/30">
        <span className="text-primary font-semibold">{m2[1]}</span><span className="text-text-secondary"> - {m2[2]}</span>
      </div>
    )
    if (line.trim() === '') return <div key={index} className="h-2" />
    return <p key={index} className="text-text-secondary leading-relaxed">{line}</p>
  })
}

export default function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [showDocModal, setShowDocModal] = useState(false)

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', id],
    queryFn: () => apiGetLesson(id),
  })

  const { data: fileUrl } = useQuery({
    queryKey: ['file-url', lesson?.file_id],
    queryFn: () => apiGetFileUrl(lesson!.file_id!),
    enabled: !!lesson?.file_id,
    staleTime: 50 * 60 * 1000,
  })

  if (isLoading) return (
    <div className="max-w-4xl space-y-6">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-10 w-80" />
      <Skeleton className="h-96 w-full rounded-card" />
    </div>
  )

  if (!lesson) return (
    <div className="max-w-4xl py-20 text-center">
      <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-text-primary">Урок не найден</h1>
      <Link href="/dashboard/training" className="mt-6 inline-flex items-center gap-2 text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> Назад к обучению
      </Link>
    </div>
  )

  const contentIcon = lesson.content_type === 'video'
    ? Video
    : lesson.content_type === 'document'
    ? FileText
    : BookOpen

  const ContentIcon = contentIcon

  return (
    <motion.div
      className="max-w-4xl space-y-6"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      key={id}
    >
      {/* Back */}
      <Link
        href="/dashboard/training"
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Назад к этапу
      </Link>

      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <ContentIcon className="h-5 w-5 text-primary" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">{lesson.title}</h1>
      </div>

      {/* Video */}
      {lesson.content_type === 'video' && (
        <motion.div
          className="rounded-card overflow-hidden border border-slate-100 shadow-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {fileUrl ? (
            <div className="relative aspect-video bg-black" onContextMenu={e => e.preventDefault()}>
              <video
                src={fileUrl}
                className="w-full h-full object-contain"
                controls
                controlsList="nodownload noremoteplayback"
                disablePictureInPicture
                onContextMenu={e => e.preventDefault()}
              />
            </div>
          ) : (
            <div className="bg-slate-50 p-12 flex flex-col items-center justify-center min-h-[280px]">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Play className="w-10 h-10 text-primary ml-1" />
              </div>
              <p className="text-text-secondary text-center">Видео появится совсем скоро</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Document */}
      {lesson.content_type === 'document' && fileUrl && (
        <>
          <motion.div
            className="rounded-card border border-primary/20 shadow-card p-6 cursor-pointer hover:bg-primary/5 transition-colors"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => setShowDocModal(true)}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-text-primary">{lesson.title}</p>
                  <p className="text-sm text-text-secondary mt-0.5">PDF документ · нажмите для просмотра</p>
                </div>
              </div>
              <Eye className="w-5 h-5 text-primary flex-shrink-0" />
            </div>
          </motion.div>

          <AnimatePresence>
            {showDocModal && (
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowDocModal(false)}
              >
                <motion.div
                  className="bg-white rounded-2xl shadow-xl flex flex-col w-full max-w-5xl"
                  style={{ height: '90vh' }}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      <span className="font-semibold text-text-primary">{lesson.title}</span>
                    </div>
                    <button
                      onClick={() => setShowDocModal(false)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-hidden rounded-b-2xl">
                    <iframe
                      src={fileUrl}
                      className="w-full h-full border-0"
                      title={lesson.title}
                    />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Text content */}
      {lesson.content && (
        <motion.div
          className="rounded-card bg-white border border-slate-100 shadow-card p-6 sm:p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Содержание урока
            </h2>
            <span className="flex items-center gap-1.5 text-xs text-text-muted bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
              <Clock className="w-3.5 h-3.5" />
              ~{readingMinutes(lesson.content)} мин
            </span>
          </div>

          <div
            className="select-none"
            onContextMenu={e => e.preventDefault()}
            onCopy={e => e.preventDefault()}
          >
            {lesson.content.trimStart().startsWith('<') ? (
              <div
                className="prose prose-sm max-w-none text-text-secondary
                  [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-text-primary [&_h1]:mb-3 [&_h1]:mt-5
                  [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-text-primary [&_h2]:mb-2 [&_h2]:mt-4
                  [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-text-primary [&_h3]:mb-1 [&_h3]:mt-3
                  [&_p]:mb-3 [&_p]:leading-relaxed
                  [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul_li]:mb-1
                  [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_ol_li]:mb-1
                  [&_hr]:border-slate-200 [&_hr]:my-4
                  [&_strong]:font-semibold [&_strong]:text-text-primary
                  [&_em]:italic [&_u]:underline
                  [&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-text-muted"
                dangerouslySetInnerHTML={{ __html: lesson.content }}
              />
            ) : (
              <div className="space-y-1">{renderContent(lesson.content)}</div>
            )}
          </div>
        </motion.div>
      )}

      {!lesson.content && !fileUrl && (
        <div className="rounded-card border border-slate-100 shadow-card p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-text-muted">Контент урока ещё не добавлен</p>
        </div>
      )}
    </motion.div>
  )
}
