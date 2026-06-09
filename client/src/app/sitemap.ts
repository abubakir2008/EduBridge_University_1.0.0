import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://university.edubridge.bond'
  const now = new Date()

  // Публичная страница одна (лендинг). /login и кабинет закрыты в robots — в sitemap не включаем.
  return [
    {
      url: base,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]
}
