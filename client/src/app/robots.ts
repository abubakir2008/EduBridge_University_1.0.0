import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/admin/', '/login'],
      },
    ],
    sitemap: 'https://university.edubridge.bond/sitemap.xml',
  }
}
