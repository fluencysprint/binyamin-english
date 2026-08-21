/* ==========================================================================
   Lightweight settings + session recovery via localStorage.
   Only small, non-sensitive values live here. Everything structured is in
   IndexedDB. Session recovery lets us restore an active lesson after refresh.
   ========================================================================== */

import { AppMode, UILanguage } from '../types'
import { normalizeUILanguage } from '../locales'

const PREFIX = 'ewb:'

export interface Settings {
  language: UILanguage
  theme: 'light' | 'dark' | 'system'
  mode: AppMode
  /** The one student Student mode is bound to. Only meaningful while
   *  `mode === 'student'` — always null otherwise, see `loadSettings`. */
  boundStudentId: string | null
  /** Whether the tutor gate has been unlocked this session/device. */
  tutorUnlocked: boolean
  /** Whether the microphone privacy notice has been acknowledged. */
  micNoticeAcknowledged: boolean
  // NOTE: declared but not yet wired to any setter or consumer — pre-existing
  // loose end, not addressed here.
  reducedActivityMotion: boolean
  /** Whether the lesson-runner timer is visible. Default true so existing
   *  usage isn't surprised; toggled right next to the timer itself. */
  showTimer: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  language: 'en',
  theme: 'system',
  mode: 'tutor',
  boundStudentId: null,
  tutorUnlocked: false,
  micNoticeAcknowledged: false,
  reducedActivityMotion: false,
  showTimer: true,
}

/** Read one small value from the app's localStorage namespace. Exported so
 *  every feature that keeps a scrap of local state uses the same prefix and
 *  the same never-throw behaviour. */
export function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw == null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

/** Write one small value into the app's localStorage namespace. */
export function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* storage may be full or blocked — non-fatal */
  }
}

const VALID_MODES: AppMode[] = ['tutor', 'together', 'student']

/** A mode string written by an older build, or edited by hand, must never
 *  resolve to anything but the most restrictive mode — the same fail-closed
 *  rule `accessFor` applies to capabilities (see app/modeAccess.ts). */
function normalizeMode(mode: unknown): AppMode {
  return VALID_MODES.includes(mode as AppMode) ? (mode as AppMode) : 'student'
}

export function loadSettings(): Settings {
  const stored = { ...DEFAULT_SETTINGS, ...read<Partial<Settings>>('settings', {}) }
  // A language tag written by an older build (or edited by hand) must never
  // reach the dictionary lookup as-is.
  //
  // The binding only ever means something when the stored mode was
  // GENUINELY 'student' — not when it merely coerced to 'student' below
  // because it was junk. Checking the pre-coercion value means a corrupt
  // mode string can never drag a leftover binding through with it: Student
  // mode with no binding fails closed instead.
  const wasStudent = stored.mode === 'student'
  return {
    ...stored,
    language: normalizeUILanguage(stored.language),
    mode: normalizeMode(stored.mode),
    boundStudentId: wasStudent && typeof stored.boundStudentId === 'string' ? stored.boundStudentId : null,
  }
}

export function saveSettings(s: Settings): void {
  write('settings', s)
}

/* ---- Lesson orientation ("Your job today") dismissal ---- */
const ORIENTATION_KEY = 'hideLessonOrientation'

export function getHideLessonOrientation(): boolean {
  return read(ORIENTATION_KEY, false)
}
export function setHideLessonOrientation(hide: boolean): void {
  write(ORIENTATION_KEY, hide)
}

/* ---- Active-lesson session recovery ---- */
const ACTIVE_LESSON_KEY = 'activeLesson'

export function setActiveLessonId(lessonId: string | null): void {
  if (lessonId) write(ACTIVE_LESSON_KEY, lessonId)
  else
    try {
      localStorage.removeItem(PREFIX + ACTIVE_LESSON_KEY)
    } catch {
      /* ignore */
    }
}
