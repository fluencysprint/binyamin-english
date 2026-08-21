import { useI18n } from '../i18n/I18nProvider'
import { ValidationIssue } from '../utils/validation'
import { WarningIcon } from '../components/icons'
import styles from './FieldError.module.css'

/**
 * A friendly, localized validation message under a field.
 *
 * Validation issues travel as i18n keys plus params (see src/utils/validation.ts)
 * rather than as English sentences, so the message a Hebrew-speaking parent sees
 * is Hebrew — including the numbers in "between 5 and 120".
 */
export function FieldError({ issue, id }: { issue?: ValidationIssue; id?: string }) {
  const { t } = useI18n()
  if (!issue) return null
  return (
    <p className={styles.error} id={id} role="alert">
      <WarningIcon /> {t(issue.key, issue.params)}
    </p>
  )
}
