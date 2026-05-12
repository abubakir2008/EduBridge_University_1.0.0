export type UserRole = 'student' | 'admin'
export type AccountStatus = 'active' | 'archived' | 'enrolled'
export type LeadStatus = 'new' | 'contacted' | 'registered'
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
  country_preference?: string
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
  description?: string
  specialties?: string
  requirements?: string
  tuition_fee?: number
  ranking?: number
  logo_file_id?: string
  logo_url?: string
}

export interface Stage {
  id: string
  university_id: string
  name: string
  description?: string
  order: number
  deadline?: string
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
  current_stage_id?: string
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
  content_type: 'text' | 'video' | 'document'
  content?: string
  file_id?: string
  order: number
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
  created_at: string
}

export interface FileRecord {
  id: string
  filename: string
  bucket: string
  url?: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface Credentials {
  login: string
  password: string
}

export interface AdminDashboardSummary {
  total_students: number
  active_students: number
  enrolled_students: number
  archived_students: number
  new_leads: number
  overdue_students: number
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
