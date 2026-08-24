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
import { BidiTrans } from '../components/BidiTrans'
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
import { ct } from '../i18n/contentText'
import { useTeachingStrings } from '../i18n/teachingStrings'
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
  /* A read-only peek at an earlier answer — never the live item. This is what
     "Previous" does here: it does not rewind the set (which would risk a
     second result for the same item, i.e. duplicated evidence), it just shows
     what was already answered. 0 = the most recent answer, 1 = the one
     before that, and so on. `null` means "showing the live item". */
  const [reviewOffset, setReviewOffset] = useState<number | null>(null)

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
      setReviewOffset(null)
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
    async (outcome: PracticeOutcome, helpUsed?: 'hint' | 'choices') => {
      if (!set || !item || !session || !model) return
      // A hint or a multiple-choice option is real help — it can never earn
      // the "unaided" claim, whatever button was actually tapped.
      const finalOutcome: PracticeOutcome = helpUsed && outcome === 'independent' ? 'afterSupport' : outcome
      const result: PracticeItemResult = {
        itemId: item.id,
        targetKind: item.targetKind,
        targetKey: item.targetKey,
        label: item.label,
        outcome: finalOutcome,
        at: Date.now(),
        ...(written.trim() ? { response: written.trim() } : {}),
        ...(helpUsed ? { helpUsed } : {}),
      }
      const next = recordResult(model, session.id, result, set.items.length)
      setModel(next.model)
      if (next.session) setSession(next.session)
      setAnswered((prev) => [...prev.filter((r) => r.itemId !== result.itemId), result])
      await persistModel(next.model)
      setWritten('')

      const queue =
        finalOutcome === 'independent' || retried.includes(item.id) || retryQueue.includes(item.id)
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
      const [again, ...rest] = queue.filter((id) => id !== item.id || finalOutcome === 'independent')
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
  const reviewing = reviewOffset !== null ? answered[answered.length - 1 - reviewOffset] : undefined

  return (
    <PracticeShell studentId={id}>
      <div className={styles.progress} aria-hidden="true">
        <div className={styles.progressBar} style={{ inlineSize: `${(doneCount / set.items.length) * 100}%` }} />
      </div>
      <div className={styles.positionRow}>
        {doneCount > 0 && !reviewing && (
          <button
            type="button"
            className={`btn btn-sm btn-ghost ${styles.prevBtn}`}
            onClick={() => setReviewOffset(0)}
          >
            <ArrowLeftIcon className="flip-in-rtl" /> {t('practice.previous')}
          </button>
        )}
        <p className={styles.position} dir="ltr">
          {index + 1} / {set.items.length}
        </p>
      </div>

      {reviewing ? (
        <ReviewCard
          result={reviewing}
          canGoOlder={reviewOffset! + 1 < answered.length}
          onOlder={() => setReviewOffset((o) => (o === null ? 0 : o + 1))}
          onBack={() => setReviewOffset((o) => (o === null || o === 0 ? null : o - 1))}
        />
      ) : (
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
      )}
    </PracticeShell>
  )
}

/** A read-only look at an answer already given — never a way to change it.
 *  Nothing here calls `onAnswer`, so it cannot produce a second result for
 *  the same item. */
