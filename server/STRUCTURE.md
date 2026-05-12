# Структура проекта

## Дерево папок

```
edubridge-university/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── auth.py           # POST /login, /refresh, /logout, /reset-password
│   │   │   ├── leads.py          # CRUD заявок
│   │   │   ├── users.py          # CRUD профилей, смена статуса
│   │   │   ├── universities.py   # CRUD вузов, /match
│   │   │   ├── stages.py         # CRUD этапов и требований
│   │   │   ├── favourites.py     # Избранные вузы, сравнение
│   │   │   ├── training.py       # Прогресс студента, заметки
│   │   │   ├── notifications.py  # История уведомлений
│   │   │   ├── lessons.py        # CRUD уроков
│   │   │   ├── cases.py          # CRUD кейсов
│   │   │   ├── files.py          # Загрузка файлов, pre-signed URL
│   │   │   └── admin/
│   │   │       ├── dashboard.py  # Статистика, просроченные дедлайны
│   │   │       └── notifications.py  # Ручная отправка уведомлений
│   │   └── deps.py               # Зависимости (get_current_user, require_role)
│   ├── core/
│   │   ├── config.py             # Настройки (pydantic-settings / dotenv)
│   │   ├── security.py           # JWT: create/verify access и refresh токенов
│   │   └── credentials.py        # Генерация логина и пароля
│   ├── db/
│   │   ├── base.py               # Base declarative model
│   │   ├── session.py            # Фабрика сессий, engine
│   │   └── migrations/           # Alembic миграции
│   │       ├── env.py
│   │       └── versions/
│   ├── models/                   # SQLAlchemy ORM модели
│   │   ├── user.py
│   │   ├── university.py
│   │   ├── stage.py
│   │   ├── requirement.py
│   │   ├── student_progress.py
│   │   ├── student_requirement.py
│   │   ├── student_note.py
│   │   ├── favourite.py
│   │   ├── notification.py
│   │   ├── lesson.py
│   │   ├── case.py
│   │   ├── lead.py
│   │   └── file.py
│   ├── schemas/                  # Pydantic схемы (request / response)
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── university.py
│   │   ├── stage.py
│   │   ├── training.py
│   │   ├── notification.py
│   │   ├── lesson.py
│   │   ├── case.py
│   │   ├── lead.py
│   │   └── file.py
│   ├── services/                 # Бизнес-логика
│   │   ├── auth_service.py
│   │   ├── user_service.py
│   │   ├── university_service.py
│   │   ├── matching_service.py   # Подбор вузов по данным студента
│   │   ├── training_service.py   # Логика этапов, проверка требований
│   │   ├── notification_service.py
│   │   ├── email_service.py      # SMTP отправка
│   │   └── file_service.py       # MinIO: upload / pre-signed URL / delete
│   ├── tasks/                    # Периодические задачи (дедлайны)
│   │   └── deadline_checker.py   # Проверка at_risk / overdue, отправка уведомлений
│   └── main.py                   # Точка входа, регистрация роутеров, CORS
├── tests/
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_leads.py
│   ├── test_users.py
│   ├── test_universities.py
│   ├── test_training.py
│   └── test_files.py
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── alembic.ini
├── requirements.txt              # или pyproject.toml
├── README.md
└── STRUCTURE.md
```

---

## Модели данных

### User

| Поле               | Тип                                     | Описание                              |
|--------------------|-----------------------------------------|---------------------------------------|
| `id`               | UUID                                    | Первичный ключ                        |
| `full_name`        | string                                  | ФИО                                   |
| `email`            | string, unique                          | Email                                 |
| `phone`            | string                                  | Телефон                               |
| `login`            | string, unique                          | Автогенерируемый логин                |
| `password_hash`    | string                                  | bcrypt-хэш пароля                     |
| `role`             | enum: `student`, `admin`                | Роль                                  |
| `account_status`   | enum: `active`, `archived`, `enrolled`  | Статус аккаунта                       |
| `gpa`              | float, nullable                         | Средний балл                          |
| `test_scores`      | JSON                                    | Результаты тестов (IELTS, TOEFL, SAT) |
| `achievements`     | text, nullable                          | Грамоты и достижения                  |
| `country_preference` | string[], nullable                    | Желаемые страны/страна                |
| `specialty_preference` | string, nullable                    | Желаемая специальность                |
| `created_at`       | timestamp                               |                                       |

### University

