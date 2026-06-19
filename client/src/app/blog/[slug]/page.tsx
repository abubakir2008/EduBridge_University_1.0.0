import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { GraduationCap, ArrowLeft, ArrowRight, Calendar } from 'lucide-react'
import { fetchPostBySlug, fetchCategories } from '@/lib/serverPosts'
import { getPostCoverUrl } from '@/lib/api/posts'
import { CategoryIcon } from '@/lib/categoryIcons'

const SITE = 'https://university.edubridge.bond'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await fetchPostBySlug(params.slug)
  if (!post) return { title: 'Статья не найдена — EduBridge' }
  const title = post.seo_title || post.title
  const description = post.seo_description || post.excerpt || 'Статья о поступлении и учёбе за границей.'
  const url = `${SITE}/blog/${post.slug}`
  const image = post.cover_file_id ? `${SITE}${getPostCoverUrl(post.cover_file_id)}` : `${SITE}/opengraph-image.png`
  return {
    title: `${title} — EduBridge`,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'article', images: [image] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}

function fmtDate(d?: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const [post, categories] = await Promise.all([fetchPostBySlug(params.slug), fetchCategories()])
  if (!post) notFound()

  const cat = categories.find((c) => c.slug === post.category)
  const date = post.published_at || post.created_at
  const image = post.cover_file_id ? `${SITE}${getPostCoverUrl(post.cover_file_id)}` : undefined

  const faq = (post.faq ?? []).filter((f) => f?.question && f?.answer)

  const article = {
    '@type': 'Article',
    headline: post.title,
    description: post.seo_description || post.excerpt || undefined,
    image: image ? [image] : undefined,
    datePublished: date || undefined,
    inLanguage: 'ru',
    author: { '@type': 'Organization', name: 'EduBridge' },
    publisher: {
      '@type': 'Organization',
      name: 'EduBridge',
      logo: { '@type': 'ImageObject', url: `${SITE}/logo.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE}/blog/${post.slug}` },
  }

  const graph: object[] = [article]
  if (faq.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: faq.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    })
  }
  const jsonLd = { '@context': 'https://schema.org', '@graph': graph }

  return (
    <div className="min-h-screen bg-background-elevated">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Мини-шапка */}
      <header className="section-navy py-4">
        <div className="relative mx-auto flex max-w-3xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-white">
            <GraduationCap className="h-6 w-6" />
            <span className="font-bold">EduBridge</span>
          </Link>
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-medium text-white/70 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Все статьи
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-4 py-8">
        <Link href={`/blog?cat=${post.category}`} className="pill">
          <CategoryIcon icon={cat?.icon} className="h-3.5 w-3.5" /> {cat?.name ?? post.category}
        </Link>
        <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold leading-tight text-text-primary">{post.title}</h1>
        {date && (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-text-muted">
            <Calendar className="h-4 w-4" /> {fmtDate(date)}
          </p>
        )}

        {post.cover_file_id && (
          <div className="mt-6 overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getPostCoverUrl(post.cover_file_id)} alt={post.title} className="w-full object-cover" />
          </div>
        )}

        {post.excerpt && (
          <p className="mt-6 text-lg leading-relaxed text-text-secondary">{post.excerpt}</p>
        )}

        {post.content && (
          <div className="article-body mt-6" dangerouslySetInnerHTML={{ __html: post.content }} />
        )}

        {/* FAQ-блок (виден читателю + FAQPage-разметка для Google/ИИ) */}
        {faq.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-text-primary mb-5">Частые вопросы</h2>
            <div className="space-y-3">
              {faq.map((f, i) => (
                <details key={i} className="group rounded-card border border-slate-100 bg-white p-5 shadow-card">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold text-text-primary list-none">
                    {f.question}
                    <span className="text-primary transition-transform group-open:rotate-45 text-xl leading-none">+</span>
                  </summary>
                  <p className="mt-3 text-text-secondary leading-relaxed">{f.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="gradient-brand mt-12 rounded-3xl p-8 text-center text-white">
          <h2 className="text-2xl font-extrabold">Готов поступать за границу?</h2>
          <p className="mt-2 text-white/70">Оставь заявку — подберём вузы под твой профиль и проведём за руку до зачисления.</p>
          <Link href="/#contact"
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 font-bold text-navy transition-all hover:bg-slate-100">
            Оставить заявку <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </article>
    </div>
  )
}
