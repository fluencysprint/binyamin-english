import { TutorCard } from '../types'
import { useI18n } from '../i18n/I18nProvider'
import { LockIcon } from '../components/icons'
import { useModeAccess } from '../app/ModeGate'
import { Bdi } from '../components/Bdi'
import { BidiText } from '../components/BidiText'
import { hasRTL } from '../utils/bidi'
import styles from './TutorCardView.module.css'

/** Renders a private tutor card. Hidden entirely in Student and Together modes
 *  so answers/notes are never exposed on a shared screen. */
export function TutorCardView({ card }: { card?: TutorCard }) {
  const { t } = useI18n()
  const access = useModeAccess()
  if (!card || !access.tutorGuidance) return null

  /* Some sections are always the English being taught (model, practice,
     listenFor); others (avoid, in particular) are tutor instructions that
     localize. A blanket dir="ltr" here was correct for the first kind and
     silently broke list markers for the second — each item picks its own
     direction from what it actually contains. */
  const section = (label: string, items: string[]) =>
    items.length > 0 && (
      <div className={styles.section}>
        <div className={styles.label}>{label}</div>
        <ul className={styles.list}>
          {items.map((it, i) => (
            <li key={i} dir={hasRTL(it) ? 'rtl' : 'ltr'}>
              <BidiText text={it} block />
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
          <p dir={hasRTL(card.ifStruggle) ? 'rtl' : 'ltr'}>
            <BidiText text={card.ifStruggle} />
          </p>
        </div>
        <div className={styles.section}>
          <div className={styles.label}>{t('lesson.ifSucceed')}</div>
          <p dir={hasRTL(card.ifSucceed) ? 'rtl' : 'ltr'}>
            <BidiText text={card.ifSucceed} />
          </p>
        </div>
      </div>
      <div className={styles.section}>
        <div className={styles.label}>{t('lesson.howToExplain')}</div>
        <p dir={hasRTL(card.howToExplain) ? 'rtl' : 'ltr'}>
          <BidiText text={card.howToExplain} />
        </p>
      </div>
      {section(t('lesson.model'), card.model)}
      {section(t('lesson.practice'), card.practice)}
      {section(t('lesson.avoid'), card.avoid)}
    </aside>
  )
}