| Поле          | Тип      | Описание                          |
|---------------|----------|-----------------------------------|
| `id`          | UUID     | Первичный ключ                    |
| `name`        | string   | Название                          |
| `country`     | string   | Страна                            |
| `city`        | string   | Город                             |
| `specialties` | string[] | Специальности                     |
| `requirements`| JSON     | Минимальные требования (GPA, тесты) |
| `cost`        | integer  | Стоимость (USD/год)               |
| `rating`      | integer  | Рейтинг (QS и др.)               |
| `description` | text     |                                   |
| `logo_file_id`| UUID FK  | Ссылка на File                    |

### Stage

| Поле          | Тип           | Описание                   |
|---------------|---------------|----------------------------|
| `id`          | UUID          |                            |
| `university_id` | UUID FK     |                            |
| `name`        | string        | Название этапа             |
| `order`       | integer       | Порядковый номер           |
| `description` | text          |                            |
| `deadline`    | date, nullable| Дедлайн                    |
| `created_at`  | timestamp     |                            |

### Requirement

| Поле        | Тип                          | Описание                        |
|-------------|------------------------------|---------------------------------|
| `id`        | UUID                         |                                 |
| `stage_id`  | UUID FK                      |                                 |
| `name`      | string                       | Название требования             |
| `description` | text                       |                                 |
| `type`      | enum: `checkbox`, `file_upload` | Тип выполнения              |
| `required`  | boolean                      | Обязательное или нет            |

### StudentProgress

| Поле               | Тип                                | Описание                    |
|--------------------|------------------------------------|-----------------------------|
| `id`               | UUID                               |                             |
| `user_id`          | UUID FK                            |                             |
| `university_id`    | UUID FK                            | Выбранный вуз               |
| `current_stage_id` | UUID FK                            | Текущий этап                |
| `status`           | enum: `in_progress`, `completed`   |                             |
| `started_at`       | timestamp                          |                             |
| `updated_at`       | timestamp                          |                             |

### StudentRequirement

| Поле                  | Тип           | Описание                         |
|-----------------------|---------------|----------------------------------|
| `id`                  | UUID          |                                  |
| `student_progress_id` | UUID FK       |                                  |
| `requirement_id`      | UUID FK       |                                  |
| `completed`           | boolean       |                                  |
| `completed_at`        | timestamp     | nullable                         |
| `file_id`             | UUID FK       | nullable, только для file_upload |

### StudentNote

| Поле                  | Тип       | Описание                        |
|-----------------------|-----------|---------------------------------|
| `id`                  | UUID      |                                 |
| `student_progress_id` | UUID FK   |                                 |
| `stage_id`            | UUID FK   |                                 |
| `text`                | text      |                                 |
| `created_at`          | timestamp |                                 |
| `updated_at`          | timestamp |                                 |

### Favourite

| Поле            | Тип       | Описание |
|-----------------|-----------|----------|
| `id`            | UUID      |          |
| `user_id`       | UUID FK   |          |
| `university_id` | UUID FK   |          |
| `created_at`    | timestamp |          |

### Notification

| Поле      | Тип                              | Описание              |
|-----------|----------------------------------|-----------------------|
| `id`      | UUID                             |                       |
| `user_id` | UUID FK                          |                       |
| `type`    | string                           | Тип события           |
| `message` | text                             |                       |
| `channel` | enum: `email`, `telegram`        |                       |
| `is_read` | boolean                          |                       |
| `sent_at` | timestamp                        |                       |

### Lesson

| Поле           | Тип                                    | Описание               |
|----------------|----------------------------------------|------------------------|
| `id`           | UUID                                   |                        |
| `title`        | string                                 |                        |
| `content_type` | enum: `text`, `video`, `document`      |                        |
| `body`         | text, nullable                         | Текст урока            |
| `file_id`      | UUID FK, nullable                      | Видео / документ       |
| `stage_id`     | UUID FK, nullable                      | Привязка к этапу       |
| `order`        | integer                                |                        |

### Case

| Поле           | Тип       | Описание                       |
|----------------|-----------|--------------------------------|
| `id`           | UUID      |                                |
| `title`        | string    |                                |
| `student_name` | string    |                                |
| `university_id`| UUID FK   |                                |
| `description`  | text      | Путь поступления               |
| `photo_file_id`| UUID FK   | nullable                       |
| `published_at` | timestamp |                                |

### Lead

| Поле              | Тип                                      | Описание          |
|-------------------|------------------------------------------|-------------------|
| `id`              | UUID                                     |                   |
| `name`            | string                                   |                   |
| `contact`         | string                                   | Телефон или email |
| `country_interest`| string                                   |                   |
| `comment`         | text, nullable                           |                   |
| `status`          | enum: `new`, `contacted`, `registered`   |                   |
| `created_at`      | timestamp                                |                   |

