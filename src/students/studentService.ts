/* ==========================================================================
   Service layer — bridges the pure domain logic to IndexedDB persistence.
   Pages/hooks call these; the domain modules stay free of storage concerns.
   ========================================================================== */

import {
  AssessmentSnapshot,
  CEFR,
  Correction,
  HomeworkReview,
  LearningModel,
  LessonPlan,
  LessonRecord,
  Skill,
  StudentProfile,
} from '../types'
import { uid } from '../utils/id'
import { SKILLS } from '../types'
import { cefrIndex, makeEstimate } from '../utils/cefr'
import {
  getAllStudents,
  getCorrectionsForStudent,
  getLearningModel,
  getLesson,
  getLessonsForStudent,
  getStudent,
  putCorrection,
  putLearningModel,
  putLesson,
  putStudent,
} from '../data/db'
import { initLearningModel } from './learningModel'
import { buildProgress, ProgressSnapshot } from './progress'
import { buildBriefing, LessonBriefing } from '../lessons/briefing'
import { generateFirstLesson, generateLesson } from '../lessons/lessonGenerator'
import { applyCompletedLesson } from '../lessons/lessonCompletion'
import {
  deriveInitialStage,
  literacyToCefr,
  needsNativeScaffolding,
  oralStrength,
  oralToCefr,
} from './beginnerModel'

/**
 * Choose the starting CEFR, in strict priority order:
 *
 *  1. A placement snapshot from an assessment run during THIS onboarding —
 *     real per-item evidence, the strongest signal we can have.
 *  2. An explicit triage choice ("just starting out" → Pre-A1, "already
 *     fluent" → C1). A deliberate human declaration beats a coarse heuristic.
 *  3. The oral self-report, but only to pin a genuine beginner: someone who
 *     tells us they have little or no spoken English starts at Pre-A1.
 *  4. The self-estimated CEFR level, else A1.
 *
 * Note the snapshot must be passed in explicitly by the caller. It is never
 * read from global storage here — a leftover public self-check result from
 * some other visitor must not decide this student's level.
 */
function inferStartLevel(input: NewStudentInput): CEFR {
  if (input.snapshot?.overallCEFR) return input.snapshot.overallCEFR
  if (input.startLevelOverride) return input.startLevelOverride
  const oral = Math.max(oralStrength(input.englishListening), oralStrength(input.englishSpeaking))
  if ((input.englishListening || input.englishSpeaking) && oral <= 1 && !input.selfEstimatedLevel) {
    return 'preA1'
  }
  return input.selfEstimatedLevel ?? 'A1'
}

export interface NewStudentInput extends Omit<StudentProfile, 'id' | 'createdAt' | 'updatedAt'> {
  /** Placement result from an assessment run during THIS onboarding session.
   *  Never sourced from localStorage — see inferStartLevel. */
  snapshot?: AssessmentSnapshot | null
  /** Explicit onboarding-triage override ('preA1' for a true beginner, 'C1'
   *  for an already-fluent learner). Outranks the self-report chips. */
  startLevelOverride?: CEFR
}

export async function createStudent(input: NewStudentInput): Promise<StudentProfile> {
  const now = Date.now()
  // Onboarding-only signals; they seed the model but are not part of the profile.
  const { snapshot: _snapshot, startLevelOverride: _override, ...profileInput } = input
  const student: StudentProfile = {
    ...profileInput,
    // Derive native-language scaffolding from the reading answer if not set.
    needsNativeLanguageScaffolding:
      input.needsNativeLanguageScaffolding ?? needsNativeScaffolding(input.englishReading),
    id: uid('stu'),
    createdAt: now,
    updatedAt: now,
  }
  await putStudent(student)

  // Seed the learning model. Oral vs. literacy answers can pin a true beginner
  // at Pre-A1 even without an assessment snapshot.
  const start: CEFR = inferStartLevel(input)
  let model = initLearningModel(student.id, start, now)
  if (input.snapshot) {
    const est = { ...model.skillEstimates }
    for (const skill of SKILLS) {
      const lvl = input.snapshot.perSkill[skill]
      if (lvl) est[skill] = makeEstimate(lvl, 0.3, 1, now)
    }
    model = { ...model, skillEstimates: est }
  } else if (input.englishListening || input.englishSpeaking || input.englishReading) {
    // No assessment yet, but the learner told us about their English. Seed oral
    // and literacy skills INDEPENDENTLY so a strong-speaker/weak-reader (or the
    // reverse) is modeled honestly from lesson one.
    //
    // These chips are a coarse, supplementary signal. When the tutor has also
    // made an explicit declaration (a triage choice or a self-estimated CEFR),
    // a chip may refine a skill upward but must never drag it below the
    // declared level — that is how a fluent C1 adult used to end up seeded at
    // A2 and routed into the Pre-A1 beginner pathway.
    const declared = Boolean(input.startLevelOverride || input.selfEstimatedLevel)
    const est = { ...model.skillEstimates }
    const apply = (skill: Skill, candidate: CEFR) => {
      if (declared && cefrIndex(candidate) < cefrIndex(start)) return
      est[skill] = makeEstimate(candidate, 0.25, 1, now)
    }
    if (input.englishListening) apply('listening', oralToCefr(input.englishListening))
    if (input.englishSpeaking) {
      const spk = oralToCefr(input.englishSpeaking)
      apply('speaking', spk)
      apply('pronunciation', spk)
      apply('vocabulary', spk)
      apply('grammar', spk)
    }
    if (input.englishReading) {
      const lit = literacyToCefr(input.englishReading)
      apply('reading', lit)
      apply('writing', lit)
    }
    model = { ...model, skillEstimates: est }
  }
  // Set the internal Pre-A1 stage so the first lesson is stage-appropriate.
  if (start === 'preA1') {
    model = {
      ...model,
      preA1Stage:
        input.snapshot?.preA1Stage ??
        deriveInitialStage({
          englishListening: input.englishListening,
          englishSpeaking: input.englishSpeaking,
          englishReading: input.englishReading,
        }),
    }
  }
  await putLearningModel(model)
  return student
}

