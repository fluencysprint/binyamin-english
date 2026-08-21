import { MicroStep } from '../lessons/microSteps'
import { LessonActivity } from '../types'
import { useI18n } from '../i18n/I18nProvider'
import { BidiText } from '../components/BidiText'
import { useSpeak, useSpeechAvailable } from '../components/useSpeak'
import { SpeakerIcon } from '../components/icons'
import styles from './StudentTaskView.module.css'

/**
 * What the LEARNER sees, in Student and Together modes.
 *
 * Three rules, and they are the whole component:
 *
 * 1. ONE task at a time. No list of upcoming steps, no phase plan, nothing to
 *    scan — a nervous beginner reading five instructions does none of them.
 *
 * 2. The instruction is in the CURRENTLY SELECTED interface language — the one
 *    the tutor picked in the header, on the screen they are both looking at.
 *    It is deliberately NOT the language stored on the profile: a stored
 *    preference made the app show one student's task in French while the whole
 *    rest of the UI was English, and switching the header language did not
 *    fix it. The profile keeps `interfaceLanguage` as the DEFAULT to start a
 *    lesson in; what is on screen always follows what is selected now.
 *    The English TARGET stays English — that is the thing being learned.
 *
 * 3. Nothing from the tutor's side is rendered here at all. Not hidden with
 *    CSS, not collapsed: simply never passed in. SAY, LOOK FOR, HELP and the
 *    rest do not exist in this tree.
 */
export function StudentTaskView({ step, activity }: { step: MicroStep; activity: LessonActivity }) {
  const { t, dir } = useI18n()
  const say = useSpeak()
  const canListen = useSpeechAvailable()

  const instruction = t(step.studentKey, step.studentParams)

  // The English target: shown as English, marked LTR, visually separated so it
  // never reads as part of the instruction.
  const target = step.speak ?? activity.speak

  return (
    <section className={styles.task} dir={dir} aria-live="polite">
      {/* Hebrew instructions embed English ("…אמרו: “My name is ___.”").
          BidiText isolates each embedded run so its quotes, blanks and
          punctuation stay attached to the English instead of being flung to
          the far end of the RTL line. */}
      <p className={styles.instruction}>
        <BidiText text={instruction} />
      </p>

      {target && (
        <div className={styles.target} dir="ltr" lang="en">
          <span className={styles.targetText}>{target}</span>
          {canListen && (
            <button type="button" className="btn btn-lg" onClick={() => say(target)}>
              <SpeakerIcon /> {t('lesson.listen')}
            </button>
          )}
        </div>
      )}

      {activity.passage && (
        <blockquote className={styles.passage} dir="ltr" lang="en">
          {activity.passage}
        </blockquote>
      )}
    </section>
  )
}
