'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// «AI-Ассистент» заменён постоянным помощником «Барашек» в левой панели.
// Старый маршрут перенаправляем на «Мой путь».
export default function AiRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/dashboard/training')
  }, [router])
  return null
}
