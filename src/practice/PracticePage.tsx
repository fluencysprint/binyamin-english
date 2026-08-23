/* ==========================================================================
   The learner, their phone, and one thing at a time.
   --------------------------------------------------------------------------
   Homework used to be a paragraph at the end of a report. This is the same
   homework, done: one item per screen, cue before answer, and a single honest
   question after each attempt.

   Deliberate omissions: no score, no streak, no timer running against the
   learner, no "you got 40%!". The only number anywhere is the position in the
   set, and the only summary at the end is a count with its real denominator.
   ========================================================================== */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { useI18n } from '../i18n/I18nProvider'
import { BidiText } from '../components/BidiText'
import { useSpeak, useSpeechAvailable } from '../components/useSpeak'
import { SpeakerIcon, ArrowLeftIcon } from '../components/icons'
import { ModeSwitcher, LockButton } from '../tutor/ModeSwitcher'
import {
  LearningModel,
  LessonRecord,
  PracticeItemResult,
  PracticeOutcome,
  PracticeSessionRecord,
} from '../types'
import { getLessonsForStudent, getStudent } from '../data/db'
import { PracticeItem, PracticeSet } from './practiceSet'
import {
  choosePracticeSet,
  persistModel,
  recordResult,
  reloadModel,
  startSession,
} from './practiceService'
import { initLearningModel } from '../students/learningModel'
import styles from './PracticePage.module.css'

type Phase = 'loading' | 'attempt' | 'reveal' | 'done' | 'empty'

