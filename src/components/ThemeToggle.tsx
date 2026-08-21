import { useSettings } from '../app/SettingsContext'
import { useI18n } from '../i18n/I18nProvider'
import { MonitorIcon, MoonIcon, SunIcon } from './icons'
import styles from './Controls.module.css'

const order = ['system', 'light', 'dark'] as const

export function ThemeToggle() {
  const { theme, setTheme } = useSettings()
  const { t } = useI18n()
  const Icon = theme === 'dark' ? MoonIcon : theme === 'light' ? SunIcon : MonitorIcon
  const label =
    theme === 'dark' ? t('nav.themeDark') : theme === 'light' ? t('nav.themeLight') : t('nav.themeSystem')

  const cycle = () => {
    const idx = order.indexOf(theme as (typeof order)[number])
    setTheme(order[(idx + 1) % order.length])
  }

  return (
    <button
      type="button"
      className={styles.iconBtn}
      onClick={cycle}
      aria-label={`${t('nav.theme')}: ${label}`}
      title={`${t('nav.theme')}: ${label}`}
    >
      <Icon />
    </button>
  )
}
