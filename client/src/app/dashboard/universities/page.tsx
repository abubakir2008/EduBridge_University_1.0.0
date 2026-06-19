'use client'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, Heart, Star, AlertCircle, ChevronRight, GraduationCap, Coins, MapPin, Play, Calendar, CheckCircle2, BedDouble, Languages, Wallet, Award, X } from 'lucide-react'
import { formatCost } from '@/lib/currency'
import { useAuthStore } from '@/lib/store/authStore'
import { apiGetUniversities, apiMatchUniversities, getUniversityPhotoUrl } from '@/lib/api/universities'
import { apiStartTraining } from '@/lib/api/training'
import { apiAddFavourite, apiRemoveFavourite, apiGetFavourites } from '@/lib/api/favourites'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { CardSkeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { University, MatchTier } from '@/types'

const TIER_STYLE: Record<string, {
  label: string
  medal: string
  ring: string
  badge: string
  bar: string
  scoreText: string
}> = {
  gold: {
    label: 'Золотой выбор',
    medal: '🥇',
    ring: 'ring-2 ring-amber-400 shadow-lg shadow-amber-200/50',
    badge: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white',
    bar: 'bg-gradient-to-r from-amber-400 to-yellow-500',
    scoreText: 'text-amber-600',
  },
  silver: {
    label: 'Серебряный',
    medal: '🥈',
    ring: 'ring-1 ring-slate-300',
    badge: 'bg-slate-200 text-slate-700',
    bar: 'bg-gradient-to-r from-slate-400 to-slate-500',
    scoreText: 'text-slate-600',
  },
  bronze: {
    label: 'Бронзовый',
    medal: '🥉',
    ring: 'ring-1 ring-orange-200',
    badge: 'bg-orange-100 text-orange-700',
    bar: 'bg-gradient-to-r from-orange-400 to-amber-600',
    scoreText: 'text-orange-600',
  },
}

const DIFFICULTY_STYLE: Record<string, string> = {
  'Легко': 'bg-emerald-50 text-emerald-700',
  'Средний': 'bg-amber-50 text-amber-700',
  'Сложно': 'bg-red-50 text-red-700',
}

function UniCard({
  uni,
  isFav,
  matched,
  onFav,
  onDetail,
}: {
  uni: University
  isFav: boolean
  matched: boolean
  onFav: () => void
  onDetail: () => void
}) {
  const coverPhotoId = uni.photo_file_ids?.[0]
  const coverUrl = coverPhotoId ? getUniversityPhotoUrl(uni.id, coverPhotoId) : null
  const cost = uni.cost ?? uni.tuition_fee
  const rating = uni.rating ?? uni.ranking
  const specs = Array.isArray(uni.specialties)
    ? uni.specialties
    : uni.specialties ? [uni.specialties] : []

  const tier = matched ? uni.match_tier : undefined
  const tierStyle = tier ? TIER_STYLE[tier] : undefined
  const score = uni.match_score
  const reasons = uni.match_reasons ?? []
  const gaps = uni.match_gaps ?? []

  return (
    <div
      className={cn(
        'group relative bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden transition-all duration-200 flex flex-col hover:shadow-card-hover hover:-translate-y-1',
        tierStyle?.ring,
      )}
    >
      {/* Цветная полоса тира сверху */}
      {tierStyle && <div className={cn('h-1.5 w-full flex-shrink-0', tierStyle.bar)} />}

      {/* Обложка */}
      <div className="relative h-40 bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden flex-shrink-0">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt={uni.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-7 w-7 text-primary/50" />
            </div>
          </div>
        )}

        {/* Тир-бейдж (в режиме подбора) или рейтинг */}
        {tierStyle ? (
          <div className={cn('absolute top-2 left-2 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold shadow-sm', tierStyle.badge)}>
            <span>{tierStyle.medal}</span> {tierStyle.label}
          </div>
        ) : rating ? (
          <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-white shadow-sm">
            <Star className="h-3 w-3 fill-white" /> #{rating}
          </div>
        ) : null}

        {/* Видео бейдж */}
        {uni.video_file_id && (
          <div className="absolute top-2 right-10 flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] text-white font-semibold">
            <Play className="h-2.5 w-2.5 fill-white" /> VIDEO
          </div>
        )}

        {/* % совпадения */}
        {matched && score != null && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 shadow-sm backdrop-blur">
            <span className={cn('text-xs font-extrabold', tierStyle?.scoreText)}>{score}%</span>
            <span className="text-[10px] font-medium text-text-muted">совпадение</span>
          </div>
        )}

        {/* Избранное */}
        <button
          data-tour="uni-fav"
          onClick={(e) => { e.stopPropagation(); onFav() }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow hover:bg-white transition-colors"
        >
          <Heart className={`h-4 w-4 transition-colors ${isFav ? 'fill-error text-error' : 'text-text-muted hover:text-error'}`} />
        </button>
      </div>

      {/* Инфо */}
      <div className="p-4 flex flex-col flex-1 space-y-2">
        <div>
          <h3 className="font-bold text-text-primary text-sm leading-tight line-clamp-1">{uni.name}</h3>
          <div className="flex items-center gap-1 mt-0.5 text-text-muted text-xs">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{uni.city}, {uni.country}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {cost && (
            <div className="flex items-center gap-1 text-xs">
              <Coins className="h-3.5 w-3.5 text-emerald-500" />
              <span className="font-semibold text-emerald-600">{formatCost(cost, uni.country)}</span>
              <span className="text-text-muted">/ год</span>
            </div>
          )}
          {uni.difficulty && (
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', DIFFICULTY_STYLE[uni.difficulty] ?? 'bg-slate-100 text-slate-600')}>
              {uni.difficulty}
            </span>
          )}
        </div>

        {/* Причины совпадения + чего не хватает (в режиме подбора) */}
        {matched && (reasons.length > 0 || gaps.length > 0) ? (
          <div className="flex flex-col gap-1">
            {reasons.slice(0, 3).map((r, i) => (
              <div key={`r${i}`} className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                <CheckCircle2 className="h-3 w-3 flex-shrink-0 text-emerald-500" />
                <span className="truncate">{r}</span>
              </div>
            ))}
            {gaps.slice(0, 2).map((g, i) => (
              <div key={`g${i}`} className="flex items-center gap-1.5 text-[11px] text-amber-600">
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{g}</span>
              </div>
            ))}
          </div>
        ) : specs.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {specs.slice(0, 2).map((s, i) => (
              <span key={i} className="rounded-full bg-primary/8 text-primary px-2 py-0.5 text-[10px] font-medium truncate max-w-[110px]">{s}</span>
            ))}
            {specs.length > 2 && (
              <span className="rounded-full bg-slate-100 text-slate-500 px-2 py-0.5 text-[10px]">+{specs.length - 2}</span>
            )}
          </div>
        ) : null}

        <div className="mt-auto pt-2">
          <Button data-tour="uni-detail" variant="outline" size="sm" className="w-full" onClick={onDetail}>
            Подробнее <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function VideoPlayer({ universityId }: { universityId: string }) {
  const src = `/api/universities/${universityId}/video`
  return (
    <div>
      <p className="text-sm font-medium text-text-secondary mb-2">Видео</p>
      <video src={src} controls className="w-full rounded-xl max-h-64 bg-black" preload="metadata" />
    </div>
  )
}

export default function UniversitiesPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('')
  const [selected, setSelected] = useState<University | null>(null)
  const [showMatched, setShowMatched] = useState(false)
  const [page, setPage] = useState(1)
  const PER_PAGE = 9

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
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 409) toast.error('Вы уже начали поступление в другой университет')
      else toast.error('Не удалось начать поступление')
    },
  })

  // «Все»: клиентская пагинация. «Подбор»: группировка по тирам (без пагинации).
  const allList = universities ?? []
  const totalPages = Math.max(1, Math.ceil(allList.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const pageItems = allList.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  const matchedList = matched ?? []
  const tierGroups: { key: MatchTier; title: string; desc: string; items: University[] }[] = [
    { key: 'gold', title: '🥇 Идеальный выбор', desc: 'Лучший баланс шансов и качества', items: matchedList.filter((u) => u.match_tier === 'gold') },
    { key: 'silver', title: '🥈 Отличные варианты', desc: 'Хорошо подходят под ваш профиль', items: matchedList.filter((u) => u.match_tier === 'silver') },
    { key: 'bronze', title: '🥉 Стоит рассмотреть', desc: 'Амбициозные и запасные варианты', items: matchedList.filter((u) => u.match_tier === 'bronze') },
  ]

  const renderCard = (uni: University, i: number) => (
    <motion.div
      key={uni.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(i * 0.03, 0.3) }}
    >
      <UniCard
        uni={uni}
        isFav={favIds.has(uni.id)}
        matched={showMatched}
        onFav={() => toggleFav.mutate(uni)}
        onDetail={() => setSelected(uni)}
      />
    </motion.div>
  )

  // Сброс на 1-ю страницу при смене фильтров/режима
  useEffect(() => { setPage(1) }, [search, country, showMatched])

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Университеты</h1>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/compare" data-tour="uni-compare"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-slate-50 transition-colors">
            Сравнить
          </Link>
          <Button data-tour="uni-match" variant={showMatched ? 'primary' : 'outline'} size="sm" onClick={() => setShowMatched(!showMatched)}>
            {showMatched ? 'Все университеты' : 'Подобрать по моим данным'}
          </Button>
        </div>
      </div>

      {user && !user.gpa && (
        <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Заполните профиль (GPA, тесты), чтобы получить персональный подбор.
        </div>
      )}

      <div className="flex gap-3">
        <div className="flex-1" data-tour="uni-search">
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : showMatched ? (
        /* ── Режим подбора: группы по тирам ── */
        matchedList.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Search className="h-12 w-12 text-text-muted mb-4" />
            <p className="text-text-secondary">Под ваши данные ничего не подошло</p>
            <p className="mt-1 text-sm text-text-muted">Уточните предпочтения в профиле или посмотрите все университеты</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setShowMatched(false)}>
              Показать все
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            <p className="text-sm text-text-muted">
              Подобрали {matchedList.length} вузов под ваш профиль и отсортировали по совпадению.
            </p>
            {tierGroups.filter((g) => g.items.length > 0).map((g) => (
              <section key={g.key}>
                <div className="mb-3">
                  <h2 className="text-lg font-bold text-text-primary">{g.title}</h2>
                  <p className="text-sm text-text-muted">{g.desc} · {g.items.length}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {g.items.map(renderCard)}
                </div>
              </section>
            ))}
          </div>
        )
      ) : allList.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Search className="h-12 w-12 text-text-muted mb-4" />
          <p className="text-text-secondary">Университеты не найдены</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pageItems.map(renderCard)}
          </div>

          {/* Пагинация */}
          {totalPages > 1 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-slate-50 disabled:opacity-40"
              >
                ←
              </button>
              {Array.from({ length: totalPages }).map((_, i) => {
                const n = i + 1
                return (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={cn(
                      'min-w-[36px] rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                      n === safePage
                        ? 'border-primary bg-primary text-white'
                        : 'border-slate-200 text-text-secondary hover:bg-slate-50'
                    )}
                  >
                    {n}
                  </button>
                )
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-slate-50 disabled:opacity-40"
              >
                →
              </button>
            </div>
          )}
        </>
      )}

      {/* Детальный модал */}
      <Modal open={!!selected} onClose={() => setSelected(null)} maxWidth="max-w-xl">
        {selected && (() => {
          const cost = selected.cost ?? selected.tuition_fee
          const rating = selected.rating ?? selected.ranking
          const specs = Array.isArray(selected.specialties)
            ? selected.specialties
            : selected.specialties ? [selected.specialties] : []
          const coverId = selected.photo_file_ids?.[0]
          const coverUrl = coverId ? getUniversityPhotoUrl(selected.id, coverId) : null
          const location = [selected.city, selected.province, selected.country].filter(Boolean).join(', ')
          const requirements = selected.min_requirements
            || (typeof selected.requirements === 'string' ? selected.requirements : '')

          const difficultyStyle: Record<string, string> = {
            'Легко': 'bg-emerald-500/90',
            'Средний': 'bg-amber-500/90',
            'Сложно': 'bg-red-500/90',
          }

          const tuition = [
            { label: 'Бакалавриат', value: selected.tuition_bachelor, icon: GraduationCap },
            { label: 'Магистратура', value: selected.tuition_masters, icon: Award },
            { label: 'Языковой год', value: selected.tuition_language_year, icon: Languages },
            { label: 'Взнос за подачу', value: selected.application_fee, icon: Wallet },
          ].filter((t) => t.value)

          return (
            <div className="space-y-5">
              {/* Hero */}
              <div className="relative -mx-6 -mt-6 h-52 overflow-hidden rounded-t-[16px] bg-gradient-to-br from-primary/25 to-primary/5">
                {coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverUrl}
                    alt={selected.name}
                    className="h-full w-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <GraduationCap className="h-16 w-16 text-primary/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

                {/* Закрыть */}
                <button
                  onClick={() => setSelected(null)}
                  aria-label="Закрыть"
                  className="absolute right-3 top-3 rounded-full bg-black/30 p-1.5 text-white backdrop-blur transition-colors hover:bg-black/50"
                >
                  <X className="h-5 w-5" />
                </button>

                {/* Сложность */}
                {selected.difficulty && (
                  <span className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white backdrop-blur ${difficultyStyle[selected.difficulty] ?? 'bg-slate-500/90'}`}>
                    <AlertCircle className="h-3.5 w-3.5" /> {selected.difficulty}
                  </span>
                )}

                {/* Название */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h2 className="text-xl font-bold leading-tight text-white drop-shadow-sm">{selected.name}</h2>
                  {location && (
                    <p className="mt-1 flex items-center gap-1 text-sm text-white/90">
                      <MapPin className="h-3.5 w-3.5" /> {location}
                    </p>
                  )}
                </div>
              </div>

              {/* Быстрые факты */}
              <div className="flex flex-wrap gap-2">
                {rating != null && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> Рейтинг #{rating}
                  </span>
                )}
                {cost != null && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                    <Coins className="h-3.5 w-3.5" /> от {formatCost(cost, selected.country)}/год
                  </span>
                )}
                {selected.has_language_year && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
                    <Languages className="h-3.5 w-3.5" /> Языковой год
                  </span>
                )}
              </div>

              {/* Описание */}
              {selected.description && (
                <p className="text-sm leading-relaxed text-text-primary">{selected.description}</p>
              )}

              {/* Специальности */}
              {specs.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Специальности</p>
                  <div className="flex flex-wrap gap-1.5">
                    {specs.map((s, i) => (
                      <span key={i} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Стоимость по уровням */}
              {tuition.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Стоимость обучения</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {tuition.map(({ label, value, icon: Icon }) => (
                      <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <div className="mb-0.5 flex items-center gap-1.5 text-xs text-text-muted">
                          <Icon className="h-3.5 w-3.5 text-primary" /> {label}
                        </div>
                        <p className="text-sm font-semibold text-text-primary">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Требования */}
              {requirements && (
                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-blue-700">
                    <CheckCircle2 className="h-4 w-4" /> Требования к поступлению
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-text-primary">{requirements}</p>
                </div>
              )}

              {/* Дедлайн */}
              {selected.deadline && (
                <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3">
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                    <Calendar className="h-4 w-4" /> Сроки подачи
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-text-primary">{selected.deadline}</p>
                </div>
              )}

              {/* Проживание */}
              {selected.dormitory_info && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                    <BedDouble className="h-4 w-4" /> Проживание
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-text-primary">{selected.dormitory_info}</p>
                </div>
              )}

              {/* Видео */}
              {selected.video_file_id && <VideoPlayer universityId={selected.id} />}

              {/* Закреплённый CTA */}
              <div className="sticky bottom-0 -mx-6 -mb-6 border-t border-slate-100 bg-white/95 px-6 py-4 backdrop-blur">
                <Button
                  data-tour="tour-start-training"
                  className="w-full"
                  loading={startMutation.isPending}
                  onClick={() => startMutation.mutate(selected.id)}
                >
                  Начать поступление
                </Button>
              </div>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}
