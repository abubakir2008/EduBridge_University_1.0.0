import { test, expect } from '@playwright/test'

/**
 * Сценарий 2 — Аутентификация и защита маршрутов.
 * Успешный UI-вход админа проверяется в auth.setup.ts (чтобы не плодить
 * логины и не упираться в rate-limit 5/min).
 */
test.describe('Аутентификация', () => {
  test('форма входа отображается', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByPlaceholder('Ваш логин')).toBeVisible()
    await expect(page.getByPlaceholder('••••••••')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Войти' })).toBeVisible()
  })

  test('неверные данные → сообщение об ошибке', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('Ваш логин').fill('no-such-user')
    await page.getByPlaceholder('••••••••').fill('wrong-password')
    await page.getByRole('button', { name: 'Войти' }).click()
    await expect(page.getByText(/Неверный логин или пароль/i)).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  test('валидация пустых полей', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Войти' }).click()
    // role=alert — сообщение об ошибке поля (точное совпадение, без подзаголовка)
    await expect(page.getByText('Введите логин', { exact: true })).toBeVisible()
  })

  test.describe('защита приватных маршрутов (без авторизации)', () => {
    const guarded = [
      '/dashboard/training',
      '/dashboard/universities',
      '/dashboard/profile',
      '/admin',
      '/admin/users',
    ]
    for (const path of guarded) {
      test(`${path} → редирект на /login`, async ({ page }) => {
        await page.goto(path)
        await expect(page).toHaveURL(/\/login/)
      })
    }
  })
})
