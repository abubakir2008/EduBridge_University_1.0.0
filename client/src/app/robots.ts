import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const privateAreas = ['/dashboard/', '/admin/', '/login']
  // ИИ-краулеры (GEO): явно разрешаем индексировать публичный контент,
  // чтобы сайт попадал в ответы ChatGPT, Claude, Perplexity, Google AI.
  const aiBots = [
    'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',
    'ClaudeBot', 'anthropic-ai', 'Claude-Web',
    'PerplexityBot', 'Google-Extended', 'Applebot-Extended', 'CCBot',
  ]
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: privateAreas },
      ...aiBots.map((ua) => ({ userAgent: ua, allow: '/', disallow: privateAreas })),
    ],
    sitemap: 'https://university.edubridge.bond/sitemap.xml',
  }
}
