import { useEffect, useMemo, useState } from 'react'
import { MicroStep } from '../lessons/microSteps'
import { buildStudentBoard } from '../lessons/studentBoard'
import { CEFR, LearningModel, LessonActivity, StudentProfile } from '../types'
import { useI18n } from '../i18n/I18nProvider'
import { BidiText } from '../components/BidiText'
import { useSpeak, useSpeechAvailable } from '../components/useSpeak'
import { ArrowRightIcon, SpeakerIcon } from '../components/icons'
import styles from './StudentTaskView.module.css'

/**
 * What the LEARNER sees, in Student and Together modes.
 *
 * Four rules, and they are the whole component:
 *
 * 1. ONE thing at a time. The prompt on screen is the prompt they are on;
 *    the rest of the activity's questions sit behind a pager rather than in a
 *    list — a nervous beginner reading five questions answers none of them.
 *
 * 2. But never NOTHING. This screen used to be a single localized sentence
 *    ("Now talk about you.") for a six-minute speaking activity, while the
 *    task, the follow-up questions and the target language all existed and
 *    went only to the tutor. `studentBoard` derives the learner's half from
 *    the same content banks; this renders it.
 *
 * 3. The instruction is in the CURRENTLY SELECTED interface language — the one
 *    the tutor picked in the header, on the screen they are both looking at.
 *    It is deliberately NOT the language stored on the profile: a stored
 *    preference made the app show one student's task in French while the whole
 *    rest of the UI was English, and switching the header language did not
 *    fix it. The profile keeps `interfaceLanguage` as the DEFAULT to start a
 *    lesson in; what is on screen always follows what is selected now.
 *    The English TARGET stays English — that is the thing being learned.
 *
 * 4. Nothing from the tutor's side is rendered here at all. Not hidden with
 *    CSS, not collapsed: simply never passed in. SAY, LOOK FOR, HELP and the
 *    rest do not exist in this tree. Support that IS the learner's — the
 *    target language, the explanation, a recalled word's answer — is present
 *    but closed, so it is never on screen before the attempt.
 */
