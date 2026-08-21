import { useI18n } from '../i18n/I18nProvider'
import { PacingProfile, PacingVerdict, lessonPosition } from '../lessons/pacing'
import { TimerIcon } from '../components/icons'
import styles from './PacingBar.module.css'

/**
 * Where we are, and what to do about it.
 *
 * The brief for this component is short: timing is guidance, not punishment.
 * So it never turns red for being over time, never blocks anything, and when
 * the learner is mid-conversation it explicitly says to keep going. The one
 * thing it always answers is "roughly where are we, and should I continue,
 * simplify, advance, or change activity?"
 */
export function PacingBar({
  elapsedSeconds,
  plannedMinutes,
  stepNumber,
  stepCount,
  verdict,
  profile,
}: {
  elapsedSeconds: number
  plannedMinutes: number
  stepNumber: number
  stepCount: number
  verdict: PacingVerdict
  profile: PacingProfile
}) {
  const { t } = useI18n()
  const pct = Math.round(lessonPosition(elapsedSeconds, plannedMinutes) * 100)
  const elapsedMin = Math.floor(elapsedSeconds / 60)

  return (
    <aside className={styles.bar} aria-label={t('pacing.title')}>
      <div className={styles.track} role="presentation">
        <div className={styles.fill} style={{ inlineSize: `${Math.min(100, pct)}%` }} />
      </div>

      <div className={styles.row}>
        <span className={styles.where}>
          <TimerIcon />
          {/* dir=ltr: an RTL context would otherwise flip "12 / 50". */}
          <span dir="ltr">
            {elapsedMin} / {plannedMinutes} {t('common.minutes')}
          </span>
          <span className={styles.sep}>·</span>
          {t('lesson.stepProgress', { current: stepNumber, total: stepCount })}
        </span>

        <span className={`${styles.advice} ${styles[verdict.advice]}`}>{t(`pacing.advice${cap(verdict.advice)}`)}</span>
      </div>

      <p className={styles.reason}>{t(verdict.reasonKey)}</p>
      <p className={styles.note}>{t(profile.noteKey)}</p>
    </aside>
  )
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
