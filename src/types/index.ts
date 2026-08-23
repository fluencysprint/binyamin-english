/* ==========================================================================
   Core domain types for Binyamin English
   ========================================================================== */

/** CEFR levels used across the app. C2 is intentionally excluded as a required
 *  progression target — strong C1 becomes ongoing communication coaching. */
export const CEFR_LEVELS = ['preA1', 'A1', 'A2', 'B1', 'B2', 'C1'] as const
export type CEFR = (typeof CEFR_LEVELS)[number]

/** Skills tracked independently — a learner may differ per skill. */
export const SKILLS = [
  'listening',
  'speaking',
  'pronunciation',
  'vocabulary',
  'grammar',
  'reading',
  'writing',
] as const
export type Skill = (typeof SKILLS)[number]

/** Age bands drive presentation and pedagogy, not just cosmetics.
 *  Age 5 maps to '6-8' (the youngest, pre-reader-friendly presentation). */
export const AGE_BANDS = ['6-8', '9-12', '13-17', 'adult'] as const
export type AgeBand = (typeof AGE_BANDS)[number]

/* --------------------------------------------------------------------------
   English proficiency and English literacy are DIFFERENT things and are
   modeled independently. A fluent-Russian 65-year-old and a 5-year-old may
   both be Pre-A1, yet need completely different instruction.
   Each scale is ordinal (index = strength); 'unsure' is a branch, not a rung.
   -------------------------------------------------------------------------- */

/** How much spoken English the learner understands / can produce. */
export const ENGLISH_ORAL_LEVELS = [
  'none',
  'fewWords',
  'simplePhrases',
  'conversational',
  'confident',
  'fluent',
  'unsure',
] as const
export type EnglishOralLevel = (typeof ENGLISH_ORAL_LEVELS)[number]

/** Whether the learner can recognize/read English letters, words, sentences. */
export const ENGLISH_LITERACY_LEVELS = [
  'cannot',
  'fewWords',
  'simpleSentences',
  'comfortable',
  'fluent',
  'unsure',
] as const
export type EnglishLiteracyLevel = (typeof ENGLISH_LITERACY_LEVELS)[number]

/** Whether the learner reads their OWN language comfortably — decides whether
 *  written native-language scaffolding is even usable. */
export const NATIVE_LITERACY_LEVELS = ['no', 'some', 'yes'] as const
export type NativeLiteracyLevel = (typeof NATIVE_LITERACY_LEVELS)[number]

/** Public label stays "Pre-A1"; internally we subdivide it so beginner lessons
 *  have meaningful progression. P0 = from zero … P3 = A1-readiness. */
export const PRE_A1_STAGES = ['P0', 'P1', 'P2', 'P3'] as const
export type PreA1Stage = (typeof PRE_A1_STAGES)[number]

export const UI_LANGUAGES = ['en', 'he', 'ru', 'es', 'fr'] as const
export type UILanguage = (typeof UI_LANGUAGES)[number]

export type AppMode = 'tutor' | 'student' | 'together'

/** Goals a learner may pursue. */
export const GOALS = [
  'conversation',
  'pronunciation',
  'school',
  'work',
  'travel',
  'reading',
  'writing',
  'grammar',
  'vocabulary',
  'confidence',
  'interview',
  'exam',
  'other',
] as const
export type Goal = (typeof GOALS)[number]

/** Pronunciation focus areas (a major differentiator). */
export const PRONUNCIATION_AREAS = [
  'th',
  'r',
  'l',
  'vw',
  'vowels',
  'americanR',
  'finalConsonants',
  'consonantClusters',
  'wordStress',
  'sentenceStress',
  'rhythm',
  'reducedVowels',
  'linking',
  'intonation',
] as const
export type PronunciationArea = (typeof PRONUNCIATION_AREAS)[number]

export type PronunciationRating =
  | 'clear'
  | 'understandable'
  | 'needsPractice'
  | 'communicationProblem'

export const CORRECTION_CATEGORIES = [
  'grammar',
  'pronunciation',
  'vocabulary',
  'wordChoice',
  'wordOrder',
  'fluency',
  'greatExpression',
] as const
export type CorrectionCategory = (typeof CORRECTION_CATEGORIES)[number]

