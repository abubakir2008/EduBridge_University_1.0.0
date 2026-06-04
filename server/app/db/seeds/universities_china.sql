-- Seed: Universities from China (Shanghai & Jiangsu)
-- Run: docker exec -i edubridge_db psql -U postgres -d edubridge < /path/to/universities_china.sql

INSERT INTO universities (
    id, name, country, city, province,
    has_language_year, min_requirements,
    tuition_bachelor, tuition_masters, tuition_language_year, application_fee,
    dormitory_info,
    programs_bachelor_chinese, programs_masters_chinese,
    programs_bachelor_english, programs_masters_english,
    documents_bachelor, documents_masters, documents_language_year,
    difficulty, deadline,
    specialties, rating, cost, description
) VALUES

-- 1. Shanghai University
(
    gen_random_uuid(), 'Shanghai University', 'China', 'Shanghai', 'Shanghai',
    true,
    'Аттестат о полном среднем образовании. Возраст обычно до 25 лет. IELTS 5.5–6.0 или TOEFL 70+ для английских программ. HSK 4–5 для китайских программ. Средний GPA желательно выше 70–75%.',
    '25 000 – 40 000 RMB в год', '30 000 – 45 000 RMB в год', '15 000 – 22 000 RMB в год', 'Около 800 RMB',
    'Двухместные комнаты, интернет, кондиционер, прачечная, общая кухня, иногда отдельный санузел. 4 000 – 12 000 RMB в год.',
    '["临床医学 — Клиническая медицина", "汉语言文学 — Китайская филология", "法学 — Юриспруденция", "新闻学 — Журналистика", "教育学 — Педагогика", "土木工程 — Гражданское строительство", "计算机科学与技术 — Компьютерные науки", "软件工程 — Программная инженерия", "自动化 — Автоматизация", "金融学 — Финансы", "国际经济与贸易 — Международная экономика и торговля"]',
    '["计算机技术 — Компьютерные технологии", "人工智能 — Искусственный интеллект", "法律 — Право", "教育学 — Педагогика", "新闻传播学 — Медиа и коммуникации", "金融学 — Финансы", "企业管理 — Управление бизнесом", "建筑学 — Архитектура"]',
    '["International Economics and Trade", "Business Administration", "Mechanical Engineering", "Civil Engineering", "Computer Science and Technology", "Electrical Engineering and Automation", "Software Engineering", "Finance", "International Business", "Architecture", "Environmental Engineering", "Material Science and Engineering"]',
    '["MBA", "International Trade", "Mechanical Engineering", "Civil Engineering", "Computer Science", "Artificial Intelligence", "Data Science", "Electrical Engineering", "Finance", "Applied Economics"]',
    '["Паспорт", "Аттестат", "Транскрипт оценок", "Фото", "Медицинская форма (Foreigner Physical Examination)", "Bank Statement", "Certificate of No Criminal Record", "Языковой сертификат"]',
    '["Паспорт", "Диплом бакалавра", "Transcript", "Recommendation Letters", "Study Plan / Research Proposal", "Языковой сертификат", "Медицинская форма"]',
    '["Паспорт", "Аттестат", "Фото", "Bank Statement", "Медицинская форма"]',
    'Сложно', 'Февральский intake: октябрь – декабрь 2025. Сентябрьский intake: январь – июнь 2026.',
    '["Компьютерные науки", "Финансы", "Инженерия", "Журналистика"]', 4, 32000, 'Крупный государственный университет в Шанхае с широким спектром программ.'
),

