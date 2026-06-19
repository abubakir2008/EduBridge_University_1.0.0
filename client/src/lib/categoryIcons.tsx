import {
  Plane, GraduationCap, Languages, Globe, FileText, Award, BookOpen,
  MapPin, Briefcase, Home, Wallet, Newspaper, Lightbulb, Building2, Users, Tag,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// Набор иконок для рубрик блога. Эмодзи в проекте не используем — только иконки.
export const CATEGORY_ICONS: { key: string; Icon: LucideIcon; label: string }[] = [
  { key: 'plane', Icon: Plane, label: 'Переезд' },
  { key: 'graduation-cap', Icon: GraduationCap, label: 'Поступление' },
  { key: 'languages', Icon: Languages, label: 'Языки' },
  { key: 'globe', Icon: Globe, label: 'Страны' },
  { key: 'file-text', Icon: FileText, label: 'Документы' },
  { key: 'award', Icon: Award, label: 'Гранты' },
  { key: 'book', Icon: BookOpen, label: 'Учёба' },
  { key: 'map-pin', Icon: MapPin, label: 'Город' },
  { key: 'briefcase', Icon: Briefcase, label: 'Работа' },
  { key: 'home', Icon: Home, label: 'Жильё' },
  { key: 'wallet', Icon: Wallet, label: 'Бюджет' },
  { key: 'newspaper', Icon: Newspaper, label: 'Новости' },
  { key: 'lightbulb', Icon: Lightbulb, label: 'Советы' },
  { key: 'building', Icon: Building2, label: 'Вузы' },
  { key: 'users', Icon: Users, label: 'Сообщество' },
]

const BY_KEY: Record<string, LucideIcon> = Object.fromEntries(CATEGORY_ICONS.map((i) => [i.key, i.Icon]))

export function CategoryIcon({ icon, className }: { icon?: string | null; className?: string }) {
  const Icon = (icon && BY_KEY[icon]) || Tag
  return <Icon className={className} />
}