export type Priority = 'low' | 'medium' | 'high'

/* -------------------------------------------------------------------------- */
/* Skill estimates                                                            */
/* -------------------------------------------------------------------------- */

/** A single skill estimate. `confidence` grows with repeated evidence so we
 *  never declare mastery on one correct answer. */
export interface SkillEstimate {
  level: CEFR
  /**
   * The unrounded position on the CEFR scale that `level` is derived from.
   *
   * Kept alongside `level` because rounding to a discrete band after every
   * observation threw the movement away: four consecutive failures at B1 each
   * nudged the estimate to 2.5 and then rounded straight back to B1, so a
   * learner who could not do anything at their own level never came down.
   * Optional so estimates persisted before this existed still load.
   */
  levelScore?: number
  /** 0..1 — how sure we are about `level`. */
  confidence: number
  /** Count of scored observations feeding this estimate. */
  evidenceCount: number
  updatedAt: number
}

export type SkillEstimates = Record<Skill, SkillEstimate>

/* -------------------------------------------------------------------------- */
/* Student & learning model                                                   */
/* -------------------------------------------------------------------------- */

export interface StudentProfile {
  id: string
  createdAt: number
  updatedAt: number

  // Onboarding
  name: string
  age: number
  ageBand: AgeBand
  grade?: string
  nativeLanguage: string
  otherLanguages: string[]
  interfaceLanguage: UILanguage
  englishExperience?: string
  selfEstimatedLevel?: CEFR
  goals: Goal[]
  interests: string[]
  speakingConfidence: 1 | 2 | 3 | 4 | 5
  pronunciationImportance: 1 | 2 | 3 | 4 | 5

  /* -- Independent oral vs. literacy model (see the scales above). These are
     optional so existing records keep working; onboarding collects them with
     simple human questions. -- */
  englishListening?: EnglishOralLevel
  englishSpeaking?: EnglishOralLevel
  englishReading?: EnglishLiteracyLevel
  englishWriting?: EnglishLiteracyLevel
  nativeLanguageLiteracy?: NativeLiteracyLevel
  /** When true, instructions/meaning checks may lean on the interface language.
   *  Derived from the answers above (a beginner who can't read English yet). */
  needsNativeLanguageScaffolding?: boolean
  /** A parent/guardian answered onboarding on behalf of a young child. */
  respondedByParent?: boolean

  /** For minors — used on parent reports and booking. */
  parentName?: string
}

/** A recurring error the tutor keeps seeing. */
export interface RecurringError {
  id: string
  category: CorrectionCategory
  description: string
  example?: string
  occurrences: number
  firstSeen: number
  lastSeen: number
  resolved: boolean
}

export interface TrackedSkillItem {
  id: string
  /** Grammar concept id, pronunciation area, or free vocabulary term. */
  ref: string
  label: string
  /** How firmly established — updated by retrieval practice over time. */
  strength: 'emerging' | 'developing' | 'secure'
  evidenceCount: number
  lastPracticed: number
  /** Next spaced-review date (ms epoch). */
  reviewDue: number
}

export interface VocabularyItem {
  id: string
  term: string
  meaning?: string
  example?: string
  addedAt: number
  strength: 'emerging' | 'developing' | 'secure'
  reviewDue: number
  /** How many times the learner has been asked to RECALL this word (not how
   *  many times it was written down). Optional so words saved before spaced
   *  recall existed still load — absent means "never yet tested". */
  evidenceCount?: number
  /** When recall was last attempted, successfully or not. */
  lastReviewed?: number
}

/** A verdict on one word at the spaced-recall step. Deliberately binary: a
 *  tutor mid-lesson can decide "they got it / they didn't", and nothing more
 *  precise than that would be honest. */
export type VocabRecallOutcome = 'recalled' | 'missed'

export interface PronunciationFocus {
  area: PronunciationArea
  rating: PronunciationRating
  note?: string
  updatedAt: number
}