-- 2. Shanghai Jiao Tong University
(
    gen_random_uuid(), 'Shanghai Jiao Tong University', 'China', 'Shanghai', 'Shanghai',
    true,
    'Высокий GPA. IELTS 6.0–6.5, TOEFL 80–90. HSK 5–6 для китайских программ.',
    '24 000 – 80 000 RMB в год', '35 000 – 120 000 RMB в год', '13 000 – 25 000 RMB в год', '800 RMB',
    'Международные общежития, single/double rooms, интернет, кондиционер, душ, учебные зоны.',
    '["临床医学 — Клиническая медицина", "口腔医学 — Стоматология", "法学 — Юриспруденция", "汉语言 — Китайский язык", "金融学 — Финансы", "软件工程 — Программная инженерия", "计算机科学与技术 — Компьютерные науки", "人工智能 — Искусственный интеллект"]',
    '["法律 — Право", "金融学 — Финансы", "新闻传播学 — Медиа и коммуникации"]',
    '["Computer Science and Technology", "Mechanical Engineering", "Electrical Engineering", "Civil Engineering", "Biomedical Engineering", "Business Administration", "Finance", "Artificial Intelligence"]',
    '["MBA", "Data Science", "Artificial Intelligence", "Mechanical Engineering", "International Business", "Finance"]',
    '["Паспорт", "Аттестат", "Transcript", "IELTS/TOEFL или HSK", "Study Plan", "Медицинская форма"]',
    '["Паспорт", "Bachelor Diploma", "Recommendation Letters", "Research Proposal", "Language Certificate", "CV"]',
    '["Паспорт", "Аттестат", "Фото", "Bank Statement"]',
    'Сложно', 'Обычно до марта–апреля 2026 для degree programs. Языковой год — до июня–июля 2026.',
    '["Компьютерные науки", "Медицина", "Инженерия", "Финансы", "Искусственный интеллект"]', 1, 52000, 'Один из ведущих университетов Китая, входит в топ-100 мировых рейтингов.'
),

-- 3. Shanghai University of Finance and Economics
(
    gen_random_uuid(), 'Shanghai University of Finance and Economics', 'China', 'Shanghai', 'Shanghai',
    true,
    'IELTS 5.5+. HSK 4–5 для китайских программ.',
    '30 000 RMB в год', '32 000 – 45 000 RMB в год', '10 000 – 18 000 RMB в год', '830 RMB',
    'Double rooms, интернет, общая кухня, прачечная, Security 24/7.',
    '["金融学 — Финансы", "国际经济与贸易 — Международная экономика и торговля", "会计学 — Бухгалтерский учёт", "工商管理 — Управление бизнесом", "经济学 — Экономика"]',
    '["金融学 — Финансы", "应用经济学 — Прикладная экономика", "企业管理 — Управление предприятием", "会计学 — Бухгалтерский учёт"]',
    '["International Economics and Trade", "Finance", "Accounting", "Business Administration", "Economics", "Applied Economics"]',
    '["International Business", "Finance", "MBA", "Accounting"]',
    '["Паспорт", "Аттестат", "Transcript", "Language Certificate", "Medical Form", "Bank Statement"]',
    '["Bachelor Diploma", "Recommendation Letters", "Research Proposal", "CV", "Language Certificate"]',
    '["Паспорт", "Аттестат", "Фото", "Финансовая гарантия"]',
    'Средний', 'Бакалавр и магистратура: март – май 2026. Языковой год: до июня–июля 2026.',
    '["Финансы", "Экономика", "Бухгалтерский учёт", "Международный бизнес"]', 5, 30000, 'Специализированный финансово-экономический университет Шанхая.'
),

-- 4. East China Normal University
(
    gen_random_uuid(), 'East China Normal University', 'China', 'Shanghai', 'Shanghai',
    true,
    'Аттестат о полном среднем образовании. IELTS 5.5+ или TOEFL 70+. HSK 4–5. Возраст обычно до 25 лет.',
    '24 000 – 36 000 RMB в год', '30 000 – 42 000 RMB в год', '12 000 – 20 000 RMB в год', '800 RMB',
    'Double rooms и single rooms, интернет, кондиционер, прачечная, кухня, охрана 24/7.',
    '["汉语言文学 — Китайская филология", "教育学 — Педагогика", "心理学 — Психология", "计算机科学与技术 — Компьютерные науки", "软件工程 — Программная инженерия", "法学 — Юриспруденция", "新闻学 — Журналистика", "金融学 — Финансы"]',
    '["应用心理学 — Прикладная психология", "教育管理 — Управление образованием", "人工智能 — Искусственный интеллект", "金融学 — Финансы", "法律 — Право", "新闻传播学 — Медиа и коммуникации"]',
    '["International Chinese Language Education", "Business Administration", "Finance", "Software Engineering", "Computer Science and Technology", "Psychology", "Education", "International Economics and Trade"]',
    '["Applied Psychology", "MBA", "Computer Science", "Data Science", "International Business", "Education Management", "Finance"]',
    '["Паспорт", "Аттестат", "Transcript", "Фото", "Языковой сертификат", "Medical Form", "Bank Statement", "Certificate of No Criminal Record"]',
    '["Bachelor Diploma", "Transcript", "Research Proposal", "Recommendation Letters", "CV", "Language Certificate"]',
    '["Паспорт", "Аттестат", "Фото", "Bank Statement", "Медицинская форма"]',
    'Средний', 'Обычно январь – май 2026 на degree programs. Языковой год до июня–июля 2026.',
    '["Педагогика", "Психология", "Компьютерные науки", "Финансы"]', 6, 28000, 'Один из ведущих педагогических университетов Китая.'
),

