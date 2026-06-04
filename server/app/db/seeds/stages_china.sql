-- Этапы поступления для всех китайских университетов
-- Запускается один раз; повторный запуск безопасен (INSERT … WHERE NOT EXISTS)

DO $$
DECLARE
  uni        RECORD;
  s1 UUID; s2 UUID; s3 UUID; s4 UUID; s5 UUID; s6 UUID; s7 UUID;
BEGIN
  FOR uni IN
    SELECT id FROM universities WHERE deleted_at IS NULL
  LOOP
    -- пропускаем если этапы уже есть
    IF (SELECT COUNT(*) FROM stages WHERE university_id = uni.id) > 0 THEN
      CONTINUE;
    END IF;

    s1 := gen_random_uuid();
    s2 := gen_random_uuid();
    s3 := gen_random_uuid();
    s4 := gen_random_uuid();
    s5 := gen_random_uuid();
    s6 := gen_random_uuid();
    s7 := gen_random_uuid();

    -- ── ЭТАП 1: Подготовка документов ────────────────────────────────────────
    INSERT INTO stages (id, university_id, name, "order", description, deadline_days)
    VALUES (s1, uni.id, 'Подготовка документов', 1,
      'Сбор и подготовка всех необходимых документов для поступления', 30);

    INSERT INTO requirements (id, stage_id, name, description, type, required) VALUES
      (gen_random_uuid(), s1, 'Оригинал аттестата / диплома',
        'Школьный аттестат или диплом предыдущего вуза', 'file_upload', true),
      (gen_random_uuid(), s1, 'Академическая справка с оценками',
        'Транскрипт с оценками за все годы обучения', 'file_upload', true),
      (gen_random_uuid(), s1, 'Паспорт (действующий)',
        'Срок действия должен быть не менее 18 месяцев', 'file_upload', true),
      (gen_random_uuid(), s1, 'Фотографии 3×4 (6 штук)',
        'На белом фоне, цветные', 'checkbox', true),
      (gen_random_uuid(), s1, 'Медицинская справка о состоянии здоровья',
        'Справка с печатью медучреждения', 'file_upload', true);

    -- ── ЭТАП 2: Нотариальный перевод и заверение ─────────────────────────────
    INSERT INTO stages (id, university_id, name, "order", description, deadline_days)
    VALUES (s2, uni.id, 'Нотариальный перевод документов', 2,
      'Перевод всех документов на китайский или английский язык с нотариальным заверением', 21);

    INSERT INTO requirements (id, stage_id, name, description, type, required) VALUES
      (gen_random_uuid(), s2, 'Нотариально заверенный перевод аттестата',
        'Перевод на китайский язык, заверен нотариусом', 'file_upload', true),
      (gen_random_uuid(), s2, 'Нотариально заверенный перевод транскрипта',
        'Перевод всех оценок', 'file_upload', true),
      (gen_random_uuid(), s2, 'Нотариально заверенная копия паспорта',
        'Страница с фото и личными данными', 'file_upload', true),
      (gen_random_uuid(), s2, 'Апостиль на аттестат (если требуется)',
        'Для некоторых вузов необходим апостиль', 'file_upload', false);

    -- ── ЭТАП 3: Языковая подготовка ──────────────────────────────────────────
    INSERT INTO stages (id, university_id, name, "order", description, deadline_days)
    VALUES (s3, uni.id, 'Языковая подготовка', 3,
      'Подтверждение знания китайского или английского языка', 45);

    INSERT INTO requirements (id, stage_id, name, description, type, required) VALUES
      (gen_random_uuid(), s3, 'Сдать экзамен HSK (уровень 3+)',
        'Для программ на китайском языке — минимум HSK 3', 'checkbox', false),
      (gen_random_uuid(), s3, 'Сертификат HSK',
        'Загрузить скан сертификата', 'file_upload', false),
      (gen_random_uuid(), s3, 'Сертификат IELTS / TOEFL',
        'Для программ на английском языке — IELTS 5.5+ или TOEFL 70+', 'file_upload', false),
      (gen_random_uuid(), s3, 'Пройти языковое собеседование с вузом',
        'Некоторые вузы проводят онлайн-интервью', 'checkbox', false);

    -- ── ЭТАП 4: Подача заявки в университет ─────────────────────────────────
    INSERT INTO stages (id, university_id, name, "order", description, deadline_days)
    VALUES (s4, uni.id, 'Подача заявки', 4,
      'Заполнение анкеты и отправка документов в университет', 14);

    INSERT INTO requirements (id, stage_id, name, description, type, required) VALUES
      (gen_random_uuid(), s4, 'Заполнить онлайн-анкету университета',
        'Зарегистрироваться на сайте вуза и заполнить форму поступления', 'checkbox', true),
      (gen_random_uuid(), s4, 'Мотивационное письмо',
        'На китайском или английском языке, 500–1000 слов', 'file_upload', true),
      (gen_random_uuid(), s4, 'Рекомендательное письмо (2 штуки)',
        'От учителей или преподавателей вуза', 'file_upload', true),
      (gen_random_uuid(), s4, 'Оплата регистрационного взноса',
        'Сохранить квитанцию об оплате', 'file_upload', true),
      (gen_random_uuid(), s4, 'Загрузить все документы в систему вуза',
        'Проверить, что все файлы приняты', 'checkbox', true);

    -- ── ЭТАП 5: Ожидание решения ─────────────────────────────────────────────
    INSERT INTO stages (id, university_id, name, "order", description, deadline_days)
    VALUES (s5, uni.id, 'Ожидание решения', 5,
      'Ожидание официального ответа от университета (обычно 4–8 недель)', 60);

    INSERT INTO requirements (id, stage_id, name, description, type, required) VALUES
      (gen_random_uuid(), s5, 'Отслеживать статус заявки в системе вуза',
        'Регулярно проверять личный кабинет на сайте университета', 'checkbox', true),
      (gen_random_uuid(), s5, 'Получить письмо о зачислении (Admission Letter)',
        'Официальное письмо о приёме', 'file_upload', true),
      (gen_random_uuid(), s5, 'Получить JW202 (форма для стипендии CSC)',
        'Только для стипендиатов государственной стипендии', 'file_upload', false);

    -- ── ЭТАП 6: Оформление студенческой визы ─────────────────────────────────
    INSERT INTO stages (id, university_id, name, "order", description, deadline_days)
    VALUES (s6, uni.id, 'Оформление студенческой визы (X1)', 6,
      'Подача документов в посольство КНР для получения студенческой визы', 21);

    INSERT INTO requirements (id, stage_id, name, description, type, required) VALUES
      (gen_random_uuid(), s6, 'Анкета на визу (заполнена онлайн)',
        'Заполнить форму на сайте посольства КНР', 'file_upload', true),
      (gen_random_uuid(), s6, 'Оригинал Admission Letter',
        'Оригинал приглашения от университета', 'file_upload', true),
      (gen_random_uuid(), s6, 'Медицинская форма для КНР (форма JW-L01)',
        'Пройти медицинский осмотр в сертифицированной клинике', 'file_upload', true),
      (gen_random_uuid(), s6, 'Подтверждение оплаты первого семестра',
        'Квитанция о переводе средств в вуз', 'file_upload', false),
      (gen_random_uuid(), s6, 'Получить визу X1',
        'Вклеить визу в паспорт, проверить дату начала действия', 'checkbox', true);

    -- ── ЭТАП 7: Подготовка к отъезду ─────────────────────────────────────────
    INSERT INTO stages (id, university_id, name, "order", description, deadline_days)
    VALUES (s7, uni.id, 'Подготовка к отъезду', 7,
      'Финальные шаги перед отъездом в Китай', 21);

    INSERT INTO requirements (id, stage_id, name, description, type, required) VALUES
      (gen_random_uuid(), s7, 'Купить авиабилеты',
        'Сохранить маршрутную квитанцию', 'file_upload', true),
      (gen_random_uuid(), s7, 'Оформить страховку здоровья',
        'Международная медицинская страховка на весь период обучения', 'file_upload', true),
      (gen_random_uuid(), s7, 'Забронировать общежитие или жильё',
        'Заявка в вузовское общежитие или договор аренды', 'checkbox', true),
      (gen_random_uuid(), s7, 'Обменять валюту / открыть карту',
        'Наличные юани и/или международная банковская карта', 'checkbox', true),
      (gen_random_uuid(), s7, 'Пройти регистрацию в полиции по прибытии',
        'В течение 24 часов после заселения зарегистрироваться в местном отделении полиции', 'checkbox', true);

  END LOOP;
END;
$$;