/** The persistent learning model — updated after every lesson. */
export interface LearningModel {
  studentId: string
  skillEstimates: SkillEstimates
  /** Internal Pre-A1 progression (P0…P3). Only meaningful while the overall
   *  level is Pre-A1; drives beginner lesson generation. */
  preA1Stage?: PreA1Stage
  recentlyLearned: TrackedSkillItem[]
  emerging: TrackedSkillItem[]
  recurringErrors: RecurringError[]
  pronunciationFoci: PronunciationFocus[]
  vocabulary: VocabularyItem[]
  topicsDiscussed: string[]
  confidenceNotes: string[]
  completedActivityIds: string[]
  /** Stable content-bank ids (warmups, conversation tasks, beginner activities)
   *  used in recent lessons, most-recent last, capped at RECENT_CONTENT_WINDOW.
   *  Lets generation avoid repeating the same prompt week after week. */
  recentContentIds: string[]
  tutorNotes: string[]
  /** Practice the learner did between lessons, most recent last, capped at
   *  PRACTICE_SESSION_WINDOW. Kept on the model rather than in a store of its
   *  own because it is exactly what the model is for — the accumulated record
   *  of one learner — and because it then rides along in every backup, every
   *  import and every deletion without a second code path.
   *  Optional so models written before between-lesson practice existed load. */
  practiceSessions?: PracticeSessionRecord[]
  updatedAt: number
}

/** How many practice sessions are kept. Six months of weekly lessons with a
 *  homework set and a review set each is comfortably inside this. */
export const PRACTICE_SESSION_WINDOW = 40

/* -------------------------------------------------------------------------- */
/* Assessment / adaptive engine                                               */
/* -------------------------------------------------------------------------- */

export type ScoreOutcome = 'correct' | 'partial' | 'needsWork'

export interface TutorCard {
  goal: string
  listenFor: string[]
  ifStruggle: string
  ifSucceed: string
  howToExplain: string
  model: string[]
  practice: string[]
  avoid: string[]
}

/**
 * The at-a-glance "autopilot" for a tutor with no teaching experience — the
 * answer to "what do I do right now?", readable in about two seconds.
 *
 * This is the MOST visible guidance during a lesson; the fuller TutorCard sits
 * beneath it as progressive disclosure.
 *
 * It is never stored on a lesson plan: src/lessons/guidance.ts rebuilds it from
 * the activity's content id every time it is rendered, in whatever language the
 * tutor is reading. `say` and the model/practice lines are the exception that
 * proves the rule — they are the English the LEARNER has to hear, so they are
 * identical in every locale.
 *
 * The five original fields are required because every piece of content already
 * supplies them. The four added ones (now / studentDoes / help / challenge /
 * doneWhen) are optional here, but never optional on screen: `resolveGuidance`
 * in src/lessons/microSteps.ts derives anything missing from the TutorCard and
 * the activity kind, so all nine sections are always shown.
 */
export interface TutorAutopilot {
  /** NOW — what activity is actually happening, in one line. */
  now?: string
  /** SAY — exact words the tutor can say, verbatim. Optional to use. */
  say: string[]
  /** DO — what the tutor physically does (point, gesture, show a picture). */
  do: string[]
  /** STUDENT DOES — what the learner should actually be doing right now. */
  studentDoes?: string[]
  /** LOOK FOR — observable evidence of understanding or performance. */
  lookFor: string[]
  /** HELP — what to do if they cannot do it. */
  help?: string[]
  /** CHALLENGE — what to do if it turns out to be too easy. */
  challenge?: string[]
  /** DONE WHEN — the criterion for moving on. */
  doneWhen?: string
  /** NEXT — the clear next decision (→ Easier / Continue / Harder). */
  next: string[]
  /** An optional short, situational teacher tip. */
  teacherTip?: string
}

export interface AssessmentItem {
  id: string
  ageBands: AgeBand[]
  cefr: CEFR
  skill: Skill
  /** 1..10 fine-grained difficulty inside a CEFR band. */
  difficulty: number
  prompt: string
  /** Beginner/non-reader items: an i18n key whose text is shown in the learner's
   *  interface language, so navigation never requires reading English. */
  instructionKey?: string
  /** English word/phrase to speak aloud (Speech Synthesis) — the TARGET being
   *  tested, spoken rather than shown as text the learner must read. */
  speak?: string
  /** How the item is presented. 'picture' = emoji/picture options (no English
   *  reading required). 'listen' = spoken prompt + picture options. */
  presentation?: 'text' | 'listen' | 'picture'
  /** What good performance looks like (tutor-facing). */
  expectedEvidence: string
  scoringCriteria: string
  tutorNotes?: string
  /** Optional multiple-choice options for auto-scorable public items. */
  options?: string[]
  /** Index into `options` for the correct answer (public auto-scored items). */
  answerIndex?: number
  easierItemIds?: string[]
  harderItemIds?: string[]
  followUpIds?: string[]
  tutorCard?: TutorCard
}

