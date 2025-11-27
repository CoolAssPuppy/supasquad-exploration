import { type HTMLAttributes, forwardRef } from 'react'
import Image from 'next/image'

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null
  alt?: string
  fallback?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizePixels = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className = '', src, alt = '', fallback, size = 'md', ...props }, ref) => {
    const sizes = {
      sm: 'h-8 w-8 text-xs',
      md: 'h-10 w-10 text-sm',
      lg: 'h-12 w-12 text-base',
      xl: 'h-16 w-16 text-lg',
    }

    const getFallbackText = () => {
      if (fallback) return fallback.slice(0, 2).toUpperCase()
      if (alt) return alt.slice(0, 2).toUpperCase()
      return '?'
    }

    return (
      <div
        ref={ref}
        className={`
          relative inline-flex items-center justify-center
          rounded-full overflow-hidden
          bg-[var(--surface)] border border-[var(--border)]
          ${sizes[size]}
          ${className}
        `}
        {...props}
      >
        {src ? (
          <Image
            src={src}
            alt={alt}
            width={sizePixels[size]}
            height={sizePixels[size]}
            className="h-full w-full object-cover"
            unoptimized
          />
        ) : (
          <span className="font-medium text-[var(--foreground-light)]">
            {getFallbackText()}
          </span>
        )}
      </div>
    )
  }
)

Avatar.displayName = 'Avatar'

export { Avatar }