export async function listStudents(): Promise<StudentProfile[]> {
  const students = await getAllStudents()
  return students.sort((a, b) => b.updatedAt - a.updatedAt)
}

export interface StudentBundle {
  student: StudentProfile
  model: LearningModel
  lessons: LessonRecord[]
  corrections: Correction[]
  /** The longitudinal picture, derived once here so every surface that shows
   *  progress — dashboard, briefing, next-lesson preview — agrees. */
  progress: ProgressSnapshot
}

export async function loadStudentBundle(id: string): Promise<StudentBundle | null> {
  const student = await getStudent(id)
  if (!student) return null
  const model = (await getLearningModel(id)) ?? initLearningModel(id)
  const lessons = await getLessonsForStudent(id)
  const corrections = await getCorrectionsForStudent(id)
  const progress = buildProgress({ student, model, lessons, corrections })
  return { student, model, lessons, corrections, progress }
}

/** The pre-lesson briefing for a student, straight from storage. */
export async function loadBriefing(id: string): Promise<LessonBriefing | null> {
  const bundle = await loadStudentBundle(id)
  if (!bundle) return null
  const plan = previewNextLesson(bundle.student, bundle.model, bundle.lessons, bundle.progress)
  return buildBriefing(bundle, Date.now(), plan)
}

/** Create + persist a new lesson record (planned) and return it. */
export async function createLesson(
  student: StudentProfile,
  model: LearningModel,
  lessons: LessonRecord[],
  progress?: ProgressSnapshot,
): Promise<LessonRecord> {
  const completed = lessons.filter((l) => l.status === 'completed')
  let plan: LessonPlan
  if (completed.length === 0) {
    plan = generateFirstLesson(student, model)
  } else {
    const previousObjectiveRefs = completed.map((l) => l.plan.objective.ref)
    plan = generateLesson(student, model, {
      label: `Lesson ${completed.length + 1}`,
      previousObjectiveRefs,
      seed: completed.length * 13 + student.name.length,
      progress,
    })
  }
  const record: LessonRecord = {
    id: plan.id,
    studentId: student.id,
    plan,
    status: 'planned',
    currentPhaseIndex: 0,
    elapsedSeconds: 0,
    responses: [],
    correctionIds: [],
    audioIds: [],
    vocabularyAdded: [],
  }
  await putLesson(record)
  return record
}

/** Preview the next lesson plan without persisting a record (for the dashboard). */
export function previewNextLesson(
  student: StudentProfile,
  model: LearningModel,
  lessons: LessonRecord[],
  progress?: ProgressSnapshot,
): LessonPlan {
  const completed = lessons.filter((l) => l.status === 'completed')
  if (completed.length === 0) return generateFirstLesson(student, model)
  return generateLesson(student, model, {
    label: `Lesson ${completed.length + 1}`,
    previousObjectiveRefs: completed.map((l) => l.plan.objective.ref),
    seed: completed.length * 13 + student.name.length,
    progress,
  })
}

export async function saveLessonProgress(lesson: LessonRecord): Promise<void> {
  await putLesson(lesson)
}

/**
 * Record whether a completed lesson's homework came back.
 *
 * It is stored on the lesson that SET the homework, not on the one being
 * taught now — that is the only place a verdict about "last week's tasks" is
 * unambiguous, and it means the next report can read it without knowing which
 * lesson happens to be running.
 */
export async function reviewHomework(lessonId: string, review: HomeworkReview): Promise<void> {
  const lesson = await getLesson(lessonId)
  if (!lesson) return
  await putLesson({ ...lesson, homeworkReview: review })
}

export async function saveCorrection(correction: Correction): Promise<void> {
  await putCorrection(correction)
}

/** Finalize a lesson: fold into the model, generate report, persist all. */
export async function completeLesson(
  lesson: LessonRecord,
  student: StudentProfile,
  model: LearningModel,
  corrections: Correction[],
): Promise<{ lesson: LessonRecord; model: LearningModel; progress: ProgressSnapshot }> {
  const now = Date.now()
  // The rest of this student's history, so the report's "next focus" is the
  // longitudinal answer rather than today's loudest mistake.
  const priorLessons = (await getLessonsForStudent(student.id)).filter((l) => l.id !== lesson.id)
  const { model: updatedModel, report, progress } = applyCompletedLesson(
    model,
    lesson,
    student,
    corrections,
    now,
    priorLessons,
  )
  const finalized: LessonRecord = {
    ...lesson,
    status: 'completed',
    completedAt: now,
    report,
  }
  await putLesson(finalized)
  await putLearningModel(updatedModel)
  await putStudent({ ...student, updatedAt: now })
  return { lesson: finalized, model: updatedModel, progress }
}
