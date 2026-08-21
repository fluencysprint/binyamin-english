import { AssessmentSnapshot } from '../types'

const KEY = 'ewb:lastSnapshot'

/** How long a public self-check result stays usable to prefill the booking
 *  form. Past this it is stale and ignored — a result from weeks ago should
 *  never quietly speak for whoever is using the browser now. */
export const SNAPSHOT_TTL_MS = 24 * 60 * 60 * 1000

interface StoredSnapshot {
  snapshot: AssessmentSnapshot
  savedAt: number
}

/** Persist the most recent public snapshot so the booking page can include it.
 *  This is for the anonymous public self-check only — student records get their
 *  placement passed explicitly, never through this shared key. */
export function saveLastSnapshot(snapshot: AssessmentSnapshot): void {
  try {
    const record: StoredSnapshot = { snapshot, savedAt: Date.now() }
    localStorage.setItem(KEY, JSON.stringify(record))
  } catch {
    /* ignore */
  }
}

export function loadLastSnapshot(): AssessmentSnapshot | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const record = JSON.parse(raw) as StoredSnapshot | AssessmentSnapshot
    // Values written before the TTL existed were the bare snapshot, with no
    // way to tell how old they are — treat them as expired rather than trust them.
    if (!record || typeof record !== 'object' || !('savedAt' in record)) {
      localStorage.removeItem(KEY)
      return null
    }
    if (Date.now() - record.savedAt > SNAPSHOT_TTL_MS) {
      localStorage.removeItem(KEY)
      return null
    }
    return record.snapshot
  } catch {
    return null
  }
}

export function clearLastSnapshot(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
