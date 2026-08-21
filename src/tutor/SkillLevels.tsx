import { LearningModel, SKILLS } from '../types'
import { useI18n } from '../i18n/I18nProvider'
import { cefrIndex, cefrLabel } from '../utils/cefr'
import { CEFR_LEVELS } from '../types'
import { Bdi } from '../components/Bdi'
import styles from './SkillLevels.module.css'

/** Per-skill CEFR estimates with a simple visual bar. Avoids fake precision:
 *  shows the band + a low-confidence hint, not a decimal score. */
export function SkillLevels({ model }: { model: LearningModel }) {
  const { t } = useI18n()
  const maxIdx = CEFR_LEVELS.length - 1
  return (
    <div className={styles.grid}>
      {SKILLS.map((skill) => {
        const est = model.skillEstimates[skill]
        const pct = (cefrIndex(est.level) / maxIdx) * 100
        const low = est.confidence < 0.45
        return (
          <div key={skill} className={styles.row}>
            <span className={styles.name}>{t(`skills.${skill}`)}</span>
            <div className={styles.bar} aria-hidden="true">
              <div className={styles.fill} style={{ width: `${Math.max(6, pct)}%` }} />
            </div>
            <span className={styles.level}>
              <Bdi>{cefrLabel(est.level)}</Bdi>
            </span>
            {/* The low-confidence "~" gets its own always-rendered column so the
                level labels sit at the same x on every row, with or without it. */}
            <span
              className={styles.confidence}
              title={low ? 'Low confidence — needs more evidence' : undefined}
              aria-hidden={low ? undefined : 'true'}
            >
              {low ? '~' : ''}
            </span>
          </div>
        )
      })}
    </div>
  )
}