export function StudentTaskView({
  step,
  activity,
  student,
  model,
  level,
  todayVocabulary,
  todayCorrections,
}: {
  step: MicroStep
  activity: LessonActivity
  student: StudentProfile
  model: LearningModel
  level: CEFR
  /** Captured in THIS lesson. The closing steps are about what just happened,
   *  so they are the two places the learner's own material goes on screen. */
  todayVocabulary?: string[]
  todayCorrections?: { said: string; better: string }[]
}) {
  const { t, lang, dir } = useI18n()
  const say = useSpeak()
  const canListen = useSpeechAvailable()

  const board = useMemo(
    () =>
      buildStudentBoard(step, activity, {
        lang,
        student,
        model,
        level,
        todayVocabulary,
        todayCorrections,
      }),
    [step, activity, lang, student, model, level, todayVocabulary, todayCorrections],
  )

  const instruction = t(step.studentKey, step.studentParams)

  /* The prompts of this step, in order: the headline one and then whatever
     follow-ups the plan chose. They are paged rather than listed so a
     five-minute activity has five minutes of material without ever putting
     more than one question in front of the learner. */
  const prompts = useMemo(
    () => [board.prompt, ...board.questions].filter((p): p is string => Boolean(p?.trim())),
    [board],
  )
  const [promptIndex, setPromptIndex] = useState(0)
  // A new step is a new activity: never leave the pager where the last one
  // ended, or the learner opens on question four of a task they have not met.
  useEffect(() => setPromptIndex(0), [step.id])
  const current = prompts[Math.min(promptIndex, prompts.length - 1)]

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

      {current && (
        <div className={styles.promptCard}>
          <p className={styles.promptText} dir="ltr" lang="en">
            {current}
          </p>
          <div className={styles.promptFoot}>
            {canListen && (
              <button type="button" className="btn btn-sm" onClick={() => say(current)}>
                <SpeakerIcon /> {t('lesson.listen')}
              </button>
            )}
            {prompts.length > 1 && (
              <>
                <span className={styles.pagerCount} dir="ltr">
                  {promptIndex + 1} / {prompts.length}
                </span>
                <button
                  type="button"
                  className="btn btn-sm"
                  disabled={promptIndex >= prompts.length - 1}
                  onClick={() => setPromptIndex((i) => Math.min(i + 1, prompts.length - 1))}
                >
                  {t('board.nextPrompt')} <ArrowRightIcon className="flip-in-rtl" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {board.seconds !== undefined && (
        <p className={styles.clock} dir="ltr">
          {t('board.seconds', { seconds: board.seconds })}
        </p>
      )}

      {/* The English target of a beginner step: one word or chunk, as large as
          the screen allows, with the voice beside it. Suppressed wherever the
          board already carries the same English in a richer form — the model
          step's `speak` is its first few examples joined, so showing both
          printed the same sentences twice, once as a headline and once as a
          list. */}
      {target && !current && board.words.length === 0 && board.examples.length === 0 && (
        <div className={styles.target} dir="ltr" lang="en">
          <span className={styles.targetText}>{target}</span>
          {canListen && (
            <button type="button" className="btn btn-lg" onClick={() => say(target)}>
              <SpeakerIcon /> {t('lesson.listen')}
            </button>
          )}
        </div>
      )}

      {board.pairs.length > 0 && (
        <Group label={t('board.pairs')}>
          <div className={styles.pairs}>
            {board.pairs.map((p) => (
              <button
                key={`${p.a}-${p.b}`}
                type="button"
                className={styles.pair}
                dir="ltr"
                lang="en"
                onClick={() => canListen && say(`${p.a}. ${p.b}.`)}
              >
                <span>{p.a}</span>
                <span className={styles.pairVs}>/</span>
                <span>{p.b}</span>
              </button>
            ))}
          </div>
        </Group>
      )}

      {board.words.length > 0 && (
        <Group label={t('board.words')}>
          <div className={styles.words}>
            {board.words.map((w) => (
              <button
                key={w}
                type="button"
                className={styles.word}
                dir="ltr"
                lang="en"
                onClick={() => canListen && say(w)}
              >
                {w}
              </button>
            ))}
          </div>
        </Group>
      )}

      {board.recallCues.length > 0 && (
        <Group label={t('board.recall')}>
          <ul className={styles.cues}>
            {board.recallCues.map((c) => (
              <RecallCue key={c.answer} cue={c.cue} answer={c.answer} />
            ))}
          </ul>
        </Group>
      )}

      {/* Their own sentences, fixed. The wrong version is shown struck
          through beside the right one, because the point is the DIFFERENCE —
          and because a learner who cannot see what they said cannot connect
          the correction to the moment they said it. */}
      {board.corrections.length > 0 && (
        <Group label={t('board.yourSentences')}>
          <ul className={styles.fixes} dir="ltr" lang="en">
            {board.corrections.map((c, i) => (
              <li key={i}>
                <span className={styles.said}>{c.said}</span>
                <strong className={styles.better}>{c.better}</strong>
                {canListen && (
                  <button
                    type="button"
                    className={styles.speakBtn}
                    aria-label={t('lesson.listen')}
                    onClick={() => say(c.better)}
                  >
                    <SpeakerIcon />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </Group>
      )}

      {board.examples.length > 0 && (
        <Group label={t('board.examples')}>
          <ul className={styles.examples} dir="ltr" lang="en">
            {board.examples.map((e, i) => (
              <li key={i}>
                <span>{e}</span>
                {canListen && (
                  <button
                    type="button"
                    className={styles.speakBtn}
                    aria-label={t('lesson.listen')}
                    onClick={() => say(e)}
                  >
                    <SpeakerIcon />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </Group>
      )}

      {/* The learner's target language. Closed by default for anyone who can
          start without it — a frame handed over before the attempt is a
          sentence copied, not a sentence built. */}
      {board.phrases.length > 0 && (
        /* Keyed on the step so a disclosure the learner opened does not stay
           open into the next activity: React only writes `open` back to the
           DOM when the value it renders CHANGES, so without a remount, support
           revealed once stays revealed for the rest of the lesson. */
        <details key={step.id} className={styles.support} open={board.phrasesOpen}>
          <summary>{t('board.usefulLanguage')}</summary>
          <ul className={styles.phrases} dir="ltr" lang="en">
            {board.phrases.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </details>
      )}

      {board.help && (
        <details key={`${step.id}-help`} className={styles.support}>
          <summary>{t(board.helpKey)}</summary>
          <p className={styles.helpText} dir="auto">
            <BidiText text={board.help} />
          </p>
        </details>
      )}

      {(board.passage ?? activity.passage) && (
        <blockquote className={styles.passage} dir="ltr" lang="en">
          {board.passage ?? activity.passage}
        </blockquote>
      )}
    </section>
  )
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.group}>
      <span className={styles.groupLabel}>{label}</span>
      {children}
    </div>
  )
}

/** One meaning cue. The English is held back until it has been attempted —
 *  a word read off a screen has not been recalled. */
function RecallCue({ cue, answer }: { cue: string; answer: string }) {
  const { t } = useI18n()
  const say = useSpeak()
  const canListen = useSpeechAvailable()
  const [shown, setShown] = useState(false)
  return (
    <li className={styles.cue}>
      <span className={styles.cueText} dir="auto">
        <BidiText text={cue} />
      </span>
      {shown ? (
        <button
          type="button"
          className={styles.cueAnswer}
          dir="ltr"
          lang="en"
          onClick={() => canListen && say(answer)}
        >
          {answer}
        </button>
      ) : (
        <button type="button" className="btn btn-sm" onClick={() => setShown(true)}>
          {t('board.reveal')}
        </button>
      )}
    </li>
  )
}