export interface ItemResponse {
  itemId: string
  skill: Skill
  cefr: CEFR
  difficulty: number
  outcome: ScoreOutcome
  at: number
}

/** How much the check actually saw of one skill. A skill with no items is
 *  'unassessed' — it is never reported as a beginner level by default. */
export type SkillEvidenceStatus = 'assessed' | 'limited' | 'unassessed'

export interface SkillEvidence {
  skill: Skill
  status: SkillEvidenceStatus
  /** Absent when the skill was not assessed at all. */
  level?: CEFR
  attempted: number
  correct: number
}

export type AssessmentConfidence = 'low' | 'moderate' | 'high'

export interface AssessmentSnapshot {
  overallCEFR: CEFR
  perSkill: Partial<Record<Skill, CEFR>>
  /** Per-skill evidence including skills the check could not measure. */
  skillEvidence?: SkillEvidence[]
  strongestSkill: Skill
  priorities: string[]
  /** i18n keys parallel to `priorities`, so the advice localizes. */
  priorityKeys?: string[]
  /** How many items the estimate rests on, and how much to trust it. */
  itemsAttempted?: number
  confidence?: AssessmentConfidence
  /** Performance reached the top of what this check can measure. */
  atCeiling?: boolean
  sampleCorrection?: { said: string; better: string; note?: string }
  /** The level the sample correction illustrates. It follows the learner's top
   *  focus area, which is not always the headline level — so the localized
   *  note must be looked up by THIS, not by overallCEFR. */
  sampleCorrectionLevel?: CEFR
  /** Set when the overall level is Pre-A1, so the result can be specific and
   *  supportive ("starting from foundations") rather than a bare "Beginner". */
  preA1Stage?: PreA1Stage
  /** True when the check ended early because zero-English evidence was strong —
   *  the result should be encouraging, not a list of failures. */
  foundational?: boolean
}

/* -------------------------------------------------------------------------- */
/* Corrections & audio                                                        */
/* -------------------------------------------------------------------------- */

export interface Correction {
  id: string
  studentId: string
  lessonId?: string
  category: CorrectionCategory
  said: string
  better: string
  explanation?: string
  priority: Priority
  at: number
  /** Whether the student successfully retried. */
  retried?: boolean
}

export type AudioRole = 'baseline' | 'practice' | 'improved'

/** Metadata for an audio recording. The Blob itself lives in its own store. */
export interface AudioRecordingMeta {
  id: string
  studentId: string
  lessonId?: string
  date: number
  target: string
  area: PronunciationArea
  rating?: PronunciationRating
  note?: string
  role: AudioRole
  mimeType: string
  durationMs?: number
}

/** Audio is stored as an ArrayBuffer + mime type (not a Blob) so it round-trips
 *  through structured clone identically in every environment. */
export interface AudioBlobRecord {
  id: string
  data: ArrayBuffer
  type: string
}

/* -------------------------------------------------------------------------- */
/* Lessons                                                                     */
/* -------------------------------------------------------------------------- */

export type LessonPhaseKind =
  | 'warmup'
  | 'speakingListening'
  /** Receptive listening only — no production expected. A true beginner
   *  understands long before they can speak, and a phase that demands speech
   *  too early reads to the learner as failure. */
  | 'listening'
  | 'reading'
  | 'writing'
  | 'microLesson'
  | 'guidedPractice'
  | 'communication'
  /** Repeated timed speaking — the same content, told again with less time
   *  each round. Fluency, not accuracy; nothing new is taught here. */
  | 'fluency'
  | 'pronunciation'
  | 'vocabulary'
  | 'feedback'

