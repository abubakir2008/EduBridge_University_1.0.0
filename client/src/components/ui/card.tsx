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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      whileHover={glowOnHover ? { y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } : undefined}
      className={cn(
        'rounded-card border border-slate-200 bg-white shadow-card transition-shadow',
        paddingMap[padding],
        className
      )}
    >
      {children}
    </motion.div>
  )
}
