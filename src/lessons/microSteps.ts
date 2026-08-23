/* ==========================================================================
   Micro-steps — the answer to "what do I do RIGHT NOW?"
   --------------------------------------------------------------------------
   A lesson activity ("Focus: Past simple", seven minutes) is a plan, not an
   instruction. An inexperienced tutor staring at seven minutes of "teach the
   past simple" has to invent the whole shape of it at the table.

   This module turns each activity into a sequence of 2–5 minute micro-steps
   that follow real language-teaching practice:

     Meaning → Model → Notice → Guided practice → Retrieval → Real use → Feedback

   and gives every step the nine things the tutor needs in the moment:

     NOW / SAY / DO / STUDENT DOES / LOOK FOR / HELP / CHALLENGE / DONE WHEN / NEXT

   Two design decisions worth knowing:

   1. Steps are DERIVED, not stored. A LessonPlan saved last month still gets
      today's guidance, and lesson records in IndexedDB stay small. The function
      is pure, so it is straightforward to test.

   2. Nothing here starts with a rule. Every grammar sequence opens with
      `meaningFirst` — a concrete situation, object or gesture. Abstract
      explanation, where it appears at all, comes after the learner has already
      met the language in use.
   ========================================================================== */

import {
  CEFR,
  LearningModel,
  LessonActivity,
  LessonPhaseKind,
  PronunciationArea,
  StudentProfile,
  TutorAutopilot,
  TutorCard,
  UILanguage,
} from '../types'
import { getGrammarById } from '../data/grammarLibrary'
import { getPronunciationByArea } from '../data/pronunciationLibrary'
import { dueForReview } from '../students/learningModel'
import { roundsFor } from './fluency'
import { cefrIndex } from '../utils/cefr'
import { AgeStage, PacingProfile, ageStageFor, pacingFor } from './pacing'
import { translate, translateList } from '../i18n/translate'
import { ct } from '../i18n/contentText'
import { grammarKey, pronKey } from '../data/contentStrings'
import {
  activityGuidance,
  defaultDoneWhen,
  defaultStudentDoes,
  followUpQuestions,
  grammarTitle,
  localizedTitle,
} from './guidance'

/** The teaching move a step performs. Names the pedagogy, so the UI can label
 *  it and a test can assert the sequence is sound. */
export type TeachingMove =
  | 'meaning'
  | 'model'
  | 'notice'
  | 'guided'
  | 'retrieval'
  | 'realUse'
  | 'feedback'
  | 'record'
  | 'reset'
  | 'recap'

/** All nine sections, always populated. Nothing here is optional on screen. */
export interface MicroStep {
  id: string
  /** The lesson activity this step belongs to — the runner needs it to render
   *  the learner-facing prompt and to attach a score. */
  activityId: string
  move: TeachingMove
  /** Suggested minutes. Guidance — the runner never enforces it. */
  minutes: number
  /** NOW — what is happening. */
  now: string
  /** SAY — optional exact wording. */
  say: string[]
  /** DO — what the tutor does. */
  do: string[]
  /** STUDENT DOES — what the learner is actually doing. */
  studentDoes: string[]
  /** LOOK FOR — observable evidence. */
  lookFor: string[]
  /** HELP — if they cannot do it. */
  help: string[]
  /** CHALLENGE — if it is too easy. */
  challenge: string[]
  /** DONE WHEN — the criterion to move on. */
  doneWhen: string
  /** NEXT — one obvious next action. */
  next: string
  /** English to model aloud via speech synthesis, when there is one. */
  speak?: string
  /** i18n key for the student-facing instruction, shown in the learner's own
   *  language. English target content stays English. */
  studentKey: string
  /** Params for `studentKey`. */
  studentParams?: Record<string, string>
}

export interface MicroStepContext {
  student: StudentProfile
  model: LearningModel
  level: CEFR
  /** The language the TUTOR is reading right now — not the language the plan
   *  was generated in, and not necessarily the student's profile language.
   *  Steps are derived per render, so switching it re-renders the guidance. */
  lang: UILanguage
  /** Index of the activity in the lesson, for stable step ids. */
  activityIndex: number
}

