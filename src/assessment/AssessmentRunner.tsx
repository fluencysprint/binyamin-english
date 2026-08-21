import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../i18n/I18nProvider'
import { SpeakerIcon } from '../components/icons'
import { AgeBand, AssessmentItem, AssessmentSnapshot, CEFR, ItemResponse } from '../types'
import { publicAssessmentItems } from '../data/assessmentBank'
import { foundationalAssessmentItems } from '../data/beginnerAssessment'
import { buildDiagnosticPlan, buildFoundationalPlan } from './placement'
import { buildSnapshot } from './snapshot'
import { scoreAutoItem } from './itemSelector'
import { shouldStopEarly } from '../students/beginnerModel'
import { Progress } from '../components/ui'
import { speak } from '../utils/speech'
import { useSpeak, useSpeechAvailable } from '../components/useSpeak'
import styles from './AssessmentRunner.module.css'

export interface AssessmentRunnerProps {
  ageBand: AgeBand
  selfLevel?: CEFR
  foundational: boolean
  /** Receives the finished placement. The runner deliberately does not persist
   *  anything itself — the public page stores it for the booking form, while
   *  onboarding hands it straight to createStudent. */
  onComplete: (snapshot: AssessmentSnapshot, responses: ItemResponse[]) => void
}

/**
 * The adaptive placement quiz, reusable in two places: the public "check your
 * English" page and inline during tutor-led student onboarding.
 */
export function AssessmentRunner({
  ageBand,
  selfLevel,
  foundational,
  onComplete,
}: AssessmentRunnerProps) {
  const { t } = useI18n()
  // The plan is built once for this run.
  const plan = useMemo<AssessmentItem[]>(
    () =>
      foundational
        ? buildFoundationalPlan({ pool: foundationalAssessmentItems, ageBand })
        : buildDiagnosticPlan({ pool: publicAssessmentItems, ageBand, selfLevel }),
    [ageBand, selfLevel, foundational],
  )
  const [index, setIndex] = useState(0)
  const [responses, setResponses] = useState<ItemResponse[]>([])
  const [selected, setSelected] = useState<number | null>(null)

  const item = plan[index]

  /* Speak the English target aloud for listening items (progressive
     enhancement). Auto-play, unlike the replay button, stays silent about
     failure: it happens without the learner asking for it, and a browser that
     blocks it until a gesture is not something to report as an error. */
  useEffect(() => {
    if (item?.speak) void speak(item.speak)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  if (!item) {
    return <p>{t('common.loading')}</p>
  }

  const isListen = item.presentation === 'listen' || item.presentation === 'picture'

  const finishWith = (all: ItemResponse[]) => {
    // buildSnapshot runs the ability model itself, so the headline level, the
    // per-skill levels and the focus advice all come from one estimate and
    // cannot disagree.
    const snapshot = buildSnapshot(all, undefined, { foundational })
    onComplete(snapshot, all)
  }

  const submit = () => {
    if (selected == null) return
    const outcome = scoreAutoItem(item, selected)
    const response: ItemResponse = {
      itemId: item.id,
      skill: item.skill,
      cefr: item.cefr,
      difficulty: item.difficulty,
      outcome,
      at: Date.now(),
    }
    const next = [...responses, response]
    setResponses(next)
    setSelected(null)

    // Zero-English early stop: never march a true beginner through harder items.
    if (shouldStopEarly(next) || index + 1 >= plan.length) {
      finishWith(next)
    } else {
      setIndex(index + 1)
    }
  }

  return (
    <div className="stack-lg">
      <div>
        <div className={styles.quizHead}>
          <span className="muted">
            {t('assessment.questionOf', { current: index + 1, total: plan.length })}
          </span>
        </div>
        <Progress value={index} max={plan.length} label="assessment progress" />
      </div>

      <div className="card card-pad-lg">
        {/* The INSTRUCTION is in the interface language for listening items, so a
            non-reader is never blocked by English navigation. */}
        <p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
          {isListen && item.instructionKey ? t(item.instructionKey) : t('assessment.listenPrompt')}
        </p>

        {isListen && item.speak ? (
          <ListenPrompt text={item.speak} />
        ) : (
          /* dir="auto" keeps English exercise text left-to-right even when the
             surrounding UI (e.g. Hebrew) is right-to-left. */
          <p className={styles.prompt} dir="auto">
            {item.prompt}
          </p>
        )}

        <div
          className={`${styles.options} ${isListen ? styles.optionsPicture : ''}`}
          role="radiogroup"
          aria-label={t('assessment.chooseAnswer')}
        >
          {item.options!.map((opt, i) => (
            <button
              key={i}
              type="button"
              role="radio"
              dir="auto"
              aria-checked={selected === i}
              className={`${styles.option} ${isListen ? styles.optionPicture : ''} ${selected === i ? styles.optionActive : ''}`}
              onClick={() => setSelected(i)}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <button className="btn btn-primary btn-lg" onClick={submit} disabled={selected == null}>
        {t('assessment.submit')}
      </button>
    </div>
  )
}

/** A replay control for a spoken word, with a tutor/parent fallback when the
 *  browser has no speech synthesis. */
function ListenPrompt({ text }: { text: string }) {
  const { t } = useI18n()
  const say = useSpeak()
  const supported = useSpeechAvailable()
  return (
    <div className={styles.listen}>
      {supported ? (
        <button type="button" className="btn btn-lg" onClick={() => say(text)}>
          <SpeakerIcon /> {t('assessment.listen')}
        </button>
      ) : (
        <p className={styles.sayAloud}>
          {t('assessment.sayAloud')} <strong dir="ltr">{text}</strong>
        </p>
      )}
    </div>
  )
}
