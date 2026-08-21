/* ==========================================================================
   Persistent Student Learning Model
   --------------------------------------------------------------------------
   Updated after every lesson. Skills are never marked "secure" from a single
   success — strength advances only with repeated evidence, and spaced-review
   dates grow as a skill consolidates.
   ========================================================================== */

import {
  CEFR,
  Correction,
  ItemResponse,
  LearningModel,
  PronunciationArea,
  PronunciationRating,
  RecurringError,
  Skill,
  SkillEstimate,
  SKILLS,
  TrackedSkillItem,
  VocabRecallOutcome,
  VocabularyItem,
} from '../types'
import { cefrIndex, cefrFromIndex, seedEstimates } from '../utils/cefr'
import { uid } from '../utils/id'

/** Days until next review by strength. Spaced repetition, deliberately gentle. */
const REVIEW_DAYS: Record<TrackedSkillItem['strength'], number> = {
  emerging: 2,
  developing: 7,
  secure: 21,
}
const DAY = 24 * 60 * 60 * 1000

/** How far, in CEFR levels, one perfect (or failed) observation can pull the
 *  estimate past the level it was observed at. Three-quarters of a level: enough
 *  to move with consistent evidence, never enough to claim a band outright. */
const EVIDENCE_PUSH = 1.5

export function initLearningModel(studentId: string, start: CEFR = 'A1', now = Date.now()): LearningModel {
  return {
    studentId,
    skillEstimates: seedEstimates(start, now),
    recentlyLearned: [],
    emerging: [],
    recurringErrors: [],
    pronunciationFoci: [],
    vocabulary: [],
    topicsDiscussed: [],
    confidenceNotes: [],
    completedActivityIds: [],
    recentContentIds: [],
    tutorNotes: [],
    updatedAt: now,
  }
}

/** Blend a new observed level into an existing estimate. Confidence rises with
 *  agreement and evidence; a single data point moves the level only partway. */
export function updateEstimate(
  prev: SkillEstimate,
  observedLevel: CEFR,
  outcomeWeight: number, // 0..1 (correct=1, partial=0.5, needsWork=0)
  now: number,
): SkillEstimate {
  // Track the CONTINUOUS position, not the rounded band. Re-reading the band
  // each time silently discarded every movement smaller than half a level, so
  // repeated failures at a learner's own level never actually moved them.
  const prevIdx = prev.levelScore ?? cefrIndex(prev.level)
  const obsIdx = cefrIndex(observedLevel)
  // Learning rate shrinks as evidence accumulates (more inertia when confident).
  const lr = Math.max(0.15, 0.5 - prev.evidenceCount * 0.05)
  /* A correct answer at/above current pulls up; a failure pulls down. The
     push is deliberately less than a full level: succeeding repeatedly on A1
     items is evidence of being at least A1, not of being A2. Claiming a level
     the learner has never actually demonstrated is the one direction this
     estimate must not drift in — an overstated level produces lessons that are
     too hard, which reads to the learner as their own failure. */
  const signal = obsIdx + (outcomeWeight - 0.5) * EVIDENCE_PUSH
  const nextIdxRaw = prevIdx + (signal - prevIdx) * lr
  const nextIdx = Math.max(0, Math.min(5, nextIdxRaw))
  const evidenceCount = prev.evidenceCount + 1
  const agreement = 1 - Math.min(1, Math.abs(obsIdx - prevIdx) / 2)
  const confidence = Math.round(
    Math.min(0.95, prev.confidence * 0.6 + (0.2 + 0.5 * agreement + Math.min(0.3, evidenceCount * 0.03)) * 0.4) * 100,
  ) / 100
  return {
    level: cefrFromIndex(nextIdx),
    levelScore: nextIdx,
    confidence,
    evidenceCount,
    updatedAt: now,
  }
}

function outcomeWeight(o: ItemResponse['outcome']): number {
  return o === 'correct' ? 1 : o === 'partial' ? 0.5 : 0
}

/** Fold a batch of scored responses into the skill estimates. */
export function applyResponses(
  model: LearningModel,
  responses: ItemResponse[],
  now = Date.now(),
): LearningModel {
  const estimates = { ...model.skillEstimates }
  for (const r of responses) {
    const skill = r.skill as Skill
    if (!SKILLS.includes(skill)) continue
    estimates[skill] = updateEstimate(estimates[skill], r.cefr, outcomeWeight(r.outcome), now)
  }
  return { ...model, skillEstimates: estimates, updatedAt: now }
}

/** Merge corrections into recurring-error tracking (dedup by description). */
export function applyCorrections(
  model: LearningModel,
  corrections: Correction[],
  now = Date.now(),
): LearningModel {
  const recurring = [...model.recurringErrors]
  for (const c of corrections) {
    if (c.category === 'greatExpression') continue // a positive, not an error
    const key = c.said.trim().toLowerCase()
    const existing = recurring.find(
      (e) => e.category === c.category && e.description.trim().toLowerCase() === key,
    )
    if (existing) {
      existing.occurrences += 1
      existing.lastSeen = now
      existing.resolved = false
      if (c.better) existing.example = c.better
    } else {
      const err: RecurringError = {
        id: uid('err'),
        category: c.category,
        description: c.said,
        example: c.better,
        occurrences: 1,
        firstSeen: now,
        lastSeen: now,
        resolved: false,
      }
      recurring.push(err)
    }
  }
  return { ...model, recurringErrors: recurring, updatedAt: now }
}