/* -------------------------------------------------------------------------- */
/* Guidance resolution                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Fill in whatever the content bank did not supply. Older content provides
 * five fields (say/do/lookFor/next/teacherTip); this derives NOW, STUDENT DOES,
 * HELP, CHALLENGE and DONE WHEN from the TutorCard and the activity kind, so
 * the tutor never sees an empty section — in their own language, because every
 * default here is a key rather than a sentence.
 */
export function resolveGuidance(
  activity: LessonActivity,
  autopilot: TutorAutopilot | undefined,
  card: TutorCard | undefined,
  lang: UILanguage = 'en',
): Required<Pick<TutorAutopilot, 'now' | 'studentDoes' | 'help' | 'challenge' | 'doneWhen'>> {
  const kind = activity.kind
  return {
    now: autopilot?.now ?? localizedTitle(lang, activity),
    studentDoes: autopilot?.studentDoes ?? [defaultStudentDoes(lang, kind)],
    help: autopilot?.help ?? [card?.ifStruggle ?? translate(lang, 'guide.defaults.help')],
    challenge: autopilot?.challenge ?? [card?.ifSucceed ?? translate(lang, 'guide.defaults.challenge')],
    doneWhen: autopilot?.doneWhen ?? defaultDoneWhen(lang, kind),
  }
}

/* -------------------------------------------------------------------------- */
/* Step builders                                                              */
/* -------------------------------------------------------------------------- */

let stepCounter = 0
function stepId(ctx: MicroStepContext, move: TeachingMove, i: number): string {
  stepCounter += 1
  return `ms-${ctx.activityIndex}-${move}-${i}-${stepCounter}`
}

/** Round a suggested duration into the age-appropriate 2–5 minute window. */
function stepMinutes(profile: PacingProfile, weight = 1): number {
  const raw = Math.round(profile.stepMinutes * weight)
  return Math.max(2, Math.min(profile.maxStepMinutes, raw))
}

/** Items this learner is actually due to revisit, for a concrete retrieval
 *  step. Falls back to nothing rather than to invented content. */
export function retrievalMaterial(model: LearningModel, now = Date.now()): {
  vocabulary: string[]
  /** Words the tutor can cue FROM MEANING — the learner has to produce the
   *  English rather than recognise it. Only words that were captured with a
   *  meaning note qualify. */
  fromMeaning: { term: string; meaning: string }[]
  skills: string[]
  errors: string[]
} {
  const due = dueForReview(model, now)
  /* Secure words are excluded, not merely deprioritised. Recall time in a
     50-minute lesson is a couple of minutes; spending it on words the learner
     has already produced from memory three times is exactly the "repeat
     mastered content endlessly" failure. They stay in the model, and a lapse
     puts them straight back in the queue. */
  const dueVocab = model.vocabulary
    .filter((v) => v.reviewDue <= now && v.strength !== 'secure')
    .slice(-5)
  return {
    vocabulary: dueVocab.map((v) => v.term),
    fromMeaning: dueVocab
      .filter((v): v is typeof v & { meaning: string } => Boolean(v.meaning?.trim()))
      .map((v) => ({ term: v.term, meaning: v.meaning })),
    skills: due.slice(0, 3).map((s) => s.label),
    errors: model.recurringErrors
      .filter((e) => !e.resolved)
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, 2)
      .map((e) => e.description),
  }
}

/* ---- Grammar: Meaning → Model → Notice → Guided → Real use ---------------- */

