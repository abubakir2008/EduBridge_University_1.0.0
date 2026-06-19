"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  GraduationCap,
  ChevronDown,
  Menu,
  X,
  CheckCircle,
  CheckCircle2,
  Star,
  BookOpen,
  Target,
  Users,
  ArrowRight,
  Sparkles,
  Shield,
  Plane,
  Home,
  FileText,
  Award,
  Globe,
  Clock,
  Send,
  MessageSquare,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { apiGetCases } from "@/lib/api/cases";
import { apiCreateLead } from "@/lib/api/leads";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: "easeOut" as const },
});

const navLinks = [
  { label: "Как это работает", href: "#how" },
  { label: "Что входит", href: "#services" },
  { label: "Кейсы", href: "#cases" },
  { label: "Блог", href: "/blog" },
  { label: "FAQ", href: "#faq" },
  { label: "Контакты", href: "#contact" },
];

const stats = [
  { value: "3 000+", label: "студентов поступили" },
  { value: "2021", label: "год основания" },
  { value: "3+", label: "университета в каждой заявке" },
  { value: "100%", label: "поддержка до диплома" },
];

const steps = [
  {
    n: "01",
    title: "Оставь заявку",
    desc: "Заполни форму — мы свяжемся в течение 24 часов и проведём бесплатную консультацию.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    n: "02",
    title: "Получи доступ",
    desc: "После проверки откроем личный кабинет студента с персональным планом поступления.",
    color: "bg-violet-50 text-violet-600",
  },
  {
    n: "03",
    title: "Готовь документы",
    desc: "Следуй пошаговым инструкциям, загружай документы и отслеживай дедлайны.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    n: "04",
    title: "Поступи и уедь",
    desc: "Получи зачисление — мы поможем с визой, билетами, встречей и жильём.",
    color: "bg-orange-50 text-orange-600",
  },
];

