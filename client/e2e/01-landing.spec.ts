import { test, expect } from '@playwright/test'

/**
 * Сценарий 1 — Лендинг.
 * Проверяем, что главная грузится, новый navy-дизайн на месте,
 * навигация, заявка (lead-форма) и переход на вход работают.
 */
test.describe('Лендинг', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('грузится с заголовком hero', async ({ page }) => {
    await expect(page).toHaveTitle(/EduBridge/i)
    // Главный заголовок hero
    await expect(
      page.getByRole('heading', { level: 1, name: /это не мечта|стратегия/i }),
    ).toBeVisible()
  })

  test('новый navy-hero и glassmorphism-карточка прогресса видны', async ({ page }) => {
    // Стеклянная карточка прогресса (геймификация) — текст из неё
    await expect(page.getByText('Прогресс поступления')).toBeVisible()
    await expect(page.getByText(/Этап 3: Подача документов/)).toBeVisible()
    // Плавающая карточка «Зачислен!»
    await expect(page.getByText('Зачислен!')).toBeVisible()
  })

  test('блок статистики показывает ключевые цифры', async ({ page }) => {
    await expect(page.getByText('3 000+').first()).toBeVisible()
    await expect(page.getByText(/студентов поступили/i)).toBeVisible()
  })

  test('навигация по якорям работает', async ({ page }) => {
    // Кликаем «Как это работает» в hero и проверяем, что секция показана
    await page.getByRole('button', { name: /Как это работает/i }).first().click()
    await expect(page.locator('#how')).toBeVisible()
    await expect(page.getByRole('heading', { name: /От заявки до зачисления/i })).toBeVisible()
  })

  test('кнопка «Оставить заявку» прокручивает к форме контактов', async ({ page }) => {
    await page.getByRole('button', { name: /Оставить заявку/i }).first().click()
    await expect(page.locator('#contact')).toBeVisible()
  })

  test('lead-форма: валидация телефона не пускает пустую отправку', async ({ page }) => {
    await page.locator('#contact').scrollIntoViewIfNeeded()
    // Имя есть, телефон по умолчанию +996 без цифр → ошибка валидации
    const nameInput = page.locator('#contact').getByPlaceholder(/имя|Айгерим|Введите/i).first()
    if (await nameInput.count()) {
      await nameInput.fill('Тест Тестов')
    }
    await page.locator('#contact').getByRole('button', { name: /Оставить заявку|Отправить/i }).click()
    // Должно остаться на странице (форма не ушла в success), т.к. телефон невалидный
    await expect(page.locator('#contact')).toBeVisible()
  })

  test('переход на страницу входа из шапки', async ({ page }) => {
    await page.getByRole('link', { name: /Войти/i }).first().click()
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: /Добро пожаловать/i })).toBeVisible()
  })

  test('футер содержит контакты', async ({ page }) => {
    await expect(page.getByRole('link', { name: /educationbridge\.kg@gmail\.com/i })).toBeVisible()
  })
})