function grammarSteps(conceptId: string, ctx: MicroStepContext, profile: PacingProfile): MicroStep[] {
  const g = getGrammarById(conceptId)
  if (!g) return []
  const lang = ctx.lang
  const t = (k: string, p?: Record<string, string | number>) =>
    translate(lang, `guide.step.grammar.${k}`, p)
  const tl = (k: string, p?: Record<string, string | number>) =>
    translateList(lang, `guide.step.grammar.${k}`, p)
  const gc = (field: string, en: string) => ct(lang, grammarKey(g.id, field), en)
  const easier = g.easierVariant ? grammarTitle(lang, g.easierVariant) : undefined
  const harder = g.harderVariant ? grammarTitle(lang, g.harderVariant) : undefined
  const errors = g.commonErrors.map((e) => `“${e.wrong}” → “${e.right}”`)

  return [
    {
      id: stepId(ctx, 'meaning', 0),
      activityId: '',
      move: 'meaning',
      minutes: stepMinutes(profile, 0.6),
      now: t('meaning.now', { title: gc('title', g.title) }),
      say: [g.correctExamples[0]],
      do: [gc('meaningFirst', g.meaningFirst)],
      studentDoes: tl('meaning.studentDoes'),
      lookFor: tl('meaning.lookFor'),
      help: tl('meaning.help'),
      challenge: tl('meaning.challenge'),
      doneWhen: t('meaning.doneWhen'),
      next: t('meaning.next'),
      speak: g.correctExamples[0],
      studentKey: 'student.watchAndListen',
    },
    {
      id: stepId(ctx, 'model', 1),
      activityId: '',
      move: 'model',
      minutes: stepMinutes(profile, 0.6),
      now: t('model.now'),
      say: g.correctExamples.slice(0, 3),
      do: tl('model.do'),
      studentDoes: tl('model.studentDoes'),
      lookFor: tl('model.lookFor'),
      help: tl('model.help'),
      challenge: tl('model.challenge'),
      doneWhen: t('model.doneWhen'),
      next: t('model.next'),
      speak: g.correctExamples.slice(0, 2).join(' '),
      studentKey: 'student.listenToTutor',
    },
    {
      id: stepId(ctx, 'notice', 2),
      activityId: '',
      move: 'notice',
      minutes: stepMinutes(profile, 0.5),
      // The noticing question is spoken to the learner, so it stays English.
      say: [g.noticePrompt],
      now: t('notice.now'),
      do: tl('notice.do'),
      studentDoes: tl('notice.studentDoes'),
      lookFor: tl('notice.lookFor'),
      help: [t('notice.help', { explanation: gc('studentExplanation', g.studentExplanation) })],
      challenge: tl('notice.challenge'),
      doneWhen: t('notice.doneWhen'),
      next: t('notice.next'),
      studentKey: 'student.spotThePattern',
    },
    {
      id: stepId(ctx, 'guided', 3),
      activityId: '',
      move: 'guided',
      minutes: stepMinutes(profile, 1),
      now: t('guided.now'),
      say: g.controlledPractice,
      do: tl('guided.do'),
      studentDoes: tl('guided.studentDoes'),
      lookFor: errors.length ? errors : tl('guided.lookFor'),
      help: [gc('fallback', g.fallback)],
      challenge: [gc('extension', g.extension)],
      doneWhen: t('guided.doneWhen'),
      next: t('guided.next'),
      studentKey: 'student.yourTurnPractice',
    },
    {
      id: stepId(ctx, 'realUse', 4),
      activityId: '',
      move: 'realUse',
      minutes: stepMinutes(profile, 1.2),
      now: t('realUse.now'),
      say: g.conversationPractice,
      do: tl('realUse.do'),
      studentDoes: tl('realUse.studentDoes'),
      lookFor: tl('realUse.lookFor'),
      help: tl('realUse.help'),
      challenge: [harder ? t('realUse.challengeHarder', { title: harder }) : t('realUse.challenge')],
      doneWhen: t('realUse.doneWhen'),
      next: t('realUse.next'),
      studentKey: 'student.talkAboutYou',
    },
    {
      id: stepId(ctx, 'feedback', 5),
      activityId: '',
      move: 'feedback',
      minutes: stepMinutes(profile, 0.5),
      now: t('feedback.now'),
      say: g.correctionScript,
      do: [t('feedback.do'), gc('correctionMethod', g.correctionMethod)],
      studentDoes: tl('feedback.studentDoes'),
      lookFor: tl('feedback.lookFor'),
      help: [easier ? t('feedback.helpEasier', { title: easier }) : t('feedback.help')],
      challenge: tl('feedback.challenge'),
      doneWhen: t('feedback.doneWhen'),
      next: t('feedback.next'),
      studentKey: 'student.sayItAgain',
    },
  ]
}