-- 5. Tongji University
(
    gen_random_uuid(), 'Tongji University', 'China', 'Shanghai', 'Shanghai',
    true,
    'IELTS 6.0+, TOEFL 80+. HSK 5 для китайских программ. Высокий GPA.',
    '26 000 – 45 000 RMB в год', '35 000 – 55 000 RMB в год', '14 000 – 22 000 RMB в год', '800 RMB',
    'Single и double rooms, интернет, кондиционер, стиральные машины, учебные зоны, общая кухня.',
    '["建筑学 — Архитектура", "土木工程 — Гражданское строительство", "计算机科学与技术 — Компьютерные науки", "软件工程 — Программная инженерия", "人工智能 — Искусственный интеллект", "交通运输工程 — Транспортная инженерия", "金融学 — Финансы"]',
    '["建筑学 — Архитектура", "城市规划 — Городское планирование", "人工智能 — Искусственный интеллект", "交通运输工程 — Транспортная инженерия", "环境工程 — Экологическая инженерия", "金融学 — Финансы"]',
    '["Architecture", "Civil Engineering", "Environmental Engineering", "Mechanical Engineering", "Computer Science and Technology", "Software Engineering", "Business Administration", "Artificial Intelligence"]',
    '["Architecture", "Urban Planning", "Civil Engineering", "Computer Science", "Artificial Intelligence", "Environmental Engineering", "MBA"]',
    '["Паспорт", "Аттестат", "Transcript", "IELTS/TOEFL или HSK", "Study Plan", "Medical Form", "Financial Guarantee"]',
    '["Bachelor Diploma", "Transcript", "Research Proposal", "CV", "Recommendation Letters", "Language Certificate"]',
    '["Паспорт", "Аттестат", "Фото", "Bank Statement"]',
    'Сложно', 'Февраль – апрель 2026 на бакалавр и магистратуру. Языковой год обычно до июля 2026.',
    '["Архитектура", "Гражданское строительство", "Инженерия", "Искусственный интеллект"]', 3, 38000, 'Известен архитектурными и инженерными программами, входит в C9 League.'
),

-- 6. Donghua University
(
    gen_random_uuid(), 'Donghua University', 'China', 'Shanghai', 'Shanghai',
    true,
    'Аттестат. IELTS 5.5+. HSK 4–5 для китайских программ.',
    '22 000 – 38 000 RMB в год', '28 000 – 45 000 RMB в год', '11 000 – 18 000 RMB в год', '600 RMB',
    'Double rooms, интернет, кондиционер, общая кухня, прачечная, охрана.',
    '["服装设计 — Дизайн одежды", "纺织工程 — Текстильная инженерия", "计算机科学与技术 — Компьютерные науки", "软件工程 — Программная инженерия", "金融学 — Финансы", "国际经济与贸易 — Международная экономика и торговля"]',
    '["服装设计 — Дизайн одежды", "纺织工程 — Текстильная инженерия", "金融学 — Финансы", "工商管理 — Управление бизнесом", "环境科学 — Экологические науки"]',
    '["International Economics and Trade", "Business Administration", "Fashion Design", "Textile Engineering", "Computer Science and Technology", "Software Engineering", "Environmental Engineering"]',
    '["International Business", "Fashion and Design", "Textile Engineering", "Computer Science", "Environmental Science", "MBA"]',
    '["Паспорт", "Аттестат", "Transcript", "Фото", "Language Certificate", "Medical Form", "Financial Guarantee"]',
    '["Bachelor Diploma", "Transcript", "Recommendation Letters", "Research Proposal", "CV", "Language Certificate"]',
    '["Паспорт", "Аттестат", "Фото", "Bank Statement"]',
    'Средний', 'Март – май 2026 на degree programs. Языковой год до июня–июля 2026.',
    '["Дизайн", "Текстиль", "Компьютерные науки", "Финансы"]', 7, 25000, 'Известен программами по дизайну одежды и текстильной инженерии.'
),

