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
  { flag: "🇮🇹", name: "Италия" },
  { flag: "🇨🇳", name: "Китай" },
];

const leadSchema = z.object({
  full_name: z.string().min(2, "Введите имя"),
  phone: z.string().min(7, "Введите телефон"),
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
    formState: { errors, isSubmitting },
  } = useForm<LeadForm>({
    resolver: zodResolver(leadSchema),
  });

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

  return (
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
            {navLinks.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className={`text-sm font-medium transition-colors ${activeSection === href.slice(1) ? "text-primary" : "text-text-secondary hover:text-text-primary"}`}
              >
                {label}
              </a>
            ))}
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
            {navLinks.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="block text-sm font-medium text-text-secondary hover:text-primary"
              >
                {label}
              </a>
            ))}
          </motion.div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/40 to-white pt-24 pb-20 sm:pb-32">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-100/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

        <div className="relative mx-auto max-w-6xl px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left */}
            <div className="flex-1 text-center lg:text-left">
              <motion.div {...fadeUp(0)}>
                <span className="inline-flex items-center gap-2 bg-blue-50 text-primary text-sm font-semibold px-4 py-2 rounded-full mb-6 border border-blue-100">
                  <Sparkles className="w-4 h-4" />
                  Для студентов из Кыргызстана, Казахстана и России
                </span>
              </motion.div>

              <motion.h1
                {...fadeUp(0.08)}
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-text-primary leading-tight tracking-tight"
              >
                Учёба за границей —{" "}
                <span className="text-primary">это не мечта.</span>{" "}
                <span className="block mt-1">Это стратегия.</span>
              </motion.h1>

              <motion.p
                {...fadeUp(0.16)}
                className="mt-6 text-lg text-text-secondary max-w-xl mx-auto lg:mx-0 leading-relaxed"
              >
                EduBridge помогает поступить в зарубежные университеты на грант,
                со стипендией и в сильные вузы мира. С нами уже начали обучение{" "}
                <strong className="text-text-primary">
                  более 3000 студентов
                </strong>
                .
              </motion.p>

              <motion.div
                {...fadeUp(0.22)}
                className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
              >
                <Button
                  size="lg"
                  onClick={() =>
                    formRef.current?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="group"
                >
                  Оставить заявку
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() =>
                    document
                      .getElementById("how")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Как это работает <ChevronDown className="h-4 w-4" />
                </Button>
              </motion.div>

              <motion.div
                {...fadeUp(0.28)}
                className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-6"
              >
                {[
                  "Бесплатная консультация",
                  "Гарантия поступления",
                  "Поддержка до диплома",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 text-sm text-text-secondary"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right — Visual card */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
              className="flex-1 w-full max-w-md lg:max-w-none"
            >
              <div className="relative">
                <div className="bg-white rounded-card shadow-card border border-slate-100 p-6 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary">
                        Этап 3: Подача документов
                      </p>
                      <p className="text-xs text-text-muted">
                        Берлинский технический университет
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">
                        Прогресс поступления
                      </span>
                      <span className="font-semibold text-primary">72%</span>
                    </div>
                    <div className="h-2 bg-blue-50 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: "72%" }}
                        transition={{ duration: 1.2, delay: 0.5 }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    {[
                      { label: "✅ Сертификат TOEFL получен", done: true },
                      { label: "✅ Мотивационное письмо готово", done: true },
                      { label: "⏳ Академическая справка", done: false },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${item.done ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-text-secondary"}`}
                      >
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {
                        label: "Вузов",
                        value: "3",
                        color: "text-primary bg-blue-50",
                      },
                      {
                        label: "Дней",
                        value: "14",
                        color: "text-amber-600 bg-amber-50",
                      },
                      {
                        label: "Этапов",
                        value: "5/7",
                        color: "text-emerald-600 bg-emerald-50",
                      },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className={`rounded-xl p-3 text-center ${s.color}`}
                      >
                        <p className="text-lg font-bold">{s.value}</p>
                        <p className="text-xs font-medium opacity-70">
                          {s.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="hidden sm:flex absolute -top-4 -right-4 bg-white shadow-card border border-slate-100 rounded-xl px-4 py-3 text-sm items-center gap-2"
                >
                  <span className="text-lg">🎉</span>
                  <div>
                    <p className="font-semibold text-text-primary text-xs">
                      Зачислен!
                    </p>
                    <p className="text-text-muted text-xs">
                      Грант 100% · Берлин
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 6, 0] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1,
                  }}
                  className="hidden sm:block absolute -bottom-6 -left-6 bg-white shadow-card border border-slate-100 rounded-xl px-4 py-3 text-sm max-w-[200px]"
                >
                  <p className="text-xs text-text-muted">Новый студент</p>
                  <p className="font-semibold text-text-primary text-xs mt-0.5">
                    Айгерим · Бишкек → Мюнхен
                  </p>
                  <p className="text-xs text-emerald-600 font-medium mt-1">
                    Стипендия получена ✓
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-y border-slate-100 bg-white py-12">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <motion.div key={i} {...fadeUp(i * 0.08)} className="text-center">
                <p className="text-3xl lg:text-4xl font-extrabold text-primary">
                  {s.value}
                </p>
                <p className="mt-1 text-sm text-text-muted">{s.label}</p>
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
                Наша команда имеет многолетний опыт в международном образовании
                и знает все тонкости поступления в университеты Германии,
                Италии, Китая и других стран. Мы отслеживаем дедлайны, помогаем
                с документами, визой и адаптацией на новом месте.
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
              Мы готовим не просто к поступлению. Мы готовим к жизни и обучению
              в международной среде.
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
          <div className="grid grid-cols-2 max-w-sm mx-auto gap-4">
            {countries.map((c, i) => (
              <motion.div key={c.name} {...fadeUp(i * 0.06)}>
                <div className="bg-white rounded-card border border-slate-100 shadow-card p-5 flex flex-col items-center gap-3 hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-default">
                  <span className="text-4xl">{c.flag}</span>
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

      {/* ── CTA ── */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <motion.div {...fadeUp()}>
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <GraduationCap className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary">
              Готов начать путь к международному образованию?
            </h2>
            <p className="mt-4 text-text-secondary max-w-lg mx-auto">
              Оставь заявку — получи бесплатную консультацию и узнай, в какие
              университеты можешь поступить уже в этом году.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() =>
                  formRef.current?.scrollIntoView({ behavior: "smooth" })
                }
                className="group"
              >
                Оставить заявку
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Link href="/login">
                <Button variant="outline" size="lg">
                  Войти в кабинет
                </Button>
              </Link>
            </div>
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-text-muted">
              <Users className="w-4 h-4" />
              Уже 3000+ студентов из Кыргызстана, Казахстана и России
            </div>
          </motion.div>
        </div>
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
              Мы свяжемся с вами в течение 24 часов и расскажем всё о программе
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
                      placeholder="+7 999 123 45 67"
                      error={errors.phone?.message}
                      {...register("phone")}
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

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 py-12 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
            {/* Brand */}
            <div>
              <Link href="/" className="flex items-center gap-2 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                  <GraduationCap className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-text-primary">EduBridge University</span>
              </Link>
              <p className="text-sm text-text-muted leading-relaxed">
                Помогаем студентам из СНГ поступить в зарубежные университеты — от заявки до диплома.
              </p>
              <div className="flex items-center gap-2 mt-4 text-sm text-text-muted">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>Работаем с 2021 года</span>
              </div>
            </div>

            {/* Navigation */}
            <div>
              <p className="text-sm font-semibold text-text-primary mb-4">Навигация</p>
              <nav className="flex flex-col gap-2">
                {navLinks.map(({ label, href }) => (
                  <a
                    key={label}
                    href={href}
                    className="text-sm text-text-secondary hover:text-primary transition-colors"
                  >
                    {label}
                  </a>
                ))}
              </nav>
            </div>

            {/* Contacts */}
            <div>
              <p className="text-sm font-semibold text-text-primary mb-4">Контакты</p>
              <div className="flex flex-col gap-3 text-sm text-text-secondary">
                <a
                  href="mailto:educationbridge.kg@gmail.com"
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <Send className="w-4 h-4 flex-shrink-0" />
                  educationbridge.kg@gmail.com
                </a>
                <a
                  href="https://instagram.com/edubridge.kg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <Globe className="w-4 h-4 flex-shrink-0" />
                  @edubridge.kg
                </a>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>г. Бишкек, Ленинский район,<br />ул. Фурманова 12</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
            <p>© 2025 EduBridge University. Все права защищены.</p>
            <p>Кыргызстан · Казахстан · Россия</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
