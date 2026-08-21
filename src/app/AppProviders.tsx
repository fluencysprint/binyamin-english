import { ReactNode } from 'react'
import { SettingsProvider, useSettings } from './SettingsContext'
import { I18nProvider } from '../i18n/I18nProvider'
import { ToastProvider } from '../components/Toast'

/** Bridges settings → i18n so the chosen language drives translations + dir. */
function I18nBridge({ children }: { children: ReactNode }) {
  const { language, setLanguage } = useSettings()
  return (
    <I18nProvider initialLang={language} onLangChange={setLanguage}>
      {children}
    </I18nProvider>
  )
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <I18nBridge>
        <ToastProvider>{children}</ToastProvider>
      </I18nBridge>
    </SettingsProvider>
  )
}