### File

| Поле            | Тип       | Описание                         |
|-----------------|-----------|----------------------------------|
| `id`            | UUID      |                                  |
| `bucket`        | string    | `lessons`, `cases`, `universities`, `documents` |
| `object_key`    | string    | Путь внутри MinIO bucket         |
| `original_name` | string    |                                  |
| `mime_type`     | string    |                                  |
| `uploaded_by`   | UUID FK   | user_id                          |
| `created_at`    | timestamp |                                  |

---

## Все эндпоинты API

### Аутентификация — `/api/auth`

| Метод | Путь                             | Описание                                  | Доступ   |
|-------|----------------------------------|-------------------------------------------|----------|
| POST  | `/api/auth/login`                | Вход по логину/паролю, возвращает JWT     | Все      |
| POST  | `/api/auth/refresh`              | Обновление access токена                  | Все      |
| POST  | `/api/auth/logout`               | Выход (инвалидация refresh token)         | Авторизован |
| POST  | `/api/auth/reset-password/{userId}` | Генерация нового пароля (логин не меняется) | Admin |

### Заявки — `/api/leads`

| Метод | Путь              | Описание            | Доступ    |
|-------|-------------------|---------------------|-----------|
| POST  | `/api/leads`      | Создать заявку      | Публичный |
| GET   | `/api/leads`      | Список заявок       | Admin     |
| PATCH | `/api/leads/{id}` | Обновить статус     | Admin     |

### Пользователи — `/api/users`

| Метод  | Путь                         | Описание                          | Доступ        |
|--------|------------------------------|-----------------------------------|---------------|
| GET    | `/api/users`                 | Список пользователей              | Admin         |
| POST   | `/api/users`                 | Создать пользователя              | Admin         |
| GET    | `/api/users/{id}`            | Профиль пользователя              | Admin / Owner |
| PATCH  | `/api/users/{id}`            | Обновить профиль                  | Admin / Owner |
| DELETE | `/api/users/{id}`            | Удалить пользователя              | Admin         |
| PATCH  | `/api/users/{id}/status`     | Сменить статус аккаунта           | Admin         |

### Университеты — `/api/universities`

| Метод  | Путь                               | Описание                              | Доступ          |
|--------|------------------------------------|---------------------------------------|-----------------|
| GET    | `/api/universities`                | Список с фильтрами                    | Авторизован     |
| POST   | `/api/universities`                | Создать вуз                           | Admin           |
| GET    | `/api/universities/{id}`           | Детали вуза                           | Авторизован     |
| PATCH  | `/api/universities/{id}`           | Обновить вуз                          | Admin           |
| DELETE | `/api/universities/{id}`           | Удалить вуз                           | Admin           |
| GET    | `/api/universities/match`          | Подходящие вузы по профилю студента   | Student / Admin |
| GET    | `/api/universities/{id}/stages`    | Этапы вуза                            | Авторизован     |
| POST   | `/api/universities/{id}/stages`    | Создать этап                          | Admin           |

### Этапы и требования — `/api/stages`

| Метод  | Путь                  | Описание             | Доступ |
|--------|-----------------------|----------------------|--------|
| PATCH  | `/api/stages/{id}`    | Обновить этап        | Admin  |
| DELETE | `/api/stages/{id}`    | Удалить этап         | Admin  |

### Избранное — `/api/favourites`

| Метод  | Путь                                   | Описание                       | Доступ  |
|--------|----------------------------------------|--------------------------------|---------|
| GET    | `/api/favourites`                      | Список избранных вузов         | Student |
| POST   | `/api/favourites/{universityId}`       | Добавить в избранное           | Student |
| DELETE | `/api/favourites/{universityId}`       | Убрать из избранного           | Student |
| GET    | `/api/favourites/compare`              | Сравнение избранных вузов      | Student |

### Прогресс обучения — `/api/training`

| Метод | Путь                                                      | Описание                                         | Доступ        |
|-------|-----------------------------------------------------------|--------------------------------------------------|---------------|
| GET   | `/api/training/{userId}`                                  | Текущий прогресс студента                        | Owner / Admin |
| POST  | `/api/training/{userId}/start`                            | Начать путь — выбрать университет                | Student / Admin |
| PATCH | `/api/training/{userId}/requirements/{requirementId}`     | Отметить требование как выполненное              | Student       |
| POST  | `/api/training/{userId}/stage/next`                       | Перейти на следующий этап                        | Student       |
| GET   | `/api/training/{userId}/notes`                            | Получить заметки студента по этапам              | Owner / Admin |
| POST  | `/api/training/{userId}/stage/{stageId}/notes`            | Добавить заметку к этапу                        | Student       |
| PATCH | `/api/training/{userId}/notes/{noteId}`                   | Редактировать заметку                            | Student       |
| DELETE| `/api/training/{userId}/notes/{noteId}`                   | Удалить заметку                                  | Student       |

