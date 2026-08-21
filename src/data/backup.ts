/* ==========================================================================
   Backup / restore — full local export & import as a single JSON file.
   Audio blobs are embedded as base64 data URLs so a backup is self-contained.
   ========================================================================== */

import {
  AudioRecordingMeta,
  Correction,
  LearningModel,
  LessonRecord,
  StudentProfile,
} from '../types'
import {
  STORES,
  getDB,
  getAudioBlob,
  putStudent,
  normalizeStudent,
  putLearningModel,
  putLesson,
  putCorrection,
  putAudio,
} from './db'
import { blobToArrayBuffer } from '../utils/blob'

export const BACKUP_VERSION = 1

export interface BackupFile {
  app: 'english-with-benji'
  version: number
  exportedAt: number
  students: StudentProfile[]
  learningModels: LearningModel[]
  lessons: LessonRecord[]
  corrections: Correction[]
  audio: { meta: AudioRecordingMeta; dataUrl: string }[]
}

// FileReader + fetch(data:) are avoided so this works identically in browsers
// and test environments. Base64 is chunked to stay within call-stack limits.
function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blobToArrayBuffer(blob))
  const type = blob.type || 'application/octet-stream'
  return `data:${type};base64,${bytesToBase64(bytes)}`
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const match = /^data:([^;]*);base64,(.*)$/s.exec(dataUrl)
  if (!match) throw new BackupError('Malformed audio data in backup.')
  const [, type, b64] = match
  const bytes = base64ToBytes(b64)
  return new Blob([bytes as BlobPart], { type: type || 'application/octet-stream' })
}

export async function exportBackup(): Promise<BackupFile> {
  const db = await getDB()
  const students = (await db.getAll(STORES.students)) as StudentProfile[]
  const learningModels = (await db.getAll(STORES.learningModels)) as LearningModel[]
  const lessons = (await db.getAll(STORES.lessons)) as LessonRecord[]
  const corrections = (await db.getAll(STORES.corrections)) as Correction[]
  const metas = (await db.getAll(STORES.audioMeta)) as AudioRecordingMeta[]

  const audio: BackupFile['audio'] = []
  for (const meta of metas) {
    const blob = await getAudioBlob(meta.id)
    if (blob) audio.push({ meta, dataUrl: await blobToDataUrl(blob) })
  }

  return {
    app: 'english-with-benji',
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    students,
    learningModels,
    lessons,
    corrections,
    audio,
  }
}

export class BackupError extends Error {}

/** A record is only importable if it has the primary key its store is built on
 *  — without it `put` throws deep inside IndexedDB with an opaque message. */
function hasStringId(value: unknown, key = 'id'): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>)[key] === 'string' &&
    (value as Record<string, unknown>)[key] !== ''
  )
}

export function validateBackup(data: unknown): asserts data is BackupFile {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new BackupError('Not a valid backup file.')
  }
  const d = data as Partial<BackupFile>
  // The internal format id is unchanged across the rebrand ('english-with-benji')
  // so backups exported before or after it remain interchangeable.
  if (d.app !== 'english-with-benji') throw new BackupError('This file is not a Binyamin English backup.')
  if (typeof d.version !== 'number' || !Number.isFinite(d.version)) {
    throw new BackupError('Backup is missing a version.')
  }
  if (d.version > BACKUP_VERSION) throw new BackupError('Backup was made by a newer version of the app.')
  for (const key of ['students', 'learningModels', 'lessons', 'corrections'] as const) {
    if (!Array.isArray(d[key])) throw new BackupError(`Backup is missing "${key}".`)
  }
  if (d.audio && !Array.isArray(d.audio)) throw new BackupError('Backup "audio" is malformed.')
}

/** What an import actually did — surfaced so a partly-corrupt file reports
 *  honestly instead of claiming a clean restore. */
export interface ImportSummary {
  students: number
  learningModels: number
  lessons: number
  corrections: number
  audio: number
  /** Entries dropped because they were structurally unusable. */
  skipped: number
}

/**
 * Import a backup. Existing records with matching ids are overwritten.
 *
 * Every entry is shape-checked before it reaches IndexedDB: a file that has
 * been hand-edited, truncated, or assembled by something else can contain
 * nulls, arrays where objects belong, or records with no id. Those are counted
 * and skipped so one bad row cannot abort a restore that is otherwise fine.
 */
export async function importBackup(data: unknown): Promise<ImportSummary> {
  validateBackup(data)
  const summary: ImportSummary = {
    students: 0,
    learningModels: 0,
    lessons: 0,
    corrections: 0,
    audio: 0,
    skipped: 0,
  }

  const restore = async <T>(
    rows: unknown[],
    isUsable: (row: unknown) => boolean,
    put: (row: T) => Promise<unknown>,
    counter: keyof ImportSummary,
  ) => {
    for (const row of rows) {
      if (!isUsable(row)) {
        summary.skipped += 1
        continue
      }
      try {
        await put(row as T)
        summary[counter] += 1
      } catch {
        summary.skipped += 1
      }
    }
  }

  /* Imported profiles are normalized on the way IN as well as on the way out:
     a backup taken from another build can carry a language this one does not
     ship. */
  await restore<StudentProfile>(
    data.students,
    (r) => hasStringId(r),
    (s) => putStudent(normalizeStudent(s)),
    'students',
  )
  await restore<LearningModel>(
    data.learningModels,
    (r) => hasStringId(r, 'studentId'),
    putLearningModel,
    'learningModels',
  )
  await restore<LessonRecord>(
    data.lessons,
    (r) => hasStringId(r) && typeof (r as LessonRecord).plan === 'object' && (r as LessonRecord).plan !== null,
    putLesson,
    'lessons',
  )
  await restore<Correction>(data.corrections, (r) => hasStringId(r), putCorrection, 'corrections')

  for (const entry of data.audio ?? []) {
    if (!entry || typeof entry !== 'object' || typeof entry.dataUrl !== 'string' || !hasStringId(entry.meta)) {
      summary.skipped += 1
      continue
    }
    try {
      await putAudio(entry.meta, await dataUrlToBlob(entry.dataUrl))
      summary.audio += 1
    } catch {
      // Skip a single corrupt recording rather than failing the whole import.
      summary.skipped += 1
    }
  }

  return summary
}

export function downloadBackup(backup: BackupFile): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date(backup.exportedAt).toISOString().slice(0, 10)
  a.href = url
  a.download = `binyamin-english-backup-${stamp}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
