import type { MetadataRoute } from 'next'
import { fetchPublishedPosts } from '@/lib/serverPosts'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://university.edubridge.bond'
  const now = new Date()

  const entries: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
  ]

  // Опубликованные статьи блога
  const posts = await fetchPublishedPosts()
  for (const p of posts) {
    entries.push({
      url: `${base}/blog/${p.slug}`,
      lastModified: p.published_at ? new Date(p.published_at) : now,
      changeFrequency: 'monthly',
      priority: 0.7,
    })
  }

  return entries
}