/**
 * Where an activity's TUTOR guidance comes from.
 *
 * The guidance itself is never stored on the plan: it is rebuilt from this
 * descriptor at render time, in whatever language the tutor is currently
 * reading. That is what lets a lesson generated in English three weeks ago
 * appear in Hebrew today without regenerating it, and what stops a plan from
 * quietly carrying the locale it happened to be created in.
 *
 * `params` carries only English target content (the prompt, the follow-up
 * questions, a topic) and plain data — never instructional prose.
 */
export interface ActivityGuide {
  src: GuideSource
  /** Content-bank id: grammar concept, pronunciation area, warm-up, task… */
  id?: string
  params?: Record<string, string | number>
}

export type GuideSource =
  | 'grammar'
  | 'pronunciation'
  /** A habit of this learner's own, with no entry in any content bank. The
   *  params carry the two sentences the whole activity is built from. */
  | 'pattern'
  | 'warmup'
  | 'speaking'
  | 'reading'
  | 'writing'
  | 'communication'
  | 'fluency'
  | 'vocabulary'
  | 'feedback'
  | 'beginner'
  | 'beginnerRecap'
  | 'c1Review'
  | 'c1Communication'
  | 'c1Feedback'
  | 'c1Consolidation'

export interface LessonActivity {
  id: string
  kind: LessonPhaseKind
  /** English title. Kept for records written before `titleKey` existed. */
  title: string
  /** i18n key for the title, so the tutor reads it in their own language. */
  titleKey?: string
  titleParams?: Record<string, string | number>
  /** How to rebuild this activity's tutor guidance in the current language. */
  guide?: ActivityGuide
  /** Student-facing instruction/prompt. */
  studentPrompt: string
  /** The actual text to read, when studentPrompt refers to a passage. */
  passage?: string
  /** i18n key for a native-language version of studentPrompt, shown to a learner
   *  who cannot yet read English (falls back to studentPrompt). */
  studentPromptKey?: string
  /** English word/phrase to model aloud via Speech Synthesis (beginner items). */
  speak?: string
  /** The prominent at-a-glance tutor guidance (SAY / DO / LOOK FOR / NEXT). */
  autopilot?: TutorAutopilot
  tutorCard?: TutorCard
  /** Optional structured items (e.g. from the assessment bank). */
  itemIds?: string[]
  /** Related grammar concept or pronunciation area. */
  ref?: string
  optional?: boolean
}

export interface LessonPhase {
  kind: LessonPhaseKind
  title: string
  /** i18n key for the phase title (falls back to `title` for old records). */
  titleKey?: string
  titleParams?: Record<string, string | number>
  startMin: number
  endMin: number
  activities: LessonActivity[]
}

/** What a lesson is FOR. `titleKey` / `rationaleKey` localize it; the plain
 *  strings stay for plans saved before they existed. */
export interface LessonObjective {
  ref: string
  title: string
  rationale: string
  titleKey?: string
  titleParams?: Record<string, string | number>
  rationaleKey?: string
  rationaleParams?: Record<string, string | number>
}

export interface LessonPlan {
  id: string
  studentId: string
  createdAt: number
  /** Human label, e.g. "First lesson" or "Lesson 4". */
  label: string
  /** The single high-value teaching target for this lesson. */
  objective: LessonObjective
  phases: LessonPhase[]
  /** Total planned minutes (50 by default; ~50 for C1 coaching too). */
  totalMinutes: number
  /** Where this plan came from. */
  source: 'firstLesson' | 'generated' | 'manual'
}

export type LessonStatus = 'planned' | 'inProgress' | 'completed' | 'abandoned'

