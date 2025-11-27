import { type ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'default' | 'secondary' | 'outline' | 'dashed' | 'link' | 'text' | 'danger' | 'warning'
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge'
  isLoading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'medium',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      relative inline-flex items-center justify-center space-x-2
      rounded-md font-medium
      outline-none focus-visible:outline-4 focus-visible:outline-offset-1
      transition-all duration-200 ease-out
      cursor-pointer
      disabled:opacity-50 disabled:cursor-not-allowed
    `

    const variants = {
      primary: `
        bg-[var(--brand)] hover:bg-[var(--brand)]/80
        text-[var(--background)]
        border border-[var(--brand-500)]/75
        focus-visible:outline-[var(--brand)]/50
      `,
      default: `
        bg-[var(--surface-200)] hover:bg-[var(--surface-300)]
        text-[var(--foreground)]
        border border-[var(--border-strong)] hover:border-[var(--foreground-muted)]
        focus-visible:outline-[var(--border-strong)]
      `,
      secondary: `
        bg-[var(--foreground)] hover:bg-[var(--foreground-light)]
        text-[var(--background)]
        border border-[var(--foreground-light)]
        focus-visible:outline-[var(--foreground)]/50
      `,
      outline: `
        bg-transparent hover:bg-[var(--surface-200)]
        text-[var(--foreground)]
        border border-[var(--border-strong)] hover:border-[var(--foreground-muted)]
        focus-visible:outline-[var(--border-strong)]
      `,
      dashed: `
        bg-transparent hover:bg-[var(--surface-200)]
        text-[var(--foreground)]
        border border-dashed border-[var(--border-strong)] hover:border-[var(--foreground-muted)]
        focus-visible:outline-[var(--border-strong)]
      `,
      link: `
        bg-transparent hover:bg-[var(--brand)]/10
        text-[var(--brand)] hover:text-[var(--brand-400)]
        border-none p-0
        focus-visible:outline-[var(--brand)]/50
      `,
      text: `
        bg-transparent hover:bg-[var(--surface-300)]
        text-[var(--foreground-light)] hover:text-[var(--foreground)]
        border-none
        focus-visible:outline-[var(--surface-300)]
      `,
      danger: `
        bg-[var(--destructive-400)] hover:bg-[var(--destructive)]
        text-white
        border border-[var(--destructive-500)]
        focus-visible:outline-[var(--destructive)]/50
      `,
      warning: `
        bg-[var(--warning-400)] hover:bg-[var(--warning)]
        text-[var(--background)]
        border border-[var(--warning-500)]
        focus-visible:outline-[var(--warning)]/50
      `,
    }

    const sizes = {
      tiny: 'px-2.5 py-1 text-xs h-[26px]',
      small: 'px-3 py-2 text-sm leading-4 h-[34px]',
      medium: 'px-4 py-2 text-sm h-[38px]',
      large: 'px-4 py-2 text-base h-[42px]',
      xlarge: 'px-6 py-3 text-base h-[50px]',
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
