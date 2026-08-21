import { useLocation, useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/I18nProvider'
import { UI_LANGUAGES, UILanguage } from '../types'
import { languageNames } from '../locales'
import { GlobeIcon } from './icons'
import { matchPublicPath, pagePath } from '../seo/site'
import styles from './Controls.module.css'

/**
 * `compact` collapses the control to a 40px globe button with the select laid
 * transparently over it — the form the header uses when there is no room for a
 * labelled control. It is driven by the header's measured stage rather than by
 * a media query, so it can never disagree with the rest of the row.
 */
export function LanguageSwitcher({ compact = false }: { compact?: boolean } = {}) {
  const { lang, setLang, t } = useI18n()
  const location = useLocation()
  const navigate = useNavigate()

  /* Public pages carry their language in the URL, so switching language there
     is a navigation, not just a state change — otherwise /about/ would render
     Hebrew while its canonical and hreflang still claimed English. On tutor
     screens (no crawlable URL, no locale prefix) it stays a plain setting. */
  const onChange = (next: UILanguage) => {
    const match = matchPublicPath(location.pathname)
    if (match) {
      navigate(pagePath(match.id, next) + location.search, { replace: true })
    }
    setLang(next)
  }

  return (
    <label className={`${styles.selectWrap} ${compact ? styles.selectCompact : ''}`}>
      <span className="sr-only">{t('nav.language')}</span>
      {/* Wrapped in a span the CSS owns: the icon itself carries an inline
          `display` for baseline alignment, which a class alone cannot undo. */}
      {compact && (
        <span className={styles.selectIcon} aria-hidden="true">
          <GlobeIcon />
        </span>
      )}
      <select
        className={styles.select}
        value={lang}
        onChange={(e) => onChange(e.target.value as UILanguage)}
        aria-label={t('nav.language')}
      >
        {UI_LANGUAGES.map((l) => (
          <option key={l} value={l}>
            {languageNames[l]}
          </option>
        ))}
      </select>
    </label>
  )
}
