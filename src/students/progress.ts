/* ==========================================================================
   Longitudinal progress — what the tutor and the student have accumulated.
   --------------------------------------------------------------------------
   Everything here is DERIVED, deterministic and explainable. There is no
   score, no model, no hidden weighting: each conclusion is a count of lessons
   with a stated reason, so a tutor can always answer "why does it say that?".

   The one idea the whole module rests on:

       evidence is counted in LESSONS, not in occurrences.

   A learner who says "he don't" four times in one conversation has made one
   mistake, four times, on one day. A learner who says it once in three
   different lessons has a weakness. Counting raw occurrences cannot tell
   those apart — counting distinct lessons can, and that is the difference
   between "do not overreact to one mistake" and a system that panics.

   From that single measure the four statuses fall out:

     new        seen in one lesson so far — noted, not yet a weakness
     recurring  seen in >= 2 lessons, and recently — this is what to teach
     improving  was recurring, absent for the last 2 lessons
     mastered   absent for 3 lessons — stops influencing lesson planning

   Vocabulary and tracked skills use the spaced-review dates the learning
   model already maintains; nothing new is invented to hold them.
   ========================================================================== */

import {
  CorrectionCategory,
  Correction,
  Goal,
  LearningModel,
  LessonRecord,
  PronunciationArea,
  PronunciationRating,
  ScoreOutcome,
  StudentProfile,
  TrackedSkillItem,
} from '../types'
import { findGrammarByCorrection, findGrammarForError, getGrammarById } from '../data/grammarLibrary'
import { editSignature } from '../utils/editSignature'
import { findPronunciationForError, getPronunciationByArea } from '../data/pronunciationLibrary'

/* -------------------------------------------------------------------------- */
/* Thresholds — deliberately few, deliberately named, deliberately small       */
/* -------------------------------------------------------------------------- */

/** Distinct lessons an issue must appear in before it counts as a weakness. */
export const RECURRING_MIN_LESSONS = 2
/** Lessons of silence before a former weakness is called "improving". */
export const IMPROVING_AFTER_LESSONS = 2
/** Lessons of silence before an issue stops influencing lesson planning. */
export const MASTERED_AFTER_LESSONS = 3
/** How many completed lessons the history strip shows. */
export const HISTORY_WINDOW = 6
/** How far back an objective counts as "just taught" — kept in step with the
 *  generator's own look-back so both agree on what to suggest next. */
export const RECENT_OBJECTIVE_WINDOW = 4

const DAY = 24 * 60 * 60 * 1000

export type IssueStatus = 'new' | 'recurring' | 'improving' | 'mastered'

/** An i18n key plus its parameters — resolved to text by whichever surface
 *  renders it, so every explanation localizes instead of shipping English. */
export interface Explanation {
  key: string
  params?: Record<string, string | number>
}

export interface ProgressIssue {
  /** Stable grouping key — same underlying problem, same key, across lessons. */
  key: string
  category: CorrectionCategory
  /** What to work on, tutor-facing (a grammar concept where one matched). */
  label: string
  /** The learner's own wrong version, kept so the tutor recognizes it. */
  said?: string
  /** The corrected form. */
  better?: string
  status: IssueStatus
  /** Total corrections captured, across all lessons. */
  occurrences: number
  /** Distinct lessons it appeared in — the number that decides the status. */
  lessonsSeen: number
  /** Completed lessons since it was last heard. 0 = the last lesson. */
  lessonsSinceLastSeen: number
  firstSeen: number
  lastSeen: number
  /** Grammar concept id when the error maps to one — this is what a lesson
   *  can actually teach, as opposed to the sentence the learner said. */
  grammarRef?: string
  /** Pronunciation area when the error is a sound. */
  pronunciationRef?: PronunciationArea
  why: Explanation
}

export interface ProgressSkillItem {
  ref: string
  label: string
  strength: TrackedSkillItem['strength']
  lastPracticed: number
  /** Negative when overdue. */
  dueInDays: number
}

export interface VocabRecallItem {
  id: string
  term: string
  meaning?: string
  strength: 'emerging' | 'developing' | 'secure'
  /** Days past the review date; 0 when due exactly now. */
  overdueDays: number
}

export interface PronunciationTarget {
  area: PronunciationArea
  rating: PronunciationRating
  label: string
  status: IssueStatus
  updatedAt: number
}

export interface ProgressLessonSummary {
  id: string
  label: string
  completedAt: number
  objectiveTitle: string
  objectiveOutcome?: ScoreOutcome
  newWords: number
  corrections: number
}

