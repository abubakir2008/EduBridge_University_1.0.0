import { test, expect } from '@playwright/test'
import { STUDENT, loginViaUI } from './helpers'

/**
 * Сценарий 4 — Кабинет студента.
 * Требует учётку студента: E2E_STUDENT_LOGIN / E2E_STUDENT_PASSWORD.
 * Без неё весь блок пропускается (skip), чтобы прогон не падал на CI без сидов.
 */
test.describe('Кабинет студента', () => {
  test.skip(!STUDENT.login, 'Нет E2E_STUDENT_LOGIN — пропускаем студенческие сценарии')

  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, STUDENT.login, STUDENT.password)
  })

  test('после входа студент попадает в «Мой путь»', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/training/)
  })

  test('страница «Мой путь»: герой прогресса ИЛИ выбор университета', async ({ page }) => {
    await page.goto('/dashboard/training')
    // Либо геймификация-герой (университет выбран), либо предложение выбрать вуз
    const heroProgress = page.getByText('Общий прогресс')
    const pickUni = page.getByRole('heading', { name: /не выбрали университет/i })
    await expect(heroProgress.or(pickUni)).toBeVisible()
  })

  test('геймификация-герой содержит плитки этапов/требований (если вуз выбран)', async ({ page }) => {
    await page.goto('/dashboard/training')
    const heroProgress = page.getByText('Общий прогресс')
    if (await heroProgress.isVisible().catch(() => false)) {
      await expect(page.getByText('Этапов')).toBeVisible()
      await expect(page.getByText('Требований')).toBeVisible()
    }
  })

  test('раздел «Университеты» открывается и грузит список', async ({ page }) => {
    await page.goto('/dashboard/universities')
    await expect(page).not.toHaveURL(/\/login/)
    const resp = await page.waitForResponse(
      (r) => r.url().includes('/api/universities') && r.request().method() === 'GET',
      { timeout: 15_000 },
    )
    expect(resp.status()).toBe(200)
  })

  test('навигация по сайдбару: Избранное и Профиль', async ({ page }) => {
    await page.goto('/dashboard/training')
    await page.getByRole('link', { name: 'Избранное' }).first().click()
    await expect(page).toHaveURL(/\/dashboard\/favourites/)
    await page.getByRole('link', { name: 'Профиль' }).first().click()
    await expect(page).toHaveURL(/\/dashboard\/profile/)
  })
})