-- 7. Fudan University
(
    gen_random_uuid(), 'Fudan University', 'China', 'Shanghai', 'Shanghai',
    true,
    'Аттестат о полном среднем образовании. IELTS 6.0–6.5 или TOEFL 80+. HSK 5–6. Высокий GPA.',
    '26 000 – 80 000 RMB в год', '35 000 – 120 000 RMB в год', '14 000 – 25 000 RMB в год', '800 RMB',
    'Single и double rooms, интернет, кондиционер, прачечная, учебные комнаты, охрана 24/7.',
    '["临床医学 — Клиническая медицина", "法学 — Юриспруденция", "国际政治 — Международная политика", "汉语言文学 — Китайская филология", "新闻学 — Журналистика", "计算机科学与技术 — Компьютерные науки", "软件工程 — Программная инженерия", "金融学 — Финансы"]',
    '["国际关系 — Международные отношения", "金融学 — Финансы", "新闻传播学 — Медиа и коммуникации", "人工智能 — Искусственный интеллект", "公共卫生 — Общественное здравоохранение", "法律 — Право"]',
    '["Clinical Medicine", "International Politics", "Chinese Economy", "Business Administration", "Computer Science and Technology", "Software Engineering", "Data Science", "Environmental Science"]',
    '["MBA", "International Relations", "Chinese Politics", "Finance", "Public Health", "Computer Science", "Artificial Intelligence", "Data Science"]',
    '["Паспорт", "Аттестат", "Transcript", "Language Certificate", "Study Plan", "Medical Form", "Bank Statement", "Certificate of No Criminal Record"]',
    '["Bachelor Diploma", "Transcript", "Research Proposal", "Recommendation Letters", "CV", "Language Certificate", "Medical Form"]',
    '["Паспорт", "Аттестат", "Фото", "Bank Statement", "Медицинская форма"]',
    'Сложно', 'Февраль – апрель 2026 на degree programs. Языковой год до июня–июля 2026.',
    '["Медицина", "Политика", "Компьютерные науки", "Финансы", "Журналистика"]', 2, 55000, 'Один из самых престижных университетов Китая, входит в C9 League.'
),

-- 8. East China University of Science and Technology
(
    gen_random_uuid(), 'East China University of Science and Technology', 'China', 'Shanghai', 'Shanghai',
    true,
    'Аттестат. IELTS 5.5–6.0. HSK 4–5 для китайских программ. Возраст обычно до 25 лет.',
    '22 000 – 38 000 RMB в год', '30 000 – 48 000 RMB в год', '12 000 – 20 000 RMB в год', '600 RMB',
    'Double rooms, интернет, кондиционер, общая кухня, прачечная, охрана.',
    '["化学工程 — Химическая инженерия", "计算机科学与技术 — Компьютерные науки", "软件工程 — Программная инженерия", "金融学 — Финансы", "国际经济与贸易 — Международная экономика и торговля", "环境工程 — Экологическая инженерия"]',
    '["化学工程 — Химическая инженерия", "环境工程 — Экологическая инженерия", "金融学 — Финансы", "工商管理 — Управление бизнесом", "人工智能 — Искусственный интеллект"]',
    '["Chemical Engineering", "Computer Science and Technology", "Software Engineering", "Business Administration", "International Economics and Trade", "Environmental Engineering", "Mechanical Engineering"]',
    '["Chemical Engineering", "MBA", "Computer Science", "Environmental Science", "Mechanical Engineering", "International Business"]',
    '["Паспорт", "Аттестат", "Transcript", "Language Certificate", "Medical Form", "Financial Guarantee"]',
    '["Bachelor Diploma", "Transcript", "Research Proposal", "Recommendation Letters", "CV", "Language Certificate"]',
    '["Паспорт", "Аттестат", "Фото", "Bank Statement"]',
    'Легко', 'Март – май 2026. Языковой год до июня–июля 2026.',
    '["Химическая инженерия", "Экология", "Компьютерные науки", "Финансы"]', 8, 28000, 'Специализируется на химической инженерии и естественных науках.'
),

