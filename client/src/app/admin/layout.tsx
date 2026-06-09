'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { useAuthStore } from '@/lib/store/authStore'
import { PageSpinner } from '@/components/ui/spinner'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, fetchMe, isLoading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!user) fetchMe()
  }, [user, fetchMe])

  useEffect(() => {
    if (user && user.role !== 'admin') router.push('/dashboard/training')
  }, [user, router])

  if (!user || isLoading) return <PageSpinner />

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 min-w-0 bg-background-elevated p-4 sm:p-6 pt-[72px] md:pt-6 md:ml-64">
        {children}
      </main>
    </div>
  )
}