export type FocusSource =
  | 'recurringIssue'
  | 'pronunciation'
  | 'spacedReview'
  | 'goal'
  | 'newMaterial'

export interface FocusCandidate {
  ref: string
  title: string
  kind: 'grammar' | 'pronunciation'
  source: FocusSource
  /** Localizable explanation for the UI. */
  why: Explanation
  /** English one-liner for the lesson plan's tutor-facing rationale. */
  rationale: string
}

export interface ProgressSnapshot {
  lessonCount: number
  lastLessonAt?: number
  /** Every grouped issue, most urgent first. */
  issues: ProgressIssue[]
  /** What to actually work on now. */
  needsWork: ProgressIssue[]
  improving: ProgressIssue[]
  mastered: ProgressIssue[]
  /** Skills that have held up across several practices. */
  secureSkills: ProgressSkillItem[]
  /** Skills in motion — practiced, not yet dependable. */
  developingSkills: ProgressSkillItem[]
  /** Words whose spaced-review date has arrived. */
  dueVocabulary: VocabRecallItem[]
  /** Words captured in the most recent lessons. */
  recentVocabulary: string[]
  /** Words that have survived repeated recall. */
  secureVocabulary: string[]
  pronunciationTargets: PronunciationTarget[]
  history: ProgressLessonSummary[]
  /** Ranked next-focus candidates. The lesson generator consumes this, and
   *  the dashboard shows the first one, so both always agree. */
  focus: FocusCandidate[]
}

/* -------------------------------------------------------------------------- */
/* Grouping                                                                    */
/* -------------------------------------------------------------------------- */

function normalize(text: string): string {
  return text
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}\s'’]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Categories where the underlying weakness is a STRUCTURE, so two different
 *  sentences with the same broken structure are the same issue. */
const STRUCTURAL: CorrectionCategory[] = ['grammar', 'wordOrder']

/**
 * The key that decides whether two corrections are the same weakness.
 *
 * Grammar and word order group by the concept the error belongs to, because
 * "she go to school" and "he don't like it" are both third-person -s and both
 * teachable as one thing; grouping them by their literal text would file every
 * sentence a learner ever said as its own separate, permanently-new issue.
 * Everything else groups by the normalized text, because a vocabulary or word-
 * choice slip really is about that specific word.
 */
export function issueKeyFor(c: Pick<Correction, 'category' | 'said' | 'better'>): {
  key: string
  grammarRef?: string
  pronunciationRef?: PronunciationArea
} {
  if (STRUCTURAL.includes(c.category)) {
    const concept =
      findGrammarByCorrection(c.said, c.better ?? '') ??
      findGrammarForError(`${c.said} ${c.better ?? ''}`)
    if (concept) return { key: `g:${concept.id}`, grammarRef: concept.id }
    /* No concept in the library teaches this. Group on the edit anyway, so a
       learner who keeps making the same correction is still seen to be making
       ONE mistake repeatedly rather than a new one every week. */
    const sig = editSignature(c.said, c.better ?? '')
    if (sig.length) return { key: `${c.category}#${sig.join('|')}` }
  }
  if (c.category === 'pronunciation') {
    const concept = findPronunciationForError(`${c.said} ${c.better ?? ''}`)
    if (concept) return { key: `p:${concept.area}`, pronunciationRef: concept.area }
  }
  return { key: `${c.category}:${normalize(c.said)}` }
}

export function statusFor(lessonsSeen: number, lessonsSinceLastSeen: number): IssueStatus {
  if (lessonsSinceLastSeen >= MASTERED_AFTER_LESSONS) return 'mastered'
  if (lessonsSeen >= RECURRING_MIN_LESSONS) {
    return lessonsSinceLastSeen >= IMPROVING_AFTER_LESSONS ? 'improving' : 'recurring'
  }
  return 'new'
}

function explain(status: IssueStatus, lessonsSeen: number, since: number): Explanation {
  switch (status) {
    case 'recurring':
      return { key: 'progress.whyRecurring', params: { lessons: lessonsSeen } }
    case 'improving':
      return { key: 'progress.whyImproving', params: { lessons: since } }
    case 'mastered':
      return { key: 'progress.whyMastered', params: { lessons: since } }
    default:
      return { key: 'progress.whyNew' }
  }
}

