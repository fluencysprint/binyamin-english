import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useI18n } from '../i18n/I18nProvider'
import { useSettings } from '../app/SettingsContext'
import { useModeAccess } from '../app/ModeGate'
import { useToast } from '../components/Toast'
import { Modal } from '../components/Modal'
import { Progress } from '../components/ui'
import { MicroStepView } from './MicroStepView'
import { StudentTaskView } from './StudentTaskView'
import { PacingBar } from './PacingBar'
import { CorrectionCapture } from './CorrectionCapture'
import { RecorderPanel } from '../audio/RecorderPanel'
import { FieldError } from '../components/FieldError'
import { LIMITS, validateOptionalText, validateText } from '../utils/validation'
import { getHideLessonOrientation, setHideLessonOrientation } from '../data/settings'
import {
  Correction,
  CorrectionCategory,
  ItemResponse,
  LearningModel,
  LessonRecord,
  ScoreOutcome,
  Skill,
  StudentProfile,
  LessonPhaseKind,
  PronunciationArea,
  PRONUNCIATION_AREAS,
  UILanguage,
  VocabRecallOutcome,
  PhraseVerdictValue,
} from '../types'
import {
  loadStudentBundle,
  saveCorrection,
  saveLessonProgress,
  completeLesson,
} from '../students/studentService'
import { getLesson } from '../data/db'
import {
  buildFixStep,
  buildMicroSteps,
  buildRetrievalStep,
  isConversationStep,
  MicroStep,
  phraseBlockOf,
  phrasePhrases,
  retrievalMaterial,
} from '../lessons/microSteps'
import { lessonPhraseIds } from '../curriculum/phraseProgress'
import { getPhrase, PhraseTarget } from '../curriculum/phrases'
import { activityGuidance, localizedTitle, objectiveTitle } from '../lessons/guidance'
import { loadTeachingStrings, teachingStringsStatus, useTeachingStrings } from '../i18n/teachingStrings'
import { pacingAdvice, pacingFor } from '../lessons/pacing'
import { overallCefr } from '../utils/cefr'
import { formatDuration } from '../utils/time'
import { setActiveLessonId } from '../data/settings'
import { uid } from '../utils/id'
import { Bdi } from '../components/Bdi'
import { ArrowLeftIcon, FamilyIcon, PauseIcon, PlayIcon, TimerIcon } from '../components/icons'
import { StepActionBar } from './StepActionBar'
import { PhraseVerdictPanel } from './PhraseVerdictPanel'
import styles from './LessonRunnerPage.module.css'

/* The correction a tutor is most likely to be capturing, given where they are
   in the lesson. It only pre-selects a chip — every category is still one tap
   away — but it removes a decision from the middle of a live conversation. */
const PHASE_CORRECTION_CATEGORY: Record<LessonPhaseKind, CorrectionCategory> = {
  warmup: 'grammar',
  listening: 'vocabulary',
  speakingListening: 'grammar',
  reading: 'pronunciation',
  writing: 'grammar',
  microLesson: 'grammar',
  guidedPractice: 'grammar',
  communication: 'wordChoice',
  fluency: 'fluency',
  pronunciation: 'pronunciation',
  vocabulary: 'vocabulary',
  feedback: 'grammar',
}

const PHASE_SKILL: Record<LessonPhaseKind, Skill> = {
  warmup: 'speaking',
  listening: 'listening',
  speakingListening: 'speaking',
  reading: 'reading',
  writing: 'writing',
  microLesson: 'grammar',
  guidedPractice: 'grammar',
  communication: 'speaking',
  fluency: 'speaking',
  pronunciation: 'pronunciation',
  vocabulary: 'vocabulary',
  feedback: 'speaking',
}

