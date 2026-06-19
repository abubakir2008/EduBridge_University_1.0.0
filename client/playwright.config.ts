import { defineConfig, devices } from '@playwright/test'

/**
 * E2E-конфиг EduBridge University.
 *
 * Тесты гоняются против УЖЕ запущенного фронта (localhost:3000) и бэкенда (localhost:8000).
 * Если фронт не поднят — Playwright сам стартует `npm run dev` (webServer ниже).
 *
 * Учётка админа задаётся через env (по умолчанию admin / Admin123456):
 *   E2E_ADMIN_LOGIN, E2E_ADMIN_PASSWORD
 * Учётка студента (опционально, часть сценариев пропустится без неё):
 *   E2E_STUDENT_LOGIN, E2E_STUDENT_PASSWORD
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  // Один worker: dev-сервер компилирует роуты последовательно (иначе тяжёлые
  // admin-страницы тормозят лендинг сверх таймаута), щадим rate-limit логина,
  // и так удобнее наблюдать прогон в --headed.
  workers: 1,

  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    locale: 'ru-RU',
  },

  projects: [
    // 1) Логинимся под админом и кешируем сессию.
    { name: 'setup', testMatch: /auth\.setup\.ts/ },

    // 2) Публичные сценарии (лендинг, вход, API) — без авторизации.
    {
      name: 'public',
      testIgnore: [/03-admin/, /04-student/, /auth\.setup/],
      use: { ...devices['Desktop Chrome'] },
    },

    // 3) Админские сценарии — переиспользуют сохранённую сессию.
    {
      name: 'admin',
      testMatch: /03-admin/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/admin.json' },
    },

    // 4) Студенческие сценарии — UI-логин (skip без E2E_STUDENT_LOGIN).
    {
      name: 'student',
      testMatch: /04-student/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