/** Rank for display and for lesson planning. Lower sorts first. */
function issueRank(i: ProgressIssue): number {
  const byStatus = { recurring: 0, new: 1000, improving: 2000, mastered: 3000 }[i.status]
  // Within a status: more lessons of evidence first, then more occurrences,
  // then more recent. All integers — no weights to tune, nothing opaque.
  return byStatus - i.lessonsSeen * 10 - Math.min(9, i.occurrences)
}

/* -------------------------------------------------------------------------- */
/* Snapshot                                                                    */
/* -------------------------------------------------------------------------- */

export interface ProgressInput {
  student: StudentProfile
  model: LearningModel
  lessons: LessonRecord[]
  corrections: Correction[]
  now?: number
}

export function buildProgress(input: ProgressInput): ProgressSnapshot {
  const now = input.now ?? Date.now()
  const { model, corrections, student } = input

  const completed = input.lessons
    .filter((l) => l.status === 'completed')
    .sort((a, b) => (a.completedAt ?? a.plan.createdAt) - (b.completedAt ?? b.plan.createdAt))
  const lastIndex = completed.length - 1
  const ordinalOf = new Map(completed.map((l, i) => [l.id, i]))

  /** Which completed lesson a correction belongs to.
   *  Records written before lessons carried ids — and corrections captured in
   *  a lesson that is still running — fall back to the timeline, so legacy
   *  data still produces honest counts rather than being silently dropped. */
  const lessonOrdinal = (c: Correction): number => {
    const direct = c.lessonId ? ordinalOf.get(c.lessonId) : undefined
    if (direct !== undefined) return direct
    // No usable id. Place it on the timeline instead: the last lesson that had
    // already finished when it was captured.
    let idx = -1
    completed.forEach((l, i) => {
      if ((l.completedAt ?? l.plan.createdAt) <= c.at) idx = i
    })
    if (idx < 0) return 0
    // Captured after that lesson ended AND tagged with a lesson we have no
    // completed record for: it belongs to the session still running, which is
    // an occasion of its own and must not be merged into the previous one.
    const startedLater = c.lessonId !== undefined && c.at > (completed[idx].completedAt ?? 0)
    return startedLater ? idx + 1 : idx
  }

  type Bucket = {
    key: string
    category: CorrectionCategory
    grammarRef?: string
    pronunciationRef?: PronunciationArea
    occurrences: number
    lessons: Set<number>
    firstSeen: number
    lastSeen: number
    said: string
    better: string
  }
  const buckets = new Map<string, Bucket>()

  for (const c of corrections) {
    if (c.category === 'greatExpression') continue
    const { key, grammarRef, pronunciationRef } = issueKeyFor(c)
    const ord = lessonOrdinal(c)
    const b = buckets.get(key)
    if (b) {
      b.occurrences += 1
      b.lessons.add(ord)
      b.firstSeen = Math.min(b.firstSeen, c.at)
      if (c.at >= b.lastSeen) {
        b.lastSeen = c.at
        b.said = c.said
        b.better = c.better
      }
    } else {
      buckets.set(key, {
        key,
        category: c.category,
        grammarRef,
        pronunciationRef,
        occurrences: 1,
        lessons: new Set([ord]),
        firstSeen: c.at,
        lastSeen: c.at,
        said: c.said,
        better: c.better,
      })
    }
  }

  /* Legacy safety: a student whose corrections were pruned (or who was
     imported from a backup that kept only the learning model) still has
     recurringErrors. Fold in anything that produced no bucket, using the
     occurrence count as the only evidence available — an issue recorded
     3 times but with no per-lesson trail is treated as seen in as many
     lessons, which is exactly what the old model meant by it. */
  for (const e of model.recurringErrors) {
    const { key, grammarRef } = issueKeyFor({ category: e.category, said: e.description, better: e.example ?? '' })
    if (buckets.has(key)) continue
    buckets.set(key, {
      key,
      category: e.category,
      grammarRef,
      occurrences: e.occurrences,
      lessons: new Set(
        Array.from({ length: Math.min(e.occurrences, Math.max(1, completed.length)) }, (_, i) =>
          Math.max(0, lastIndex - i),
        ),
      ),
      firstSeen: e.firstSeen,
      lastSeen: e.lastSeen,
      said: e.description,
      better: e.example ?? '',
    })
  }

  const issues: ProgressIssue[] = [...buckets.values()]
    .map((b) => {
      const lessonsSeen = b.lessons.size
      const maxOrd = Math.max(...b.lessons)
      const since = Math.max(0, lastIndex - maxOrd)
      const status = statusFor(lessonsSeen, since)
      const grammar = b.grammarRef ? getGrammarById(b.grammarRef) : undefined
      return {
        key: b.key,
        category: b.category,
        label: grammar?.title || b.better.trim() || b.said,
        said: b.said,
        better: b.better || undefined,
        status,
        occurrences: b.occurrences,
        lessonsSeen,
        lessonsSinceLastSeen: since,
        firstSeen: b.firstSeen,
        lastSeen: b.lastSeen,
        grammarRef: b.grammarRef,
        pronunciationRef: b.pronunciationRef,
        why: explain(status, lessonsSeen, since),
      } satisfies ProgressIssue
    })
    .sort((a, b) => issueRank(a) - issueRank(b) || b.lastSeen - a.lastSeen)

  const needsWork = issues.filter((i) => i.status === 'recurring')
  const improving = issues.filter((i) => i.status === 'improving')
  const mastered = issues.filter((i) => i.status === 'mastered')

  const toSkillItem = (s: TrackedSkillItem): ProgressSkillItem => ({
    ref: s.ref,
    label: s.label,
    strength: s.strength,
    lastPracticed: s.lastPracticed,
    dueInDays: Math.round((s.reviewDue - now) / DAY),
  })
  const secureSkills = model.emerging.filter((s) => s.strength === 'secure').map(toSkillItem)
  const developingSkills = model.emerging.filter((s) => s.strength === 'developing').map(toSkillItem)

  const dueVocabulary: VocabRecallItem[] = model.vocabulary
    .filter((v) => v.reviewDue <= now && v.strength !== 'secure')
    .sort((a, b) => a.reviewDue - b.reviewDue)
    .slice(0, 8)
    .map((v) => ({
      id: v.id,
      term: v.term,
      meaning: v.meaning,
      strength: v.strength,
      overdueDays: Math.max(0, Math.round((now - v.reviewDue) / DAY)),
    }))

  const recentLessonIds = new Set(completed.slice(-2).map((l) => l.id))
  const recentVocabulary = [
    ...new Set(
      completed
        .filter((l) => recentLessonIds.has(l.id))
        .flatMap((l) => l.vocabularyAdded)
        .map((t) => t.trim())
        .filter(Boolean),
    ),
  ]
  const secureVocabulary = model.vocabulary.filter((v) => v.strength === 'secure').map((v) => v.term)

  const pronIssueStatus = new Map(
    issues.filter((i) => i.pronunciationRef).map((i) => [i.pronunciationRef!, i.status]),
  )
  const pronunciationTargets: PronunciationTarget[] = model.pronunciationFoci
    .filter((f) => f.rating !== 'clear')
    .map((f) => ({
      area: f.area,
      rating: f.rating,
      label: getPronunciationByArea(f.area)?.title ?? f.area,
      status: pronIssueStatus.get(f.area) ?? (f.rating === 'communicationProblem' ? 'recurring' : 'new'),
      updatedAt: f.updatedAt,
    }))
    .sort((a, b) => b.updatedAt - a.updatedAt)

  const history: ProgressLessonSummary[] = completed
    .slice(-HISTORY_WINDOW)
    .reverse()
    .map((l) => ({
      id: l.id,
      label: l.plan.label,
      completedAt: l.completedAt ?? l.plan.createdAt,
      objectiveTitle: l.plan.objective.title,
      objectiveOutcome: l.objectiveOutcome,
      newWords: l.vocabularyAdded.length,
      corrections: l.correctionIds.length,
    }))

  return {
    lessonCount: completed.length,
    lastLessonAt: completed.length ? completed[lastIndex].completedAt ?? undefined : undefined,
    issues,
    needsWork,
    improving,
    mastered,
    secureSkills,
    developingSkills,
    dueVocabulary,
    recentVocabulary,
    secureVocabulary,
    pronunciationTargets,
    history,
    focus: rankFocus({
      student,
      model,
      needsWork,
      pronunciationTargets,
      now,
      /* What the last few lessons already taught. Excluded so the suggested
         focus shown to the tutor is the one the generator will actually pick —
         a dashboard that recommends a lesson the app then refuses to build is
         worse than no recommendation. */
      recentObjectiveRefs: completed.slice(-RECENT_OBJECTIVE_WINDOW).map((l) => l.plan.objective.ref),
    }),
  }
}

