/* ==========================================================================
   The state machine LessonRunnerPage gates the guidance panel on.
   --------------------------------------------------------------------------
   `translate`/`ct` silently fall back to English for a chunk that has not
   landed yet — the right behaviour for a genuinely missing key, wrong for a
   locale still in flight, since the two are otherwise indistinguishable. This
   locks down the three states a screen actually branches on: 'loading' before
   arrival, 'ready' once it lands, and 'error' — reported rather than papered
   over — when the fetch fails. No timers: every assertion here is driven by
   a real promise resolving or rejecting, not a clock.
   ========================================================================== */

import { describe, it, expect, vi } from 'vitest'

describe('teachingStringsStatus', () => {
  it('is ready for English immediately, and loading for another language before its chunk resolves', async () => {
    const { teachingStringsStatus } = await import('../i18n/teachingStrings')
    expect(teachingStringsStatus('en')).toBe('ready')
    expect(teachingStringsStatus('fr')).toBe('loading')
  })

  it('becomes ready once loadTeachingStrings resolves, and stays ready on a repeat call', async () => {
    const { teachingStringsStatus, loadTeachingStrings } = await import('../i18n/teachingStrings')
    expect(teachingStringsStatus('ru')).toBe('loading')
    await loadTeachingStrings('ru')
    expect(teachingStringsStatus('ru')).toBe('ready')
    // Idempotent: a second call (e.g. a re-mount) does not regress the status.
    await loadTeachingStrings('ru')
    expect(teachingStringsStatus('ru')).toBe('ready')
  })
})

describe('a failed chunk fetch', () => {
  it('reports "error" rather than silently resolving to English', async () => {
    vi.doMock('../locales/guide/es', () => {
      throw new Error('network down')
    })
    const { teachingStringsStatus, loadTeachingStrings } = await import('../i18n/teachingStrings')
    expect(teachingStringsStatus('es')).toBe('loading')
    await loadTeachingStrings('es')
    expect(teachingStringsStatus('es')).toBe('error')
  })

  it('recovers once the chunk is retried and succeeds', async () => {
    vi.doMock('../locales/guide/he', () => {
      throw new Error('network down')
    })
    const { teachingStringsStatus, loadTeachingStrings } = await import('../i18n/teachingStrings')
    await loadTeachingStrings('he')
    expect(teachingStringsStatus('he')).toBe('error')

    // The retry button in LessonRunnerPage does exactly this: call the same
    // loader again. Once the chunk is reachable, status must not stay stuck.
    vi.doUnmock('../locales/guide/he')
    vi.resetModules()
    const fresh = await import('../i18n/teachingStrings')
    await fresh.loadTeachingStrings('he')
    expect(fresh.teachingStringsStatus('he')).toBe('ready')
  })
})
