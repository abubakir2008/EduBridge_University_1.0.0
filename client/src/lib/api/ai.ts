import client from './client'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface LetterCheckResult {
  score: number
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  verdict: string
  translated?: string
}

export interface DocumentCheckResult {
  ok: boolean
  document_type: string
  issues: string[]
  empty_fields: string[]
  verdict: string
  recommendations: string[]
}

export interface UniRecommendation {
  name: string
  match_percent: number
  reasons: string[]
  concerns: string[]
}

export interface AiReminder {
  priority: 'high' | 'medium' | 'low'
  icon: string
  message: string
}

export interface StudentSummary {
  summary: string
  action_items: string[]
  risk_level: 'low' | 'medium' | 'high'
  recommendation: string
}

export interface AdmissionScore {
  score: number
  breakdown: { gpa: number; ielts: number; sat: number; completeness: number }
  verdict: string
  weak_points: string[]
  strong_points: string[]
  recommendations: string[]
}

export interface ReminderDraft {
  draft: string
  user_name: string
}

export interface OnboardingOption { label: string; value: string }
export interface OnboardingResult {
  reply: string
  profile_updates: Record<string, unknown>
  completed: boolean
  is_onboarded: boolean
  field: string
  field_type: 'text' | 'number' | 'date' | 'choice'
  options: OnboardingOption[]
  skippable: boolean
  progress: { filled: number; total: number }
}

// Student
export const apiAiOnboardingChat = (message: string, history: ChatMessage[], skipped: string[] = []) =>
  client.post<OnboardingResult>('/ai/onboarding/chat', { message, history, skipped }).then(r => r.data)

export const apiAiChat = (message: string, history: ChatMessage[]) =>
  client.post<{ reply: string }>('/ai/chat', { message, history }).then(r => r.data)

export const apiBarashekTip = () =>
  client.get<{ tip: string }>('/ai/barashek/tip').then(r => r.data)

export interface NextAction {
  text: string
  action_label: string
  action_href: string
  mood: string
  emoji: string
}
export const apiBarashekNextAction = () =>
  client.get<NextAction>('/ai/barashek/next-action').then(r => r.data)

export const apiBarashekTTS = (text: string, gender: 'female' | 'male' = 'female') =>
  client.post('/ai/tts', { text, gender }, { responseType: 'blob' }).then(r => r.data as Blob)

export const apiBarashekInterview = (message: string, history: ChatMessage[]) =>
  client.post<{ reply: string }>('/ai/interview', { message, history }).then(r => r.data)

export const apiBarashekGuide = (params: {
  message?: string
  history: ChatMessage[]
  page?: string
  auto?: boolean
}) =>
  client.post<{ reply: string }>('/ai/barashek', {
    message: params.message ?? '',
    history: params.history,
    page: params.page ?? '',
    auto: params.auto ?? false,
  }).then(r => r.data)

export const apiAiCheckLetter = (text: string, translate_to = '') =>
  client.post<LetterCheckResult>('/ai/check-letter', { text, translate_to }).then(r => r.data)

export const apiAiCheckDocument = (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return client.post<DocumentCheckResult>('/ai/check-document', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)
}

export const apiAiExtractDocument = (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return client.post<Record<string, string | null>>('/ai/extract-document', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)
}

export const apiAiRecommendations = () =>
  client.get<{ universities: UniRecommendation[] }>('/ai/recommendations').then(r => r.data)

export const apiAiReminders = () =>
  client.get<{ reminders: AiReminder[] }>('/ai/reminders').then(r => r.data)

// Admin
export const apiAiStudentSummary = (userId: string) =>
  client.get<StudentSummary>(`/ai/admin/summary/${userId}`).then(r => r.data)

export const apiAiAnalytics = (question: string) =>
  client.post<{ answer: string; can_export: boolean }>('/ai/admin/analytics', { question }).then(r => r.data)

export const apiAiReminderDraft = (userId: string) =>
  client.post<ReminderDraft>(`/ai/admin/reminder-draft/${userId}`).then(r => r.data)

export const apiAiAdmissionScore = (userId: string) =>
  client.get<AdmissionScore>(`/ai/admin/admission-score/${userId}`).then(r => r.data)

export const apiAiExport = () =>
  client.post('/ai/admin/export', {}, { responseType: 'blob' }).then(r => r.data as Blob)

export interface UniCompareResult {
  winner: string
  winner_reason: string
  per_university: { name: string; pros: string[]; cons: string[]; admission_chance: string; fit_score: number }[]
  advice: string
  red_flags: string[]
}

export const apiAiCompareUniversities = (university_ids: string[]) =>
  client.post<UniCompareResult>('/ai/compare-universities', { university_ids }).then(r => r.data)