/** A lesson record — the plan plus what actually happened. */
export interface LessonRecord {
  id: string
  studentId: string
  plan: LessonPlan
  status: LessonStatus
  startedAt?: number
  completedAt?: number
  /** Index of the active phase, for refresh recovery. */
  currentPhaseIndex: number
  /** Index of the active micro-step within that phase. Optional so lesson
   *  records written before micro-steps existed still load. */
  currentStepIndex?: number
  elapsedSeconds: number
  responses: ItemResponse[]
  correctionIds: string[]
  audioIds: string[]
  vocabularyAdded: string[]
  /** Meaning notes for the captured words, keyed by term. Optional so lesson
   *  records written before meanings were captured still load — and so a tutor
   *  who is mid-conversation can save a word without one. A meaning is what
   *  lets a later recall step cue FROM meaning ("what's the English for…?")
   *  instead of showing the word it is asking the learner to remember. */
  vocabularyMeanings?: Record<string, string>
  /** Recall verdicts from the spaced-review step, keyed by term. This is the
   *  only place the app learns whether a word actually stuck, so it is what
   *  moves a word's strength and its next review date. Optional so lessons
   *  recorded before recall capture existed still load. */
  vocabularyReview?: Record<string, VocabRecallOutcome>
  /** Objective outcome after teaching. */
  objectiveOutcome?: ScoreOutcome
  /**
   * Whether the homework THIS lesson set was actually done, recorded at the
   * start of the following lesson.
   *
   * Deliberately one verdict for the whole set rather than one per task: a
   * tutor asks "did you do it?" once and gets one answer, and inventing a
   * per-task grade from that would be precision the app never had. Optional
   * so lessons recorded before homework was checked still load — absent means
   * "never asked", which is not the same as "not done".
   */
  homeworkReview?: HomeworkReview
  tutorNotes?: string
  report?: LessonReport
}

/* -------------------------------------------------------------------------- */
/* Reports                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * One small task the student takes away. Structured rather than pre-rendered
 * English so the student reads it in their own language while the English
 * being practised stays English. Built in src/lessons/homework.ts from what
 * actually happened in the lesson.
 */
export type HomeworkTask =
  /** Say the corrected version of their own sentences out loud. */
  | { kind: 'sayCorrected'; items: { said: string; better: string }[] }
  /** Beginners and young children: say the new words, no writing. */
  | { kind: 'sayWordsAloud'; terms: string[] }
  /** Everyone else: use each new word in a sentence of their own. */
  | { kind: 'useWordsInSentences'; terms: string[] }
  /** Repeat today's fluency sprint at home — same topic, same shrinking clock. */
  | { kind: 'repeatFluency'; topic: string; seconds: number }
  /** Practise a sound with real words. */
  | { kind: 'practiceSound'; area: PronunciationArea; words: string[] }
  /** Write a few sentences using the target language. */
  | { kind: 'writeSentences'; count: number; target: string }
  /** Notice the target language in the wild — no production required. */
  | { kind: 'noticeLanguage'; target: string }
  /** Come to the next lesson with an answer ready. */
  | { kind: 'prepareAnswer'; question: string }

/** Whether the homework a lesson set actually came back. */
export type HomeworkReview = 'done' | 'partly' | 'notDone'

/* --------------------------------------------------------------------------
   Practice evidence — what the learner actually did, on their own.
   --------------------------------------------------------------------------
   A lesson already records what the tutor saw. Nothing recorded what happened
   between lessons, which is where the honest answer to "am I getting better?"
   has to come from: the same target, attempted again a week later, without a
   tutor in the room.

   The grain is deliberately coarse. Three outcomes, judged by the learner at
   the moment of retrieval — which is the pedagogy (a judgement of learning is
   part of retrieval practice), not instrumentation bolted onto it. Anything
   finer would be precision the app never had.
   -------------------------------------------------------------------------- */

/** How one attempt went. */
export type PracticeOutcome =
  /** Produced it from memory, unaided. The only outcome that claims mastery. */
  | 'independent'
  /** Produced it, but had to look at the answer first. Real, partial evidence. */
  | 'afterSupport'
  /** Could not produce it. */
  | 'incorrect'

/** What an attempt was ABOUT, so evidence can be grouped across sessions. */
export type PracticeTargetKind =
  | 'correction'
  | 'vocabulary'
  | 'pronunciation'
  | 'grammar'
  | 'speaking'

export interface PracticeItemResult {
  /** Stable id of the item within its set — lets a set be resumed exactly. */
  itemId: string
  targetKind: PracticeTargetKind
  /** Stable grouping key: an issue key, a normalized term, a sound, a
   *  concept id. The same underlying target keeps the same key forever. */
  targetKey: string
  /** The English being practised, for evidence the learner can read back. */
  label: string
  outcome: PracticeOutcome
  at: number
  /** What the learner typed, for the tasks that ask for written production.
   *  Local like everything else; it is the one thing a tutor can look at and
   *  say "you wrote this" at the next lesson. */
  response?: string
}

