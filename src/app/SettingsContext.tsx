import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import { AppMode, UILanguage } from '../types'
import { Settings, loadSettings, saveSettings } from '../data/settings'

interface SettingsValue extends Settings {
  setLanguage: (l: UILanguage) => void
  setTheme: (t: Settings['theme']) => void
  /** Switching to `student` binds the mode to exactly one student — pass the
   *  id being viewed. Switching to `tutor` or `together` always releases any
   *  existing binding, so a stale one never survives a mode change. */
  setMode: (m: AppMode, studentId?: string) => void
  setTutorUnlocked: (v: boolean) => void
  setMicNoticeAcknowledged: (v: boolean) => void
  setShowTimer: (v: boolean) => void
}

const SettingsContext = createContext<SettingsValue | null>(null)

function applyTheme(theme: Settings['theme']) {
  const root = document.documentElement
  if (theme === 'system') {
    const dark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
    root.setAttribute('data-theme', dark ? 'dark' : 'light')
  } else {
    root.setAttribute('data-theme', theme)
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => loadSettings())

  useEffect(() => {
    saveSettings(settings)
    applyTheme(settings.theme)
  }, [settings])

  // React to system theme changes when in "system" mode.
  useEffect(() => {
    if (settings.theme !== 'system' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [settings.theme])

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((s) => ({ ...s, ...patch }))
  }, [])

  const value = useMemo<SettingsValue>(
    () => ({
      ...settings,
      setLanguage: (language) => update({ language }),
      setTheme: (theme) => update({ theme }),
      setMode: (mode, studentId) =>
        update({ mode, boundStudentId: mode === 'student' ? (studentId ?? null) : null }),
      setTutorUnlocked: (tutorUnlocked) => update({ tutorUnlocked }),
      setMicNoticeAcknowledged: (micNoticeAcknowledged) => update({ micNoticeAcknowledged }),
      setShowTimer: (showTimer) => update({ showTimer }),
    }),
    [settings, update],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings(): SettingsValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider')
  return ctx
}