/* ---- Pronunciation: Listen → Contrast → Repeat → Sentence → Evidence ------ */

function pronunciationSteps(area: string, ctx: MicroStepContext, profile: PacingProfile): MicroStep[] {
  const p = getPronunciationByArea(area)
  if (!p) return []
  const lang = ctx.lang
  const t = (k: string, params?: Record<string, string | number>) =>
    translate(lang, `guide.step.pron.${k}`, params)
  const tl = (k: string) => translateList(lang, `guide.step.pron.${k}`)
  const pc = (field: string, en: string) => ct(lang, pronKey(p.area, field), en)
  const pair = p.minimalPairs[0]
  const l1Lang = ctx.student.interfaceLanguage
  const l1Raw = p.firstLanguageNotes?.[l1Lang]
  const l1 = l1Raw ? ct(lang, pronKey(p.area, `l1.${l1Lang}`), l1Raw) : undefined

  return [
    {
      id: stepId(ctx, 'meaning', 0),
      activityId: '',
      move: 'meaning',
      minutes: stepMinutes(profile, 0.5),
      now: t('meaning.now', { title: pc('title', p.title) }),
      say: pair ? [`Listen: “${pair.a}” … “${pair.b}”. Different words.`] : [p.words[0]],
      do: [
        pc('why', p.why),
        l1 ? t('meaning.forThisLearner', { note: l1 }) : pc('tutorNotes', p.tutorNotes),
      ],
      studentDoes: tl('meaning.studentDoes'),
      lookFor: tl('meaning.lookFor'),
      help: tl('meaning.help'),
      challenge: tl('meaning.challenge'),
      doneWhen: t('meaning.doneWhen'),
      next: t('meaning.next'),
      speak: pair ? `${pair.a}. ${pair.b}.` : p.words[0],
      studentKey: 'student.listenForDifference',
    },
    {
      id: stepId(ctx, 'model', 1),
      activityId: '',
      move: 'model',
      minutes: stepMinutes(profile, 0.7),
      now: t('model.now'),
      say: p.words.slice(0, 4),
      do: [pc('howTo', p.howTo), t('model.do')],
      studentDoes: tl('model.studentDoes'),
      lookFor: tl('model.lookFor'),
      help: tl('model.help'),
      challenge: tl('model.challenge'),
      doneWhen: t('model.doneWhen'),
      next: t('model.next'),
      speak: p.words.slice(0, 4).join(', '),
      studentKey: 'student.watchMyMouth',
    },
    {
      id: stepId(ctx, 'guided', 2),
      activityId: '',
      move: 'guided',
      minutes: stepMinutes(profile, 1),
      now: t('guided.now'),
      say: [
        ...p.minimalPairs.slice(0, 2).map((m) => `${m.a} / ${m.b}`),
        ...p.sentences.slice(0, 1),
      ],
      do: tl('guided.do'),
      studentDoes: tl('guided.studentDoes'),
      lookFor: [pc('tutorNotes', p.tutorNotes)],
      help: tl('guided.help'),
      challenge: [pc('connectedSpeech', p.connectedSpeech)],
      doneWhen: t('guided.doneWhen'),
      next: t('guided.next'),
      speak: p.sentences[0],
      studentKey: 'student.repeatAfterMe',
    },
    {
      id: stepId(ctx, 'record', 3),
      activityId: '',
      move: 'record',
      minutes: stepMinutes(profile, 0.6),
      now: t('record.now'),
      say: ['Let’s record that and listen back.'],
      do: [pc('recording.improved', p.recordingPlan.improved), t('record.do')],
      studentDoes: tl('record.studentDoes'),
      lookFor: tl('record.lookFor'),
      help: tl('record.help'),
      challenge: tl('record.challenge'),
      doneWhen: t('record.doneWhen'),
      next: t('record.next'),
      studentKey: 'student.recordAndListen',
    },
    {
      id: stepId(ctx, 'realUse', 4),
      activityId: '',
      move: 'realUse',
      minutes: stepMinutes(profile, 1),
      now: t('realUse.now'),
      say: [p.conversationPrompt],
      do: tl('realUse.do'),
      studentDoes: tl('realUse.studentDoes'),
      lookFor: tl('realUse.lookFor'),
      help: tl('realUse.help'),
      challenge: tl('realUse.challenge'),
      doneWhen: t('realUse.doneWhen'),
      next: t('realUse.next'),
      studentKey: 'student.talkNaturally',
    },
  ]
}