export function PracticePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, dir } = useI18n()

  const [model, setModel] = useState<LearningModel | null>(null)
  const [set, setSet] = useState<PracticeSet | null>(null)
  const [session, setSession] = useState<PracticeSessionRecord | null>(null)
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('loading')
  const [written, setWritten] = useState('')
  const [answered, setAnswered] = useState<PracticeItemResult[]>([])
  /* Items to come back to before the set is finished — anything that did not
     come back unaided the first time. Each item earns at most one repeat: a
     second look a few minutes later is spaced retrieval, a third is a loop the
     learner cannot get out of. */
  const [retryQueue, setRetryQueue] = useState<string[]>([])
  const [retried, setRetried] = useState<string[]>([])

  /* One load, one decision: what is this learner supposed to do, and where in
     it did they stop? Everything after this is local state — the set is pure,
     so nothing has to go back to storage to render the next item. */
  useEffect(() => {
    let live = true
    ;(async () => {
      if (!id) return
      const [s, lessons] = await Promise.all([getStudent(id), getLessonsForStudent(id)])
      const m = (await reloadModel(id)) ?? initLearningModel(id)
      if (!live || !s) return
      const plan = choosePracticeSet(s, m, lessons as LessonRecord[])
      if (!plan) {
        setModel(m)
        setPhase('empty')
        return
      }
      const started = startSession(m, plan.set, plan.session)
      await persistModel(started.model)
      if (!live) return
      setModel(started.model)
      setSession(started.session)
      setSet(plan.set)
      setAnswered(started.session.results)
      setRetryQueue([])
      setRetried([])
      // Resume on the first item with no result — never on item one of a set
      // the learner is halfway through.
      const firstOpen = plan.set.items.findIndex((i) => !plan.doneItemIds.has(i.id))
      setIndex(firstOpen < 0 ? 0 : firstOpen)
      setPhase(firstOpen < 0 ? 'done' : 'attempt')
    })()
    return () => {
      live = false
    }
  }, [id])

  const item: PracticeItem | undefined = set?.items[index]

  const answer = useCallback(
    async (outcome: PracticeOutcome) => {
      if (!set || !item || !session || !model) return
      const result: PracticeItemResult = {
        itemId: item.id,
        targetKind: item.targetKind,
        targetKey: item.targetKey,
        label: item.label,
        outcome,
        at: Date.now(),
        ...(written.trim() ? { response: written.trim() } : {}),
      }
      const next = recordResult(model, session.id, result, set.items.length)
      setModel(next.model)
      if (next.session) setSession(next.session)
      setAnswered((prev) => [...prev.filter((r) => r.itemId !== result.itemId), result])
      await persistModel(next.model)
      setWritten('')

      const queue =
        outcome === 'independent' || retried.includes(item.id) || retryQueue.includes(item.id)
          ? retryQueue
          : [...retryQueue, item.id]
      setRetryQueue(queue)

      // Move to the next item that still has no result, so a set resumed in
      // the middle finishes the ones that were skipped rather than stopping.
      const isOpen = (i: PracticeItem) => !next.session?.results.some((r) => r.itemId === i.id)
      const after = set.items.findIndex((i, n) => n > index && isOpen(i))
      const anyOpen = after < 0 ? set.items.findIndex(isOpen) : after
      if (anyOpen >= 0) {
        setIndex(anyOpen)
        setPhase('attempt')
        return
      }

      /* Nothing new left. Anything that needed help comes round once more —
         the same question, a few minutes later, which is the cheapest real
         spacing a single sitting can offer. */
      const [again, ...rest] = queue.filter((id) => id !== item.id || outcome === 'independent')
      if (again !== undefined) {
        setRetryQueue(rest)
        setRetried((prev) => [...prev, again])
        setIndex(set.items.findIndex((i) => i.id === again))
        setPhase('attempt')
        return
      }
      setPhase('done')
    },
    [set, item, session, model, written, index, retryQueue, retried],
  )

  if (phase === 'loading') {
    return (
      <PracticeShell studentId={id}>
        <p className="muted">{t('common.loading')}</p>
      </PracticeShell>
    )
  }

  if (phase === 'empty' || !set || !item) {
    return (
      <PracticeShell studentId={id}>
        <div className={`card card-pad-lg ${styles.finish}`}>
          <h1 className={styles.finishTitle}>{t('practice.nothingDueTitle')}</h1>
          <p className="muted">{t('practice.nothingDueBody')}</p>
          <Link className="btn btn-primary btn-lg" to={`/tutor/student/${id}`}>
            {t('practice.backHome')}
          </Link>
        </div>
      </PracticeShell>
    )
  }

  if (phase === 'done') {
    const independent = answered.filter((r) => r.outcome === 'independent').length
    return (
      <PracticeShell studentId={id}>
        <div className={`card card-pad-lg ${styles.finish}`}>
          <h1 className={styles.finishTitle}>{t('practice.finishedTitle')}</h1>
          {/* A count with its real denominator. Nothing is scaled, rounded or
              turned into a percentage of a total the learner never attempted. */}
          <p className={styles.finishCount} dir="ltr">
            {t('practice.finishedCount', { correct: independent, total: answered.length })}
          </p>
          <p className="muted">
            {t(set.source === 'homework' ? 'practice.finishedHomework' : 'practice.finishedReview')}
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate(`/tutor/student/${id}`)}>
            {t('practice.backHome')}
          </button>
        </div>
      </PracticeShell>
    )
  }

  const doneCount = answered.length
  return (
    <PracticeShell studentId={id}>
      <div className={styles.progress} aria-hidden="true">
        <div className={styles.progressBar} style={{ inlineSize: `${(doneCount / set.items.length) * 100}%` }} />
      </div>
      <p className={styles.position} dir="ltr">
        {index + 1} / {set.items.length}
      </p>

      <PracticeCard
        key={item.id}
        item={item}
        revealed={phase === 'reveal'}
        onReveal={() => setPhase('reveal')}
        onAnswer={answer}
        written={written}
        onWrite={setWritten}
        dir={dir}
      />
    </PracticeShell>
  )
}

function PracticeShell({
  studentId,
  children,
}: {
  studentId?: string
  children: React.ReactNode
}) {
  const { t } = useI18n()
  return (
    <Layout
      headerExtra={
        <>
          <ModeSwitcher studentId={studentId} />
          <LockButton />
        </>
      }
    >
      <div className={`container container-narrow ${styles.page}`}>
        <Link to={`/tutor/student/${studentId}`} className={styles.back}>
          <ArrowLeftIcon className="flip-in-rtl" /> {t('practice.backHome')}
        </Link>
        {children}
      </div>
    </Layout>
  )
}

/* -------------------------------------------------------------------------- */

