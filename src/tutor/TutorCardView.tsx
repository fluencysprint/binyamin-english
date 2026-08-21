import { TutorCard } from '../types'
import { useI18n } from '../i18n/I18nProvider'
import { LockIcon } from '../components/icons'
import { useModeAccess } from '../app/ModeGate'
import { Bdi } from '../components/Bdi'
import styles from './TutorCardView.module.css'

/** Renders a private tutor card. Hidden entirely in Student and Together modes
 *  so answers/notes are never exposed on a shared screen. */
export function TutorCardView({ card }: { card?: TutorCard }) {
  const { t } = useI18n()
  const access = useModeAccess()
  if (!card || !access.tutorGuidance) return null

  const section = (label: string, items: string[]) =>
    items.length > 0 && (
      <div className={styles.section}>
        <div className={styles.label}>{label}</div>
        <ul className={styles.list}>
          {items.map((it, i) => (
            <li key={i} dir="ltr">
              {it}
            </li>
          ))}
        </ul>
      </div>
    )

  return (
    <aside className={styles.card} aria-label={t('lesson.tutorCard')}>
      <div className={styles.badge}>
        <LockIcon /> {t('lesson.tutorCard')}
      </div>
      <div className={styles.goal}>
        <span className={styles.label}>{t('lesson.goal')}</span> <Bdi>{card.goal}</Bdi>
      </div>
      {section(t('lesson.listenFor'), card.listenFor)}
      <div className={styles.twoCol}>
        <div className={styles.section}>
          <div className={styles.label}>{t('lesson.ifStruggle')}</div>
          <p dir="ltr">{card.ifStruggle}</p>
        </div>
        <div className={styles.section}>
          <div className={styles.label}>{t('lesson.ifSucceed')}</div>
          <p dir="ltr">{card.ifSucceed}</p>
        </div>
      </div>
      <div className={styles.section}>
        <div className={styles.label}>{t('lesson.howToExplain')}</div>
        <p dir="ltr">{card.howToExplain}</p>
      </div>
      {section(t('lesson.model'), card.model)}
      {section(t('lesson.practice'), card.practice)}
      {section(t('lesson.avoid'), card.avoid)}
    </aside>
  )
}
