import { Page, expect } from '@playwright/test'

/** Учётные данные из env с дефолтами под локальный стенд. */
export const ADMIN = {
  login: process.env.E2E_ADMIN_LOGIN || 'admin',
  password: process.env.E2E_ADMIN_PASSWORD || 'Admin123456',
}

export const STUDENT = {
  login: process.env.E2E_STUDENT_LOGIN || '',
  password: process.env.E2E_STUDENT_PASSWORD || '',
}

/** Авторизация через UI-форму логина. Возвращает URL, куда увёл редирект. */
export async function loginViaUI(page: Page, login: string, password: string) {
  await page.goto('/login')
  await page.getByPlaceholder('Ваш логин').fill(login)
  await page.getByPlaceholder('••••••••').fill(password)
  await page.getByRole('button', { name: 'Войти' }).click()
  // Дожидаемся ухода со страницы логина (успешный вход)
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15_000 })
  return page.url()
}

/** Логин под админом + проверка, что попали в админку. */
export async function loginAsAdmin(page: Page) {
  await loginViaUI(page, ADMIN.login, ADMIN.password)
  await expect(page).toHaveURL(/\/admin/)
}
