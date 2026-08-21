import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  saveLastSnapshot,
  loadLastSnapshot,
  clearLastSnapshot,
  SNAPSHOT_TTL_MS,
} from './snapshotStore'
import { shouldUseFoundationalCheck } from './foundationalGate'
import { AssessmentSnapshot } from '../types'

const snap: AssessmentSnapshot = {
  overallCEFR: 'B1',
  perSkill: { speaking: 'B1' },
  strongestSkill: 'speaking',
  priorities: [],
}

beforeEach(() => localStorage.clear())
afterEach(() => vi.useRealTimers())

describe('public snapshot storage', () => {
  it('round-trips a fresh snapshot', () => {
    saveLastSnapshot(snap)
    expect(loadLastSnapshot()?.overallCEFR).toBe('B1')
  })

  it('ignores and clears a snapshot older than the TTL', () => {
    vi.useFakeTimers()
    saveLastSnapshot(snap)
    vi.advanceTimersByTime(SNAPSHOT_TTL_MS + 1000)
    expect(loadLastSnapshot()).toBeNull()
    expect(localStorage.getItem('ewb:lastSnapshot')).toBeNull()
  })

  it('discards legacy undated values rather than trusting them', () => {
    // Values written before the TTL existed carried no timestamp, so there is
    // no way to know they are not ancient.
    localStorage.setItem('ewb:lastSnapshot', JSON.stringify(snap))
    expect(loadLastSnapshot()).toBeNull()
  })

  it('clearLastSnapshot removes it', () => {
    saveLastSnapshot(snap)
    clearLastSnapshot()
    expect(loadLastSnapshot()).toBeNull()
  })

  it('survives corrupt data without throwing', () => {
    localStorage.setItem('ewb:lastSnapshot', '{not json')
    expect(loadLastSnapshot()).toBeNull()
  })
})

describe('foundational check gating', () => {
  it('routes a young child to the picture/listening check', () => {
    expect(shouldUseFoundationalCheck({ ageBand: '6-8' })).toBe(true)
  })

  it('routes a genuine non-reader there too', () => {
    expect(shouldUseFoundationalCheck({ ageBand: 'adult', englishReading: 'cannot' })).toBe(true)
  })

  it('does NOT trap a fluent speaker who cannot read English', () => {
    // Oral and literacy are independent: this learner needs the real check.
    expect(
      shouldUseFoundationalCheck({
        ageBand: 'adult',
        englishReading: 'cannot',
        englishSpeaking: 'fluent',
      }),
    ).toBe(false)
  })

  it('treats "not sure" and unanswered as neutral, not as beginner evidence', () => {
    expect(shouldUseFoundationalCheck({ ageBand: 'adult', englishReading: 'unsure' })).toBe(false)
    expect(shouldUseFoundationalCheck({ ageBand: 'adult' })).toBe(false)
  })
})
