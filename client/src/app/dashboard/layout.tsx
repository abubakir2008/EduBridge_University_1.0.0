'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { StudentSidebar } from '@/components/layout/StudentSidebar'
import { useAuthStore } from '@/lib/store/authStore'
import { PageSpinner } from '@/components/ui/spinner'
import { OnboardingModal } from '@/components/ui/onboarding-modal'
import { AiChat } from '@/components/ui/AiChat'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, fetchMe, isLoading } = useAuthStore()
  const router = useRouter()
  const [aiChatOpen, setAiChatOpen] = useState(false)

  useEffect(() => {
    if (!user) fetchMe()
  }, [user, fetchMe])

  useEffect(() => {
    if (user && user.role === 'admin') router.push('/admin')
  }, [user, router])

  if (!user || isLoading) return <PageSpinner />

  return (
    <div className="flex min-h-screen bg-background-elevated">
      <OnboardingModal />
      <StudentSidebar onAiChatToggle={() => setAiChatOpen((v) => !v)} aiChatOpen={aiChatOpen} />
      <main className={`flex-1 p-6 pb-24 md:pb-6 overflow-auto transition-all duration-300 ${aiChatOpen ? 'md:mr-[380px]' : ''}`}>
        {children}
      </main>
      <AiChat open={aiChatOpen} onClose={() => setAiChatOpen(false)} />
    </div>
  )
}
