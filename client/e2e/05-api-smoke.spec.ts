import { test, expect } from '@playwright/test'
import { ADMIN } from './helpers'

/**
 * Сценарий 5 — Дымовые проверки API через прокси фронта (/api → бэкенд :8000).
 * Используем встроенный request-контекст Playwright (baseURL = фронт).
 */
test.describe('API smoke', () => {
  test('бэкенд жив: /health → 200', async ({ request }) => {
    // health отдаётся самим бэкендом, без префикса /api
    const res = await request.get('http://localhost:8000/health')
    expect(res.status()).toBe(200)
    expect(await res.json()).toMatchObject({ status: 'ok' })
  })

  test('приватный эндпоинт без авторизации → 401', async ({ request }) => {
    const res = await request.get('/api/universities')
    expect(res.status()).toBe(401)
  })

  test('логин через API устанавливает сессионные куки', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: { login: ADMIN.login, password: ADMIN.password },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('role')
    // После логина приватный эндпоинт доступен (куки в том же контексте)
    const after = await request.get('/api/users')
    expect(after.status()).toBe(200)
  })

  test('неверный логин через API → 401', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: { login: 'nope', password: 'nope' },
    })
    expect(res.status()).toBe(401)
  })
})