function PracticeCard({
  item,
  revealed,
  onReveal,
  onAnswer,
  written,
  onWrite,
  dir,
}: {
  item: PracticeItem
  revealed: boolean
  onReveal: () => void
  onAnswer: (outcome: PracticeOutcome) => void
  written: string
  onWrite: (v: string) => void
  dir: 'ltr' | 'rtl'
}) {
  const { t } = useI18n()
  const say = useSpeak()
  const canListen = useSpeechAvailable()
  const [seconds, setSeconds] = useState<number | null>(null)

  const params = useMemo(() => {
    const resolved: Record<string, string | number> = { ...item.instructionParams }
    for (const [name, key] of Object.entries(item.instructionParamKeys ?? {})) {
      resolved[name] = t(key)
    }
    return resolved
  }, [item, t])

  /* The sprint's clock. It counts DOWN and then stops: there is no penalty
     for running out, because the exercise is "keep talking for this long",
     not "beat the buzzer". */
  useEffect(() => {
    if (seconds === null || seconds <= 0) return
    const timer = window.setTimeout(() => setSeconds((s) => (s === null ? null : s - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [seconds])
  useEffect(() => setSeconds(null), [item.id])

  return (
    <section className={styles.card} dir={dir} aria-live="polite">
      <p className={styles.instruction}>
        <BidiText text={t(item.instructionKey, params)} />
      </p>

      {/* Their own language cue — a meaning, in the language they think in. */}
      {item.cueText && (
        <p className={styles.cueText} dir="auto">
          <BidiText text={item.cueText} />
        </p>
      )}

      {/* The English cue: their own sentence, a topic, a question. Never the
          answer — that is the point of the two-stage screen. */}
      {item.cue && (
        <div className={styles.cue} dir="ltr" lang="en">
          <span className={styles.cueEnglish}>{item.cue}</span>
          {canListen && !item.answer && (
            <button
              type="button"
              className={styles.speakBtn}
              aria-label={t('lesson.listen')}
              onClick={() => say(item.cue!)}
            >
              <SpeakerIcon />
            </button>
          )}
        </div>
      )}

      {item.seconds !== undefined && (
        <div className={styles.timer}>
          <span className={styles.timerValue} dir="ltr">
            {seconds ?? item.seconds}s
          </span>
          <button type="button" className="btn" onClick={() => setSeconds(item.seconds!)}>
            {t('practice.startTimer')}
          </button>
        </div>
      )}

      {item.writing && (
        <label className={styles.writeField}>
          <span className={styles.writeLabel}>{t('practice.writeHere')}</span>
          <textarea
            className="input"
            rows={4}
            dir="ltr"
            lang="en"
            value={written}
            onChange={(e) => onWrite(e.target.value)}
          />
        </label>
      )}

      {!revealed ? (
        <div className={styles.actions}>
          {item.check === 'recall' ? (
            /* One button, and it is not "next": the learner has to decide
               they have tried before the answer can appear. */
            <button className="btn btn-primary btn-lg btn-block" onClick={onReveal}>
              {t('practice.showAnswer')}
            </button>
          ) : (
            <>
              <button
                className="btn btn-primary btn-lg btn-block"
                onClick={() => onAnswer('independent')}
              >
                {t('practice.didIt')}
              </button>
              <button className="btn btn-block" onClick={() => onAnswer('incorrect')}>
                {t('practice.skipThis')}
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          {item.answer && (
            <div className={styles.answer} dir="ltr" lang="en">
              <strong className={styles.answerText}>{item.answer}</strong>
              {canListen && (
                <button
                  type="button"
                  className={styles.speakBtn}
                  aria-label={t('lesson.listen')}
                  onClick={() => say(item.answer!)}
                >
                  <SpeakerIcon />
                </button>
              )}
            </div>
          )}
          {item.answerWords && item.answerWords.length > 0 && (
            <div className={styles.words} dir="ltr" lang="en">
              {item.answerWords.map((w) => (
                <button
                  key={w}
                  type="button"
                  className={styles.word}
                  onClick={() => canListen && say(w)}
                >
                  {w}
                </button>
              ))}
            </div>
          )}

          {/* The self-check. Three options because there are three honest answers:
              got it, had to look, not yet. "Had to look" is the one that makes
              the other two mean anything. */}
          <p className={styles.checkLabel}>{t('practice.howDidThatGo')}</p>
          <div className={styles.actions}>
            <button
              className="btn btn-primary btn-lg btn-block"
              onClick={() => onAnswer('independent')}
            >
              {t('practice.gotIt')}
            </button>
            <button className="btn btn-block" onClick={() => onAnswer('afterSupport')}>
              {t('practice.hadToLook')}
            </button>
            <button className="btn btn-block" onClick={() => onAnswer('incorrect')}>
              {t('practice.notYet')}
            </button>
          </div>
        </>
      )}
    </section>
  )
}