/** One run through a practice set, on the learner's own device. */
export interface PracticeSessionRecord {
  id: string
  studentId: string
  /** `homework` is the set a lesson produced; `review` is a spaced-recall set
   *  built from what is due when there is no homework outstanding. */
  source: 'homework' | 'review'
  /** The lesson that SET the homework. Absent for a review set. */
  lessonId?: string
  startedAt: number
  updatedAt: number
  /** Set when every item has a result. A session without it is a partial run
   *  the learner can come back to — never a failure to be punished for. */
  completedAt?: number
  /** How many items the set held when it was built, so a partial run has an
   *  honest denominator. */
  itemCount: number
  results: PracticeItemResult[]
}

/** A "went well" bullet, resolved to localized text at render time (see
 *  ReportView.tsx) instead of being pre-rendered into English. */
export type WentWellItem =
  | {
      kind: 'objectiveOutcome'
      outcome: 'correct' | 'partial'
      title: string
      titleKey?: string
      titleParams?: Record<string, string | number>
    }
  | { kind: 'greatExpression'; said: string }
  | { kind: 'selfCorrected'; count: number }
  | { kind: 'engaged' }
  | { kind: 'strongestArea'; goal: string }

export type ImprovementItem =
  | {
      kind: 'appliedCorrectly'
      title: string
      titleKey?: string
      titleParams?: Record<string, string | number>
    }
  | { kind: 'practicedIndependently' }
  | { kind: 'fixedAfterModeling'; said: string; better: string }

/**
 * One line of "today we worked on…", kept as a reference rather than a
 * sentence so a report written in one language still reads in another.
 * `title` is the English it was generated with, for reports saved before the
 * keys existed.
 */
export interface ReportTopic {
  title: string
  titleKey?: string
  titleParams?: Record<string, string | number>
  /** The task itself — English the learner actually worked with. */
  prompt?: string
}

export interface LessonReport {
  lessonId: string
  studentId: string
  generatedAt: number
  workedOn: string[]
  /** The same list, localizable. Optional so older reports still render. */
  workedOnItems?: ReportTopic[]
  wentWell: WentWellItem[]
  corrections: { said: string; better: string }[]
  vocabulary: string[]
  pronunciation: { area: PronunciationArea; rating: PronunciationRating; note?: string }[]
  nextFocusTitle: string
  /** The content id behind `nextFocusTitle`, when there is one, so the focus
   *  is named in the reader's language rather than the writer's. */
  nextFocusRef?: string
  /** Which previously-taught words were asked for and how it went. Present
   *  only when the lesson actually ran a recall step. */
  reviewed?: { recalled: string[]; missed: string[] }
  /** 1–3 small tasks built from what actually happened (see lessons/homework).
   *  Optional so reports generated before homework existed still render. */
  homework?: HomeworkTask[]
  /** Parent-facing section for minors. */
  parent?: {
    approxLevel: CEFR
    strengths: WentWellItem[]
    priorities: string[]
    practiced: string[]
    practicedItems?: ReportTopic[]
    improvement: ImprovementItem[]
    nextFocusTitle: string
    nextFocusRef?: string
  }
}

/* -------------------------------------------------------------------------- */
/* Booking / contact                                                          */
/* -------------------------------------------------------------------------- */

/**
 * A first-contact enquiry.
 *
 * Deliberately short. Everything a fourteen-field form used to ask —
 * parent name, first language, preferred days, times, frequency, how to
 * reach you — is a question that answers itself in the reply email, and
 * every one of them was a chance to abandon the page before making contact.
 * What is left is the minimum needed to write back usefully.
 */
export interface BookingInquiry {
  name: string
  email: string
  /** Child / Teen / Adult, already localized. Free of an exact birthday. */
  ageGroup: string
  goals: string[]
  message?: string
  /** Detected, never asked — it only has to be right enough to offer times. */
  timezone: string
  /** Carried silently from a completed self-check, if there is one. */
  approxLevel?: string
  assessmentSummary?: string
}

/** The goals offered on the public booking form — a deliberately short list.
 *  The full GOALS set stays available to the tutor during onboarding. */
export const BOOKING_GOALS = [
  'conversation',
  'pronunciation',
  'confidence',
  'school',
  'work',
  'travel',
  'exam',
] as const satisfies readonly Goal[]
