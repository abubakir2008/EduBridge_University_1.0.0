import { test, expect } from '@playwright/test'

/**
 * Сценарий 3 — Админка.
 * Сессия берётся из storageState (см. auth.setup.ts), без повторных логинов —
 * это уважает rate-limit /auth/login и стабилизирует параллельный прогон.
 */
test.describe('Админка', () => {
  test('дашборд админа открывается', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin/)
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.getByRole('link', { name: 'Студенты' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Заявки' })).toBeVisible()
  })

  const sections: Array<[string, RegExp]> = [
    ['Заявки', /\/admin\/leads/],
    ['Студенты', /\/admin\/users/],
    ['Университеты', /\/admin\/universities/],
    ['Кейсы', /\/admin\/cases/],
    ['Уроки', /\/admin\/lessons/],
    ['Уведомления', /\/admin\/notifications/],
    ['AI-Аналитика', /\/admin\/ai/],
  ]

  for (const [label, urlRe] of sections) {
    test(`раздел «${label}» открывается без ошибок`, async ({ page }) => {
      await page.goto('/admin')
      const link = page.getByRole('link', { name: label }).first()
      // Ретраим клик: <Link> навигирует только после гидрации React.
      await expect(async () => {
        await link.click()
        await expect(page).toHaveURL(urlRe, { timeout: 2_000 })
      }).toPass({ timeout: 15_000 })
      await expect(page).not.toHaveURL(/\/login/)
      await expect(page.locator('h1, h2, table').first()).toBeVisible()
    })
  }

  test('список студентов подгружается с бэкенда (200)', async ({ page }) => {
    await page.goto('/admin/users')
    const resp = await page.waitForResponse(
      (r) => r.url().includes('/api/users') && r.request().method() === 'GET',
      { timeout: 15_000 },
    )
    expect(resp.status()).toBe(200)
  })

  test('выход из аккаунта возвращает на логин', async ({ page }) => {
    await page.goto('/admin')
    const logout = page.getByRole('button', { name: /Выйти/i }).first()
    await expect(async () => {
      await logout.click()
      await expect(page).toHaveURL(/\/login/, { timeout: 3_000 })
    }).toPass({ timeout: 15_000 })
  })
})
