import { test, expect } from '@playwright/test'

/**
 * Сценарий 6 — SEO / GEO.
 * Проверяем, что сайт «видим» и для Google, и для ИИ-поисковиков:
 * коды 200 без редиректа, мета-теги, structured data, robots/sitemap/llms.txt.
 */
test.describe('SEO / GEO', () => {
  test('главная: 200, без редиректа на /login, есть H1', async ({ page }) => {
    const resp = await page.goto('/')
    expect(resp?.status()).toBe(200)
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('главная: мета-теги (title/description/canonical/robots/OG)', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/EduBridge/i)
    await expect(page.locator('head meta[name="description"]')).toHaveCount(1)
    await expect(page.locator('head link[rel="canonical"]')).toHaveCount(1)
    const robots = await page.locator('head meta[name="robots"]').getAttribute('content')
    expect(robots).toMatch(/index/i)
    await expect(page.locator('head meta[property="og:title"]')).toHaveCount(1)
  })

  test('главная: structured data (Organization + WebSite + FAQPage)', async ({ page }) => {
    await page.goto('/')
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents()
    const types = new Set<string>()
    for (const raw of blocks) {
      try {
        const json = JSON.parse(raw)
        const graph = json['@graph'] ?? [json]
        for (const node of graph) if (node?.['@type']) types.add(node['@type'])
      } catch { /* пропускаем невалидный */ }
    }
    expect(types.has('EducationalOrganization')).toBeTruthy()
    expect(types.has('WebSite')).toBeTruthy()
    expect(types.has('FAQPage')).toBeTruthy()
  })

  test('главная: видимый FAQ-блок', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /частые вопросы/i })).toBeVisible()
  })

  test('robots.txt: доступен, есть Sitemap и AI-краулеры', async ({ request }) => {
    const res = await request.get('/robots.txt')
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toMatch(/Sitemap:/i)
    expect(body).toMatch(/GPTBot/)
    expect(body).toMatch(/Disallow:\s*\/admin/i)
  })

  test('sitemap.xml: доступен и содержит главную + /blog', async ({ request }) => {
    const res = await request.get('/sitemap.xml')
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toContain('university.edubridge.bond')
    expect(body).toContain('/blog')
  })

  test('llms.txt (GEO): доступен и описывает сайт', async ({ request }) => {
    const res = await request.get('/llms.txt')
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toMatch(/EduBridge/)
    expect(body.length).toBeGreaterThan(200)
  })

  test('блог: 200 без редиректа', async ({ page }) => {
    const resp = await page.goto('/blog')
    expect(resp?.status()).toBe(200)
    await expect(page).not.toHaveURL(/\/login/)
  })
})
