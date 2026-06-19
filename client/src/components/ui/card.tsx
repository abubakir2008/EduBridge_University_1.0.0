'use client'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  glowOnHover?: boolean
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export function Card({ children, className, padding = 'md', glowOnHover = true }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={glowOnHover ? { y: -4, transition: { duration: 0.2 } } : undefined}
      className={cn(
        'rounded-card border border-slate-100 bg-white shadow-card overflow-hidden transition-shadow',
        glowOnHover && 'hover:shadow-card-hover',
        paddingMap[padding],
        className
      )}
    >
      {children}
    </motion.div>
  )
}