export function LessonRunnerPage() {
  const { id, lessonId } = useParams()
  const navigate = useNavigate()
  const { t, lang } = useI18n()
  /* Micro-steps are memoized, and the guidance they are built from arrives
     asynchronously the first time a language is used — so the memo has to be
     invalidated when it does. */
  const teaching = useTeachingStrings(lang)
  /* Read fresh on every render — `teaching` above already forces one when the
     chunk lands or fails, so this is never stale when it matters. Gates the
     guidance-bearing JSX below: `translate`/`ct` fall back to English for a
     chunk that has not arrived yet, indistinguishable from a real
     translation, so the screen must not render that output while status is
     anything but 'ready'. */
  const teachingStatus = teachingStringsStatus(lang)
  const { showTimer, setShowTimer } = useSettings()
  const access = useModeAccess()
  const { toast } = useToast()

  const [student, setStudent] = useState<StudentProfile | null>(null)
  const [model, setModel] = useState<LearningModel | null>(null)
  const [lesson, setLesson] = useState<LessonRecord | null>(null)
  const [phaseIndex, setPhaseIndex] = useState(0)
  /** Index of the current micro-step INSIDE the current phase. */
  const [stepIndex, setStepIndex] = useState(0)
  /** Lesson-elapsed seconds at the moment the current step opened — so pacing
   *  advice is about this step, not about the whole lesson. */
  const [stepStartedAt, setStepStartedAt] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(true)
  const [responses, setResponses] = useState<ItemResponse[]>([])
  const [activityOutcomes, setActivityOutcomes] = useState<Record<string, ScoreOutcome>>({})
  const [corrections, setCorrections] = useState<Correction[]>([])
  const [vocab, setVocab] = useState<string[]>([])
  const [vocabMeanings, setVocabMeanings] = useState<Record<string, string>>({})
  /** Recall verdicts on OLD words at the spaced-review step. This is the only
   *  evidence the app ever gets that a word actually stuck, so it survives a
   *  refresh with everything else. */
  const [vocabReview, setVocabReview] = useState<Record<string, VocabRecallOutcome>>({})
  const [notes, setNotes] = useState('')
  /** Per-phrase verdicts for a beginner lesson. Written the moment a chip is
   *  tapped, like every other capture here — a tutor who closes the tab
   *  mid-lesson keeps what they already saw. */
  const [phraseVerdicts, setPhraseVerdicts] = useState<Record<string, PhraseVerdictValue>>({})
  const [objectiveOutcome, setObjectiveOutcome] = useState<ScoreOutcome | undefined>()
  const [modal, setModal] = useState<null | 'correction' | 'record' | 'notes' | 'vocab' | 'finish'>(null)
  const [showOrientation, setShowOrientation] = useState(!getHideLessonOrientation())
  const [notFound, setNotFound] = useState(false)
  const elapsedRef = useRef(0)

  // Load lesson + student + model, restoring progress after a refresh.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!id || !lessonId) return
      const bundle = await loadStudentBundle(id)
      const rec = await getLesson(lessonId)
      if (cancelled) return
      if (!bundle || !rec) {
        setNotFound(true)
        return
      }
      setStudent(bundle.student)
      setModel(bundle.model)
      setLesson(rec)
      setPhaseIndex(rec.currentPhaseIndex)
      setStepIndex(rec.currentStepIndex ?? 0)
      setStepStartedAt(rec.elapsedSeconds)
      setElapsed(rec.elapsedSeconds)
      elapsedRef.current = rec.elapsedSeconds
      setResponses(rec.responses)
      setVocab(rec.vocabularyAdded)
      setVocabMeanings(rec.vocabularyMeanings ?? {})
      setVocabReview(rec.vocabularyReview ?? {})
      setPhraseVerdicts(rec.phraseVerdicts ?? {})
      setNotes(rec.tutorNotes ?? '')
      setObjectiveOutcome(rec.objectiveOutcome)
      // Only the tutor needs to know the session was recovered; on the
      // learner's device it is an English message about app internals.
      if (rec.status === 'inProgress') {
        if (access.tutorGuidance) toast(t('lesson.recoveredBody'), 'info')
        // This lesson was already running — the tutor saw "Your job today"
        // when it started. A reload (dropped connection, a locked phone)
        // should hand them straight back to their step, not stack a second
        // full-screen orientation modal on top of the recovery toast.
        setShowOrientation(false)
      } else {
        await saveLessonProgress({ ...rec, status: 'inProgress', startedAt: rec.startedAt ?? Date.now() })
      }
      setActiveLessonId(lessonId)
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, lessonId])

  // Tick the timer.
  useEffect(() => {
    if (!running) return
    const iv = window.setInterval(() => {
      elapsedRef.current += 1
      setElapsed(elapsedRef.current)
    }, 1000)
    return () => window.clearInterval(iv)
  }, [running])

  /* Corrections worth showing back at the end of the lesson. Praise
     ("great expression") is not a fix, and a correction with no better version
     is half-captured — neither belongs on a screen that says "here is what to
     say instead". */
  const correctionPairs = useMemo(
    () =>
      corrections
        .filter((c) => c.category !== 'greatExpression' && c.better.trim())
        .map((c) => ({ said: c.said, better: c.better })),
    [corrections],
  )

  /**
   * Everything the runner captures, in a ref that is always current.
   *
   * `persist` used to close over these as ordinary values, which made it a new
   * function on every capture — and the autosave effect below depends on it,
   * so React tore the old effect down and ran its cleanup, `persist({})`,
   * through the PREVIOUS closure. That write rebuilt the record from the state
   * as it stood a moment before the capture and put it straight back to disk.
   *
   * Nothing on screen showed it: every field here is React state of its own,
   * and `finish()` builds the final record from that state, so a lesson taught
   * end to end came out right. What was silently lost was the one thing the
   * saving exists for — a word captured, a phrase marked or a note written was
   * gone the moment the tutor refreshed the tab.
   *
   * A ref fixes it at the root: `persist` no longer depends on any of it, so
   * it is created once, the autosave effect is never torn down, and there is
   * no earlier closure left to overwrite anything.
   */
  const captureRef = useRef({
    phaseIndex,
    stepIndex,
    responses,
    vocab,
    vocabMeanings,
    vocabReview,
    phraseVerdicts,
    notes,
    objectiveOutcome,
  })
  captureRef.current = {
    phaseIndex,
    stepIndex,
    responses,
    vocab,
    vocabMeanings,
    vocabReview,
    phraseVerdicts,
    notes,
    objectiveOutcome,
  }

  const persist = useCallback(
    (patch: Partial<LessonRecord>) => {
      setLesson((cur) => {
        if (!cur) return cur
        const c = captureRef.current
        const next: LessonRecord = {
          ...cur,
          currentPhaseIndex: c.phaseIndex,
          currentStepIndex: c.stepIndex,
          elapsedSeconds: elapsedRef.current,
          responses: c.responses,
          vocabularyAdded: c.vocab,
          vocabularyMeanings: c.vocabMeanings,
          vocabularyReview: c.vocabReview,
          phraseVerdicts: c.phraseVerdicts,
          tutorNotes: c.notes,
          objectiveOutcome: c.objectiveOutcome,
          status: 'inProgress',
          ...patch,
        }
        saveLessonProgress(next).catch((err) => {
          console.error(err)
          toast(t('errors.generic'), 'err')
        })
        return next
      })
    },
    [t, toast],
  )

  // Autosave every 5s and on unmount.
  useEffect(() => {
    const iv = window.setInterval(() => persist({}), 5000)
    return () => {
      window.clearInterval(iv)
      persist({})
    }
  }, [persist])

  /* Micro-steps for the current phase.
     Derived, never stored: a lesson planned weeks ago still gets today's
     guidance, and the saved record stays small. Memoized on the phase so the
     step list — and therefore the step ids — stay stable while the tutor works
     through it, rather than being rebuilt on every timer tick. */
  /* The words the spaced-review step is going to ask for. Computed from the
     same source the step itself uses, so the verdict buttons can never list a
     word the tutor was not actually prompted to ask about. */
  const recallTerms = useMemo(
    () => (model ? retrievalMaterial(model).vocabulary : []),
    [model],
  )

  const phaseForSteps = lesson?.plan.phases[phaseIndex]
  const steps: MicroStep[] = useMemo(() => {
    // Read so the dependency is a real one: the guidance these steps are built
    // from lives outside React, and this is what tells us it changed.
    void teaching
    if (!student || !model || !phaseForSteps) return []
    const ctx = {
      student,
      model,
      level: overallCefr(model.skillEstimates),
      lang,
      activityIndex: 0,
    }
    const built = phaseForSteps.activities.flatMap((activity, activityIndex) =>
      buildMicroSteps(activity, { ...ctx, activityIndex }),
    )
    // Spaced review rides at the front of the warm-up, where it belongs
    // pedagogically — and only when this learner genuinely has something due.
    if (phaseForSteps.kind === 'warmup' && phaseForSteps.activities[0]) {
      const retrieval = buildRetrievalStep(ctx, phaseForSteps.activities[0].id)
      if (retrieval) return [built[0], retrieval, ...built.slice(1)].filter(Boolean)
    }
    /* The learner's own recurring slips, drilled where production practice
       belongs: after the objective has been taught, before free conversation.
       Only fires when there is something that has actually recurred. */
    if (phaseForSteps.kind === 'guidedPractice' && phaseForSteps.activities[0]) {
      const fix = buildFixStep(ctx, phaseForSteps.activities[0].id)
      if (fix) return [fix, ...built]
    }
    return built
    /* `lang` is a dependency on purpose: switching the interface language
       rebuilds the guidance in that language on the spot, with no regeneration
       and no reload. */
  }, [student, model, phaseForSteps, lang, teaching])

  if (notFound) {
    return (
      <div className="container" style={{ paddingBlock: 'var(--sp-8)' }}>
        <p>{t('errors.lessonNotFound')}</p>
        <button className="btn" onClick={() => navigate('/tutor')}>
          {t('errors.goHome')}
        </button>
      </div>
    )
  }
  if (!student || !model || !lesson) {
    return <div className="container" style={{ paddingBlock: 'var(--sp-8)' }}>{t('common.loading')}</div>
  }

  const phases = lesson.plan.phases
  const phase = phases[phaseIndex]
  const level = overallCefr(model.skillEstimates)

  const notesResult = validateOptionalText(notes, { maxLength: LIMITS.note, multiline: true })
  const step: MicroStep | undefined = steps[Math.min(stepIndex, Math.max(0, steps.length - 1))]
  const stepActivity =
    phase.activities.find((a) => a.id === step?.activityId) ?? phase.activities[0]
  /* The deeper tutor card is rebuilt from the activity's content id in the
     current language, exactly like the step above it — never read off the
     stored plan, which carries no instructional prose at all. */
  const stepCard = stepActivity
    ? activityGuidance(stepActivity, { lang, student, level }).card
    : undefined
  const pacingProfile = pacingFor(student.age)
  const stepElapsed = Math.max(0, elapsed - stepStartedAt)

  /* Which phrases the tutor should be marking RIGHT NOW.
     Not every phrase step: on `meaning` and `model` the learner has been asked
     for nothing, so a verdict there would be a guess, and a screen that asks
     for one teaches the tutor that guessing is expected. The closing block is
     the exception in the other direction — it carries every phrase the lesson
     touched, so anything missed in the moment can still be recorded honestly
     while the tutor can still remember it. */
  const stepPhrases: PhraseTarget[] = (() => {
    if (!stepActivity || !step) return []
    const block = phraseBlockOf(stepActivity)
    if (!block) return []
    if (block === 'close') {
      return lessonPhraseIds(lesson)
        .map(getPhrase)
        .filter((p): p is PhraseTarget => Boolean(p))
    }
    if (step.move === 'meaning' || step.move === 'model') return []
    return phrasePhrases(stepActivity)
  })()

  /* How many steps are left in the WHOLE lesson, not just this phase — the
     pacing advice needs to know whether there is room to linger. Phases other
     than the current one are approximated by their activity count, which is
     close enough for "should I start wrapping up?". */
  const stepsRemaining =
    steps.length - (stepIndex + 1) +
    phases.slice(phaseIndex + 1).reduce((n, p) => n + p.activities.length, 0)

  const verdict = pacingAdvice({
    elapsedSeconds: elapsed,
    plannedMinutes: lesson.plan.totalMinutes,
    stepElapsedSeconds: stepElapsed,
    stepMinutes: step?.minutes ?? pacingProfile.stepMinutes,
    profile: pacingProfile,
    isConversation: step ? isConversationStep(step) : false,
    lastOutcome: stepActivity ? activityOutcomes[stepActivity.id] : undefined,
    stepsRemaining,
  })

  const goPhase = (idx: number) => {
    const clamped = Math.max(0, Math.min(phases.length - 1, idx))
    setPhaseIndex(clamped)
    setStepIndex(0)
    setStepStartedAt(elapsedRef.current)
    persist({ currentPhaseIndex: clamped, currentStepIndex: 0 })
  }

  /** Move within the phase; running off either end moves phase, so "next" is
   *  always one obvious action rather than two different buttons. */
  const goStep = (idx: number) => {
    if (idx < 0) {
      if (phaseIndex > 0) goPhase(phaseIndex - 1)
      return
    }
    if (idx >= steps.length) {
      if (phaseIndex < phases.length - 1) goPhase(phaseIndex + 1)
      return
    }
    setStepIndex(idx)
    setStepStartedAt(elapsedRef.current)
    persist({ currentStepIndex: idx })
  }

  const atLessonStart = phaseIndex === 0 && stepIndex === 0
  const atLessonEnd = phaseIndex === phases.length - 1 && stepIndex >= steps.length - 1

  const scoreActivity = (activityId: string, outcome: ScoreOutcome) => {
    const r: ItemResponse = {
      itemId: `${phase.kind}-${phaseIndex}-${uid('')}`,
      skill: PHASE_SKILL[phase.kind],
      cefr: level,
      difficulty: 5,
      outcome,
      at: Date.now(),
    }
    const next = [...responses, r]
    setResponses(next)
    setActivityOutcomes((cur) => ({ ...cur, [activityId]: outcome }))
    persist({ responses: next })
  }

  const onSaveCorrection = async (c: Correction) => {
    await saveCorrection(c)
    const next = [...corrections, c]
    setCorrections(next)
    persist({ correctionIds: next.map((x) => x.id) })
    setModal(null)
    toast(t('corrections.saved'), 'ok')
  }

  const finish = async () => {
    setRunning(false)
    const finalRec: LessonRecord = {
      ...lesson,
      currentPhaseIndex: phaseIndex,
      elapsedSeconds: elapsedRef.current,
      responses,
      vocabularyAdded: vocab,
      vocabularyMeanings: vocabMeanings,
      vocabularyReview: vocabReview,
      phraseVerdicts,
      tutorNotes: notes,
      // Leave unset rather than defaulting to 'partial' when the tutor never
      // scored it — the report should say "not assessed", not fake progress.
      objectiveOutcome,
      correctionIds: corrections.map((c) => c.id),
    }
    const { lesson: done } = await completeLesson(finalRec, student, model, corrections)
    setActiveLessonId(null)
    navigate(`/tutor/student/${student.id}`, { state: { justCompleted: done.id } })
  }

  const totalSeconds = lesson.plan.totalMinutes * 60
  const over = elapsed > totalSeconds

  return (
    <div className={styles.runner}>
      {/* Sticky header — SESSION STATE ONLY.
          Everything a tutor needs to glance at without losing their place:
          who they are with, how long is left, whether the clock is running,
          the level, and where they are in the plan. The eight action buttons
          that used to live here made the header ~200px tall on a phone and
          overlapped at 320px; they moved to the action area below, which
          scrolls away with the content. */}
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <button className={`btn btn-sm btn-ghost ${styles.backBtn}`} onClick={() => setModal('finish')}>
            <ArrowLeftIcon className="flip-in-rtl" />
            <span className={styles.studentName}>{student.name}</span>
          </button>

          {/* The clock is a tutor's tool. A learner watching the minutes tick
              is being given a deadline nobody meant to set — and in Student
              mode the tutor is holding the plan on their own device anyway. */}
          {showTimer && access.timer && (
            <div className={`${styles.timer} ${over ? styles.over : ''}`}>
              <TimerIcon />
              <span className={styles.time}>{formatDuration(elapsed)}</span>
              <span className={styles.timerTotal}>/ {formatDuration(totalSeconds)}</span>
            </div>
          )}
          {showTimer && access.timer && (
            <button
              className={styles.timerToggle}
              onClick={() => setRunning((r) => !r)}
              aria-label={running ? t('lesson.pause') : t('lesson.resumeTimer')}
              title={running ? t('lesson.pause') : t('lesson.resumeTimer')}
            >
              {running ? <PauseIcon /> : <PlayIcon />}
            </button>
          )}
          {/* The learner's CEFR level is tutor information. On a device handed
              to a nervous beginner, "preA1" is at best noise and at worst a
              verdict. */}
          {access.diagnostics && (
            <div className={styles.levelBadge} title={t('dashboard.approxLevel')}>
              <Bdi>{level}</Bdi>
            </div>
          )}
        </div>

        {access.tutorGuidance && (
          <>
            <div className={styles.phaseBar}>
              {/* A phrase lesson's ten phases are three kinds repeated, so
                  "Speaking & listening" says nothing about where the tutor is.
                  Its own title names the English being taught, which does. */}
              <span className={styles.phaseName} dir="auto">
                {phase.activities[0]?.guide?.src === 'phrase'
                  ? localizedTitle(lang, phase)
                  : t(`phases.${phase.kind}`)}{' '}
                · {phase.startMin}–{phase.endMin} {t('common.minutes')}
              </span>
              <span className="muted">
                {t('lesson.phaseProgress', { current: phaseIndex + 1, total: phases.length })}
              </span>
            </div>
            <Progress value={phaseIndex + 1} max={phases.length} label="lesson phase progress" />
          </>
        )}
      </header>

      {/* Phase body */}
      <main className={`${styles.body} ${access.tutorGuidance ? '' : styles.studentBody}`}>
        <div className="container container-narrow">
          {/* No "Together mode hides private tutor notes" banner here. It was
              reassurance for the tutor, printed at the top of the one screen
              the learner is looking at — the definition of tutor chrome on a
              shared screen. The tutor chose the mode; they do not need the
              app to tell them what it does, and the learner should never be
              reading about the app's modes at all. */}

          {/* The objective title is written for the tutor ("First words and
              everyday chunks"). It belongs above the guidance, not above the
              learner's task. */}
          {access.tutorGuidance && (
            <div className={styles.objective}>
              <span className="badge badge-info">{t('lesson.objective')}</span>
              <strong dir="auto">
                {teachingStatus === 'loading'
                  ? t('lesson.guidanceLoading')
                  : objectiveTitle(lang, lesson.plan.objective)}
              </strong>
            </div>
          )}

          {/* ONE micro-step at a time.
              Tutor mode gets the nine-section instruction; Student and Together
              modes get only the learner's task, in the learner's own language.
              The tutor's guidance is not hidden with CSS in those modes — it is
              never rendered, so there is nothing to leak. */}
          {step && stepActivity && (
            <>
              {access.tutorGuidance ? (
                <>
                  <PacingBar
                    elapsedSeconds={elapsed}
                    plannedMinutes={lesson.plan.totalMinutes}
                    stepNumber={Math.min(stepIndex + 1, steps.length)}
                    stepCount={steps.length}
                    verdict={verdict}
                    profile={pacingProfile}
                  />
                  {/* PacingBar reads only bundled UI strings, so it is safe to
                      show immediately. Everything below reads guide/content
                      chunks that may still be in flight — while loading, this
                      is a neutral placeholder instead of the English those
                      helpers fall back to, so a Hebrew or Russian tutor never
                      sees an English step for a frame. */}
                  {teachingStatus === 'loading' ? (
                    <GuidancePlaceholder />
                  ) : (
                    <>
                      {teachingStatus === 'error' && <GuidanceLoadError lang={lang} />}
                      <MicroStepView
                        step={step}
                        card={stepCard}
                        stepNumber={Math.min(stepIndex + 1, steps.length)}
                        stepCount={steps.length}
                        /* What the learner is looking at, in the SELECTED
                           interface language — the same one this screen is in.
                           Reading it from the profile instead is what let a French
                           profile show French instructions under an English UI. */
                        studentInstruction={t(step.studentKey, step.studentParams)}
                      />
                      {step.move === 'retrieval' && recallTerms.length > 0 && (
                        <VocabRecall
                          terms={recallTerms}
                          value={vocabReview}
                          onSet={(term, outcome) => {
                            setVocabReview((cur) => {
                              // Tapping the same verdict again clears it: a tutor who
                              // mis-taps must be able to record "no verdict", because
                              // an invented one moves the review schedule for weeks.
                              const next = { ...cur }
                              if (next[term] === outcome) delete next[term]
                              else next[term] = outcome
                              persist({ vocabularyReview: next })
                              return next
                            })
                          }}
                        />
                      )}
                    </>
                  )}
                </>
              ) : (
                <StudentTaskView
                  step={step}
                  activity={stepActivity}
                  /* The learner's board is derived from the same banks the
                     tutor guidance uses, so it needs the same three inputs:
                     who they are, what they have met before, and where they
                     are. Passing them is what lets a recall step cue from a
                     meaning THIS learner was taught. */
                  student={student}
                  model={model}
                  level={level}
                  /* Captured in this session. The closing steps are about what
                     just happened, so they show the learner's own words rather
                     than another generic instruction. */
                  todayVocabulary={vocab}
                  todayCorrections={correctionPairs}
                />
              )}

              {/* Every control that acts on this step — score it, capture
                  something from it, step off it — now lives in one pinned bar
                  at the foot of the screen (StepActionBar). What used to sit
                  here was a Previous/Next row, a score row, a five-button
                  capture tray and a skip footer, all competing to look like
                  the next thing to press. */}

              {/* The rest of the phase, collapsed. Available for a tutor who
                  wants to look ahead, never in the way of the current step.
                  Each entry's label is guide-derived (`s.now`), so it waits
                  on the same status as the step above it. */}
              {access.tutorGuidance && teachingStatus !== 'loading' && steps.length > 1 && (
                <details className={styles.phaseOutline}>
                  <summary>{t('lesson.phaseOutline')}</summary>
                  <ol>
                    {steps.map((s, i) => (
                      <li key={s.id} aria-current={i === stepIndex ? 'step' : undefined}>
                        <button type="button" className="btn btn-sm btn-ghost" onClick={() => goStep(i)}>
                          <span className="muted" dir="ltr">
                            {t(`moves.${s.move}`)}
                          </span>{' '}
                          <span dir="ltr">{s.now}</span>
                        </button>
                      </li>
                    ))}
                  </ol>
                </details>
              )}
            </>
          )}

          {/* Per-phrase evidence, at the moment production was asked for.
              This is the beginner pathway's equivalent of the objective score
              below — except there are eight to ten of them, which is the
              difference between "we did greetings" and knowing which four
              greetings this learner can produce without help. */}
          {stepPhrases.length > 0 && access.scoring && teachingStatus !== 'loading' && (
            <PhraseVerdictPanel
              phrases={stepPhrases}
              verdicts={phraseVerdicts}
              onSet={(phraseId, verdict) => {
                const next = { ...phraseVerdicts, [phraseId]: verdict }
                setPhraseVerdicts(next)
                persist({ phraseVerdicts: next })
              }}
            />
          )}

          {/* On the last phase, capture the objective outcome. No "Finish"
              button of its own: the bar's primary becomes "Finish lesson" on
              the last step, and two filled buttons offering to end the lesson
              is exactly the competition this pass removed. */}
          {phaseIndex === phases.length - 1 && access.scoring && (
            <div className={`card ${styles.objectiveScore}`}>
              {/* Names the objective inline rather than just "overall": by the
                  last phase the objective badge at the top of the page is long
                  scrolled past, and this control's own three Correct/Partial/
                  Needs-work chips otherwise read as a repeat of the identical
                  per-step "How did that go?" chips in the pinned bar below. */}
              <strong>
                {t('lesson.objectiveResult', { objective: objectiveTitle(lang, lesson.plan.objective) })}
              </strong>
              <div className="cluster">
                {(['correct', 'partial', 'needsWork'] as ScoreOutcome[]).map((o) => (
                  <button
                    key={o}
                    className="chip"
                    aria-pressed={objectiveOutcome === o}
                    onClick={() => {
                      setObjectiveOutcome(o)
                      persist({ objectiveOutcome: o })
                    }}
                  >
                    {t(`lesson.outcome${o === 'needsWork' ? 'NeedsWork' : o === 'partial' ? 'Partial' : 'Correct'}`)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {corrections.length > 0 && access.captureTools && access.privateNotes && (
            <div className={styles.capturedList}>
              <span className="muted">
                {corrections.length} {t('lesson.quickCorrection').toLowerCase()} · {vocab.length}{' '}
                {t('dashboard.vocabulary').toLowerCase()}
              </span>
            </div>
          )}
        </div>
      </main>

      {/* The tutor's control surface: score, advance, and everything else one
          disclosure away. Pinned to the foot of the viewport so a tutor deep in
          a long SAY/HELP block never scrolls through chrome to act. */}
      {step && stepActivity && (
        <StepActionBar
          access={access}
          outcome={activityOutcomes[stepActivity.id]}
          onScore={(o) => scoreActivity(stepActivity.id, o)}
          onPrev={() => goStep(stepIndex - 1)}
          onNext={() => goStep(stepIndex + 1)}
          onFinish={() => setModal('finish')}
          atStart={atLessonStart}
          atEnd={atLessonEnd}
          onCapture={(kind) => setModal(kind)}
          showTimer={showTimer}
          onToggleTimer={() => setShowTimer(!showTimer)}
          canSkipSection={access.tutorGuidance && phaseIndex < phases.length - 1}
          onSkipSection={() => goPhase(phaseIndex + 1)}
        />
      )}

      {/* Modals */}
      {modal === 'correction' && (
        <Modal title={t('corrections.addTitle')} onClose={() => setModal(null)}>
          <CorrectionCapture
            studentId={student.id}
            lessonId={lesson.id}
            defaultCategory={PHASE_CORRECTION_CATEGORY[phase.kind]}
            onSave={onSaveCorrection}
          />
        </Modal>
      )}
      {modal === 'record' && (
        <Modal title={t('audio.title')} onClose={() => setModal(null)}>
          <RecorderPanel
            studentId={student.id}
            lessonId={lesson.id}
            defaultArea={
              (PRONUNCIATION_AREAS as readonly string[]).includes(lesson.plan.objective.ref)
                ? (lesson.plan.objective.ref as PronunciationArea)
                : undefined
            }
            onSaved={() => {
              toast(t('audio.saved'), 'ok')
            }}
          />
        </Modal>
      )}
      {modal === 'vocab' && (
        <VocabModal
          onClose={() => setModal(null)}
          onAdd={(term, meaning) => {
            const next = [...vocab, term]
            const nextMeanings = meaning ? { ...vocabMeanings, [term]: meaning } : vocabMeanings
            setVocab(next)
            setVocabMeanings(nextMeanings)
            persist({ vocabularyAdded: next, vocabularyMeanings: nextMeanings })
            setModal(null)
            toast(t('corrections.saved'), 'ok')
          }}
        />
      )}
      {modal === 'notes' && (
        <Modal title={t('lesson.notes')} onClose={() => setModal(null)}>
          <textarea
            className="textarea"
            style={{ minHeight: 160 }}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            autoFocus
            maxLength={LIMITS.note}
            aria-invalid={!notesResult.ok}
          />
          <FieldError issue={notesResult.ok ? undefined : notesResult.issue} />
          <button
            className="btn btn-primary btn-block"
            style={{ marginTop: 'var(--sp-3)' }}
            disabled={!notesResult.ok}
            onClick={() => {
              // Paragraph breaks are the tutor's own structure, so multiline
              // sanitizing keeps them and strips only control characters.
              const clean = notesResult.ok ? notesResult.value ?? '' : notes
              setNotes(clean)
              persist({ tutorNotes: clean })
              setModal(null)
              toast(t('corrections.saved'), 'ok')
            }}
          >
            {t('common.save')}
          </button>
        </Modal>
      )}
      {modal === 'finish' && (
        <Modal title={t('lesson.finishLesson')} onClose={() => setModal(null)}>
          <p>{t('lesson.confirmFinish')}</p>
          <div className="cluster" style={{ marginTop: 'var(--sp-4)' }}>
            <button className="btn btn-primary btn-lg" onClick={finish}>
              {t('common.finish')}
            </button>
            {/* Deliberately not "Cancel" — this button does not dismiss the
                dialog and return to the lesson (the × already does that). It
                navigates away, which "Cancel" next to a primary "Finish"
                reads as the opposite of. */}
            <button
              className="btn btn-lg"
              onClick={() => {
                persist({})
                setActiveLessonId(null)
                navigate(`/tutor/student/${student.id}`)
              }}
            >
              {t('lesson.leaveLesson')}
            </button>
          </div>
          <p className="muted" style={{ fontSize: 'var(--fs-sm)', marginTop: 'var(--sp-3)' }}>
            {t('lesson.confirmAbandon')}
          </p>
        </Modal>
      )}

      {/* Brief tutor orientation shown when a lesson starts (dismissible). */}
      {showOrientation && access.tutorGuidance && (
        <Modal title={t('lesson.orientationTitle')} onClose={() => setShowOrientation(false)}>
          <ol className={styles.orientationList}>
            <li>{t('lesson.orientation1')}</li>
            <li>{t('lesson.orientation2')}</li>
            <li>{t('lesson.orientation3')}</li>
            <li>{t('lesson.orientation4')}</li>
            <li>{t('lesson.orientation5')}</li>
          </ol>
          {student.respondedByParent && (
            <p className={styles.parentAssist}>
              <FamilyIcon /> {t('lesson.parentAssist')}
            </p>
          )}
          <label className={styles.orientationDismiss}>
            <input
              type="checkbox"
              onChange={(e) => setHideLessonOrientation(e.target.checked)}
            />
            <span>{t('lesson.orientationDismiss')}</span>
          </label>
          <button
            className="btn btn-primary btn-block"
            style={{ marginTop: 'var(--sp-3)' }}
            onClick={() => setShowOrientation(false)}
          >
            {t('lesson.orientationStart')}
          </button>
        </Modal>
      )}
    </div>
  )
}

/** Neutral stand-in for the guidance panel while a locale's teaching prose is
 *  still loading — sized close to the panel it replaces so the step below it
 *  does not visibly jump once the real content lands. */
function GuidancePlaceholder() {
  const { t } = useI18n()
  return (
    <div className={`card ${styles.guidancePending}`} role="status" aria-live="polite">
      <p className="muted">{t('lesson.guidanceLoading')}</p>
    </div>
  )
}

/** A failed chunk fetch, shown honestly. English guidance is still complete
 *  and usable underneath this, so the lesson is never blocked — the tutor is
 *  just told plainly that it is not the language they selected. */
function GuidanceLoadError({ lang }: { lang: UILanguage }) {
  const { t } = useI18n()
  const [retrying, setRetrying] = useState(false)
  return (
    <div className={styles.guidanceError} role="alert">
      <span>{t('lesson.guidanceUnavailable')}</span>
      <button
        type="button"
        className="btn btn-sm"
        disabled={retrying}
        onClick={() => {
          setRetrying(true)
          void loadTeachingStrings(lang).finally(() => setRetrying(false))
        }}
      >
        {t('lesson.guidanceRetry')}
      </button>
    </div>
  )
}

/**
 * Verdicts on the words the learner was just asked to recall.
 *
 * Two taps per word, no free text, no score. This is the only place the app
 * ever learns whether a word stuck — without it the review queue was
 * write-only, handing back the same five words forever while every newer word
 * queued behind them. Leaving a word untouched is a valid answer and means
 * exactly what it says: it was not asked, so nothing is claimed about it.
 */
function VocabRecall({
  terms,
  value,
  onSet,
}: {
  terms: string[]
  value: Record<string, VocabRecallOutcome>
  onSet: (term: string, outcome: VocabRecallOutcome) => void
}) {
  const { t } = useI18n()
  return (
    <section className={styles.recall} aria-label={t('lesson.recallTitle')}>
      <h3 className={styles.recallTitle}>{t('lesson.recallTitle')}</h3>
      <p className={styles.recallHint}>{t('lesson.recallHint')}</p>
      <ul className={styles.recallList}>
        {terms.map((term) => (
          <li key={term} className={styles.recallRow}>
            <span className={styles.recallTerm} dir="auto">
              <Bdi>{term}</Bdi>
            </span>
            <button
              type="button"
              className={`btn btn-sm ${value[term] === 'recalled' ? 'btn-primary' : ''}`}
              aria-pressed={value[term] === 'recalled'}
              onClick={() => onSet(term, 'recalled')}
            >
              {t('lesson.recallGot')}
            </button>
            <button
              type="button"
              className={`btn btn-sm ${value[term] === 'missed' ? 'btn-primary' : ''}`}
              aria-pressed={value[term] === 'missed'}
              onClick={() => onSet(term, 'missed')}
            >
              {t('lesson.recallMissed')}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

function VocabModal({
  onClose,
  onAdd,
}: {
  onClose: () => void
  onAdd: (term: string, meaning?: string) => void
}) {
  const { t } = useI18n()
  const [term, setTerm] = useState('')
  /* The meaning is optional and stays optional — a tutor mid-conversation
     should be able to save a word in three seconds. When it IS filled in, a
     later recall step can cue from the meaning and make the learner produce
     the English, instead of showing them the word it is testing. */
  const [meaning, setMeaning] = useState('')
  // A vocabulary item is an English word or phrase, but the meaning note a
  // tutor jots beside it may be in any script — so validation trims and caps,
  // and changes nothing else.
  const result = validateText(term, { maxLength: LIMITS.term })
  const meaningResult = validateOptionalText(meaning, { maxLength: LIMITS.line })
  const value = result.ok ? result.value : ''
  const meaningValue = (meaningResult.ok && meaningResult.value) || undefined
  const submit = () => {
    if (result.ok && value) onAdd(value, meaningValue)
  }
  return (
    <Modal title={t('lesson.addVocab')} onClose={onClose}>
      <label className="field">
        <span>{t('lesson.vocabTerm')}</span>
        <input
          className="input"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          autoFocus
          type="text"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="done"
          maxLength={LIMITS.term}
          aria-invalid={!result.ok}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
        />
        <FieldError issue={result.ok ? undefined : result.issue} />
      </label>
      <label className="field">
        <span>{t('lesson.vocabMeaning')}</span>
        {/* The meaning is written in whatever language the pair share, so no
            direction is forced on it. */}
        <input
          className="input"
          value={meaning}
          onChange={(e) => setMeaning(e.target.value)}
          type="text"
          dir="auto"
          enterKeyHint="done"
          maxLength={LIMITS.line}
          aria-invalid={!meaningResult.ok}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
        />
        <FieldError issue={meaningResult.ok ? undefined : meaningResult.issue} />
      </label>
      <button
        className="btn btn-primary btn-block"
        style={{ marginTop: 'var(--sp-3)' }}
        disabled={!result.ok || value === ''}
        onClick={submit}
      >
        {t('common.add')}
      </button>
    </Modal>
  )
}
