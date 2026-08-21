/* ==========================================================================
   Speech playback: the desktop failure modes, as tests.
   --------------------------------------------------------------------------
   All three of these produced SILENT failures in a desktop browser — the
   button looked like it worked and no sound came out — so each one is
   reproduced against a fake synthesis engine that behaves the way Chrome does.
   ========================================================================== */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  cancelSpeech,
  pickEnglishVoice,
  primeVoices,
  resetSpeechForTests,
  speak,
  speechAvailable,
  speechSupported,
  subscribeSpeechAvailability,
} from './speech'

type Utterance = {
  text: string
  lang: string
  rate: number
  voice: SpeechSynthesisVoice | null
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: ((e: { error: string }) => void) | null
}

function voice(over: Partial<SpeechSynthesisVoice>): SpeechSynthesisVoice {
  return {
    name: 'v',
    lang: 'en-US',
    localService: true,
    default: false,
    voiceURI: 'v',
    ...over,
  } as SpeechSynthesisVoice
}

interface FakeOptions {
  /** Voices are empty until `releaseVoices()` — Chrome's actual behaviour. */
  lazyVoices?: boolean
  /** Accept the utterance and never start it — a dropped utterance. */
  swallow?: boolean
  /** Fail only when a specific voice is attached (a remote voice). */
  failVoice?: string
  paused?: boolean
}

