import Link from 'next/link'
import type { Metadata } from 'next'
import { GraduationCap, ArrowRight, ArrowLeft } from 'lucide-react'
import { fetchPublishedPosts, fetchCategories } from '@/lib/serverPosts'
import { getPostCoverUrl } from '@/lib/api/posts'
import { CategoryIcon } from '@/lib/categoryIcons'
import type { PostListItem, Category } from '@/types'

export const metadata: Metadata = {
  title: 'Блог EduBridge — поступление и учёба за границей',
  description:
    'Гайды и советы о поступлении в зарубежные вузы: визы и переезд, документы, языковые тесты (IELTS/TOEFL/HSK), гранты и жизнь студента за границей.',
  alternates: { canonical: 'https://university.edubridge.bond/blog' },
  openGraph: {
    title: 'Блог EduBridge — поступление и учёба за границей',
    description: 'Гайды о поступлении за границу: визы, документы, языки и тесты, гранты.',
    url: 'https://university.edubridge.bond/blog',
    type: 'website',
  },
}

function fmtDate(d?: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function PostCard({ p, cat }: { p: PostListItem; cat?: Category }) {
  return (
    <Link
      href={`/blog/${p.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover"
    >
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
        {p.cover_file_id ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={getPostCoverUrl(p.cover_file_id)} alt={p.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <CategoryIcon icon={cat?.icon} className="h-12 w-12 text-primary/40" />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-primary shadow-sm backdrop-blur">
          {cat?.name ?? p.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-bold leading-snug text-text-primary line-clamp-2 group-hover:text-primary transition-colors">{p.title}</h3>
        {p.excerpt && <p className="mt-2 text-sm text-text-secondary line-clamp-3">{p.excerpt}</p>}
        <div className="mt-auto flex items-center justify-between pt-4 text-xs text-text-muted">
          <span>{fmtDate(p.published_at)}</span>
          <span className="inline-flex items-center gap-1 font-semibold text-primary">
            Читать <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  )
}

export default async function BlogIndexPage({ searchParams }: { searchParams: { cat?: string } }) {
  const activeCat = searchParams.cat
  const [posts, categories] = await Promise.all([
    fetchPublishedPosts(activeCat),
    fetchCategories(),
  ])
  const catBy: Record<string, Category> = Object.fromEntries(categories.map((c) => [c.slug, c]))

  return (
    <div className="min-h-screen bg-background-elevated">
      {/* Hero */}
      <header className="section-navy pt-12 pb-14">
        <div className="absolute inset-0 opacity-20 bg-dot-grid pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-primary/25 rounded-full blur-3xl pointer-events-none" />
        <div className="relative mx-auto max-w-6xl px-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-white">
              <GraduationCap className="h-7 w-7" />
              <span className="text-lg font-bold">EduBridge</span>
            </Link>
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-white/70 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" /> На главную
            </Link>
          </div>
          <h1 className="mt-8 text-3xl sm:text-4xl font-extrabold text-white">Блог EduBridge</h1>
          <p className="mt-3 max-w-xl text-white/70">
            Гайды о поступлении и учёбе за границей: визы и переезд, документы, языковые тесты, гранты и жизнь студента.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Рубрики */}
        <div className="mb-8 flex flex-wrap gap-2">
          <Link href="/blog"
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${!activeCat ? 'bg-primary text-white' : 'bg-white text-text-secondary border border-slate-200 hover:border-primary/40'}`}>
            Все
          </Link>
          {categories.map((c) => (
            <Link key={c.id} href={`/blog?cat=${c.slug}`}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${activeCat === c.slug ? 'bg-primary text-white' : 'bg-white text-text-secondary border border-slate-200 hover:border-primary/40'}`}>
              <CategoryIcon icon={c.icon} className="h-4 w-4" /> {c.name}
            </Link>
          ))}
        </div>

        {posts.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white py-20 text-center text-text-muted">
            Пока нет статей в этой рубрике. Загляните позже 🐑
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => <PostCard key={p.id} p={p} cat={catBy[p.category]} />)}
          </div>
        )}
      </div>
    </div>
  )
}