/* ---- Fluency sprint: one step per round, plus the payoff ----------------- */

/**
 * The rounds are separate steps on purpose. A single "do it three times" card
 * lets an inexperienced tutor run one long round and call it done — which is
 * not the exercise. One step per round means the app counts the repetitions,
 * and the tutor only has to start a clock and stay quiet.
 */
function fluencySteps(activity: LessonActivity, ctx: MicroStepContext): MicroStep[] {
  const rounds = roundsFor(cefrIndex(ctx.level), ctx.student.ageBand)
  const prompt = activity.studentPrompt
  const last = rounds.seconds.length - 1
  const lang = ctx.lang
  const t = (k: string, p?: Record<string, string | number>) =>
    translate(lang, `guide.step.fluency.${k}`, p)
  const tl = (k: string, p?: Record<string, string | number>) =>
    translateList(lang, `guide.step.fluency.${k}`, p)

  const roundSteps: MicroStep[] = rounds.seconds.map((seconds, i) => {
    const first = i === 0
    const final = i === last
    const p = { seconds, round: i + 1, count: rounds.seconds.length, next: rounds.seconds[i + 1] ?? seconds }
    return {
      id: stepId(ctx, first ? 'model' : 'guided', i),
      activityId: '',
      move: first ? 'model' : 'guided',
      // The clock inside the round is the real timing; the step minute budget
      // just has to leave room for it plus the handover.
      minutes: Math.max(2, Math.ceil((seconds + 30) / 60)),
      now: t('round.now', p),
      say: first
        ? [prompt, `Talk for ${seconds} seconds. Do not stop. I will not interrupt.`]
        : [
            `Same story again — this time ${seconds} seconds.`,
            final
              ? 'This one should feel easy. Smooth, no stopping.'
              : 'Try to say it a bit faster, and add one thing you left out.',
          ],
      do: [
        t('round.timer', p),
        t('round.silence'),
        first ? t('round.noteGood') : t('round.betweenRounds'),
      ],
      studentDoes: [t('round.studentDoes', p)],
      lookFor: first
        ? tl('round.lookForFirst')
        : [...tl('round.lookForLater'), final ? t('round.lookForFinal') : t('round.lookForMiddle')],
      help: [first ? t('round.helpFirst') : t('round.helpLater')],
      challenge: [final ? t('round.challengeFinal') : t('round.challenge', p)],
      doneWhen: t('round.doneWhen', p),
      next: final ? t('round.nextFinal') : t('round.next', p),
      studentKey: first ? 'student.fluencySprint' : 'student.fluencyAgain',
      studentParams: { seconds: String(seconds) },
    }
  })

  return [
    ...roundSteps,
    {
      id: stepId(ctx, 'feedback', rounds.seconds.length),
      activityId: '',
      move: 'feedback',
      minutes: 2,
      now: t('recap.now'),
      say: [
        'The last one was much smoother — you stopped less and said more.',
        'That is what fluent feels like. Same words, less searching.',
      ],
      do: tl('recap.do'),
      studentDoes: tl('recap.studentDoes'),
      lookFor: tl('recap.lookFor'),
      help: tl('recap.help'),
      challenge: tl('recap.challenge'),
      doneWhen: t('recap.doneWhen'),
      next: t('recap.next'),
      studentKey: 'student.fluencyRecap',
    },
  ]
}

/* ---- Generic activity: from whatever guidance the content supplies -------- */

