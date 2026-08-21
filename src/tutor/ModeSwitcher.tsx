import { useState } from 'react'
import { useSettings } from '../app/SettingsContext'
import { useI18n } from '../i18n/I18nProvider'
import { checkTutorPhrase } from '../app/config'
import { AppMode } from '../types'
import { LockIcon } from '../components/icons'
import styles from './ModeSwitcher.module.css'

const MODES: AppMode[] = ['tutor', 'together', 'student']

/**
 * The mode control — and the way back out of Student mode.
 *
 * Student mode exists because the device is handed over. A switch that any
 * hand can flip protects nothing: every rule the rest of the app enforces is
 * one tap from being undone. So leaving Student mode costs the same access
 * phrase that opens the tutor area in the first place (see TutorGate — a light
 * gate, not real security). Entering Student mode is free, and switching
 * between Tutor and Together is free: the tutor is present in both.
 *
 * Entering Student mode always binds it to exactly one student (see
 * SettingsContext.setMode / app/ModeGate.tsx's StudentScopeGate) — `studentId`
 * is the student currently on screen, when there is one. Without it there is
 * no student to bind to, so the control refuses to guess: the "Student"
 * option stays disabled until the tutor opens a student's page first.
 */
export function ModeSwitcher({ studentId }: { studentId?: string }) {
  const { mode, setMode } = useSettings()
  const { t } = useI18n()
  const [pending, setPending] = useState<AppMode | null>(null)
  const [phrase, setPhrase] = useState('')
  const [error, setError] = useState(false)

  const choose = (m: AppMode) => {
    if (m === mode) return
    if (mode === 'student') {
      setPending(m)
      setPhrase('')
      setError(false)
      return
    }
    if (m === 'student') {
      if (!studentId) return
      setMode(m, studentId)
      return
    }
    setMode(m)
  }

  const confirm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!pending) return
    if (!checkTutorPhrase(phrase)) {
      setError(true)
      return
    }
    setMode(pending)
    setPending(null)
    setPhrase('')
    setError(false)
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.row} role="radiogroup" aria-label={t('modes.switch')}>
        {MODES.map((m) => {
          const needsSelection = m === 'student' && mode !== 'student' && !studentId
          return (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              disabled={needsSelection}
              className={`${styles.btn} ${mode === m ? styles.active : ''}`}
              onClick={() => choose(m)}
              title={needsSelection ? t('modes.studentNeedsSelection') : t(`modes.${m}Desc`)}
            >
              {t(`modes.${m}`)}
            </button>
          )
        })}
      </div>

      {pending && (
        <form onSubmit={confirm} className={styles.unlock}>
          <label className="field">
            <input
              className="input"
              type="password"
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder={t('gate.placeholder')}
              aria-label={t('modes.unlockToLeave')}
              aria-invalid={error}
              autoFocus
            />
          </label>
          <button type="submit" className="btn btn-sm btn-primary">
            {t('gate.unlock')}
          </button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setPending(null)}>
            {t('common.cancel')}
          </button>
          {error && (
            <p role="alert" className={styles.unlockError}>
              {t('gate.wrong')}
            </p>
          )}
        </form>
      )}
    </div>
  )
}

export function LockButton() {
  const { setTutorUnlocked } = useSettings()
  const { t } = useI18n()
  return (
    <button
      type="button"
      className="btn btn-sm btn-ghost"
      onClick={() => setTutorUnlocked(false)}
      title={t('gate.lock')}
      aria-label={t('gate.lock')}
    >
      <LockIcon />
    </button>
  )
}