-- 9. University of Shanghai for Science and Technology
(
    gen_random_uuid(), 'University of Shanghai for Science and Technology', 'China', 'Shanghai', 'Shanghai',
    true,
    'Аттестат. IELTS 5.5+. HSK 4–5 для китайских программ.',
    '20 000 – 35 000 RMB в год', '28 000 – 42 000 RMB в год', '10 000 – 18 000 RMB в год', '500 RMB',
    'Double rooms, интернет, кондиционер, прачечная, кухня, охрана 24/7.',
    '["机械工程 — Машиностроение", "电气工程 — Электротехника", "计算机科学与技术 — Компьютерные науки", "软件工程 — Программная инженерия", "金融学 — Финансы", "国际经济与贸易 — Международная экономика и торговля"]',
    '["机械工程 — Машиностроение", "人工智能 — Искусственный интеллект", "电气工程 — Электротехника", "工商管理 — Управление бизнесом", "金融学 — Финансы"]',
    '["Mechanical Engineering", "Electrical Engineering", "Computer Science and Technology", "Software Engineering", "Business Administration", "International Economics and Trade", "Biomedical Engineering"]',
    '["Mechanical Engineering", "Computer Science", "Electrical Engineering", "MBA", "International Business", "Biomedical Engineering"]',
    '["Паспорт", "Аттестат", "Transcript", "Фото", "Language Certificate", "Medical Form", "Bank Statement"]',
    '["Bachelor Diploma", "Transcript", "Recommendation Letters", "Research Proposal", "CV", "Language Certificate"]',
    '["Паспорт", "Аттестат", "Фото", "Bank Statement"]',
    'Средний', 'Март – июнь 2026. Языковой год обычно до июля 2026.',
    '["Машиностроение", "Электротехника", "Компьютерные науки", "Биомедицина"]', 9, 25000, 'Технический университет с сильными инженерными и прикладными программами.'
),

-- 10. Shanghai Normal University
(
    gen_random_uuid(), 'Shanghai Normal University', 'China', 'Shanghai', 'Shanghai',
    true,
    'Аттестат. IELTS 5.5+. HSK 4–5 для китайских программ. Возраст обычно до 25 лет.',
    '20 000 – 32 000 RMB в год', '26 000 – 40 000 RMB в год', '10 000 – 17 000 RMB в год', '500 RMB',
    'Double rooms, интернет, кондиционер, прачечная, кухня, охрана 24/7. Стоимость проживания 4 000 – 8 000 RMB в год.',
    '["汉语言文学 — Китайская филология", "教育学 — Педагогика", "计算机科学与技术 — Компьютерные науки", "软件工程 — Программная инженерия", "金融学 — Финансы", "旅游管理 — Туризм", "新闻学 — Журналистика"]',
    '["教育管理 — Управление образованием", "应用语言学 — Прикладная лингвистика", "金融学 — Финансы", "新闻传播学 — Медиа и коммуникации", "人工智能 — Искусственный интеллект"]',
    '["International Economics and Trade", "Business Administration", "Computer Science and Technology", "Software Engineering", "Chinese Language Education", "Finance", "Tourism Management"]',
    '["International Business", "Applied Linguistics", "Computer Science", "MBA", "Education Management", "Finance"]',
    '["Паспорт", "Аттестат", "Transcript", "Фото", "Language Certificate", "Medical Form", "Bank Statement"]',
    '["Bachelor Diploma", "Transcript", "Recommendation Letters", "Research Proposal", "CV", "Language Certificate"]',
    '["Паспорт", "Аттестат", "Фото", "Financial Guarantee"]',
    'Средний', 'Март – июнь 2026. Языковой год до июля 2026.',
    '["Педагогика", "Туризм", "Лингвистика", "Компьютерные науки"]', 10, 22000, 'Педагогический университет с широкой гуманитарной базой.'
),