function ReviewCard({
  result,
  canGoOlder,
  onOlder,
  onBack,
}: {
  result: PracticeItemResult
  canGoOlder: boolean
  onOlder: () => void
  onBack: () => void
}) {
  const { t, dir } = useI18n()
  const outcomeLabel =
    result.outcome === 'independent'
      ? t('practice.gotIt')
      : result.outcome === 'afterSupport'
        ? t('practice.hadToLook')
        : t('practice.notYet')

  return (
    <section className={styles.card} dir={dir}>
      <p className={styles.instruction}>{t('practice.reviewingTitle')}</p>
      <div className={styles.cue} dir="ltr" lang="en">
        <span className={styles.cueEnglish}>{result.label}</span>
      </div>
      {result.response && (
        <div className={styles.answer} dir="ltr" lang="en">
          <span className={styles.answerText}>{result.response}</span>
        </div>
      )}
      <p className={styles.checkLabel}>{t('practice.reviewingOutcome', { outcome: outcomeLabel })}</p>
      <div className={styles.actions}>
        <button type="button" className="btn btn-primary btn-lg btn-block" onClick={onBack}>
          {t('practice.backToCurrent')}
        </button>
        {canGoOlder && (
          <button type="button" className="btn btn-block" onClick={onOlder}>
            {t('practice.previous')}
          </button>
        )}
      </div>
    </section>
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

/** A cue that could honestly fit more than one English word gets a ladder
 *  instead of a single guess-then-reveal: try from memory, then a small
 *  hint, then recognise it among a few real options, and only then the
 *  answer — never trapping a learner who knows a word that just is not the
 *  one stored. Gated to meaning-cued vocabulary recall, where "one exact
 *  word" is genuinely ambiguous; every other item type is unaffected. */
function ladderEligible(item: PracticeItem): boolean {
  return item.targetKind === 'vocabulary' && item.check === 'recall' && !!item.cueText && !!item.answer
}

type HelpStage = 'memory' | 'hint' | 'choices'

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
  onAnswer: (outcome: PracticeOutcome, helpUsed?: 'hint' | 'choices') => void
  written: string
  onWrite: (v: string) => void
  dir: 'ltr' | 'rtl'
}) {
  const { t, lang } = useI18n()
  const say = useSpeak()
  const canListen = useSpeechAvailable()
  const [seconds, setSeconds] = useState<number | null>(null)
  // Resets automatically per item: the parent renders this component with
  // `key={item.id}`, so a fresh item is a fresh mount, never carried-over help.
  const [helpStage, setHelpStage] = useState<HelpStage>('memory')
  const eligible = ladderEligible(item)
  const helpUsed: 'hint' | 'choices' | undefined =
    eligible && helpStage !== 'memory' ? (helpStage === 'choices' ? 'choices' : 'hint') : undefined
  /* The phrase meanings this screen cues from ship in the on-demand teaching
     chunk, not the initial bundle. Asking for them here is what makes a
     Russian learner's cue Russian rather than the English fallback. */
  useTeachingStrings(lang)

  const cueText = item.cueTextKey
    ? ct(lang, item.cueTextKey, item.cueText ?? '')
    : item.cueText

  const params = useMemo(() => {
    const resolved: Record<string, string | number> = { ...item.instructionParams }
    for (const [name, key] of Object.entries(item.instructionParamKeys ?? {})) {
      resolved[name] = t(key)
    }
    return resolved
  }, [item, t])

  // Shuffled once per item, not on every render — otherwise the options would
  // visibly reorder themselves while the learner is looking at them.
  const choices = useMemo(() => {
    if (!item.distractors || !item.answer) return []
    const all = [...item.distractors, item.answer]
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[all[i], all[j]] = [all[j], all[i]]
    }
    return all
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id])

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
        <BidiTrans
          lang={lang}
          i18nKey={item.instructionKey}
          params={params}
          ltr={item.instructionLtrParams ?? []}
        />
      </p>

      {/* Their own language cue — a meaning, in the language they think in.
          A phrase's meaning lives in the content bank rather than the UI
          dictionary, so it resolves through `ct` with the English kept on the
          item as the fallback: the cue is never blank, even if the language
          chunk has not landed. */}
      {cueText && (
        <p className={styles.cueText} dir="auto">
          <BidiText text={cueText} />
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
            eligible && helpStage === 'hint' ? (
              <>
                <p className={styles.checkLabel} dir="auto">
                  <BidiTrans
                    lang={lang}
                    i18nKey="practice.hint"
                    params={{
                      letter: item.answer!.trim()[0]?.toLocaleUpperCase() ?? '',
                      count: item.answer!.replace(/\s+/g, '').length,
                    }}
                    ltr={['letter']}
                  />
                </p>
                <button className="btn btn-primary btn-lg btn-block" onClick={onReveal}>
                  {t('practice.showAnswer')}
                </button>
                {item.distractors && item.distractors.length >= 2 && (
                  <button
                    type="button"
                    className={`btn btn-sm btn-ghost ${styles.helpLink}`}
                    onClick={() => setHelpStage('choices')}
                  >
                    {t('practice.stillNotSure')}
                  </button>
                )}
              </>
            ) : eligible && helpStage === 'choices' && choices.length > 0 ? (
              <>
                <p className={styles.checkLabel}>{t('practice.chooseOne')}</p>
                <div className={styles.words} dir="ltr" lang="en">
                  {choices.map((word) => (
                    <button key={word} type="button" className={styles.word} onClick={onReveal}>
                      {word}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              /* One button, and it is not "next": the learner has to decide
                 they have tried before the answer can appear. */
              <>
                <button className="btn btn-primary btn-lg btn-block" onClick={onReveal}>
                  {t('practice.showAnswer')}
                </button>
                {eligible && (
                  <button
                    type="button"
                    className={`btn btn-sm btn-ghost ${styles.helpLink}`}
                    onClick={() => setHelpStage('hint')}
                  >
                    {t('practice.needHint')}
                  </button>
                )}
              </>
            )
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

          {/* The self-check. A hint or a multiple choice already used up the
              "unaided" claim, so that option is not on offer here — only
              "had to look" and "not yet" ever apply once help was given. */}
          <p className={styles.checkLabel}>{t('practice.howDidThatGo')}</p>
          <div className={styles.actions}>
            {!helpUsed && (
              <button
                className="btn btn-primary btn-lg btn-block"
                onClick={() => onAnswer('independent')}
              >
                {t('practice.gotIt')}
              </button>
            )}
            <button
              className={`btn ${helpUsed ? 'btn-primary btn-lg' : ''} btn-block`}
              onClick={() => onAnswer('afterSupport', helpUsed)}
            >
              {helpUsed ? t('practice.saidWithHelp') : t('practice.hadToLook')}
            </button>
            <button className="btn btn-block" onClick={() => onAnswer('incorrect', helpUsed)}>
              {t('practice.notYet')}
            </button>
          </div>
        </>
      )}
    </section>
  )
}
