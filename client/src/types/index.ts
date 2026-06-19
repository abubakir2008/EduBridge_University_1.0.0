export type UserRole = 'student' | 'admin'
export type AccountStatus = 'active' | 'archived' | 'enrolled'
export type LeadStatus = 'new' | 'contacted' | 'registered' | 'rejected'
export type ProgressStatus = 'in_progress' | 'completed'
export type RequirementType = 'checkbox' | 'file_upload'
export type DeadlineStatus = 'on_track' | 'at_risk' | 'overdue'
export type NotificationType =
  | 'account_created'
  | 'password_reset'
  | 'new_stage'
  | 'deadline_at_risk'
  | 'deadline_overdue'
  | 'manual'

export interface LanguageSkill {
  language: string
  level: string
}

export interface User {
  id: string
  login: string
  full_name: string
  phone?: string
  email?: string
  citizenship?: string
  gpa?: number
  ielts_score?: number
  sat_score?: number
  achievements?: string
  desired_specialty?: string
  specialty_preference?: string
  country_preference?: string
  contact_person?: string
  contact_person_phone?: string
  contract_file_id?: string
  language_skills?: LanguageSkill[]
  program_level?: string
  preferred_difficulty?: string
  wants_language_year?: string
  max_budget_rmb?: number
  toefl_score?: number
  hsk_level?: number
  is_onboarded?: boolean
  role: UserRole
  account_status: AccountStatus
  created_at: string
}

export interface Lead {
  id: string
  name: string
  contact: string
  country_interest?: string
  comment?: string
  status: LeadStatus
  created_at: string
}

export interface University {
  id: string
  name: string
  country: string
  city: string
  province?: string
  description?: string
  specialties?: string[] | string
  requirements?: Record<string, number> | string | null
  min_requirements?: string
  tuition_fee?: number
  ranking?: number
  cost?: number
  rating?: number
  logo_file_id?: string
  logo_url?: string
  photo_file_ids?: string[]
  video_url?: string
  video_file_id?: string

  programs_bachelor_chinese?: string[]
  programs_masters_chinese?: string[]
  programs_bachelor_english?: string[]
  programs_masters_english?: string[]

  has_language_year?: boolean

  tuition_bachelor?: string
  tuition_masters?: string
  tuition_language_year?: string
  application_fee?: string

  dormitory_info?: string

  documents_bachelor?: string[]
  documents_masters?: string[]
  documents_language_year?: string[]

  difficulty?: string
  deadline?: string

  // Поля персонального подбора (приходят из GET /universities/match)
  match_score?: number
  match_tier?: 'gold' | 'silver' | 'bronze'
  match_reasons?: string[]
  match_gaps?: string[]
}

export type MatchTier = 'gold' | 'silver' | 'bronze'

// ── Блог / статьи ──────────────────────────────────────────────
export type PostCategory = 'relocation' | 'admission' | 'languages' | 'grants'
export type PostStatus = 'draft' | 'published'

export interface PostListItem {
  id: string
  title: string
  slug: string
  category: string          // slug рубрики (рубрики динамические, управляются в админке)
  excerpt?: string | null
  cover_file_id?: string | null
  status: PostStatus
  published_at?: string | null
  created_at?: string | null
}

export interface FaqItem {
  question: string
  answer: string
}

export interface Post extends PostListItem {
  content?: string | null
  seo_title?: string | null
  seo_description?: string | null
  faq?: FaqItem[] | null
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
  icon?: string | null      // ключ lucide-иконки
  sort_order: number
}

export interface Stage {
  id: string
  university_id: string
  name: string
  description?: string
  order: number
  deadline_days?: number | null
}

export interface Requirement {
  id: string
  stage_id: string
  name: string
  description?: string
  type: RequirementType
  is_required: boolean
}

export interface StudentRequirement {
  id: string
  requirement_id: string
  is_done: boolean
  file_id?: string
  requirement: Requirement
}

export interface StudentProgress {
  id: string
  user_id: string
  university_id: string
  status: ProgressStatus
  current_stage_id?: string | null
  university: University
  current_stage?: Stage & {
    deadline_status?: DeadlineStatus
    days_left?: number
    lessons: Lesson[]
    requirements: StudentRequirement[]
  }
  all_stages?: Stage[]
  note?: string
}

export interface Lesson {
  id: string
  stage_id: string
  title: string
  content_type: 'text' | 'video' | 'document' | 'image'
  content?: string
  file_id?: string
  order: number
  viewed?: boolean
}

export interface Case {
  id: string
  title: string
  student_name: string
  university_id: string
  university?: University
  country: string
  specialty: string
  description?: string
  photo_file_id?: string
  photo_url?: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  message: string
  channel: string
  is_read: boolean
  sent_at: string
}

export interface FileRecord {
  id: string
  filename: string
  bucket: string
  url?: string
}

export interface LoginResponse {
  role: string
}

export interface Credentials {
  login: string
  password: string
}

export interface FunnelStep {
  label: string
  value: number
}

export interface AdminDashboardSummary {
  total_students: number
  active_students: number
  enrolled_students: number
  archived_students: number
  new_leads: number
  overdue_students: number
  funnel?: FunnelStep[]
}

export interface AdminStudentRow {
  id: string
  full_name: string
  login: string
  account_status: AccountStatus
  current_stage?: string
  university?: string
  created_at: string
}
