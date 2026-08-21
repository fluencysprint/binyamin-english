/* ==========================================================================
   Optional, zero-cost speech using the browser Speech Synthesis API.
   --------------------------------------------------------------------------
   A PROGRESSIVE ENHANCEMENT for simple beginner listening prompts — never an
   authoritative pronunciation model, and the app must remain fully usable when
   it is unavailable (Tutor Mode falls back to "Say this aloud: …"). Guarded so
   it is safe under jsdom / SSR / older browsers.

   Desktop browsers need three things a naive `cancel(); speak()` does not do,
   and all three produced SILENT failures — the button appeared to work and no
   sound came out:

     1. VOICES ARE ASYNC. Chrome returns an empty `getVoices()` until the voice
        list has loaded and only then fires `voiceschanged`. Speaking into that
        window can be dropped entirely, so we prime the list at startup and
        wait (briefly, bounded) for it before the first utterance.

     2. `cancel()` IMMEDIATELY BEFORE `speak()` RACES. Chrome's synthesis queue
        can swallow an utterance queued in the same task as the cancel, so the
        speak is deferred to the next task. The engine can also be left in a
        stuck `paused` state by a background tab; `resume()` clears it.

     3. FAILURE IS SILENT. An utterance can be accepted and never start (no
        usable voice for the language, a remote voice with no network). We
        watch for `start`/`error` and report the outcome, so the UI can tell
        the tutor to say the item themselves instead of pretending it played.

   And one browser has no engine AT ALL, which is a different problem again:

     4. SOME BROWSERS SHIP ZERO VOICES. Chrome's desktop voice list is entirely
        REMOTE Google voices (`localService: false`) — measured on Linux: 19
        voices, every one of them `Google …`. Brave removes that component on
        purpose, because using it would send the text to Google. On a desktop
        OS with no system voices reachable from Chromium, Brave is therefore
        left with `getVoices().length === 0` forever: `voiceschanged` fires
        with an empty list and `speak()` can only ever fail. Nothing in a web
        page can synthesize speech there without shipping our own engine.

        So availability is a RUNTIME capability, not a browser name — Brave on
        macOS/Windows has system voices and works fine. An empty voice list, or
        a first utterance the engine drops, disables speech FOR THE SESSION:
        the controls stop being offered, the app falls back to the tutor saying
        the item aloud, and we never queue another doomed utterance or repeat
        the failure message.
   ========================================================================== */

/** What actually happened, so callers can fall back honestly. */
export type SpeechOutcome = 'ok' | 'unsupported' | 'failed'

export function speechSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof window.SpeechSynthesisUtterance === 'function'
  )
}

/* --------------------------------------------------------------------------
   Session availability: one flag, one subscription, no retry loop.
   -------------------------------------------------------------------------- */

let sessionDisabled = false
const availabilityListeners = new Set<() => void>()

function notifyAvailability(): void {
  for (const listener of availabilityListeners) listener()
}

/** Subscribe to availability changes (for `useSyncExternalStore`). */
export function subscribeSpeechAvailability(listener: () => void): () => void {
  availabilityListeners.add(listener)
  return () => {
    availabilityListeners.delete(listener)
  }
}

/**
 * Can we still offer a Listen control? False once the engine has proved it
 * cannot produce sound, so the UI degrades instead of offering a dead button.
 */
export function speechAvailable(): boolean {
  return speechSupported() && !sessionDisabled
}

/** Stop offering speech for the rest of this session. Idempotent. */
export function disableSpeechForSession(): void {
  if (sessionDisabled) return
  sessionDisabled = true
  notifyAvailability()
}

/** Voices turned up after all (a genuinely lazy engine) — offer it again. */
function enableSpeechForSession(): void {
  if (!sessionDisabled) return
  sessionDisabled = false
  notifyAvailability()
}

/** Test seam: forget everything this module learned about the browser. */
export function resetSpeechForTests(): void {
  sessionDisabled = false
  voicesPrimed = false
  notifyAvailability()
}

/** How long a browser gets to produce its voice list before we decide it has
 *  none. Long enough for a slow list, short enough that the tutor is not left
 *  looking at a button that will never work. */
const VOICE_PROBE_MS = 3000

/** How many voices the engine is offering right now — zero means it cannot
 *  speak at all, whatever the API surface claims. */
function voiceCount(): number {
  try {
    return window.speechSynthesis.getVoices().length
  } catch {
    return 0
  }
}

let voicesPrimed = false

/**
 * Ask the browser for its voice list and keep asking until it arrives. Safe to
 * call repeatedly; safe to call before any user gesture. Called once at
 * startup so the first Listen tap does not race the voice list.
 */
