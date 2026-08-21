/* ==========================================================================
   "Your students only exist in this browser."
   --------------------------------------------------------------------------
   This app has no server by design: no account, no sync, no bill. The cost of
   that choice is that a cleared browser, a reinstalled OS or a replaced phone
   takes every lesson with it, silently, and the tutor finds out months later.

   The whole mitigation is one honest reminder in the right place. The rules
   below are deliberately dull, because a reminder that cries wolf gets
   dismissed on sight and then it protects nothing:

     · nothing at all until there is work worth losing (one completed lesson)
     · once, if this device has never produced a backup
     · again after three more completed lessons, or after a month in which at
       least one lesson happened
     · never while a recent backup covers everything on the device
     · never as a dialog, never in the middle of a lesson

   Nothing here invents urgency it cannot justify: every message states a
   count or a date that comes from the stored record, and when the record and
   the database disagree the reminder stays quiet rather than guessing.
   ========================================================================== */

import { read, write } from './settings'
import { exportBackup, downloadBackup } from './backup'

const DAY = 24 * 60 * 60 * 1000

/** One completed lesson is roughly forty minutes of teaching plus everything
 *  the app learned from it. Below that, a lost profile is a two-minute retype
 *  and not worth interrupting anyone over. */
export const MIN_LESSONS_TO_REMIND = 1

/** Completed lessons that may accumulate before asking again. Three is about
 *  a month of weekly teaching. */
export const LESSONS_BETWEEN_REMINDERS = 3

/** …or a month, provided at least one lesson happened in it. A backup that is
 *  old but still complete is not a risk. */
export const STALE_BACKUP_MS = 30 * DAY

/** How long "Not now" lasts. Long enough to be a real answer. */
export const SNOOZE_MS = 7 * DAY

const BACKUP_KEY = 'lastBackup'
const SNOOZE_KEY = 'backupSnoozeUntil'

/** What the last successful export covered. Versioned so a later change can
 *  migrate the record instead of silently reinterpreting it. */
export interface BackupRecord {
  v: 1
  /** When the file was produced. */
  at: number
  /** Completed lessons contained in it — the unit of "new work since". */
  completedLessons: number
}

/** What is on this device right now. */
export interface LocalDataStats {
  students: number
  completedLessons: number
}

export type ReminderReason = 'never' | 'lessons' | 'stale'

export interface BackupReminder {
  reason: ReminderReason
  /** Completed lessons not covered by any backup. */
  unbackedLessons: number
  /** When the last backup happened, if there has ever been one. */
  lastBackupAt?: number
}

/** A stored record from a future or hand-edited build is not trusted. Treating
 *  it as "no backup" errs toward reminding, which is the safe direction. */
function readRecord(): BackupRecord | null {
  const raw = read<unknown>(BACKUP_KEY, null)
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Partial<BackupRecord>
  if (r.v !== 1) return null
  if (typeof r.at !== 'number' || !Number.isFinite(r.at) || r.at <= 0) return null
  if (typeof r.completedLessons !== 'number' || !Number.isFinite(r.completedLessons)) return null
  return { v: 1, at: r.at, completedLessons: Math.max(0, Math.floor(r.completedLessons)) }
}

export function loadBackupRecord(): BackupRecord | null {
  return readRecord()
}

export function loadSnoozedUntil(): number {
  const raw = read<unknown>(SNOOZE_KEY, 0)
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : 0
}

export function snoozeBackupReminder(now = Date.now()): void {
  write(SNOOZE_KEY, now + SNOOZE_MS)
}

/** Record a backup that actually happened, and clear any snooze — the tutor
 *  has answered the question properly. */
export function recordBackup(completedLessons: number, now = Date.now()): void {
  const record: BackupRecord = { v: 1, at: now, completedLessons: Math.max(0, Math.floor(completedLessons)) }
  write(BACKUP_KEY, record)
  write(SNOOZE_KEY, 0)
}

/**
 * The whole decision, as a pure function — so the thresholds can be tested
 * without a browser, a clock or a database.
 */
export function evaluateBackupReminder(
  stats: LocalDataStats,
  record: BackupRecord | null,
  snoozedUntil: number,
  now = Date.now(),
): BackupReminder | null {
  if (stats.completedLessons < MIN_LESSONS_TO_REMIND) return null
  if (snoozedUntil > now) return null

  if (!record) {
    return { reason: 'never', unbackedLessons: stats.completedLessons }
  }

  /* A record claiming more lessons than the device holds means the database was
     cleared, or restored from an older file, since the export. The count is
     meaningless then, so say nothing rather than something wrong. */
  const unbacked = stats.completedLessons - record.completedLessons
  if (unbacked <= 0) return null

  if (unbacked >= LESSONS_BETWEEN_REMINDERS) {
    return { reason: 'lessons', unbackedLessons: unbacked, lastBackupAt: record.at }
  }
  if (now - record.at >= STALE_BACKUP_MS) {
    return { reason: 'stale', unbackedLessons: unbacked, lastBackupAt: record.at }
  }
  return null
}

/**
 * Export, hand the file to the browser, and record what it covered.
 *
 * The lesson count is taken from the file itself rather than from a second
 * database read, so the record can never claim to cover work the file does not
 * contain. If the download throws, nothing is recorded.
 */
export async function performBackup(now = Date.now()): Promise<void> {
  const backup = await exportBackup()
  downloadBackup(backup)
  recordBackup(backup.lessons.filter((l) => l.status === 'completed').length, now)
}
