import { useCallback, useSyncExternalStore } from 'react'
import { useI18n } from '../i18n/I18nProvider'
import { useOptionalToast } from './Toast'
import {
  disableSpeechForSession,
  speak,
  speechAvailable,
  subscribeSpeechAvailability,
} from '../utils/speech'

/**
 * Is a Listen control worth showing AT ALL right now?
 *
 * Not `speechSupported()`: every Chromium browser has the API. Brave desktop
 * has the API and zero voices, so the button used to render, do nothing, and
 * turn the screen red. This subscribes to what the engine has actually proved
 * it can do, so the control disappears the moment we know better — and the
 * "say it aloud yourself" fallback takes its place.
 */
export function useSpeechAvailable(): boolean {
  return useSyncExternalStore(
    subscribeSpeechAvailability,
    speechAvailable,
    // Prerender/SSR has no engine, which matches the markup a browser with no
    // engine would produce before hydration.
    () => false,
  )
}

/**
 * Play an English word or phrase, and TELL the user when nothing came out —
 * ONCE.
 *
 * A Listen button that quietly does nothing is worse than no button: the tutor
 * waits for audio that is never coming. `speak` reports whether the browser
 * actually started the utterance; the first failure both surfaces the "say it
 * aloud yourself" fallback and retires speech for the session, so a browser
 * that cannot speak says so a single time instead of once per tap.
 */
export function useSpeak(): (text: string) => void {
  const { t } = useI18n()
  const toast = useOptionalToast()
  return useCallback(
    (text: string) => {
      // Nothing is known to be broken yet — a failure now is news.
      const wasAvailable = speechAvailable()
      void speak(text).then((outcome) => {
        if (outcome === 'ok') return
        disableSpeechForSession()
        if (wasAvailable) toast(t('lesson.speechUnavailable'), 'err')
      })
    },
    [t, toast],
  )
}