### Уведомления — `/api/notifications`

| Метод | Путь                               | Описание                            | Доступ        |
|-------|------------------------------------|-------------------------------------|---------------|
| GET   | `/api/notifications`               | История уведомлений студента        | Owner / Admin |
| PATCH | `/api/notifications/{id}/read`     | Отметить как прочитанное            | Owner         |
| POST  | `/api/admin/notifications/send`    | Ручная отправка уведомления         | Admin         |

### Уроки — `/api/lessons`

| Метод  | Путь                  | Описание         | Доступ          |
|--------|-----------------------|------------------|-----------------|
| GET    | `/api/lessons`        | Список уроков    | Student / Admin |
| GET    | `/api/lessons/{id}`   | Детали урока     | Student / Admin |
| POST   | `/api/lessons`        | Создать урок     | Admin           |
| PATCH  | `/api/lessons/{id}`   | Обновить урок    | Admin           |
| DELETE | `/api/lessons/{id}`   | Удалить урок     | Admin           |

### Кейсы — `/api/cases`

| Метод  | Путь               | Описание         | Доступ      |
|--------|--------------------|------------------|-------------|
| GET    | `/api/cases`       | Список кейсов    | Авторизован |
| GET    | `/api/cases/{id}`  | Детали кейса     | Авторизован |
| POST   | `/api/cases`       | Создать кейс     | Admin       |
| PATCH  | `/api/cases/{id}`  | Обновить кейс    | Admin       |
| DELETE | `/api/cases/{id}`  | Удалить кейс     | Admin       |

### Файлы — `/api/files`

| Метод  | Путь                       | Описание                            | Доступ      |
|--------|----------------------------|-------------------------------------|-------------|
| POST   | `/api/files/upload`        | Загрузить файл (через бэкенд)       | Admin       |
| GET    | `/api/files/{fileId}/url`  | Получить временную ссылку (pre-signed URL) | Авторизован |
| DELETE | `/api/files/{fileId}`      | Удалить файл                        | Admin       |

### Дашборд администратора — `/api/admin/dashboard`

| Метод | Путь                               | Описание                                               | Доступ |
|-------|------------------------------------|--------------------------------------------------------|--------|
| GET   | `/api/admin/dashboard`             | Сводная статистика: студенты по этапам, просроченные   | Admin  |
| GET   | `/api/admin/dashboard/overdue`     | Студенты с просроченными дедлайнами                    | Admin  |
| GET   | `/api/admin/dashboard/students`    | Полный список студентов с текущим этапом и статусом    | Admin  |

---

## Логика дедлайнов

| Статус     | Условие                           |
|------------|-----------------------------------|
| `on_track` | До дедлайна больше 7 дней         |
| `at_risk`  | До дедлайна ≤ 7 дней              |
| `overdue`  | Дедлайн уже прошёл                |

При статусах `at_risk` и `overdue` студенту автоматически отправляется email-уведомление.

---

## Триггеры уведомлений

| Событие                          | Канал | Кому    |
|----------------------------------|-------|---------|
| Аккаунт создан (логин + пароль)  | Email | Student |
| Пароль сброшен                   | Email | Student |
| Начат новый этап                 | Email | Student |
| До дедлайна этапа осталось ≤ 7 дней | Email | Student |
| Дедлайн этапа истёк              | Email | Student |

---

## MinIO бакеты

| Бакет          | Содержимое                          |
|----------------|-------------------------------------|
| `lessons`      | Видео и документы уроков            |
| `cases`        | Фото кейсов                         |
| `universities` | Логотипы университетов              |
| `documents`    | Файлы студентов (требования типа `file_upload`) |

---

## Docker Compose сервисы

| Сервис       | Образ              | Порт          | Описание               |
|--------------|--------------------|---------------|------------------------|
| `app`        | Dockerfile (custom)| 8000          | REST API бэкенд        |
| `postgresql` | postgres:16        | 5432          | База данных            |
| `minio`      | minio/minio        | 9000 / 9001   | Файловое хранилище     |
