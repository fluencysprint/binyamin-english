import { describe, it, expect } from 'vitest'
import { pickVaried, pushRecentContentIds, RECENT_CONTENT_WINDOW } from './selection'
import { warmups, communicationTasks, c1Tasks, personalizeHint } from './activityContent'
import { AgeBand } from '../types'

const ids = (xs: { id: string }[]) => xs.map((x) => x.id)

describe('pickVaried', () => {
  const bank = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]

  it('prefers items that were not used recently', () => {
    // Any rng in [0,1) must land on the sole fresh candidate, 'c'.
    for (const r of [0, 0.1, 0.4, 0.5, 0.9, 0.999]) {
      const got = pickVaried(bank, (x) => x.id, ['a', 'b'], () => r)
      expect(got.id).toBe('c')
    }
  })

  it('falls back to the full pool once everything is recent', () => {
    const got = pickVaried(bank, (x) => x.id, ['a', 'b', 'c'], () => 0.5)
    expect(ids(bank)).toContain(got.id)
  })

  it('is deterministic for an injected rng', () => {
    const rng = () => 0.9
    expect(pickVaried(bank, (x) => x.id, [], rng).id).toBe(pickVaried(bank, (x) => x.id, [], rng).id)
  })

  it('samples across the whole pool with the default (Math.random) rng', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 300; i++) seen.add(pickVaried(bank, (x) => x.id, []).id)
    expect(seen.size).toBe(bank.length)
  })
})

describe('pushRecentContentIds', () => {
  it('appends, dedupes, and keeps the most recent last', () => {
    expect(pushRecentContentIds(['a', 'b'], ['b', 'c'])).toEqual(['a', 'b', 'c'])
  })

  it('caps the window', () => {
    const many = Array.from({ length: RECENT_CONTENT_WINDOW + 15 }, (_, i) => `id-${i}`)
    const out = pushRecentContentIds([], many)
    expect(out).toHaveLength(RECENT_CONTENT_WINDOW)
    expect(out[out.length - 1]).toBe(many[many.length - 1])
  })
})

describe('content banks', () => {
  const bands: AgeBand[] = ['6-8', '9-12', '13-17', 'adult']

  it('offer enough variety that a weekly learner does not loop quickly', () => {
    for (const band of bands) {
      expect(warmups[band].length).toBeGreaterThanOrEqual(16)
      expect(communicationTasks[band].length).toBeGreaterThanOrEqual(16)
    }
    // Adults practising conversation get the deepest bank.
    expect(communicationTasks.adult.length).toBeGreaterThanOrEqual(30)
    expect(c1Tasks.length).toBeGreaterThanOrEqual(32)
  })

  it('uses unique, stable ids everywhere', () => {
    const all = [
      ...bands.flatMap((b) => ids(warmups[b])),
      ...bands.flatMap((b) => ids(communicationTasks[b])),
      ...ids(c1Tasks),
    ]
    expect(new Set(all).size).toBe(all.length)
  })

  it('never repeats a prompt across a long run of lessons', () => {
    // Simulate 10 consecutive lessons, feeding each pick back as "recent".
    let recent: string[] = []
    const seen: string[] = []
    for (let lesson = 0; lesson < 10; lesson++) {
      const task = pickVaried(communicationTasks.adult, (x) => x.id, recent)
      seen.push(task.id)
      recent = pushRecentContentIds(recent, [task.id])
    }
    expect(new Set(seen).size).toBe(seen.length)
  })
})

describe('personalizeHint', () => {
  it('rotates through every interest rather than always the first', () => {
    const interests = ['football', 'cooking', 'space']
    const used = new Set(
      Array.from({ length: 9 }, (_, seed) => personalizeHint(interests, seed)).filter(Boolean) as string[],
    )
    expect(used.size).toBeGreaterThan(1)
    for (const interest of interests) {
      expect([...used].some((s) => s.includes(interest))).toBe(true)
    }
  })

  it('says nothing at all when we know nothing about the learner', () => {
    expect(personalizeHint([], 3)).toBeNull()
  })
})
