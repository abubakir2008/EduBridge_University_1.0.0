'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart, Building2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { apiGetFavourites, apiRemoveFavourite, apiCompareFavourites } from '@/lib/api/favourites'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { CardSkeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import type { University } from '@/types'

export default function FavouritesPage() {
  const qc = useQueryClient()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [compareData, setCompareData] = useState<University[] | null>(null)

  const { data: favs, isLoading } = useQuery({
    queryKey: ['favourites'],
    queryFn: apiGetFavourites,
  })

  const removeMutation = useMutation({
    mutationFn: apiRemoveFavourite,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['favourites'] })
      toast.success('Удалено из избранного')
    },
  })

  const handleCompare = async () => {
    if (selected.size < 2) return
    const data = await apiCompareFavourites([...selected])
    setCompareData(data)
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (isLoading) return (
    <div className="grid gap-4 sm:grid-cols-2 max-w-4xl">
      {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
    </div>
  )

  if (!favs || favs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-4">
        <Heart className="h-16 w-16 text-text-muted" />
        <h2 className="text-xl font-semibold text-text-primary">Избранных нет</h2>
        <p className="text-text-secondary">Добавляйте университеты в избранное при просмотре</p>
        <Link href="/dashboard/universities">
          <Button>Найти университеты</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Избранное</h1>
        {selected.size >= 2 && (
          <Button size="sm" onClick={handleCompare}>Сравнить ({selected.size})</Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {favs.map((uni) => (
          <Card key={uni.id} className="relative">
            <div className="absolute top-4 left-4">
              <input
                type="checkbox"
                checked={selected.has(uni.id)}
                onChange={() => toggleSelect(uni.id)}
                className="h-4 w-4 accent-primary"
              />
            </div>

            <div className="pl-7">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-text-primary">{uni.name}</h3>
                  <p className="text-sm text-text-secondary">{uni.city}, {uni.country}</p>
                </div>
                <button
                  onClick={() => removeMutation.mutate(uni.id)}
                  className="text-text-muted hover:text-error ml-2"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                {uni.ranking && (
                  <div className="text-text-secondary">Рейтинг: <span className="font-medium text-text-primary">#{uni.ranking}</span></div>
                )}
                {uni.tuition_fee && (
                  <div className="text-text-secondary">Стоимость: <span className="font-medium text-text-primary">${uni.tuition_fee.toLocaleString()}</span></div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Compare modal */}
      <Modal open={!!compareData} onClose={() => setCompareData(null)} title="Сравнение университетов" maxWidth="max-w-3xl">
        {compareData && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 pr-4 font-medium text-text-muted">Параметр</th>
                  {compareData.map((u) => (
                    <th key={u.id} className="text-left py-2 pr-4 font-semibold text-text-primary">{u.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { label: 'Страна', key: 'country' },
                  { label: 'Город', key: 'city' },
                  { label: 'Рейтинг', key: 'ranking' },
                  { label: 'Стоимость', key: 'tuition_fee' },
                  { label: 'Специальности', key: 'specialties' },
                  { label: 'Требования', key: 'requirements' },
                ].map(({ label, key }) => (
                  <tr key={key}>
                    <td className="py-3 pr-4 font-medium text-text-secondary whitespace-nowrap">{label}</td>
                    {compareData.map((u) => (
                      <td key={u.id} className="py-3 pr-4 text-text-primary">
                        {key === 'tuition_fee' && u[key as keyof University]
                          ? `$${(u[key as keyof University] as number).toLocaleString()}/год`
                          : (u[key as keyof University] as string) ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  )
}