/* -------------------------------------------------------------------------- */
/* What to teach next                                                          */
/* -------------------------------------------------------------------------- */

/** Goals that make pronunciation worth promoting above generic new material. */
const PRONUNCIATION_GOALS: Goal[] = ['pronunciation', 'confidence', 'interview']

/**
 * The ranked list of things worth a lesson, in the order the evidence says.
 *
 * Order is fixed and readable top to bottom — recurring weaknesses, then
 * pronunciation that is actually hurting clarity, then anything due for spaced
 * review, then a goal-driven pronunciation target. Nothing that is `mastered`
 * or merely `new` ever appears: one mistake does not buy a whole lesson, and
 * neither does something the learner has already stopped getting wrong.
 */
function rankFocus(args: {
  student: StudentProfile
  model: LearningModel
  needsWork: ProgressIssue[]
  pronunciationTargets: PronunciationTarget[]
  now: number
  recentObjectiveRefs: string[]
}): FocusCandidate[] {
  const { student, model, needsWork, pronunciationTargets, now } = args
  const out: FocusCandidate[] = []
  const seen = new Set<string>(args.recentObjectiveRefs)
  // Something the learner has made secure is not worth a whole lesson.
  model.emerging.filter((s) => s.strength === 'secure').forEach((s) => seen.add(s.ref))
  const push = (c: FocusCandidate) => {
    if (seen.has(c.ref)) return
    seen.add(c.ref)
    out.push(c)
  }

  // 1. Recurring weaknesses that map onto something teachable.
  for (const issue of needsWork) {
    if (issue.grammarRef) {
      const g = getGrammarById(issue.grammarRef)
      if (!g) continue
      push({
        ref: g.id,
        title: g.title,
        kind: 'grammar',
        source: 'recurringIssue',
        why: { key: 'progress.focusRecurring', params: { lessons: issue.lessonsSeen, example: issue.said ?? '' } },
        rationale: `Recurring across ${issue.lessonsSeen} lessons (e.g. “${issue.said}”).`,
      })
    } else if (issue.pronunciationRef) {
      const p = getPronunciationByArea(issue.pronunciationRef)
      if (!p) continue
      push({
        ref: p.area,
        title: p.title,
        kind: 'pronunciation',
        source: 'recurringIssue',
        why: { key: 'progress.focusRecurring', params: { lessons: issue.lessonsSeen, example: issue.said ?? '' } },
        rationale: `Recurring across ${issue.lessonsSeen} lessons (e.g. “${issue.said}”).`,
      })
    }
  }

  // 2. Pronunciation the tutor has flagged as getting in the way.
  for (const target of pronunciationTargets) {
    if (target.rating !== 'communicationProblem' && target.status !== 'recurring') continue
    const p = getPronunciationByArea(target.area)
    if (!p) continue
    push({
      ref: p.area,
      title: p.title,
      kind: 'pronunciation',
      source: 'pronunciation',
      why: { key: 'progress.focusPronunciation', params: { area: p.title } },
      rationale: `Pronunciation of “${p.title}” is affecting clarity — worth focused practice.`,
    })
  }

  // 3. Anything the spaced-review schedule says is due and not yet secure.
  const due = model.emerging
    .filter((s) => s.reviewDue <= now && s.strength !== 'secure')
    .sort((a, b) => a.reviewDue - b.reviewDue)
  for (const s of due) {
    const g = getGrammarById(s.ref)
    if (!g) continue
    push({
      ref: g.id,
      title: g.title,
      kind: 'grammar',
      source: 'spacedReview',
      why: { key: 'progress.focusReview', params: { title: g.title } },
      rationale: `Spaced review: “${g.title}” is due to be revisited so it becomes secure.`,
    })
  }

  // 4. The learner's own stated goal, when it points somewhere concrete.
  if (
    student.goals.some((g) => PRONUNCIATION_GOALS.includes(g)) ||
    student.pronunciationImportance >= 4
  ) {
    const target = pronunciationTargets[0]
    const p = target ? getPronunciationByArea(target.area) : undefined
    if (p) {
      push({
        ref: p.area,
        title: p.title,
        kind: 'pronunciation',
        source: 'goal',
        why: { key: 'progress.focusGoal', params: { title: p.title } },
        rationale: `Pronunciation matters to this learner — “${p.title}” is the open target.`,
      })
    }
  }

  return out
}

/** Convenience for surfaces that only need the headline. */
export function topFocus(progress: ProgressSnapshot): FocusCandidate | undefined {
  return progress.focus[0]
}