function genericSteps(activity: LessonActivity, ctx: MicroStepContext, profile: PacingProfile): MicroStep[] {
  const lang = ctx.lang
  const { autopilot: a, card } = activityGuidance(activity, {
    lang,
    student: ctx.student,
    level: ctx.level,
  })
  const g = resolveGuidance(activity, a, card, lang)
  const t = (k: string) => translate(lang, `guide.step.generic.${k}`)
  const tl = (k: string) => translateList(lang, `guide.step.generic.${k}`)
  const followUps = followUpQuestions(activity)
  const isTalk = activity.kind === 'communication' || activity.kind === 'warmup'
  const move: TeachingMove = (() => {
    // A warm-up is free talk with no accuracy pressure — the same move as any
    // other real-use block. Falling through to the default labelled the first
    // card of every lesson "Guided practice", directly under a header that
    // said "Warm-up".
    if (activity.kind === 'communication' || activity.kind === 'warmup') return 'realUse'
    // The opening speaking block is free talk on a real topic once it carries
    // one — labelling it "Guided practice" told the tutor to correct through
    // the one part of the lesson that exists to get the learner talking.
    if (activity.kind === 'speakingListening' && followUpQuestions(activity).length) return 'realUse'
    if (activity.kind === 'feedback') return 'feedback'
    if (activity.kind === 'listening') return 'meaning'
    if (activity.kind === 'vocabulary') {
      /* A vocabulary activity that carries an English target to say aloud is
         INTRODUCING words — labelling it "Recall" told the tutor to test a
         beginner on colour words they had never met. Without a target it is
         the end-of-lesson capture of words that came up, which really is
         retrieval. */
      return activity.speak ? 'model' : 'retrieval'
    }
    return 'guided'
  })()

  const base: MicroStep = {
    id: stepId(ctx, move, 0),
    activityId: '',
    move,
    minutes: stepMinutes(profile, isTalk ? 1.2 : 1),
    now: g.now,
    // SAY is optional wording, but an EMPTY say block is not a choice — it is
    // a tutor staring at a screen with nothing to open their mouth with. Fall
    // back to the student-facing prompt, which is always something sayable.
    say: a?.say?.length ? a.say : [activity.studentPrompt],
    do: a?.do?.length ? a.do : [activity.studentPrompt],
    studentDoes: g.studentDoes,
    lookFor: a?.lookFor ?? [],
    help: g.help,
    challenge: g.challenge,
    doneWhen: g.doneWhen,
    next: a?.next?.[0] ?? t('scoreAndMoveOn'),
    speak: activity.speak,
    studentKey: activity.studentPromptKey ?? STUDENT_KEY_BY_KIND[activity.kind],
  }

  /* A beginner activity with an English target to model splits into two moves:
     hear it, then produce it. One undivided block was pedagogically wrong as
     well as long — it let a tutor demand production in the same breath as the
     first exposure, which is exactly what makes a beginner stop trying. */
  if (activity.speak && (move === 'model' || activity.kind === 'speakingListening')) {
    return [
      { ...base, move: 'model', minutes: stepMinutes(profile, 0.6), next: t('handOver') },
      {
        id: stepId(ctx, 'guided', 1),
        activityId: '',
        move: 'guided',
        minutes: stepMinutes(profile, 0.8),
        now: t('turn.now'),
        say: ['Now you.', 'One more time — a little louder.'],
        do: tl('turn.do'),
        studentDoes: tl('turn.studentDoes'),
        lookFor: tl('turn.lookFor'),
        help: g.help,
        challenge: g.challenge,
        doneWhen: t('turn.doneWhen'),
        next: t('scoreAndMoveOn'),
        speak: activity.speak,
        studentKey: 'student.yourTurnPractice',
      },
    ]
  }

  // A long talking block for an adult splits into "get going" and "go deeper"
  // so the tutor has a second move ready when the first runs dry. The opening
  // speaking block carries a real task too, so it splits on the same rule.
  if (
    (activity.kind === 'communication' || (activity.kind === 'speakingListening' && followUps.length)) &&
    profile.allowsSustainedConversation
  ) {
    return [
      base,
      {
        id: stepId(ctx, 'realUse', 1),
        activityId: '',
        move: 'realUse',
        minutes: stepMinutes(profile, 1.2),
        now: t('deeper.now'),
        /* English questions the tutor asks, not the localized NEXT lines —
           feeding decision text ("Talking easily → …") into SAY put the app's
           own branching logic into the tutor's mouth. */
        say: followUps.length ? followUps : ['Why do you think that is?', 'Can you give me an example?'],
        do: tl('deeper.do'),
        studentDoes: tl('deeper.studentDoes'),
        lookFor: tl('deeper.lookFor'),
        help: tl('deeper.help'),
        challenge: tl('deeper.challenge'),
        doneWhen: t('deeper.doneWhen'),
        next: t('deeper.next'),
        studentKey: 'student.keepTalking',
      },
    ]
  }

  return [base]
}