function installFakeSynth(opts: FakeOptions = {}) {
  const spoken: Utterance[] = []
  let voices: SpeechSynthesisVoice[] = opts.lazyVoices
    ? []
    : [voice({ name: 'Local US', lang: 'en-US' })]
  const listeners: (() => void)[] = []

  const synth = {
    speaking: false,
    pending: false,
    paused: opts.paused ?? false,
    cancelled: 0,
    resumed: 0,
    getVoices: () => voices,
    cancel() {
      this.cancelled++
    },
    resume() {
      this.resumed++
      this.paused = false
    },
    speak(u: Utterance) {
      spoken.push(u)
      const failing = opts.swallow || (opts.failVoice && u.voice?.name === opts.failVoice)
      if (failing) return // accepted, never started
      setTimeout(() => u.onstart?.(), 0)
    },
    addEventListener: (_: string, fn: () => void) => listeners.push(fn),
    removeEventListener: () => {},
  }

  ;(globalThis as unknown as { speechSynthesis: unknown }).speechSynthesis = synth
  ;(globalThis as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance =
    function (this: Utterance, text: string) {
      this.text = text
      this.lang = ''
      this.rate = 1
      this.voice = null
      this.onstart = null
      this.onend = null
      this.onerror = null
    }

  return {
    synth,
    spoken,
    releaseVoices(next = [voice({ name: 'Local US', lang: 'en-US' })]) {
      voices = next
      listeners.forEach((fn) => fn())
    },
    setVoices(next: SpeechSynthesisVoice[]) {
      voices = next
    },
  }
}

beforeEach(() => {
  // The module remembers, for the whole session, that a browser cannot speak.
  // That is the point of it — and it has to be forgotten between tests.
  resetSpeechForTests()
})

afterEach(() => {
  resetSpeechForTests()
  delete (globalThis as Record<string, unknown>).speechSynthesis
  delete (globalThis as Record<string, unknown>).SpeechSynthesisUtterance
  vi.useRealTimers()
})

describe('speechSupported', () => {
  it('is false when the browser has no speech synthesis at all', () => {
    expect(speechSupported()).toBe(false)
  })

  it('is true once the API is present', () => {
    installFakeSynth()
    expect(speechSupported()).toBe(true)
  })
})

describe('pickEnglishVoice', () => {
  it('prefers a LOCAL en-US voice over a remote one', () => {
    const picked = pickEnglishVoice([
      voice({ name: 'Remote US', lang: 'en-US', localService: false }),
      voice({ name: 'Local US', lang: 'en-US', localService: true }),
    ])
    expect(picked?.name).toBe('Local US')
  })

  it('falls back through local English, then any English', () => {
    expect(
      pickEnglishVoice([voice({ name: 'Local GB', lang: 'en-GB', localService: true })])?.name,
    ).toBe('Local GB')
    expect(
      pickEnglishVoice([voice({ name: 'Remote AU', lang: 'en-AU', localService: false })])?.name,
    ).toBe('Remote AU')
  })

  it('returns null rather than a wrong-language voice', () => {
    expect(pickEnglishVoice([voice({ name: 'RU', lang: 'ru-RU' })])).toBeNull()
    expect(pickEnglishVoice([])).toBeNull()
    expect(pickEnglishVoice(undefined)).toBeNull()
  })
})

describe('speak', () => {
  it('reports unsupported instead of pretending to play', async () => {
    await expect(speak('Hello')).resolves.toBe('unsupported')
  })

  it('ignores empty text', async () => {
    installFakeSynth()
    await expect(speak('   ')).resolves.toBe('unsupported')
  })

  it('speaks, at a beginner-friendly rate, with an English voice', async () => {
    const fake = installFakeSynth()
    await expect(speak('Hello')).resolves.toBe('ok')
    expect(fake.spoken).toHaveLength(1)
    expect(fake.spoken[0].text).toBe('Hello')
    expect(fake.spoken[0].rate).toBeLessThan(1)
    expect(fake.spoken[0].voice?.name).toBe('Local US')
  })

  it('cancels anything mid-utterance, but does NOT queue in the same task', async () => {
    const fake = installFakeSynth()
    const promise = speak('Hello')
    // The cancel is synchronous; the speak is deferred past it, which is what
    // stops Chrome's queue from swallowing the utterance.
    expect(fake.synth.cancelled).toBe(1)
    expect(fake.spoken).toHaveLength(0)
    await promise
    expect(fake.spoken).toHaveLength(1)
  })

  it('clears a stuck paused engine before speaking', async () => {
    const fake = installFakeSynth({ paused: true })
    await speak('Hello')
    expect(fake.synth.resumed).toBe(1)
  })

  it('waits for a lazily-loaded voice list instead of speaking into an empty one', async () => {
    const fake = installFakeSynth({ lazyVoices: true })
    const promise = speak('Hello')
    expect(fake.spoken).toHaveLength(0)
    fake.releaseVoices()
    await expect(promise).resolves.toBe('ok')
    expect(fake.spoken[0].voice?.name).toBe('Local US')
  })

  it('still speaks when no voice ever arrives, rather than waiting forever', async () => {
    const fake = installFakeSynth({ lazyVoices: true })
    await expect(speak('Hello')).resolves.toBe('ok')
    expect(fake.spoken).toHaveLength(1)
    // No voice to attach: the utterance carries the language instead.
    expect(fake.spoken[0].voice).toBeNull()
    expect(fake.spoken[0].lang).toBe('en-US')
  }, 4000)

  it('retries with the default voice when the picked one never starts', async () => {
    const fake = installFakeSynth({ failVoice: 'Remote US' })
    fake.setVoices([voice({ name: 'Remote US', lang: 'en-US', localService: false })])
    await expect(speak('Hello')).resolves.toBe('ok')
    expect(fake.spoken).toHaveLength(2)
    expect(fake.spoken[1].voice).toBeNull()
  }, 6000)

  it('reports failure when the engine accepts an utterance and drops it', async () => {
    installFakeSynth({ swallow: true })
    await expect(speak('Hello')).resolves.toBe('failed')
  }, 8000)

  it('treats an interrupted utterance as success, not as an error', async () => {
    const fake = installFakeSynth({ swallow: true })
    const promise = speak('Hello')
    await new Promise((r) => setTimeout(r, 10))
    fake.spoken[0].onerror?.({ error: 'interrupted' })
    await expect(promise).resolves.toBe('ok')
  })

  it('reports a real synthesis error as a failure', async () => {
    const fake = installFakeSynth({ swallow: true })
    const promise = speak('Hello')
    await new Promise((r) => setTimeout(r, 10))
    fake.spoken[0].onerror?.({ error: 'synthesis-failed' })
    await expect(promise).resolves.toBe('failed')
  })
})

describe('primeVoices / cancelSpeech', () => {
  it('are safe to call, and are no-ops without the API', () => {
    installFakeSynth()
    expect(() => primeVoices()).not.toThrow()
    expect(() => cancelSpeech()).not.toThrow()
    delete (globalThis as Record<string, unknown>).speechSynthesis
    expect(() => cancelSpeech()).not.toThrow()
  })
})

/* ==========================================================================
   A browser with the API and NO ENGINE — measured in Brave on desktop Linux,
   where `getVoices()` is empty forever because Brave removes Chrome's remote
   Google voices and there is no system voice to fall back on.
   ========================================================================== */

describe('a browser that has the API but no voices at all', () => {
  it('is supported, and still stops being AVAILABLE once the list stays empty', async () => {
    vi.useFakeTimers()
    installFakeSynth({ lazyVoices: true })
    expect(speechSupported()).toBe(true)
    expect(speechAvailable()).toBe(true)

    primeVoices()
    await vi.advanceTimersByTimeAsync(3100)

    expect(speechSupported()).toBe(true)
    expect(speechAvailable()).toBe(false)
    vi.useRealTimers()
  })

  it('offers speech again if the voice list turns up late', async () => {
    vi.useFakeTimers()
    const fake = installFakeSynth({ lazyVoices: true })
    primeVoices()
    await vi.advanceTimersByTimeAsync(3100)
    expect(speechAvailable()).toBe(false)

    fake.releaseVoices()
    expect(speechAvailable()).toBe(true)
    vi.useRealTimers()
  })

  it('never touches the engine again once speech is known to be dead', async () => {
    const fake = installFakeSynth({ swallow: true })
    await expect(speak('Hello')).resolves.toBe('failed')
    expect(speechAvailable()).toBe(false)

    const attempts = fake.spoken.length
    // Every later tap is a no-op: no cancel, no utterance, no second toast.
    await expect(speak('Hello again')).resolves.toBe('unsupported')
    expect(fake.spoken).toHaveLength(attempts)
  }, 8000)

  it('notifies subscribers exactly once when speech is retired', async () => {
    installFakeSynth({ swallow: true })
    let notifications = 0
    const unsubscribe = subscribeSpeechAvailability(() => {
      notifications++
    })
    await speak('Hello')
    await speak('Hello')
    expect(notifications).toBe(1)
    unsubscribe()
  }, 8000)
})