export function primeVoices(): void {
  if (voicesPrimed || !speechSupported()) return
  voicesPrimed = true
  try {
    const synth = window.speechSynthesis
    synth.getVoices()
    // The list can arrive late, and it can also arrive EMPTY and stay empty
    // (Brave). Either way this listener is the authority: voices present →
    // offer speech, voices gone → stop offering it.
    synth.addEventListener?.('voiceschanged', () => {
      if (voiceCount() > 0) enableSpeechForSession()
      else disableSpeechForSession()
    })
    // Give a slow list a generous chance before deciding the browser has none.
    // Nothing is spoken here; this only decides whether to show the control.
    if (voiceCount() === 0) {
      setTimeout(() => {
        if (voiceCount() === 0) disableSpeechForSession()
      }, VOICE_PROBE_MS)
    }
  } catch {
    /* ignore — speech stays a no-op */
  }
}

/** Resolves as soon as the browser reports any voice, or after `timeoutMs`. */
function whenVoicesReady(timeoutMs = 1000): Promise<void> {
  return new Promise((resolve) => {
    let synth: SpeechSynthesis
    try {
      synth = window.speechSynthesis
      if (synth.getVoices().length > 0) return resolve()
    } catch {
      return resolve()
    }
    let settled = false
    const done = () => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      synth.removeEventListener?.('voiceschanged', done)
      resolve()
    }
    const timer = setTimeout(done, timeoutMs)
    synth.addEventListener?.('voiceschanged', done)
  })
}

/**
 * Prefer a LOCAL en-US voice: a remote (network) voice is the most common
 * cause of a desktop utterance that is accepted and then never heard. Falls
 * back through any local English, then any English, then the default voice.
 */
export function pickEnglishVoice(
  voices: SpeechSynthesisVoice[] | null | undefined,
): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null
  const isEn = (v: SpeechSynthesisVoice) => v.lang?.toLowerCase().startsWith('en')
  const isUs = (v: SpeechSynthesisVoice) => v.lang?.toLowerCase().replace('_', '-') === 'en-us'
  return (
    voices.find((v) => isUs(v) && v.localService) ??
    voices.find((v) => isEn(v) && v.localService) ??
    voices.find(isUs) ??
    voices.find(isEn) ??
    null
  )
}

function currentVoice(): SpeechSynthesisVoice | null {
  try {
    return pickEnglishVoice(window.speechSynthesis.getVoices())
  } catch {
    return null
  }
}

/**
 * Speak an English word/phrase aloud. Resolves with what actually happened —
 * `'failed'` means the browser accepted the utterance but never started it,
 * which callers should surface rather than ignore.
 */
export async function speak(text: string, opts?: { rate?: number }): Promise<SpeechOutcome> {
  if (!speechSupported() || !text.trim()) return 'unsupported'
  // Already known not to work. Do not touch the engine again this session.
  if (sessionDisabled) return 'unsupported'

  const synth = window.speechSynthesis
  try {
    synth.cancel()
    // A tab that was backgrounded mid-utterance can leave the engine paused;
    // every later speak() then queues silently behind it.
    if (synth.paused) synth.resume()
  } catch {
    return 'failed'
  }

  primeVoices()
  await whenVoicesReady()

  const attempt = (voice: SpeechSynthesisVoice | null): Promise<SpeechOutcome> =>
    new Promise((resolve) => {
      let settled = false
      let watchdog = 0
      const done = (outcome: SpeechOutcome) => {
        if (settled) return
        settled = true
        clearTimeout(watchdog)
        resolve(outcome)
      }

      const u = new SpeechSynthesisUtterance(text)
      u.lang = voice?.lang || 'en-US'
      // A little slower than default helps absolute beginners catch the sounds.
      u.rate = opts?.rate ?? 0.9
      if (voice) u.voice = voice
      u.onstart = () => done('ok')
      // Very short words can finish before `start` is delivered.
      u.onend = () => done('ok')
      u.onerror = (e) => {
        const err = (e as SpeechSynthesisErrorEvent).error
        // A deliberate cancel (the next tap) is not a failure.
        done(err === 'interrupted' || err === 'canceled' ? 'ok' : 'failed')
      }

      // Deferred: an utterance queued in the same task as cancel() can be
      // dropped by Chrome's synthesis queue.
      setTimeout(() => {
        try {
          synth.speak(u)
        } catch {
          done('failed')
          return
        }
        watchdog = window.setTimeout(() => {
          // Nothing started and nothing is queued — the engine took it and
          // dropped it. Report that instead of claiming success.
          done(synth.speaking || synth.pending ? 'ok' : 'failed')
        }, 1500)
      }, 0)
    })

  const voice = currentVoice()
  const first = await attempt(voice)
  if (first !== 'failed') return first

  // One retry with the platform default — and exactly one. A picked voice that
  // never starts is usually a remote voice the device cannot actually load; a
  // second failure means the engine cannot speak, so we stop asking it.
  if (!voice) {
    disableSpeechForSession()
    return 'failed'
  }
  try {
    synth.cancel()
  } catch {
    /* ignore */
  }
  const second = await attempt(null)
  if (second === 'failed') disableSpeechForSession()
  return second
}

export function cancelSpeech(): void {
  try {
    if (speechSupported()) window.speechSynthesis.cancel()
  } catch {
    /* ignore */
  }
}
