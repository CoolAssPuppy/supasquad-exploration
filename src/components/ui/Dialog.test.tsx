import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Dialog } from './Dialog'

// Mock HTMLDialogElement methods since jsdom doesn't fully support them
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  })
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open')
  })
})

describe('Dialog component', () => {
  describe('when dialog is closed', () => {
    it('should not render content when isOpen is false', () => {
      render(
        <Dialog isOpen={false} onClose={vi.fn()} title="Test Dialog">
          Dialog content
        </Dialog>
      )

      expect(screen.queryByText('Test Dialog')).not.toBeInTheDocument()
    })
  })

  describe('when dialog is open', () => {
    it('should render title', () => {
      render(
        <Dialog isOpen={true} onClose={vi.fn()} title="Test Dialog">
          Content
        </Dialog>
      )

      expect(screen.getByText('Test Dialog')).toBeInTheDocument()
    })

    it('should render description when provided', () => {
      render(
        <Dialog
          isOpen={true}
          onClose={vi.fn()}
          title="Test"
          description="This is a description"
        >
          Content
        </Dialog>
      )

      expect(screen.getByText('This is a description')).toBeInTheDocument()
    })

    it('should render children content', () => {
      render(
        <Dialog isOpen={true} onClose={vi.fn()} title="Test">
          <p>Custom child content</p>
        </Dialog>
      )

      expect(screen.getByText('Custom child content')).toBeInTheDocument()
    })

    it('should call showModal on the dialog element', () => {
      render(
        <Dialog isOpen={true} onClose={vi.fn()} title="Test">
          Content
        </Dialog>
      )

      expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled()
    })
  })

  describe('when handling button actions', () => {
    it('should render cancel button with default label', () => {
      render(
        <Dialog isOpen={true} onClose={vi.fn()} title="Test">
          Content
        </Dialog>
      )

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    })

    it('should render cancel button with custom label', () => {
      render(
        <Dialog isOpen={true} onClose={vi.fn()} title="Test" cancelLabel="Dismiss">
          Content
        </Dialog>
      )

      expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument()
    })

    it('should call onClose when cancel button is clicked', () => {
      const onClose = vi.fn()
      render(
        <Dialog isOpen={true} onClose={onClose} title="Test">
          Content
        </Dialog>
      )

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should render confirm button when onConfirm is provided', () => {
      render(
        <Dialog isOpen={true} onClose={vi.fn()} title="Test" onConfirm={vi.fn()}>
          Content
        </Dialog>
      )

      expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
    })

    it('should render confirm button with custom label', () => {
      render(
        <Dialog
          isOpen={true}
          onClose={vi.fn()}
          title="Test"
          onConfirm={vi.fn()}
          confirmLabel="Delete"
        >
          Content
        </Dialog>
      )

      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
    })

    it('should call onConfirm when confirm button is clicked', () => {
      const onConfirm = vi.fn()
      render(
        <Dialog isOpen={true} onClose={vi.fn()} title="Test" onConfirm={onConfirm}>
          Content
        </Dialog>
      )

      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))

      expect(onConfirm).toHaveBeenCalledTimes(1)
    })

    it('should not render confirm button when onConfirm is not provided', () => {
      render(
        <Dialog isOpen={true} onClose={vi.fn()} title="Test">
          Content
        </Dialog>
      )

      expect(screen.queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument()
    })
  })

  describe('when using danger variant', () => {
    it('should apply danger variant to confirm button', () => {
      render(
        <Dialog
          isOpen={true}
          onClose={vi.fn()}
          title="Delete Item"
          onConfirm={vi.fn()}
          variant="danger"
        >
          Content
        </Dialog>
      )

      const confirmButton = screen.getByRole('button', { name: 'Confirm' })
      expect(confirmButton.className).toContain('bg-[var(--destructive-400)]')
    })
  })

  describe('when in loading state', () => {
    it('should show loading state on confirm button', () => {
      render(
        <Dialog
          isOpen={true}
          onClose={vi.fn()}
          title="Test"
          onConfirm={vi.fn()}
          isLoading={true}
        >
          Content
        </Dialog>
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should disable cancel button when loading', () => {
      render(
        <Dialog
          isOpen={true}
          onClose={vi.fn()}
          title="Test"
          onConfirm={vi.fn()}
          isLoading={true}
        >
          Content
        </Dialog>
      )

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    })
  })

  describe('when handling keyboard events', () => {
    it('should call onClose when Escape key is pressed', () => {
      const onClose = vi.fn()
      render(
        <Dialog isOpen={true} onClose={onClose} title="Test">
          Content
        </Dialog>
      )

      const dialog = document.querySelector('dialog')
      fireEvent.keyDown(dialog!, { key: 'Escape' })

      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('when handling cancel event', () => {
    it('should call onClose and prevent default on cancel event', () => {
      const onClose = vi.fn()
      render(
        <Dialog isOpen={true} onClose={onClose} title="Test">
          Content
        </Dialog>
      )

      const dialog = document.querySelector('dialog')
      const cancelEvent = new Event('cancel', { cancelable: true })
      const preventDefaultSpy = vi.spyOn(cancelEvent, 'preventDefault')
      dialog!.dispatchEvent(cancelEvent)

      expect(preventDefaultSpy).toHaveBeenCalled()
      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('when clicking backdrop', () => {
    it('should call onClose when clicking outside dialog content', () => {
      const onClose = vi.fn()
      render(
        <Dialog isOpen={true} onClose={onClose} title="Test">
          Content
        </Dialog>
      )

      const dialog = document.querySelector('dialog')
      // Simulate a click outside the dialog bounds
      Object.defineProperty(dialog, 'getBoundingClientRect', {
        value: () => ({ top: 100, bottom: 200, left: 100, right: 300 }),
      })

      // Click outside (coordinates outside the dialog bounds)
      fireEvent.click(dialog!, { clientX: 50, clientY: 50 })

      expect(onClose).toHaveBeenCalled()
    })

    it('should not call onClose when clicking inside dialog content', () => {
      const onClose = vi.fn()
      render(
        <Dialog isOpen={true} onClose={onClose} title="Test">
          Content
        </Dialog>
      )

      const dialog = document.querySelector('dialog')
      Object.defineProperty(dialog, 'getBoundingClientRect', {
        value: () => ({ top: 100, bottom: 200, left: 100, right: 300 }),
      })

      // Click inside (coordinates inside the dialog bounds)
      fireEvent.click(dialog!, { clientX: 150, clientY: 150 })

      expect(onClose).not.toHaveBeenCalled()
    })
  })

  // Note: Testing dialog.close() on isOpen=false is not applicable because
  // the component returns null when isOpen is false, so the useEffect doesn't run
  // and the dialog element doesn't exist in the DOM.
})
