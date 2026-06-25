import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "sonner";

const SITE_URL = "https://university.edubridge.bond";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default:
      "EduBridge University — Поступление в зарубежные университеты для студентов СНГ",
    template: "%s | EduBridge University",
  },
  description:
    "Помогаем студентам из Кыргызстана, Казахстана и России поступить в университеты Германии, Италии, Китая, Турции, США. Полное сопровождение от заявки до диплома. Бесплатная консультация.",
  keywords: [
    "поступление в зарубежный университет",
    "учёба за границей",
    "поступление в Германию",
    "поступление в Италию",
    "поступление в Китай",
    "поступление в Турцию",
    "поступление в США",
    "студенты из Кыргызстана",
    "студенты из Казахстана",
    "EduBridge",
    "образование за рубежом",
    "грант на обучение за границей",
    "помощь с поступлением",
    "международное образование Бишкек",
    "консультация по поступлению",
  ],
  authors: [{ name: "EduBridge University", url: SITE_URL }],
  creator: "EduBridge University",
  publisher: "EduBridge University",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: SITE_URL,
    siteName: "EduBridge University",
    title:
      "EduBridge University — Поступление в зарубежные университеты для студентов СНГ",
    description:
      "Помогаем студентам из Кыргызстана, Казахстана и России поступить в университеты Германии, Италии, Китая, Турции, США. Полное сопровождение от заявки до диплома.",
    // og:image подставляется автоматически из app/opengraph-image.tsx
  },

  twitter: {
    card: "summary_large_image",
    title:
      "EduBridge University — Поступление в зарубежные университеты для студентов СНГ",
    description:
      "Помогаем студентам из СНГ поступить в университеты Германии, Италии, Китая, Турции, США.",
    // twitter:image берётся из app/opengraph-image.tsx
  },

  alternates: {
    canonical: SITE_URL,
  },

  // favicon / apple-icon подставляются из app/icon.tsx и app/apple-icon.tsx

  verification: {
    // Вставьте код подтверждения из Google Search Console (мета-тег google-site-verification)
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    // Яндекс.Вебмастер (аудитория РФ/КЗ/КГ)
    other: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION
      ? { "yandex-verification": process.env.NEXT_PUBLIC_YANDEX_VERIFICATION }
      : {},
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