-- 11. Shanghai Maritime University
(
    gen_random_uuid(), 'Shanghai Maritime University', 'China', 'Shanghai', 'Shanghai',
    true,
    'Аттестат. IELTS 5.5+. HSK 4–5 для китайских программ.',
    '18 000 – 32 000 RMB в год', '25 000 – 40 000 RMB в год', '9 000 – 15 000 RMB в год', '400 RMB',
    'Double rooms, интернет, кондиционер, прачечная, общая кухня.',
    '["物流管理 — Логистика", "航运管理 — Морское управление", "国际经济与贸易 — Международная экономика и торговля", "计算机科学与技术 — Компьютерные науки", "机械工程 — Машиностроение", "电气工程 — Электротехника"]',
    '["物流工程 — Логистическая инженерия", "交通运输工程 — Транспортная инженерия", "工商管理 — Управление бизнесом", "人工智能 — Искусственный интеллект", "金融学 — Финансы"]',
    '["Logistics Management", "Shipping Management", "International Economics and Trade", "Computer Science and Technology", "Electrical Engineering", "Mechanical Engineering", "Business Administration"]',
    '["Logistics Engineering", "Transportation Management", "International Business", "Computer Science", "MBA"]',
    '["Паспорт", "Аттестат", "Transcript", "Language Certificate", "Medical Form", "Bank Statement"]',
    '["Bachelor Diploma", "Transcript", "Recommendation Letters", "Research Proposal", "CV", "Language Certificate"]',
    '["Паспорт", "Аттестат", "Фото", "Bank Statement"]',
    'Легко', 'Март – июнь 2026. Языковой год до июля 2026.',
    '["Логистика", "Морское управление", "Транспорт", "Компьютерные науки"]', 11, 22000, 'Специализируется на морском деле, логистике и транспортной инженерии.'
),

-- 12. Shanghai Ocean University
(
    gen_random_uuid(), 'Shanghai Ocean University', 'China', 'Shanghai', 'Shanghai',
    true,
    'Аттестат. IELTS 5.5+. HSK 4–5 для китайских программ.',
    '18 000 – 30 000 RMB в год', '24 000 – 38 000 RMB в год', '8 000 – 14 000 RMB в год', '400 RMB',
    'Double rooms, интернет, кондиционер, прачечная, кухня, охрана. Стоимость проживания 3 500 – 7 000 RMB в год.',
    '["水产养殖学 — Аквакультура", "食品科学与工程 — Пищевая инженерия", "环境科学 — Экологические науки", "计算机科学与技术 — Компьютерные науки", "金融学 — Финансы"]',
    '["海洋生物学 — Морская биология", "食品科学 — Пищевая наука", "环境工程 — Экологическая инженерия", "工商管理 — Управление бизнесом", "人工智能 — Искусственный интеллект"]',
    '["Aquaculture", "Food Science and Engineering", "Environmental Science", "Computer Science and Technology", "Business Administration", "International Economics and Trade"]',
    '["Marine Biology", "Food Science", "Environmental Engineering", "International Business", "Computer Science"]',
    '["Паспорт", "Аттестат", "Transcript", "Language Certificate", "Medical Form", "Financial Guarantee"]',
    '["Bachelor Diploma", "Transcript", "Research Proposal", "Recommendation Letters", "CV", "Language Certificate"]',
    '["Паспорт", "Аттестат", "Фото", "Bank Statement"]',
    'Легко', 'Март – июнь 2026. Языковой год обычно до июля 2026.',
    '["Аквакультура", "Пищевая наука", "Морская биология", "Экология"]', 12, 20000, 'Специализируется на морских науках, рыболовстве и пищевой инженерии.'
),

-- 13. Nanjing University
(
    gen_random_uuid(), 'Nanjing University', 'China', 'Nanjing', 'Jiangsu',
    true,
    'Аттестат. IELTS 6.0+ или TOEFL 80+. HSK 5–6 для китайских программ. Высокий GPA.',
    '26 000 – 45 000 RMB в год', '35 000 – 55 000 RMB в год', '12 000 – 20 000 RMB в год', '600 RMB',
    'Single и double rooms, интернет, кондиционер, прачечная, учебные зоны, охрана 24/7. Стоимость проживания 6 000 – 15 000 RMB в год.',
    '["计算机科学与技术 — Компьютерные науки", "软件工程 — Программная инженерия", "人工智能 — Искусственный интеллект", "金融学 — Финансы", "法学 — Юриспруденция", "新闻学 — Журналистика", "汉语言文学 — Китайская филология", "物理学 — Физика"]',
    '["人工智能 — Искусственный интеллект", "金融学 — Финансы", "法律 — Право", "国际关系 — Международные отношения", "环境工程 — Экологическая инженерия", "新闻传播学 — Медиа и коммуникации"]',
    '["Computer Science and Technology", "Software Engineering", "Artificial Intelligence", "Environmental Science", "Business Administration", "International Economics and Trade", "Finance", "Physics"]',
    '["Computer Science", "Artificial Intelligence", "MBA", "International Relations", "Environmental Engineering", "Finance", "Data Science"]',
    '["Паспорт", "Аттестат", "Transcript", "Language Certificate", "Study Plan", "Medical Form", "Bank Statement", "Certificate of No Criminal Record"]',
    '["Bachelor Diploma", "Transcript", "Research Proposal", "Recommendation Letters", "CV", "Language Certificate"]',
    '["Паспорт", "Аттестат", "Фото", "Bank Statement"]',
    'Сложно', 'Февраль – апрель 2026. Языковой год до июля 2026.',
    '["Искусственный интеллект", "Физика", "Право", "Финансы"]', 2, 38000, 'Один из ведущих университетов Китая, входит в C9 League. Расположен в Нанкине.'
),

