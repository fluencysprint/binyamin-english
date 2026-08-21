import { createContext, useCallback, useContext, useRef, useState, ReactNode } from 'react'
import styles from './Toast.module.css'

interface ToastItem {
  id: number
  message: string
  tone: 'info' | 'ok' | 'err'
}

interface ToastValue {
  toast: (message: string, tone?: ToastItem['tone']) => void
}

const ToastContext = createContext<ToastValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const toast = useCallback((message: string, tone: ToastItem['tone'] = 'info') => {
    const id = nextId.current++
    setItems((cur) => [...cur, { id, message, tone }])
    window.setTimeout(() => setItems((cur) => cur.filter((t) => t.id !== id)), 3200)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* noPrint: a fixed overlay would otherwise be stamped onto every sheet. */}
      <div className={`noPrint ${styles.region}`} role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`${styles.toast} ${styles[t.tone]}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}

/**
 * Toast if a provider is mounted, no-op if not. For ADVISORY messages only —
 * a lesson view must still render when it is mounted outside the app shell
 * (a test, a print preview), and a missing toast for "audio did not play" is
 * not worth taking the screen down for.
 */
export function useOptionalToast(): ToastValue['toast'] {
  const ctx = useContext(ToastContext)
  return ctx?.toast ?? noop
}

function noop() {
  /* no provider mounted — advisory message dropped */
}
