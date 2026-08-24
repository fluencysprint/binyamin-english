import { ReactNode } from 'react'
import { MicroStep } from '../lessons/microSteps'
import { TutorCard } from '../types'
import { useI18n } from '../i18n/I18nProvider'
import { useModeAccess } from '../app/ModeGate'
import { TutorCardView } from './TutorCardView'
import { Bdi } from '../components/Bdi'
import { BidiText } from '../components/BidiText'
import { hasRTL } from '../utils/bidi'
import { quoted } from '../utils/quotes'
import {
  ArrowRightIcon,
  CheckIcon,
  EyeIcon,
  HandIcon,
  LightbulbIcon,
  SeedlingIcon,
  SparkleIcon,
  SpeakerIcon,
  SpeechIcon,
  TimerIcon,
} from '../components/icons'
import { useSpeak, useSpeechAvailable } from '../components/useSpeak'
import styles from './MicroStepView.module.css'

/**
 * ONE micro-step, as the tutor sees it. This is the most important screen in
 * the app: a tutor with no teaching experience must be able to read it and
 * know what to do within about two seconds.
 *
 * The nine sections are ordered by when they are needed, not by importance:
 * NOW tells you where you are, SAY and DO are what you act on immediately,
 * STUDENT DOES and LOOK FOR are what you watch, HELP and CHALLENGE are the two
 * branches, and DONE WHEN / NEXT close the loop. Everything deeper — the full
 * Tutor Card with methodology — is behind a disclosure, because a tutor mid-
 * lesson should never have to read teaching theory to get to the next line.
 *
 * Hidden entirely outside Tutor mode: it reveals the tutor's moves.
 */
export function MicroStepView({
  step,
  card,
  stepNumber,
  stepCount,
  studentInstruction,
}: {
  step: MicroStep
  card?: TutorCard
  stepNumber: number
  stepCount: number
  /** Exactly what the learner is being shown, in the selected interface
   *  language. The tutor needs to see it to read it aloud or point at it —
   *  especially when the learner cannot yet read English at all. */
  studentInstruction?: string
}) {
  const { t, lang } = useI18n()
  const access = useModeAccess()
  const say = useSpeak()
  const canListen = useSpeechAvailable()
  if (!access.tutorGuidance) return null

  return (
    <section className={styles.panel} aria-label={t('lesson.autopilotTitle')}>
      {/* NOW — the header IS the "what is happening", not a decorative title. */}
      <header className={styles.head}>
        <div className={styles.headTop}>
          <span className={styles.moveBadge}>{t(`moves.${step.move}`)}</span>
          <span className={styles.stepMeta}>
            {t('lesson.stepProgress', { current: stepNumber, total: stepCount })}
            {' · '}
            <span className={styles.stepMinutes}>
              <TimerIcon /> {t('lesson.aboutMinutes', { minutes: step.minutes })}
            </span>
          </span>
        </div>
        <p className={styles.nowText} dir={hasRTL(step.now) ? 'rtl' : 'ltr'}>
          <BidiText text={step.now} />
        </p>
      </header>

      {/* SAY — the single most-used thing on screen, so it is the biggest.
          Every section is rendered unconditionally: a missing block is a tutor
          discovering mid-lesson that this particular activity happens not to
          tell them what to say. */}
      <Block tone="say" icon={<SpeechIcon />} label={t('lesson.say')} hint={t('lesson.sayHint')}>
        <ul className={`${styles.list} ${styles.quotes}`}>
          {/* The quotes come from `quoted`, never from the string and never
              from both. A generated line that already carried its own quotes
              ("Let's revisit: “X.”") is normalized into a valid NESTED quote
              rather than wrapped a second time. */}
          {step.say.map((line, i) => (
            <li key={i} dir="ltr">
              {quoted(line, lang)}
            </li>
          ))}
        </ul>
        {/* The audio is a convenience, never the lesson. Where the browser
            cannot speak (Brave desktop ships no voices at all), the tutor gets
            the target text to read aloud instead — same information, no dead
            button, no repeated failure message. */}
        {step.speak &&
          (canListen ? (
            <button type="button" className="btn btn-sm" onClick={() => say(step.speak!)}>
              <SpeakerIcon /> {t('lesson.listen')}
            </button>
          ) : (
            <p className={styles.sayAloud}>
              {t('lesson.sayAloud')}{' '}
              <strong dir="ltr" lang="en">
                {step.speak}
              </strong>
            </p>
          ))}
      </Block>

      <Block tone="do" icon={<HandIcon />} label={t('lesson.do')}>
        <List items={step.do} />
      </Block>

      <div className={styles.pair}>
        <Block tone="student" icon={<SeedlingIcon />} label={t('lesson.studentDoes')}>
          <List items={step.studentDoes} />
          {studentInstruction && (
            <p className={styles.studentSees} lang={lang} dir="auto">
              <span className={styles.hint}>{t('lesson.studentSees')}</span>
              <BidiText text={studentInstruction} />
            </p>
          )}
        </Block>
        <Block tone="look" icon={<EyeIcon />} label={t('lesson.lookFor')}>
          <List items={step.lookFor} />
        </Block>
      </div>

      {/* The two branches. Side by side so the choice is visibly a choice. */}
      <div className={styles.pair}>
        <Block tone="help" icon={<LightbulbIcon />} label={t('lesson.help')}>
          <List items={step.help} />
        </Block>
        <Block tone="challenge" icon={<SparkleIcon />} label={t('lesson.challenge')}>
          <List items={step.challenge} />
        </Block>
      </div>

      {/* DONE WHEN / NEXT close the step. */}
      <div className={styles.closers}>
        <p className={styles.doneWhen}>
          <span className={styles.tag}>
            <CheckIcon /> {t('lesson.doneWhen')}
          </span>{' '}
          <Bdi>{step.doneWhen}</Bdi>
        </p>
        <p className={styles.nextAction}>
          <span className={styles.tag}>
            <ArrowRightIcon className="flip-in-rtl" /> {t('lesson.nextStep')}
          </span>{' '}
          <Bdi>{step.next}</Bdi>
        </p>
      </div>

      {card && (
        <details className={styles.deeper}>
          <summary>{t('lesson.moreGuidance')}</summary>
          <TutorCardView card={card} />
        </details>
      )}
    </section>
  )
}

function Block({
  tone,
  icon,
  label,
  hint,
  children,
}: {
  tone: string
  icon: ReactNode
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className={`${styles.block} ${styles[tone]}`}>
      <span className={styles.tag}>
        {icon} {label}
      </span>
      {hint && <span className={styles.hint}>{hint}</span>}
      {children}
    </div>
  )
}

function List({ items }: { items: string[] }) {
  return (
    <ul className={styles.list}>
      {items.map((item, i) => (
        <li key={i} dir={hasRTL(item) ? 'rtl' : 'ltr'}>
          <BidiText text={item} block />
        </li>
      ))}
    </ul>
  )
}