-- 14. Southeast University
(
    gen_random_uuid(), 'Southeast University', 'China', 'Nanjing', 'Jiangsu',
    true,
    'IELTS 6.0+, TOEFL 80+. HSK 5 для китайских программ. Высокий GPA.',
    '24 000 – 42 000 RMB в год', '34 000 – 52 000 RMB в год', '11 000 – 18 000 RMB в год', '500 RMB',
    'Single и double rooms, интернет, кондиционер, прачечная, кухня, охрана. Стоимость проживания 6 000 – 13 000 RMB в год.',
    '["建筑学 — Архитектура", "土木工程 — Гражданское строительство", "计算机科学与技术 — Компьютерные науки", "软件工程 — Программная инженерия", "人工智能 — Искусственный интеллект", "电气工程 — Электротехника", "金融学 — Финансы"]',
    '["建筑学 — Архитектура", "城市规划 — Городское планирование", "人工智能 — Искусственный интеллект", "电气工程 — Электротехника", "金融学 — Финансы", "工商管理 — Управление бизнесом"]',
    '["Architecture", "Civil Engineering", "Computer Science and Technology", "Software Engineering", "Electrical Engineering", "Artificial Intelligence", "Business Administration"]',
    '["Architecture", "Urban Planning", "Computer Science", "Artificial Intelligence", "Electrical Engineering", "MBA", "Civil Engineering"]',
    '["Паспорт", "Аттестат", "Transcript", "Language Certificate", "Medical Form", "Study Plan", "Financial Guarantee"]',
    '["Bachelor Diploma", "Transcript", "Research Proposal", "Recommendation Letters", "CV", "Language Certificate"]',
    '["Паспорт", "Аттестат", "Фото", "Bank Statement"]',
    'Сложно', 'Февраль – апрель 2026. Языковой год до июня–июля 2026.',
    '["Архитектура", "Гражданское строительство", "Электротехника", "Искусственный интеллект"]', 5, 35000, 'Известен архитектурными и инженерными программами в Нанкине.'
),

-- 15. Nanjing Normal University
(
    gen_random_uuid(), 'Nanjing Normal University', 'China', 'Nanjing', 'Jiangsu',
    true,
    'Аттестат. IELTS 5.5+. HSK 4–5 для китайских программ.',
    '18 000 – 32 000 RMB в год', '24 000 – 40 000 RMB в год', '9 000 – 16 000 RMB в год', '400 RMB',
    'Double rooms, интернет, кондиционер, прачечная, кухня, охрана 24/7. Стоимость проживания 4 000 – 8 000 RMB в год.',
    '["汉语言文学 — Китайская филология", "教育学 — Педагогика", "心理学 — Психология", "计算机科学与技术 — Компьютерные науки", "软件工程 — Программная инженерия", "金融学 — Финансы", "法学 — Юриспруденция"]',
    '["应用心理学 — Прикладная психология", "教育管理 — Управление образованием", "金融学 — Финансы", "新闻传播学 — Медиа и коммуникации", "人工智能 — Искусственный интеллект"]',
    '["Chinese Language Education", "Business Administration", "Finance", "Computer Science and Technology", "Software Engineering", "Psychology", "International Economics and Trade"]',
    '["Applied Psychology", "Education Management", "Computer Science", "International Business", "Finance", "MBA"]',
    '["Паспорт", "Аттестат", "Transcript", "Language Certificate", "Medical Form", "Bank Statement"]',
    '["Bachelor Diploma", "Transcript", "Research Proposal", "Recommendation Letters", "CV", "Language Certificate"]',
    '["Паспорт", "Аттестат", "Фото", "Financial Guarantee"]',
    'Средний', 'Март – июнь 2026. Языковой год до июля 2026.',
    '["Педагогика", "Психология", "Право", "Финансы"]', 13, 22000, 'Педагогический университет Нанкина с сильными программами по психологии и праву.'
);
