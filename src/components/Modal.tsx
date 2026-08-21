import { ReactNode, useEffect, useRef } from 'react'
import { useI18n } from '../i18n/I18nProvider'
import styles from './Modal.module.css'

export function Modal({
  title,
  onClose,
  children,
  width = 520,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  width?: number
}) {
  const { t } = useI18n()
  const ref = useRef<HTMLDivElement>(null)

  // Focus the dialog once on mount for screen readers / keyboard users.
  // This must not re-run on every render: the parent may pass a new
  // `onClose` closure each render (e.g. while a timer is ticking), and
  // re-focusing the dialog would steal focus away from whatever the user
  // is currently typing into (e.g. an input inside the modal body).
  useEffect(() => {
    ref.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className={styles.backdrop} onMouseDown={onClose}>
      <div
        className={styles.dialog}
        style={{ maxWidth: width }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={ref}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label={t('common.close')}>
            ×
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  )
}
