import { test as setup, expect } from '@playwright/test'
import { ADMIN } from './helpers'

/**
 * Auth-setup: логинимся под админом ОДИН раз и сохраняем сессию (httpOnly-куки)
 * в storageState. Все админские тесты переиспользуют её — это убирает шквал
 * логинов и обход rate-limit `5/minute` на /auth/login.
 * Заодно это и есть проверка успешного UI-входа админа.
 */
const adminFile = 'e2e/.auth/admin.json'

setup('аутентификация админа', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder('Ваш логин').fill(ADMIN.login)
  await page.getByPlaceholder('••••••••').fill(ADMIN.password)
  await page.getByRole('button', { name: 'Войти' }).click()
  await expect(page).toHaveURL(/\/admin/, { timeout: 15_000 })
  await page.context().storageState({ path: adminFile })
})
