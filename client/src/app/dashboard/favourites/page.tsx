'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Heart, Trash2, GraduationCap, MapPin, Coins, Star, Check, Sparkles, GitCompare } from 'lucide-react'
import { formatCost } from '@/lib/currency'
import Link from 'next/link'
import { apiGetFavourites, apiRemoveFavourite } from '@/lib/api/favourites'
import { getUniversityPhotoUrl } from '@/lib/api/universities'
import { Button } from '@/components/ui/button'
import { CardSkeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { University } from '@/types'

function FavCard({ uni, selected, onSelect, onRemove }: {
  uni: University
  selected: boolean
  onSelect: () => void
  onRemove: () => void
}) {
  const coverId = uni.photo_file_ids?.[0]
  const coverUrl = coverId ? getUniversityPhotoUrl(uni.id, coverId) : null
  const cost = uni.cost ?? uni.tuition_fee
  const rating = uni.rating ?? uni.ranking
  const specs = Array.isArray(uni.specialties) ? uni.specialties : (uni.specialties ? [uni.specialties] : [])

  return (
    <div className={cn(
      'group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg',
      selected ? 'border-primary ring-2 ring-primary/30' : 'border-slate-100'
    )}>
      {/* Обложка */}
      <div className="relative h-40 flex-shrink-0 overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt={uni.name} className="h-full w-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <GraduationCap className="h-7 w-7 text-primary/50" />
            </div>
          </div>
        )}
        {rating != null && (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-white">
            <Star className="h-3 w-3 fill-white" /> #{rating}
          </div>
        )}
        <button
          onClick={onRemove}
          title="Убрать из избранного"
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-error shadow transition-colors hover:bg-white"
        >
          <Heart className="h-4 w-4 fill-error" />
        </button>
      </div>

      {/* Инфо */}
      <div className="flex flex-1 flex-col space-y-2 p-4">
        <div>
          <h3 className="line-clamp-1 text-sm font-bold text-text-primary">{uni.name}</h3>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-text-muted">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{uni.city}, {uni.country}</span>
          </div>
        </div>

        {cost != null && (
          <div className="flex items-center gap-1 text-xs">
            <Coins className="h-3.5 w-3.5 text-emerald-500" />
            <span className="font-semibold text-emerald-600">{formatCost(cost as number, uni.country)}</span>
            <span className="text-text-muted">/ год</span>
          </div>
        )}

        {specs.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {specs.slice(0, 2).map((s, i) => (
              <span key={i} className="max-w-[110px] truncate rounded-full bg-primary/8 px-2 py-0.5 text-[10px] font-medium text-primary">{s}</span>
            ))}
            {specs.length > 2 && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">+{specs.length - 2}</span>
            )}
          </div>
        )}

        {/* Действия */}
        <div className="mt-auto flex items-center gap-2 pt-2">
          <button
            onClick={onSelect}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
              selected ? 'border-primary bg-primary text-white' : 'border-slate-200 text-text-secondary hover:bg-slate-50'
            )}
          >
            {selected ? <><Check className="h-3.5 w-3.5" /> Выбран</> : <><GitCompare className="h-3.5 w-3.5" /> Сравнить</>}
          </button>
          <button
            onClick={onRemove}
            title="Удалить"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-text-muted transition-colors hover:border-error/30 hover:text-error"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function FavouritesPage() {
  const qc = useQueryClient()
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const { data: favs, isLoading } = useQuery({
    queryKey: ['favourites'],
    queryFn: apiGetFavourites,
  })

  const removeMutation = useMutation({
    mutationFn: apiRemoveFavourite,
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ['favourites'] })
      setSelected((prev) => { const n = new Set(prev); n.delete(id); return n })
      toast.success('Удалено из избранного')
    },
  })

  // Перейти на страницу сравнения с выбранными вузами — AI-анализ запустится сам
  const handleCompare = () => {
    if (selected.size < 2) return
    router.push(`/dashboard/compare?ids=${[...selected].join(',')}`)
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  if (isLoading) return (
    <div className="grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
    </div>
  )

  if (!favs || favs.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/5">
          <Heart className="h-10 w-10 text-primary/40" />
        </div>
        <h2 className="text-xl font-semibold text-text-primary">В избранном пока пусто</h2>
        <p className="text-text-secondary">Жми на сердечко у вуза, чтобы сохранить его сюда 🐑</p>
        <Link href="/dashboard/universities">
          <Button>Найти университеты</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Избранное</h1>
          <p className="mt-0.5 text-sm text-text-muted">{favs.length} {favs.length === 1 ? 'университет' : 'университетов'} · отметь 2+ для сравнения</p>
        </div>
        {selected.size >= 2 && (
          <Button size="sm" onClick={handleCompare} className="gap-1.5">
            <Sparkles className="h-4 w-4" /> Сравнить с AI ({selected.size})
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {favs.map((uni, i) => (
          <motion.div key={uni.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <FavCard
              uni={uni}
              selected={selected.has(uni.id)}
              onSelect={() => toggleSelect(uni.id)}
              onRemove={() => removeMutation.mutate(uni.id)}
            />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