const STUDENT_KEY_BY_KIND: Record<LessonPhaseKind, string> = {
  warmup: 'student.warmUpTalk',
  speakingListening: 'student.answerOutLoud',
  listening: 'student.listenAndShow',
  reading: 'student.readThis',
  writing: 'student.writeThis',
  microLesson: 'student.watchAndListen',
  guidedPractice: 'student.yourTurnPractice',
  communication: 'student.talkAboutYou',
  fluency: 'student.fluencySprint',
  pronunciation: 'student.repeatAfterMe',
  vocabulary: 'student.newWords',
  feedback: 'student.listenToFeedback',
}

/* -------------------------------------------------------------------------- */
/* Public entry point                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Break one lesson activity into micro-steps. Pure and deterministic: the same
 * activity and student always produce the same steps, so this is testable and
 * so a tutor who navigates away and back does not get a different lesson.
 */
export function buildMicroSteps(activity: LessonActivity, ctx: MicroStepContext): MicroStep[] {
  const profile = pacingFor(ctx.student.age)
  const tag = (steps: MicroStep[]) => steps.map((s) => ({ ...s, activityId: activity.id }))

  // A grammar or pronunciation focus gets the full teaching sequence. The
  // micro-lesson phase carries Meaning -> Model -> Notice; the guided-practice
  // phase that follows carries Guided -> Real use -> Feedback, so the two
  // phases together are one coherent sequence rather than two overlapping ones.
  if (activity.ref && (activity.kind === 'microLesson' || activity.kind === 'guidedPractice')) {
    const steps = grammarSteps(activity.ref, ctx, profile)
    if (steps.length) return tag(activity.kind === 'guidedPractice' ? steps.slice(3) : steps.slice(0, 3))
  }
  if (activity.kind === 'fluency') return tag(fluencySteps(activity, ctx))
  if (activity.ref && activity.kind === 'pronunciation') {
    const steps = pronunciationSteps(activity.ref, ctx, profile)
    if (steps.length) return tag(steps)
  }
  return tag(genericSteps(activity, ctx, profile))
}

/** Steps for a whole phase, in order. */
export function buildPhaseMicroSteps(
  activities: LessonActivity[],
  ctx: Omit<MicroStepContext, 'activityIndex'>,
): MicroStep[] {
  return activities.flatMap((activity, activityIndex) =>
    buildMicroSteps(activity, { ...ctx, activityIndex }),
  )
}

/** A retrieval step built from what this learner is genuinely due to review.
 *  Returns null rather than inventing content when nothing is due — a fake
 *  review step teaches nothing and wastes three minutes. */
export function buildRetrievalStep(
  ctx: MicroStepContext,
  activityId: string,
  now = Date.now(),
): MicroStep | null {
  const material = retrievalMaterial(ctx.model, now)
  const items = [...material.vocabulary, ...material.skills]
  if (items.length === 0) return null
  const profile = pacingFor(ctx.student.age)
  const lang = ctx.lang
  const t = (k: string, p?: Record<string, string | number>) =>
    translate(lang, `guide.step.retrieval.${k}`, p)
  const tl = (k: string) => translateList(lang, 'guide.step.retrieval.' + k)
  return {
    id: stepId(ctx, 'retrieval', 0),
    activityId,
    move: 'retrieval',
    minutes: stepMinutes(profile, 0.6),
    now: t('now'),
    /* Cue from MEANING wherever the tutor captured one: asking "what's the
       English for a strong opinion you can't shift?" makes the learner
       produce the word, where showing them "stubborn" only makes them
       recognise it. Words saved without a meaning fall back to "use it in a
       sentence", which is still production. The cue is spoken to the learner,
       so it is built in the language they are being taught in. */
    say: [
      ...material.fromMeaning
        .slice(0, 3)
        .map((v) => translate(lang, 'guide.step.retrieval.cueMeaning', { meaning: v.meaning })),
      ...items
        .filter((item) => !material.fromMeaning.some((v) => v.term === item))
        .slice(0, 4 - Math.min(3, material.fromMeaning.length))
        .map((item) => translate(lang, 'guide.step.retrieval.cueTerm', { term: item })),
    ],
    do: tl('do'),
    studentDoes: tl('studentDoes'),
    lookFor: [
      t('lookForRecall'),
      material.errors.length ? t('lookForErrors', { errors: material.errors.join('; ') }) : t('lookForSlips'),
    ],
    help: tl('help'),
    challenge: tl('challenge'),
    doneWhen: t('doneWhen'),
    next: t('next'),
    studentKey: 'student.rememberThese',
    studentParams: { items: items.slice(0, 4).join(', ') },
  }
}

