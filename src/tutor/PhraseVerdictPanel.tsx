import { PhraseVerdictValue } from '../types'
import { useI18n } from '../i18n/I18nProvider'
import { PhraseTarget } from '../curriculum/phrases'
import { PHRASE_VERDICTS } from '../curriculum/phraseProgress'
import { Bdi } from '../components/Bdi'
import styles from './PhraseVerdictPanel.module.css'

/**
 * The one place a phrase lesson becomes evidence.
 *
 * A grammar lesson has a single objective and a single score at the end. A
 * phrase lesson has eight to ten targets, and the difference between "we
 * covered greetings" and "they can say four of these without help" is entirely
 * in whether the tutor was asked, per phrase, at the moment they saw it.
 *
 * Two decisions the panel is built around:
 *
 *   1. FOUR RUNGS, NOT THREE. "Understood it" is a real result on the day a
 *      learner first meets English, and folding it into "not yet" would tell
 *      a beginner they achieved nothing.
 *
 *   2. THE RULE IS ON SCREEN. "Said it alone" is the only rung that claims
 *      memory, so the panel states what it means — nothing shown, nothing
 *      modelled first — rather than assuming the tutor knows. Getting that
 *      one distinction right is what the whole mastery system rests on, and
 *      it is not something a new tutor should have to infer from a label.
 */
export function PhraseVerdictPanel({
  phrases,
  verdicts,
  onSet,
}: {
  phrases: PhraseTarget[]
  verdicts: Record<string, PhraseVerdictValue>
  onSet: (id: string, verdict: PhraseVerdictValue) => void
}) {
  const { t } = useI18n()
  if (phrases.length === 0) return null

  return (
    <section className={`card ${styles.panel}`} aria-label={t('phrase.verdictTitle')}>
      <div className={styles.head}>
        <strong>{t('phrase.verdictTitle')}</strong>
        <p className="muted">{t('phrase.verdictRule')}</p>
      </div>
      <ul className={styles.rows}>
        {phrases.map((p) => (
          <li key={p.id} className={styles.row}>
            <span className={styles.chunk} dir="ltr" lang="en">
              <Bdi>{p.chunk}</Bdi>
            </span>
            <div className={styles.chips} role="group" aria-label={p.chunk}>
              {PHRASE_VERDICTS.map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`chip ${styles.chip} ${styles[v]}`}
                  aria-pressed={verdicts[p.id] === v}
                  onClick={() => onSet(p.id, v)}
                >
                  {t(`phrase.verdict.${v}`)}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