const services = [
  {
    icon: BookOpen,
    title: "Подготовка к TOEFL",
    desc: "Полный курс подготовки к международному тесту с практикой и разбором ошибок.",
    bg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    icon: Globe,
    title: "Курсы английского",
    desc: "Бесплатные курсы английского языка на 3 месяца для всех студентов программы.",
    bg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  {
    icon: FileText,
    title: "Помощь с документами",
    desc: "Сопровождение при сборе и подаче всех необходимых документов в университеты.",
    bg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    icon: Target,
    title: "Подача в 3+ университета",
    desc: "Подаём заявки минимум в три подходящих университета, чтобы увеличить шансы.",
    bg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    icon: Plane,
    title: "Виза и билеты",
    desc: "Поможем оформить визу и приобрести авиабилеты по оптимальному маршруту.",
    bg: "bg-rose-50",
    iconColor: "text-rose-600",
  },
  {
    icon: MapPin,
    title: "Встреча в аэропорту",
    desc: "Вас встретят по прилёту — не придётся разбираться с незнакомым городом одному.",
    bg: "bg-cyan-50",
    iconColor: "text-cyan-600",
  },
  {
    icon: Home,
    title: "Жильё и адаптация",
    desc: "Поможем найти жильё и адаптироваться в новой стране в первые недели.",
    bg: "bg-teal-50",
    iconColor: "text-teal-600",
  },
  {
    icon: Award,
    title: "Поддержка до диплома",
    desc: "Сопровождаем студента на всём пути — от заявки до получения диплома.",
    bg: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
];

const advantages = [
  { text: "Доступные цены — без скрытых комиссий" },
  { text: "Работаем с 2021 года — проверенная методика" },
  { text: "3000+ поступивших студентов из СНГ" },
  { text: "Поддержка на каждом этапе пути" },
  { text: "Гарантия поступления при выполнении программы" },
];

const countries = [
  // ISO 3166-1 alpha-2 коды — эмодзи-флаги не рисуются на Windows, отдаём SVG-картинки.
  { code: "it", name: "Италия" },
  { code: "cn", name: "Китай" },
  { code: "tr", name: "Турция" },
  { code: "us", name: "США" },
];

const faqs = [
  {
    q: "Сколько стоит поступление за границу с EduBridge?",
    a: "Первая консультация бесплатная. Стоимость сопровождения зависит от страны и пакета услуг; мы работаем без скрытых комиссий и называем цену сразу после подбора вузов под ваш профиль.",
  },
  {
    q: "В какие страны можно поступить через EduBridge?",
    a: "Помогаем поступить в университеты Китая, Италии, Турции, США и других стран. Подбираем вуз и программу под ваши цели, бюджет и уровень подготовки.",
  },
  {
    q: "Нужно ли знать язык и сдавать IELTS, TOEFL или HSK?",
    a: "Зависит от программы. Для англоязычных программ обычно нужен IELTS 5.5–6.5 или TOEFL, для обучения на китайском — HSK 4–5. Многие вузы предлагают подготовительный языковой год, и мы помогаем подготовиться к тестам.",
  },
  {
    q: "Можно ли поступить на грант или со стипендией?",
    a: "Да. Мы подбираем университеты с грантами и стипендиями и сопровождаем подачу документов, чтобы повысить шансы на финансирование обучения.",
  },
  {
    q: "Сколько времени занимает процесс поступления?",
    a: "В среднем от 1 до 6 месяцев в зависимости от страны, программы и сроков подачи. Личный кабинет показывает все этапы и дедлайны, чтобы ничего не пропустить.",
  },
  {
    q: "Из каких стран вы принимаете студентов?",
    a: "Работаем со студентами из Кыргызстана, Казахстана и России. С 2021 года с нами начали обучение более 3000 студентов.",
  },
];

const leadSchema = z.object({
  full_name: z.string().min(2, "Введите имя"),
  phone: z.string().regex(/^\+996\d{9}$/, "Введите номер в формате +996XXXXXXXXX"),
  email: z.string().email("Неверный email").optional().or(z.literal("")),
  country_interest: z.string().optional(),
  comment: z.string().optional(),
});
type LeadForm = z.infer<typeof leadSchema>;

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const formRef = useRef<HTMLDivElement>(null);

  const { data: cases } = useQuery({
    queryKey: ["cases"],
    queryFn: () => apiGetCases(),
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LeadForm>({
    resolver: zodResolver(leadSchema),
    defaultValues: { phone: '+996' },
  });

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const PREFIX = '+996'
    let raw = e.target.value
    if (!raw.startsWith(PREFIX)) raw = PREFIX
    const digits = raw.slice(PREFIX.length).replace(/\D/g, '').slice(0, 9)
    setValue('phone', PREFIX + digits, { shouldValidate: true })
  }

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const PREFIX = '+996'
    const input = e.currentTarget
    if (
      e.key === 'Backspace' &&
      input.selectionStart !== null &&
      input.selectionStart <= PREFIX.length &&
      input.selectionEnd !== null &&
      input.selectionEnd <= PREFIX.length
    ) {
      e.preventDefault()
    }
  }

  const onSubmit = async (data: LeadForm) => {
    try {
      await apiCreateLead({
        full_name: data.full_name,
        phone: data.phone,
        email: data.email || undefined,
        country_interest: data.country_interest || undefined,
        comment: data.comment || undefined,
      });
      setSubmitted(true);
    } catch {
      toast.error("Не удалось отправить заявку. Попробуйте позже.");
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveSection(e.target.id);
        });
      },
      { threshold: 0.4 },
    );
    document
      .querySelectorAll("section[id]")
      .forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "EducationalOrganization",
        "@id": "https://university.edubridge.bond/#organization",
        name: "EduBridge University",
        url: "https://university.edubridge.bond",
        logo: "https://university.edubridge.bond/logo.png",
        description:
          "Образовательная платформа, помогающая студентам из СНГ поступить в зарубежные университеты Германии, Италии, Китая, Турции, США.",
        foundingDate: "2021",
        email: "educationbridge.kg@gmail.com",
        sameAs: ["https://instagram.com/edubridge.kg"],
        address: {
          "@type": "PostalAddress",
          streetAddress: "ул. Фурманова 12",
          addressLocality: "Бишкек",
          addressRegion: "Ленинский район",
          addressCountry: "KG",
        },
        areaServed: ["KG", "KZ", "RU"],
        numberOfStudents: { "@type": "QuantitativeValue", value: 3000 },
      },
      {
        "@type": "WebSite",
        "@id": "https://university.edubridge.bond/#website",
        url: "https://university.edubridge.bond",
        name: "EduBridge University",
        publisher: { "@id": "https://university.edubridge.bond/#organization" },
        inLanguage: "ru",
      },
      {
        "@type": "FAQPage",
        "@id": "https://university.edubridge.bond/#faq",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-white overflow-x-hidden">
        {/* ── Header ── */}
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-text-primary">
                EduBridge
              </span>
              <span className="hidden sm:inline text-xs font-medium text-text-muted bg-slate-100 px-2 py-0.5 rounded-full">
                Поступление за границу без посредников
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map(({ label, href }) =>
                href.startsWith("/") ? (
                  <Link
                    key={label}
                    href={href}
                    className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
                  >
                    {label}
                  </Link>
                ) : (
                  <a
                    key={label}
                    href={href}
                    className={`text-sm font-medium transition-colors ${activeSection === href.slice(1) ? "text-primary" : "text-text-secondary hover:text-text-primary"}`}
                  >
                    {label}
                  </a>
                ),
              )}
            </nav>

            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="primary" size="sm">
                  Войти
                </Button>
              </Link>
              <button
                className="md:hidden"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-3"
            >
              {navLinks.map(({ label, href }) =>
                href.startsWith("/") ? (
                  <Link
                    key={label}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className="block text-sm font-medium text-text-secondary hover:text-primary"
                  >
                    {label}
                  </Link>
                ) : (
                  <a
                    key={label}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className="block text-sm font-medium text-text-secondary hover:text-primary"
                  >
                    {label}
                  </a>
                ),
              )}
            </motion.div>
          )}
        </header>

        {/* ── Hero (тёмный navy + glassmorphism) ── */}
        <section className="section-navy pt-28 pb-24 sm:pb-32">
          {/* Точечный паттерн */}
          <div className="absolute inset-0 opacity-20 bg-dot-grid pointer-events-none" />
          {/* Glow-блобы */}
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-primary/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-violet-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative mx-auto max-w-6xl px-4">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
              {/* Left */}
              <div className="flex-1 text-center lg:text-left">
                <motion.div {...fadeUp(0)}>
                  <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-sm font-bold px-4 py-2 rounded-full mb-6 backdrop-blur-sm">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse flex-shrink-0" />
                    Для студентов из Кыргызстана, Казахстана и России
                  </span>
                </motion.div>

                <motion.h1
                  {...fadeUp(0.08)}
                  className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.08] tracking-tight"
                >
                  Учёба за границей —{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-primary-light to-blue-200">
                    это не мечта.
                  </span>{" "}
                  <span className="block mt-1">Это стратегия.</span>
                </motion.h1>

                <motion.p
                  {...fadeUp(0.16)}
                  className="mt-6 text-lg text-white/70 max-w-xl mx-auto lg:mx-0 leading-relaxed"
                >
                  EduBridge помогает поступить в зарубежные университеты на
                  грант, со стипендией и в сильные вузы мира. С нами уже начали
                  обучение{" "}
                  <strong className="text-white">более 3000 студентов</strong>.
                </motion.p>

                <motion.div
                  {...fadeUp(0.22)}
                  className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3"
                >
                  <button
                    onClick={() =>
                      formRef.current?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="flex items-center gap-2 px-8 py-4 bg-white text-navy rounded-2xl font-bold text-lg hover:bg-slate-100 transition-all shadow-2xl shadow-black/20 group"
                  >
                    Оставить заявку
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={() =>
                      document
                        .getElementById("how")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="flex items-center gap-2 px-6 py-4 border-2 border-white/30 text-white rounded-2xl font-bold text-base hover:bg-white/10 hover:border-white/50 transition-all"
                  >
                    Как это работает <ChevronDown className="h-4 w-4" />
                  </button>
                </motion.div>

                <motion.div
                  {...fadeUp(0.28)}
                  className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-5"
                >
                  {[
                    "Бесплатная консультация",
                    "Гарантия поступления",
                    "Поддержка до диплома",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 text-sm text-white/70 font-medium"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Right — стеклянная карточка прогресса */}
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
                className="flex-1 w-full max-w-md lg:max-w-none relative"
              >
                <div className="glass-card p-7 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          Этап 3: Подача документов
                        </p>
                        <p className="text-xs text-white/60">
                          Университет Цинхуа, Пекин
                        </p>
                      </div>
                    </div>

                    <div className="bg-white/10 rounded-2xl p-4 mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-white/70">
                          Прогресс поступления
                        </span>
                        <span className="font-bold">72%</span>
                      </div>
                      <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-blue-300 to-primary-light rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: "72%" }}
                          transition={{ duration: 1.2, delay: 0.5 }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {[
                        { label: "Сертификат HSK получен", done: true },
                        { label: "Мотивационное письмо готово", done: true },
                        { label: "Академическая справка", done: false },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl bg-white/10"
                        >
                          {item.done ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <Clock className="w-4 h-4 text-white/50 flex-shrink-0" />
                          )}
                          <span
                            className={
                              item.done ? "text-white" : "text-white/60"
                            }
                          >
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Вузов", value: "3" },
                        { label: "Дней", value: "14" },
                        { label: "Этапов", value: "5/7" },
                      ].map((s) => (
                        <div key={s.label} className="stat-tile">
                          <p className="text-lg font-extrabold">{s.value}</p>
                          <p className="text-xs text-white/60 mt-0.5">
                            {s.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Плавающие карточки */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="hidden sm:flex absolute -top-4 -right-4 bg-white shadow-2xl border border-slate-100 rounded-2xl px-4 py-3 items-center gap-2.5"
                >
                  <span className="text-2xl">🎉</span>
                  <div>
                    <p className="font-bold text-gray-900 text-xs">Зачислен!</p>
                    <p className="text-gray-400 text-xs">Грант 100% · Пекин</p>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1,
                  }}
                  className="hidden sm:block absolute -bottom-4 -left-4 bg-white shadow-2xl border border-slate-100 rounded-2xl px-4 py-3 max-w-[200px]"
                >
                  <p className="text-xs text-gray-400 font-medium">
                    Новый студент
                  </p>
                  <p className="font-bold text-gray-900 text-xs mt-0.5">
                    Айгерим · Бишкек → Шанхай
                  </p>
                  <p className="text-xs text-emerald-600 font-bold mt-1">
                    Стипендия получена ✓
                  </p>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Stats (градиентная полоса) ── */}
        <section className="gradient-brand py-12">
          <div className="mx-auto max-w-5xl px-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center text-white">
              {stats.map((s, i) => (
                <motion.div key={i} {...fadeUp(i * 0.08)}>
                  <p className="text-3xl lg:text-4xl font-extrabold">
                    {s.value}
                  </p>
                  <p className="mt-1 text-sm text-white/70 font-medium">
                    {s.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── About ── */}
        <section className="py-24 bg-white">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <motion.div
                {...fadeUp()}
                className="flex-1 text-center lg:text-left"
              >
                <span className="text-primary font-semibold text-sm uppercase tracking-wide">
                  О компании
                </span>
                <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-text-primary">
                  Чем занимается EduBridge
                </h2>
                <p className="mt-4 text-text-secondary leading-relaxed">
                  EduBridge — образовательная платформа, которая помогает
                  студентам из СНГ поступить в зарубежные университеты. Мы не
                  просто консультируем — мы ведём каждого студента от первой
                  заявки до получения диплома.
                </p>
                <p className="mt-4 text-text-secondary leading-relaxed">
                  Наша команда имеет многолетний опыт в международном
                  образовании и знает все тонкости поступления в университеты
                  Германии, Италии, Китая и других стран. Мы отслеживаем
                  дедлайны, помогаем с документами, визой и адаптацией на новом
                  месте.
                </p>
              </motion.div>

              <motion.div
                {...fadeUp(0.1)}
                className="flex-1 grid grid-cols-2 gap-4 w-full"
              >
                {[
                  {
                    icon: BookOpen,
                    title: "Образовательные программы",
                    desc: "Подбираем университеты и программы под цели и бюджет каждого студента",
                    color: "bg-blue-50 text-blue-600",
                  },
                  {
                    icon: Shield,
                    title: "Гарантия поступления",
                    desc: "При выполнении всех шагов программы гарантируем зачисление минимум в один вуз",
                    color: "bg-emerald-50 text-emerald-600",
                  },
                  {
                    icon: Users,
                    title: "Индивидуальный подход",
                    desc: "Персональный менеджер на каждом этапе — от консультации до отъезда",
                    color: "bg-violet-50 text-violet-600",
                  },
                  {
                    icon: Globe,
                    title: "Международная сеть",
                    desc: "Партнёрские отношения с университетами в 10+ странах мира",
                    color: "bg-amber-50 text-amber-600",
                  },
                ].map((item, i) => (
                  <motion.div key={i} {...fadeUp(i * 0.08)}>
                    <div className="bg-white rounded-card border border-slate-100 shadow-card p-5 h-full">
                      <div
                        className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center mb-3`}
                      >
                        <item.icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-semibold text-text-primary text-sm mb-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how" className="py-24 bg-slate-50/60">
          <div className="mx-auto max-w-6xl px-4">
            <motion.div {...fadeUp()} className="text-center mb-16">
              <span className="text-primary font-semibold text-sm uppercase tracking-wide">
                Как это работает
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-text-primary">
                От заявки до зачисления
              </h2>
              <p className="mt-4 text-text-secondary max-w-xl mx-auto">
                Четыре простых шага — и вы студент зарубежного университета
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((step, i) => (
                <motion.div key={i} {...fadeUp(i * 0.1)}>
                  <div className="relative bg-white rounded-card border border-slate-100 shadow-card p-6 h-full hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                    <div
                      className={`w-12 h-12 ${step.color} rounded-xl flex items-center justify-center font-bold text-lg mb-4`}
                    >
                      {step.n}
                    </div>
                    <h3 className="font-semibold text-text-primary mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {step.desc}
                    </p>
                    {i < steps.length - 1 && (
                      <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-0.5 border border-slate-100">
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Services ── */}
        <section id="services" className="py-24 bg-white">
          <div className="mx-auto max-w-6xl px-4">
            <motion.div {...fadeUp()} className="text-center mb-16">
              <span className="text-primary font-semibold text-sm uppercase tracking-wide">
                Что вы получаете
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-text-primary">
                Полное сопровождение — от А до Я
              </h2>
              <p className="mt-4 text-text-secondary max-w-xl mx-auto">
                Мы готовим не просто к поступлению. Мы готовим к жизни и
                обучению в международной среде.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.map((s, i) => (
                <motion.div key={i} {...fadeUp(i * 0.07)}>
                  <div className="bg-white rounded-card border border-slate-100 shadow-card p-6 h-full hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                    <div
                      className={`w-12 h-12 ${s.bg} rounded-xl flex items-center justify-center mb-4`}
                    >
                      <s.icon className={`w-6 h-6 ${s.iconColor}`} />
                    </div>
                    <h3 className="font-semibold text-text-primary mb-2">
                      {s.title}
                    </h3>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Countries ── */}
        <section className="py-20 bg-slate-50/60">
          <div className="mx-auto max-w-5xl px-4">
            <motion.div {...fadeUp()} className="text-center mb-12">
              <span className="text-primary font-semibold text-sm uppercase tracking-wide">
                Направления
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-text-primary">
                Популярные страны для поступления
              </h2>
            </motion.div>
            <div className="grid grid-cols-2 sm:grid-cols-4 max-w-3xl mx-auto gap-4">
              {countries.map((c, i) => (
                <motion.div key={c.name} {...fadeUp(i * 0.06)}>
                  <div className="bg-white rounded-card border border-slate-100 shadow-card p-5 flex flex-col items-center gap-3 hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-default">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://flagcdn.com/${c.code}.svg`}
                      alt={`Флаг — ${c.name}`}
                      width={48}
                      height={32}
                      loading="lazy"
                      className="w-12 h-8 rounded-md object-cover shadow-sm ring-1 ring-slate-200"
                    />
                    <span className="font-medium text-text-primary text-sm">
                      {c.name}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
            <motion.p
              {...fadeUp(0.5)}
              className="mt-8 text-center text-text-muted text-sm"
            >
              и другие популярные страны мира — помогаем поступить туда, где вы
              хотите учиться
            </motion.p>
          </div>
        </section>

        {/* ── Why choose us ── */}
        <section className="py-24 bg-gradient-to-br from-blue-600 to-blue-800 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-6xl px-4">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <motion.div
                {...fadeUp()}
                className="flex-1 text-center lg:text-left"
              >
                <span className="text-blue-200 font-semibold text-sm uppercase tracking-wide">
                  Почему мы
                </span>
                <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-white">
                  EDU BRIDGE — мост к международному образованию
                </h2>
                <p className="mt-4 text-blue-100 leading-relaxed max-w-lg">
                  Сегодняшний студент — завтрашний специалист мирового уровня.
                  Начни свой путь уже сейчас.
                </p>
                <div className="mt-8">
                  <Button
                    size="lg"
                    onClick={() =>
                      document
                        .getElementById("contact")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="bg-white text-primary hover:bg-blue-50 group"
                  >
                    Получить консультацию
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </motion.div>

              <motion.div {...fadeUp(0.1)} className="flex-1 w-full">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-card p-8 space-y-4">
                  {advantages.map((a, i) => (
                    <motion.div
                      key={i}
                      {...fadeUp(i * 0.08)}
                      className="flex items-start gap-3"
                    >
                      <div className="flex-shrink-0 w-6 h-6 bg-emerald-400/20 rounded-full flex items-center justify-center mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      </div>
                      <span className="text-white/90 text-sm leading-relaxed">
                        {a.text}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Cases ── */}
        {cases && cases.length > 0 && (
          <section id="cases" className="py-24 bg-slate-50/60">
            <div className="mx-auto max-w-6xl px-4">
              <motion.div {...fadeUp()} className="text-center mb-16">
                <span className="text-primary font-semibold text-sm uppercase tracking-wide">
                  Кейсы
                </span>
                <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-text-primary">
                  Реальные поступления наших студентов
                </h2>
              </motion.div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {cases.slice(0, 6).map((c, i) => (
                  <motion.div key={c.id} {...fadeUp(i * 0.06)}>
                    <Card className="h-full hover:shadow-lg transition-shadow">
                      <div className="flex items-center gap-2 mb-3">
                        <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                        <span className="text-xs font-medium text-amber-600">
                          Успешное поступление
                        </span>
                      </div>
                      <h3 className="font-semibold text-text-primary">
                        {c.student_name}
                      </h3>
                      <p className="text-sm text-text-secondary mt-1">
                        {c.university?.name ?? ""} · {c.country}
                      </p>
                      <p className="text-xs text-primary mt-1 font-medium">
                        {c.specialty}
                      </p>
                      {c.description && (
                        <p className="mt-3 text-sm text-text-secondary line-clamp-3">
                          {c.description}
                        </p>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── FAQ (для SEO rich-snippets и GEO) ── */}
        <section id="faq" className="py-20 bg-slate-50/60">
          <div className="mx-auto max-w-3xl px-4">
            <motion.div {...fadeUp()} className="text-center mb-10">
              <span className="text-primary font-semibold text-sm uppercase tracking-wide">
                Вопросы и ответы
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-text-primary">
                Частые вопросы о поступлении за границу
              </h2>
            </motion.div>

            <div className="space-y-3">
              {faqs.map((f, i) => (
                <motion.details
                  key={i}
                  {...fadeUp(i * 0.05)}
                  className="group rounded-card border border-slate-100 bg-white p-5 shadow-card"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold text-text-primary list-none">
                    {f.q}
                    <ChevronDown className="h-5 w-5 flex-shrink-0 text-primary transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 text-text-secondary leading-relaxed">{f.a}</p>
                </motion.details>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA (navy-градиентный блок) ── */}
        <section className="px-4 py-20">
          <motion.div
            {...fadeUp()}
            className="gradient-brand mx-auto max-w-5xl rounded-3xl p-8 sm:p-14 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3 pointer-events-none" />
            <div className="relative">
              <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                Готов начать путь к международному образованию?
              </h2>
              <p className="mt-4 text-white/70 max-w-lg mx-auto">
                Оставь заявку — получи бесплатную консультацию и узнай, в какие
                университеты можешь поступить уже в этом году.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() =>
                    formRef.current?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="flex items-center gap-2 px-8 py-4 bg-white text-navy rounded-2xl font-bold text-lg hover:bg-slate-100 transition-all shadow-2xl shadow-black/20 group"
                >
                  Оставить заявку
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <Link href="/login">
                  <button className="flex items-center gap-2 px-6 py-4 border-2 border-white/30 text-white rounded-2xl font-bold text-base hover:bg-white/10 hover:border-white/50 transition-all">
                    Войти в кабинет
                  </button>
                </Link>
              </div>
              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-white/60">
                <Users className="w-4 h-4" />
                Уже 3000+ студентов из Кыргызстана, Казахстана и России
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── Lead form ── */}
        <section id="contact" className="py-24 bg-slate-50/60" ref={formRef}>
          <div className="mx-auto max-w-2xl px-4">
            <motion.div {...fadeUp()} className="text-center mb-12">
              <span className="text-primary font-semibold text-sm uppercase tracking-wide">
                Заявка
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-text-primary">
                Оставить заявку на консультацию
              </h2>
              <p className="mt-4 text-text-secondary">
                Мы свяжемся с вами в течение 24 часов и расскажем всё о
                программе
              </p>
            </motion.div>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-card border border-emerald-200 bg-emerald-50 p-10 text-center"
              >
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary">
                  Заявка принята!
                </h3>
                <p className="mt-2 text-text-secondary">
                  Мы свяжемся с вами в ближайшее время.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-6 text-primary text-sm hover:underline"
                >
                  Отправить ещё одну заявку
                </button>
              </motion.div>
            ) : (
              <motion.div {...fadeUp(0.1)}>
                <div className="bg-white rounded-card shadow-card border border-slate-100 p-8">
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Input
                        label="Имя *"
                        placeholder="Ваше имя"
                        error={errors.full_name?.message}
                        {...register("full_name")}
                      />
                      <Input
                        label="Телефон *"
                        type="tel"
                        placeholder="+996700123456"
                        error={errors.phone?.message}
                        {...register("phone")}
                        onChange={handlePhoneChange}
                        onKeyDown={handlePhoneKeyDown}
                        onFocus={(e) => {
                          if (!e.target.value.startsWith('+996')) {
                            setValue('phone', '+996', { shouldValidate: false })
                          }
                        }}
                      />
                    </div>
                    <Input
                      label="Email"
                      type="email"
                      placeholder="email@mail.com"
                      error={errors.email?.message}
                      {...register("email")}
                    />
                    <Input
                      label="Страна интереса"
                      placeholder="Германия, Чехия, Польша..."
                      {...register("country_interest")}
                    />
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-text-primary">
                        Комментарий (необязательно)
                      </label>
                      <div className="relative">
                        <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-text-muted" />
                        <textarea
                          {...register("comment")}
                          rows={3}
                          placeholder="Расскажите о вашей ситуации, целях и вопросах..."
                          className="w-full rounded-input border border-slate-200 pl-10 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      loading={isSubmitting}
                    >
                      <Send className="w-4 h-4" />
                      Отправить заявку
                    </Button>
                    <p className="text-center text-xs text-text-muted">
                      Нажимая кнопку, вы соглашаетесь на обработку персональных
                      данных
                    </p>
                  </form>
                </div>
              </motion.div>
            )}
          </div>
        </section>

        {/* ── Footer (тёмный navy) ── */}
        <footer className="bg-navy text-white py-12">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
              {/* Brand */}
              <div>
                <Link href="/" className="flex items-center gap-2 mb-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15">
                    <GraduationCap className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-bold text-white">
                    EduBridge University
                  </span>
                </Link>
                <p className="text-sm text-white/60 leading-relaxed">
                  Помогаем студентам из СНГ поступить в зарубежные университеты
                  — от заявки до диплома.
                </p>
                <div className="flex items-center gap-2 mt-4 text-sm text-white/60">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>Работаем с 2021 года</span>
                </div>
              </div>

              {/* Navigation */}
              <div>
                <p className="text-sm font-semibold text-white mb-4">
                  Навигация
                </p>
                <nav className="flex flex-col gap-2">
                  {navLinks.map(({ label, href }) => (
                    <a
                      key={label}
                      href={href}
                      className="text-sm text-white/60 hover:text-white transition-colors"
                    >
                      {label}
                    </a>
                  ))}
                </nav>
              </div>

              {/* Contacts */}
              <div>
                <p className="text-sm font-semibold text-white mb-4">Контакты</p>
                <div className="flex flex-col gap-3 text-sm text-white/60">
                  <a
                    href="mailto:educationbridge.kg@gmail.com"
                    className="flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <Send className="w-4 h-4 flex-shrink-0" />
                    educationbridge.kg@gmail.com
                  </a>
                  <a
                    href="https://instagram.com/edubridge.kg"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <Globe className="w-4 h-4 flex-shrink-0" />
                    @edubridge_kg
                  </a>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>
                      г. Бишкек, Ленинский район,
                      <br />
                      ул. Фурманова 12
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
              <p>© 2025 EduBridge University. Все права защищены.</p>
              <p>Кыргызстан · Казахстан · Россия</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
