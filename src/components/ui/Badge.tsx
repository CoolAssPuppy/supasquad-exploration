import { type HTMLAttributes, forwardRef } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'brand' | 'success' | 'warning' | 'destructive'
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-[var(--surface)] text-[var(--foreground-light)] border-[var(--border)]',
      brand: 'bg-[var(--brand)]/10 text-[var(--brand)] border-[var(--brand)]/20',
      success: 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20',
      warning: 'bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20',
      destructive: 'bg-[var(--destructive)]/10 text-[var(--destructive)] border-[var(--destructive)]/20',
    }

    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center px-2 py-0.5
          text-xs font-medium
          rounded-full border
          ${variants[variant]}
          ${className}
        `}
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

export { Badge }
