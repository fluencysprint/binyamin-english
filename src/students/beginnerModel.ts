/* ==========================================================================
   Beginner (Pre-A1) model — oral vs. literacy, and the internal P0…P3 stages.
   --------------------------------------------------------------------------
   English proficiency and English literacy are treated as INDEPENDENT. A
   fluent-Russian 65-year-old who can't read English and a 5-year-old who can't
   read anything yet may both be Pre-A1, but they place at different internal
   stages and need different instruction. All functions here are pure and
   deterministic so they are easy to test.
   ========================================================================== */

import {
  CEFR,
  EnglishLiteracyLevel,
  EnglishOralLevel,
  ItemResponse,
  PRE_A1_STAGES,
  PreA1Stage,
  StudentProfile,
} from '../types'
import { cefrIndex } from '../utils/cefr'

/* -------------------------------------------------------------------------- */
/* Ordinal strength of the self-report scales                                 */
/* -------------------------------------------------------------------------- */

/** 0 (no spoken English) … 5 (fluent). 'unsure' → conservative low. */
export function oralStrength(l?: EnglishOralLevel): number {
  switch (l) {
    case 'none':
      return 0
    case 'fewWords':
      return 1
    case 'simplePhrases':
      return 2
    case 'conversational':
      return 3
    case 'confident':
      return 4
    case 'fluent':
      return 5
    case 'unsure':
      return 1
    default:
      return 1
  }
}

/** 0 (cannot read English) … 4 (reads anything). 'unsure' → assume not established. */
export function literacyStrength(l?: EnglishLiteracyLevel): number {
  switch (l) {
    case 'cannot':
      return 0
    case 'fewWords':
      return 1
    case 'simpleSentences':
      return 2
    case 'comfortable':
      return 3
    case 'fluent':
      return 4
    case 'unsure':
      return 0
    default:
      return 1
  }
}

/** Map a self-reported oral level to a coarse CEFR seed (kept low — a
 *  self-report is weak evidence). Only used to seed initial skill estimates so
 *  oral and literacy can start apart. */
export function oralToCefr(l?: EnglishOralLevel): CEFR {
  switch (oralStrength(l)) {
    case 0:
      return 'preA1'
    case 1:
      return 'preA1'
    case 2:
      return 'A1'
    case 3:
      return 'A2'
    case 4:
      return 'B2'
    default:
      return 'C1'
  }
}

/** Map a self-reported English literacy level to a coarse CEFR seed. */
export function literacyToCefr(l?: EnglishLiteracyLevel): CEFR {
  switch (literacyStrength(l)) {
    case 0:
      return 'preA1'
    case 1:
      return 'preA1'
    case 2:
      return 'A1'
    case 3:
      return 'A2'
    default:
      return 'C1'
  }
}

/* -------------------------------------------------------------------------- */
/* Native-language scaffolding                                                */
/* -------------------------------------------------------------------------- */

/** A learner who cannot reliably read English must not be forced to read English
 *  navigation. This is true whenever English reading is not yet established. */
export function needsNativeScaffolding(
  englishReading?: EnglishLiteracyLevel,
): boolean {
  return literacyStrength(englishReading) <= 1
}

/** Should navigation/instructions be presented WITHOUT relying on reading
 *  English? True for non-readers of English OR very young children. */
export function preferNonTextInstructions(profile: {
  englishReading?: EnglishLiteracyLevel
  ageBand?: StudentProfile['ageBand']
  respondedByParent?: boolean
}): boolean {
  if (needsNativeScaffolding(profile.englishReading)) return true
  return profile.ageBand === '6-8' || Boolean(profile.respondedByParent)
}

/* -------------------------------------------------------------------------- */
/* Pre-A1 internal stage (P0…P3)                                              */
/* -------------------------------------------------------------------------- */

export function stageIndex(stage: PreA1Stage): number {
  return PRE_A1_STAGES.indexOf(stage)
}

export function stageFromIndex(i: number): PreA1Stage {
  const clamped = Math.max(0, Math.min(PRE_A1_STAGES.length - 1, Math.round(i)))
  return PRE_A1_STAGES[clamped]
}

