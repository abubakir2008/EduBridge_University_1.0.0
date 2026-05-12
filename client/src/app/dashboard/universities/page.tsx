'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, Heart, Star, AlertCircle, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/lib/store/authStore'
import { apiGetUniversities, apiMatchUniversities } from '@/lib/api/universities'
import { apiStartTraining } from '@/lib/api/training'
import { apiAddFavourite, apiRemoveFavourite, apiGetFavourites } from '@/lib/api/favourites'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { CardSkeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { University } from '@/types'

export default function UniversitiesPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('')
  const [selected, setSelected] = useState<University | null>(null)
  const [showMatched, setShowMatched] = useState(false)

  const params = Object.fromEntries(
    Object.entries({ search, country }).filter(([, v]) => v)
  )

  const { data: universities, isLoading } = useQuery({
    queryKey: ['universities', params],
    queryFn: () => apiGetUniversities(params),
  })

  const { data: matched } = useQuery({
    queryKey: ['universities-match'],
    queryFn: apiMatchUniversities,
    enabled: showMatched,
  })

  const { data: favs } = useQuery({
    queryKey: ['favourites'],
    queryFn: apiGetFavourites,
    enabled: !!user,
  })

  const favIds = new Set(favs?.map((f) => f.id) ?? [])

  const toggleFav = useMutation({
    mutationFn: async (uni: University) => {
      if (favIds.has(uni.id)) await apiRemoveFavourite(uni.id)
      else await apiAddFavourite(uni.id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favourites'] }),
  })

  const startMutation = useMutation({
    mutationFn: (uniId: string) => apiStartTraining(user!.id, uniId),
    onSuccess: () => {
      toast.success('Путь поступления начат!')
      setSelected(null)
      router.push('/dashboard/training')
    },
    onError: () => toast.error('Не удалось начать поступление'),
  })

  const displayList = showMatched && matched ? matched : universities ?? []

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Университеты</h1>
        <Button variant={showMatched ? 'primary' : 'outline'} size="sm" onClick={() => setShowMatched(!showMatched)}>
          {showMatched ? 'Все университеты' : 'Подобрать по моим данным'}
        </Button>
      </div>

      {user && !user.gpa && (
        <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Заполните профиль (GPA, тесты), чтобы получить персональный подбор.
        </div>
      )}

      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            placeholder="Поиск по названию..."
            icon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Input
          placeholder="Страна"
          className="w-40"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : displayList.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Search className="h-12 w-12 text-text-muted mb-4" />
          <p className="text-text-secondary">Университеты не найдены</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {displayList.map((uni, i) => (
            <motion.div
              key={uni.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card className="relative h-full flex flex-col">
                {showMatched && matched?.find((m) => m.id === uni.id) && (
                  <Badge variant="success" className="absolute top-4 right-4">Подходит вам</Badge>
                )}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-text-primary">{uni.name}</h3>
                    <p className="text-sm text-text-secondary mt-0.5">{uni.city}, {uni.country}</p>
                  </div>
                  <button
                    onClick={() => toggleFav.mutate(uni)}
                    className="ml-3 shrink-0"
                  >
                    <Heart
                      className={`h-5 w-5 transition-colors ${favIds.has(uni.id) ? 'fill-error text-error' : 'text-text-muted hover:text-error'}`}
                    />
                  </button>
                </div>

                {uni.ranking && (
                  <div className="flex items-center gap-1 text-xs text-warning mb-2">
                    <Star className="h-3.5 w-3.5 fill-warning" />
                    Рейтинг #{uni.ranking}
                  </div>
                )}

                {uni.tuition_fee && (
                  <p className="text-sm text-text-secondary mb-2">
                    ${uni.tuition_fee.toLocaleString()} / год
                  </p>
                )}

                {uni.specialties && (
                  <p className="text-xs text-text-muted mb-4 line-clamp-2">{uni.specialties}</p>
                )}

                <div className="mt-auto flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setSelected(uni)}>
                    Подробнее <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* University detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name} maxWidth="max-w-xl">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-text-muted">Страна:</span> <span className="font-medium">{selected.country}</span></div>
              <div><span className="text-text-muted">Город:</span> <span className="font-medium">{selected.city}</span></div>
              {selected.ranking && <div><span className="text-text-muted">Рейтинг:</span> <span className="font-medium">#{selected.ranking}</span></div>}
              {selected.tuition_fee && <div><span className="text-text-muted">Стоимость:</span> <span className="font-medium">${selected.tuition_fee.toLocaleString()}/год</span></div>}
            </div>

            {selected.description && (
              <div>
                <p className="text-sm font-medium text-text-secondary mb-1">Описание</p>
                <p className="text-sm text-text-primary">{selected.description}</p>
              </div>
            )}

            {selected.specialties && (
              <div>
                <p className="text-sm font-medium text-text-secondary mb-1">Специальности</p>
                <p className="text-sm text-text-primary">{selected.specialties}</p>
              </div>
            )}

            {selected.requirements && (
              <div>
                <p className="text-sm font-medium text-text-secondary mb-1">Требования</p>
                <p className="text-sm text-text-primary">{selected.requirements}</p>
              </div>
            )}

            <Button
              className="w-full"
              loading={startMutation.isPending}
              onClick={() => startMutation.mutate(selected.id)}
            >
              Начать поступление
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
