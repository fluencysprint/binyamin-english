/* ==========================================================================
   IndexedDB access layer (via idb)
   --------------------------------------------------------------------------
   All structured student data + audio blobs live here. localStorage is used
   only for lightweight settings/session recovery (see settings.ts).
   ========================================================================== */

import { openDB, IDBPDatabase } from 'idb'
import {
  AudioBlobRecord,
  AudioRecordingMeta,
  Correction,
  LearningModel,
  LessonRecord,
  StudentProfile,
} from '../types'
import { blobToArrayBuffer } from '../utils/blob'
import { normalizeUILanguage } from '../locales'

// Deliberately left unchanged across the "Binyamin English" rebrand: this is
// an internal IndexedDB database name, invisible to users. Renaming it would
// orphan every existing student's data behind the old name with no benefit.
const DB_NAME = 'english-with-benji'
const DB_VERSION = 1

export const STORES = {
  students: 'students',
  learningModels: 'learningModels',
  lessons: 'lessons',
  corrections: 'corrections',
  audioMeta: 'audioMeta',
  audioBlobs: 'audioBlobs',
} as const

let dbPromise: Promise<IDBPDatabase> | null = null

export function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORES.students)) {
          db.createObjectStore(STORES.students, { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains(STORES.learningModels)) {
          db.createObjectStore(STORES.learningModels, { keyPath: 'studentId' })
        }
        if (!db.objectStoreNames.contains(STORES.lessons)) {
          const s = db.createObjectStore(STORES.lessons, { keyPath: 'id' })
          s.createIndex('byStudent', 'studentId')
        }
        if (!db.objectStoreNames.contains(STORES.corrections)) {
          const s = db.createObjectStore(STORES.corrections, { keyPath: 'id' })
          s.createIndex('byStudent', 'studentId')
        }
        if (!db.objectStoreNames.contains(STORES.audioMeta)) {
          const s = db.createObjectStore(STORES.audioMeta, { keyPath: 'id' })
          s.createIndex('byStudent', 'studentId')
        }
        if (!db.objectStoreNames.contains(STORES.audioBlobs)) {
          db.createObjectStore(STORES.audioBlobs, { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

/** Test hook — reset the memoised connection (used with fake-indexeddb). */
export function _resetDBForTests(): void {
  dbPromise = null
}

/* ---- Students ---- */
export async function putStudent(s: StudentProfile): Promise<void> {
  await (await getDB()).put(STORES.students, s)
}
export async function getStudent(id: string): Promise<StudentProfile | undefined> {
  const student = await (await getDB()).get(STORES.students, id)
  return student && normalizeStudent(student)
}
export async function getAllStudents(): Promise<StudentProfile[]> {
  return ((await getDB()).getAll(STORES.students) as Promise<StudentProfile[]>).then((all) =>
    all.map(normalizeStudent),
  )
}

/** Records outlive releases. A profile stored with a language this build no
 *  longer ships is repaired on the way out of storage rather than left to
 *  index the dictionary with `undefined`. */
export function normalizeStudent(student: StudentProfile): StudentProfile {
  const interfaceLanguage = normalizeUILanguage(student.interfaceLanguage)
  return interfaceLanguage === student.interfaceLanguage ? student : { ...student, interfaceLanguage }
}
export async function deleteStudent(id: string): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(
    [
      STORES.students,
      STORES.learningModels,
      STORES.lessons,
      STORES.corrections,
      STORES.audioMeta,
      STORES.audioBlobs,
    ],
    'readwrite',
  )
  await tx.objectStore(STORES.students).delete(id)
  await tx.objectStore(STORES.learningModels).delete(id)
  for (const store of [STORES.lessons, STORES.corrections, STORES.audioMeta] as const) {
    const idx = tx.objectStore(store).index('byStudent')
    let cursor = await idx.openCursor(IDBKeyRange.only(id))
    const audioIds: string[] = []
    while (cursor) {
      if (store === STORES.audioMeta) audioIds.push((cursor.value as AudioRecordingMeta).id)
      await cursor.delete()
      cursor = await cursor.continue()
    }
    if (store === STORES.audioMeta) {
      const blobs = tx.objectStore(STORES.audioBlobs)
      for (const aid of audioIds) await blobs.delete(aid)
    }
  }
  await tx.done
}

/* ---- Learning models ---- */
export async function putLearningModel(m: LearningModel): Promise<void> {
  await (await getDB()).put(STORES.learningModels, m)
}
export async function getLearningModel(studentId: string): Promise<LearningModel | undefined> {
  return (await getDB()).get(STORES.learningModels, studentId)
}

/* ---- Lessons ---- */
export async function putLesson(l: LessonRecord): Promise<void> {
  await (await getDB()).put(STORES.lessons, l)
}
export async function getLesson(id: string): Promise<LessonRecord | undefined> {
  return (await getDB()).get(STORES.lessons, id)
}
export async function getLessonsForStudent(studentId: string): Promise<LessonRecord[]> {
  const all = (await (await getDB()).getAllFromIndex(
    STORES.lessons,
    'byStudent',
    IDBKeyRange.only(studentId),
  )) as LessonRecord[]
  return all.sort((a, b) => (b.plan.createdAt ?? 0) - (a.plan.createdAt ?? 0))
}

/* ---- Corrections ---- */
export async function putCorrection(c: Correction): Promise<void> {
  await (await getDB()).put(STORES.corrections, c)
}
export async function getCorrectionsForStudent(studentId: string): Promise<Correction[]> {
  return (await (await getDB()).getAllFromIndex(
    STORES.corrections,
    'byStudent',
    IDBKeyRange.only(studentId),
  )) as Correction[]
}
export async function deleteCorrection(id: string): Promise<void> {
  await (await getDB()).delete(STORES.corrections, id)
}

/* ---- Audio ---- */
export async function putAudio(meta: AudioRecordingMeta, blob: Blob): Promise<void> {
  // Convert before opening the transaction — awaiting inside a tx closes it.
  const data = await blobToArrayBuffer(blob)
  const record: AudioBlobRecord = { id: meta.id, data, type: blob.type || meta.mimeType }
  const db = await getDB()
  const tx = db.transaction([STORES.audioMeta, STORES.audioBlobs], 'readwrite')
  await tx.objectStore(STORES.audioMeta).put(meta)
  await tx.objectStore(STORES.audioBlobs).put(record)
  await tx.done
}
export async function getAudioMetaForStudent(studentId: string): Promise<AudioRecordingMeta[]> {
  const all = (await (await getDB()).getAllFromIndex(
    STORES.audioMeta,
    'byStudent',
    IDBKeyRange.only(studentId),
  )) as AudioRecordingMeta[]
  return all.sort((a, b) => b.date - a.date)
}
export async function getAudioBlob(id: string): Promise<Blob | undefined> {
  const rec = (await (await getDB()).get(STORES.audioBlobs, id)) as AudioBlobRecord | undefined
  return rec ? new Blob([rec.data], { type: rec.type }) : undefined
}
export async function updateAudioMeta(meta: AudioRecordingMeta): Promise<void> {
  await (await getDB()).put(STORES.audioMeta, meta)
}
export async function deleteAudio(id: string): Promise<void> {
  const db = await getDB()
  const tx = db.transaction([STORES.audioMeta, STORES.audioBlobs], 'readwrite')
  await tx.objectStore(STORES.audioMeta).delete(id)
  await tx.objectStore(STORES.audioBlobs).delete(id)
  await tx.done
}
export async function deleteAllAudioForStudent(studentId: string): Promise<void> {
  const metas = await getAudioMetaForStudent(studentId)
  const db = await getDB()
  const tx = db.transaction([STORES.audioMeta, STORES.audioBlobs], 'readwrite')
  for (const m of metas) {
    await tx.objectStore(STORES.audioMeta).delete(m.id)
    await tx.objectStore(STORES.audioBlobs).delete(m.id)
  }
  await tx.done
}

/* ---- Local-data summary ---- */

/**
 * How much irreplaceable work is on this device, for the backup reminder.
 *
 * Only lessons are read in full — the count that matters is of COMPLETED ones,
 * which a key range cannot express. Everything else is a store count.
 */
export async function countLocalData(): Promise<{ students: number; completedLessons: number }> {
  const db = await getDB()
  const lessons = (await db.getAll(STORES.lessons)) as LessonRecord[]
  return {
    students: await db.count(STORES.students),
    completedLessons: lessons.filter((l) => l?.status === 'completed').length,
  }
}

/* ---- Danger zone ---- */
export async function clearAllData(): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(Object.values(STORES), 'readwrite')
  for (const store of Object.values(STORES)) {
    await tx.objectStore(store).clear()
  }
  await tx.done
}