/**
 * The learner's own recurring slips, as production practice.
 *
 * Corrections were already stored, counted across lessons and handed back as
 * homework — but inside the lesson they only ever appeared as a line telling
 * the tutor what to LISTEN for. Nothing ever asked the learner to say the
 * right version out loud, which is the one thing that actually shifts a
 * fossilized error like "I am agree".
 *
 * This is deliberately a drill and not a grammar lesson. An error the grammar
 * library can teach becomes the lesson objective through the normal route; an
 * error it cannot — and "I am agree" is one — is not a gap in the learner's
 * knowledge of a rule, it is a habit. Habits are fixed by retrieval and
 * production, not by explanation.
 *
 * Returns null rather than inventing content when the learner has no recurring
 * slips: a fix drill with nothing to fix wastes three minutes.
 */
export function buildFixStep(ctx: MicroStepContext, activityId: string): MicroStep | null {
  const pairs = recurringFixes(ctx.model)
  if (pairs.length === 0) return null
  const profile = pacingFor(ctx.student.age)
  const lang = ctx.lang
  const t = (k: string, p?: Record<string, string | number>) => translate(lang, `guide.step.fix.${k}`, p)
  const tl = (k: string) => translateList(lang, `guide.step.fix.${k}`)
  return {
    id: stepId(ctx, 'retrieval', 90),
    activityId,
    move: 'retrieval',
    minutes: stepMinutes(profile, 0.6),
    now: t('now'),
    /* The cue is spoken to the learner, so it is built in the language they
       are being taught in — but the two versions inside it are their own
       English, quoted back unchanged. */
    say: pairs.map((p) => t('cue', { said: p.said, better: p.better })),
    do: tl('do'),
    studentDoes: tl('studentDoes'),
    lookFor: pairs.map((p) => `${p.said} → ${p.better}`),
    help: tl('help'),
    challenge: tl('challenge'),
    doneWhen: t('doneWhen'),
    next: t('next'),
    studentKey: 'student.fixThese',
  }
}

/**
 * The slips worth drilling: unresolved, captured with a corrected version, and
 * seen more than once. A single slip is a slip; drilling it is an overreaction
 * that costs three minutes of a fifty-minute lesson.
 */
export function recurringFixes(
  model: LearningModel,
  max = 3,
): { said: string; better: string }[] {
  return model.recurringErrors
    .filter(
      (e) =>
        !e.resolved &&
        e.category !== 'greatExpression' &&
        e.occurrences >= 2 &&
        Boolean(e.example?.trim()),
    )
    .sort((a, b) => b.occurrences - a.occurrences || b.lastSeen - a.lastSeen)
    .slice(0, max)
    .map((e) => ({ said: e.description, better: e.example! }))
}

/** Is this step a conversation the clock must not interrupt? */
export function isConversationStep(step: MicroStep): boolean {
  return step.move === 'realUse'
}

/** The age stage the pacing derives from — re-exported so the UI does not need
 *  to know how it is computed. */
export function ageStageOf(student: StudentProfile): AgeStage {
  return ageStageFor(student.age)
}

export type { PronunciationArea }
