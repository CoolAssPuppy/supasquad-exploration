'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { Button } from './Button'

interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm?: () => void
  isLoading?: boolean
  variant?: 'default' | 'danger'
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  isLoading = false,
  variant = 'default',
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement
      dialog.showModal()
    } else {
      dialog.close()
      previousActiveElement.current?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleCancel = (e: Event) => {
      e.preventDefault()
      onClose()
    }

    const handleClick = (e: MouseEvent) => {
      // Close on backdrop click
      const rect = dialog.getBoundingClientRect()
      const isInDialog =
        rect.top <= e.clientY &&
        e.clientY <= rect.bottom &&
        rect.left <= e.clientX &&
        e.clientX <= rect.right

      if (!isInDialog) {
        onClose()
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    dialog.addEventListener('cancel', handleCancel)
    dialog.addEventListener('click', handleClick)
    dialog.addEventListener('keydown', handleKeyDown)

    return () => {
      dialog.removeEventListener('cancel', handleCancel)
      dialog.removeEventListener('click', handleClick)
      dialog.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  if (!isOpen) return null

  return (
    <dialog
      ref={dialogRef}
      className="
        fixed inset-0 z-50
        m-auto p-0
        w-full max-w-md
        rounded-lg border border-[var(--border)]
        bg-[var(--surface-100)]
        shadow-xl
        backdrop:bg-black/50 backdrop:backdrop-blur-sm
      "
    >
      <div className="p-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">{title}</h2>
        {description && (
          <p className="mt-2 text-sm text-[var(--foreground-lighter)]">{description}</p>
        )}
        {children && <div className="mt-4">{children}</div>}

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          {onConfirm && (
            <Button
              variant={variant === 'danger' ? 'danger' : 'primary'}
              onClick={onConfirm}
              isLoading={isLoading}
            >
              {confirmLabel}
            </Button>
          )}
        </div>
      </div>
    </dialog>
  )
}
