import { AssessmentSnapshot, Skill, SkillEvidence } from '../types'
import { useI18n } from '../i18n/I18nProvider'
import { cefrLabel } from '../utils/cefr'
import { Bdi } from './Bdi'
import styles from './SnapshotCard.module.css'

export function SnapshotCard({ snapshot }: { snapshot: AssessmentSnapshot }) {
  const { t, has } = useI18n()
  const level = snapshot.overallCEFR
  // Snapshots carry the i18n key of each focus area alongside its English text,
  // so advice localizes without the level label having to imply the advice.
  const evidence: SkillEvidence[] =
    snapshot.skillEvidence ??
    (Object.keys(snapshot.perSkill) as Skill[]).map((s) => ({
      skill: s,
      status: 'assessed' as const,
      level: snapshot.perSkill[s],
      attempted: 0,
      correct: 0,
    }))
  const measured = evidence.filter((e) => e.status !== 'unassessed' && e.level)
  const unassessed = evidence.filter((e) => e.status === 'unassessed')
  const priorityText = (englishFallback: string, i: number) => {
    const key = snapshot.priorityKeys?.[i]
    return key && has(key) ? t(key) : englishFallback
  }
  const noteKey = `snapshot.notes.${snapshot.sampleCorrectionLevel ?? level}`
  const noteText = has(noteKey) ? t(noteKey) : snapshot.sampleCorrection?.note
  return (
    <div className={`card ${styles.card}`}>
      <h2 className={styles.title}>{t('assessment.resultTitle')}</h2>

      <div className={styles.levelRow}>
        <div>
          <div className="muted">{t('assessment.resultLevel')}</div>
          <div className={styles.level}>
            <Bdi>{cefrLabel(snapshot.overallCEFR)}</Bdi>
            <span className={styles.levelName}>· {t(`cefr.${snapshot.overallCEFR}Name`)}</span>
          </div>
          {snapshot.atCeiling && <div className={styles.ceiling}>{t('assessment.resultCeiling')}</div>}
        </div>
        <div>
          <div className="muted">{t('assessment.resultStrength')}</div>
          <div className={styles.strength}>{t(`skills.${snapshot.strongestSkill}`)}</div>
        </div>
      </div>

      {/* Pre-A1 results are specific and encouraging, never a bare "Beginner". */}
      {snapshot.preA1Stage && (
        <div className={styles.foundation}>
          <p className={styles.foundationLead}>{t(`snapshot.preA1.stage.${snapshot.preA1Stage}`)}</p>
          <dl className={styles.foundationGrid}>
            <div>
              <dt>{t('skills.listening')}</dt>
              <dd>{t('snapshot.preA1.listening')}</dd>
            </div>
            <div>
              <dt>{t('skills.speaking')}</dt>
              <dd>{t('snapshot.preA1.speaking')}</dd>
            </div>
            <div>
              <dt>{t('snapshot.preA1.readingLabel')}</dt>
              <dd>{t('snapshot.preA1.reading')}</dd>
            </div>
            <div>
              <dt>{t('skills.pronunciation')}</dt>
              <dd>{t('snapshot.preA1.pronunciation')}</dd>
            </div>
          </dl>
          <p className={styles.foundationFocus}>
            <strong>{t('snapshot.preA1.focusLabel')}</strong> {t('snapshot.preA1.focus')}
          </p>
        </div>
      )}

      {!snapshot.preA1Stage && measured.length > 0 && (
        <>
          <div className={styles.skillGrid}>
            {measured.map((e) => (
              <div key={e.skill} className={styles.skillChip}>
                <span>{t(`skills.${e.skill}`)}</span>
                <strong>
                  <Bdi>{cefrLabel(e.level!)}</Bdi>
                </strong>
                {/* A skill carried by one or two questions is shown as a rough
                    indication, never as a firm level. */}
                {e.status === 'limited' && (
                  <span className={styles.skillNote}>{t('assessment.skillLimited')}</span>
                )}
              </div>
            ))}
          </div>
          {/* Skills this check cannot see are named as not assessed. Leaving
              them out silently reads as "nothing to say about them"; showing
              them at a default level would be an outright fabrication. */}
          {unassessed.length > 0 && (
            <p className={`muted ${styles.notAssessed}`}>
              {t('assessment.skillsNotAssessed', {
                skills: unassessed.map((e) => t(`skills.${e.skill}`)).join(', '),
              })}
            </p>
          )}
        </>
      )}

      {/* How much evidence the estimate rests on, in plain language. */}
      {snapshot.itemsAttempted != null && snapshot.confidence && (
        <p className={`muted ${styles.evidence}`}>
          {t('assessment.resultEvidence', { count: snapshot.itemsAttempted })}{' '}
          {t(`assessment.confidence.${snapshot.confidence}`)}
        </p>
      )}

      <div>
        <div className={styles.subhead}>{t('assessment.resultPriorities')}</div>
        <ul className={styles.priorities}>
          {snapshot.priorities.map((p, i) => (
            <li key={i} dir="auto">
              {priorityText(p, i)}
            </li>
          ))}
        </ul>
      </div>

      {snapshot.sampleCorrection && (
        <div className={styles.correction}>
          <div className={styles.subhead}>{t('assessment.resultCorrection')}</div>
          <div className={styles.corrRow}>
            <span className={styles.corrLabel}>{t('assessment.resultSaid')}</span>
            <span className={styles.said} dir="ltr">
              {snapshot.sampleCorrection.said}
            </span>
          </div>
          <div className={styles.corrRow}>
            <span className={styles.corrLabel}>{t('assessment.resultBetter')}</span>
            <span className={styles.better} dir="ltr">
              {snapshot.sampleCorrection.better}
            </span>
          </div>
          {noteText && (
            <p className="muted" dir="auto">
              {noteText}
            </p>
          )}
        </div>
      )}

      <p className={`muted ${styles.disclaimer}`}>{t('assessment.resultDisclaimer')}</p>
    </div>
  )
}
