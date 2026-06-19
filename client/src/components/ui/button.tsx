'use client'
import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-[1.02] active:scale-[0.97]',
  {
    variants: {
      variant: {
        primary: 'bg-gradient-to-r from-primary to-navy text-white shadow-glow hover:shadow-glow-lg hover:brightness-110',
        secondary: 'bg-white text-primary border-2 border-primary/30 hover:border-primary/60 hover:bg-primary/5',
        ghost: 'text-text-secondary hover:bg-primary/5 hover:text-primary',
        danger: 'bg-error text-white hover:bg-red-600 shadow-lg shadow-red-500/20',
        outline: 'border-2 border-primary/30 text-primary hover:border-primary/60 hover:bg-primary/5',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-5 text-sm',
        lg: 'h-12 px-7 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
)
Button.displayName = 'Button'

export { Button, buttonVariants }