/**
 * Derive the starting Pre-A1 stage from onboarding self-reports. Oral ability
 * leads (a true beginner is placed by what they can hear/say, not by reading),
 * with reading nudging the top of the range toward A1-readiness (P3).
 */
export function deriveInitialStage(profile: {
  englishListening?: EnglishOralLevel
  englishSpeaking?: EnglishOralLevel
  englishReading?: EnglishLiteracyLevel
}): PreA1Stage {
  /* Only answers that were actually GIVEN count.
     `oralStrength(undefined)` returns a cautious 1, which is right as a default
     — but taking the max across both answers let that default outvote an
     explicit "none": a learner who told us they speak no English at all, and
     was simply never asked about listening, was placed at P1 instead of P0 and
     started a stage above where they actually were. */
  const answered = [profile.englishListening, profile.englishSpeaking].filter(
    (value): value is EnglishOralLevel => value !== undefined,
  )
  const oral = answered.length > 0 ? Math.max(...answered.map(oralStrength)) : oralStrength(undefined)
  const read = literacyStrength(profile.englishReading)
  if (oral <= 0) return 'P0'
  if (oral === 1) return 'P1'
  if (oral === 2) return read >= 2 ? 'P3' : 'P2'
  return 'P3' // conversational-ish spoken English → ready to move to A1 soon
}

/**
 * Move the internal stage after a beginner lesson. Advancing requires a clearly
 * successful objective; a struggle steps back one. 'partial' holds — we never
 * jump on a single ambiguous result (mirrors the skill-strength philosophy).
 * Stays within Pre-A1; graduation to A1 is governed by the skill estimates.
 */
export function nextStageFromLesson(
  current: PreA1Stage | undefined,
  objectiveOutcome: 'correct' | 'partial' | 'needsWork' | undefined,
  start: PreA1Stage = 'P0',
): PreA1Stage {
  const cur = current ?? start
  if (objectiveOutcome === 'correct') return stageFromIndex(stageIndex(cur) + 1)
  if (objectiveOutcome === 'needsWork') return stageFromIndex(stageIndex(cur) - 1)
  return cur
}

/* -------------------------------------------------------------------------- */
/* Zero-English detection from assessment evidence                            */
/* -------------------------------------------------------------------------- */

/** Minimum low-level attempts before we're willing to call it "zero English". */
export const ZERO_ENGLISH_MIN_LOW_ATTEMPTS = 3

/** Responses at Pre-A1 / A1 — the "can they do anything at all yet?" band. */
function lowResponses(responses: ItemResponse[]): ItemResponse[] {
  return responses.filter((r) => cefrIndex(r.cefr) <= cefrIndex('A1'))
}

/**
 * Strong evidence the learner has essentially no functional English: they have
 * attempted several of the easiest items and gotten none of them right. Used to
 * stop escalating placement (no march through B2/C1) and to route into the
 * supportive foundational result instead of a wall of failures.
 */
export function detectZeroEnglish(responses: ItemResponse[]): boolean {
  const low = lowResponses(responses)
  if (low.length < ZERO_ENGLISH_MIN_LOW_ATTEMPTS) return false
  return low.every((r) => r.outcome !== 'correct')
}

/**
 * The quiz should stop early once zero-English evidence is strong — continuing
 * to serve harder items would only make a true beginner fail repeatedly.
 */
export function shouldStopEarly(responses: ItemResponse[]): boolean {
  return detectZeroEnglish(responses)
}

/**
 * Estimate the Pre-A1 stage from finished assessment evidence, for the snapshot.
 * Zero-English → P0. Otherwise scale by how many of the easiest items landed.
 */
export function stageFromResponses(responses: ItemResponse[]): PreA1Stage {
  if (detectZeroEnglish(responses)) return 'P0'
  const low = lowResponses(responses)
  const correct = low.filter((r) => r.outcome === 'correct').length
  if (low.length === 0) return 'P1'
  const ratio = correct / low.length
  if (ratio <= 0.2) return 'P0'
  if (ratio <= 0.5) return 'P1'
  if (ratio < 1) return 'P2'
  return 'P3'
}
