import DOMPurify from 'isomorphic-dompurify'

// Очищает HTML перед вставкой через dangerouslySetInnerHTML.
// Работает и на сервере (SSR блога), и в браузере (isomorphic-dompurify).
// Разрешаем target/rel на ссылках, чтобы внешние ссылки в контенте открывались безопасно.
export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return ''
  return DOMPurify.sanitize(dirty, {
    ADD_ATTR: ['target', 'rel'],
    USE_PROFILES: { html: true },
  })
}