/** Advance (or add) a tracked skill's strength based on a success/failure. */
export function reinforceSkill(
  model: LearningModel,
  ref: string,
  label: string,
  success: boolean,
  now = Date.now(),
): LearningModel {
  const list = [...model.emerging]
  let item = list.find((s) => s.ref === ref)
  if (!item) {
    item = {
      id: uid('skill'),
      ref,
      label,
      strength: 'emerging',
      evidenceCount: 0,
      lastPracticed: now,
      reviewDue: now + REVIEW_DAYS.emerging * DAY,
    }
    list.push(item)
  }
  item.evidenceCount += 1
  item.lastPracticed = now
  if (success) {
    // Advance only with repeated evidence, not one correct answer.
    if (item.strength === 'emerging' && item.evidenceCount >= 2) item.strength = 'developing'
    else if (item.strength === 'developing' && item.evidenceCount >= 4) item.strength = 'secure'
  } else if (item.strength !== 'emerging') {
    item.strength = item.strength === 'secure' ? 'developing' : 'emerging'
  }
  item.reviewDue = now + REVIEW_DAYS[item.strength] * DAY

  const recentlyLearned = list.filter((s) => s.strength !== 'emerging')
  return { ...model, emerging: list, recentlyLearned, updatedAt: now }
}

export function addVocabulary(
  model: LearningModel,
  terms: { term: string; meaning?: string; example?: string }[],
  now = Date.now(),
): LearningModel {
  const vocab = [...model.vocabulary]
  for (const t of terms) {
    if (!t.term.trim()) continue
    if (vocab.some((v) => v.term.trim().toLowerCase() === t.term.trim().toLowerCase())) continue
    const item: VocabularyItem = {
      id: uid('vocab'),
      term: t.term.trim(),
      meaning: t.meaning,
      example: t.example,
      addedAt: now,
      strength: 'emerging',
      reviewDue: now + REVIEW_DAYS.emerging * DAY,
    }
    vocab.push(item)
  }
  return { ...model, vocabulary: vocab, updatedAt: now }
}

/**
 * Fold recall verdicts from the spaced-review step back into vocabulary.
 *
 * Without this the review queue was write-only: every word was created
 * "emerging", due in two days, and nothing ever moved it — so the same five
 * words came back forever while newer ones queued behind them, and no word
 * could ever be described as known. The ladder is the same one tracked skills
 * use, and for the same reason: one correct recall is not knowing a word.
 *
 *   recalled  1st → developing, 3rd → secure (21 days away)
 *   missed    drop one step and ask again in two days
 *
 * A word the tutor never gave a verdict on is untouched here; see
 * `deferVocabularyReview` for that case.
 */
export function reviewVocabulary(
  model: LearningModel,
  outcomes: Record<string, VocabRecallOutcome> | undefined,
  now = Date.now(),
): LearningModel {
  const entries = Object.entries(outcomes ?? {})
  if (entries.length === 0) return model
  const byTerm = new Map(entries.map(([term, o]) => [term.trim().toLowerCase(), o]))
  const vocabulary = model.vocabulary.map((v) => {
    const outcome = byTerm.get(v.term.trim().toLowerCase())
    if (!outcome) return v
    const evidenceCount = (v.evidenceCount ?? 0) + 1
    let strength = v.strength
    if (outcome === 'recalled') {
      if (strength === 'emerging') strength = 'developing'
      else if (strength === 'developing' && evidenceCount >= 3) strength = 'secure'
    } else {
      strength = strength === 'secure' ? 'developing' : 'emerging'
    }
    return {
      ...v,
      strength,
      evidenceCount,
      lastReviewed: now,
      reviewDue: now + REVIEW_DAYS[outcome === 'recalled' ? strength : 'emerging'] * DAY,
    }
  })
  return { ...model, vocabulary, updatedAt: now }
}

/**
 * Push a word's review date forward without claiming any evidence.
 *
 * Used for words that WERE offered at the recall step but got no verdict —
 * the lesson moved on, which is normal. Recording a success there would be a
 * lie, and leaving the date in the past would jam the queue so newer words
 * never surfaced. So: no strength change, no evidence, just ask again later.
 */
export function deferVocabularyReview(
  model: LearningModel,
  terms: readonly string[],
  now = Date.now(),
): LearningModel {
  if (terms.length === 0) return model
  const set = new Set(terms.map((t) => t.trim().toLowerCase()))
  const vocabulary = model.vocabulary.map((v) =>
    set.has(v.term.trim().toLowerCase())
      ? { ...v, reviewDue: now + REVIEW_DAYS.emerging * DAY }
      : v,
  )
  return { ...model, vocabulary, updatedAt: now }
}

export function setPronunciationFocus(
  model: LearningModel,
  area: PronunciationArea,
  rating: PronunciationRating,
  note?: string,
  now = Date.now(),
): LearningModel {
  const foci = model.pronunciationFoci.filter((f) => f.area !== area)
  foci.push({ area, rating, note, updatedAt: now })
  return { ...model, pronunciationFoci: foci, updatedAt: now }
}

export function addTopics(model: LearningModel, topics: string[], now = Date.now()): LearningModel {
  const set = new Set(model.topicsDiscussed)
  topics.forEach((t) => t.trim() && set.add(t.trim()))
  return { ...model, topicsDiscussed: [...set], updatedAt: now }
}

/** Items whose spaced-review date has arrived. */
export function dueForReview(model: LearningModel, now = Date.now()): TrackedSkillItem[] {
  return model.emerging.filter((s) => s.reviewDue <= now).sort((a, b) => a.reviewDue - b.reviewDue)
}
