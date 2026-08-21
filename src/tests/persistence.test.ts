import { describe, it, expect, beforeEach } from 'vitest'
import {
  putStudent,
  getStudent,
  getAllStudents,
  deleteStudent,
  putLearningModel,
  getLearningModel,
  putLesson,
  getLessonsForStudent,
  putCorrection,
  getCorrectionsForStudent,
  putAudio,
  getAudioMetaForStudent,
  getAudioBlob,
  deleteAudio,
  deleteAllAudioForStudent,
  clearAllData,
  _resetDBForTests,
} from '../data/db'
import { exportBackup, importBackup, validateBackup, BackupError } from '../data/backup'
import { initLearningModel } from '../students/learningModel'
import { StudentProfile, LessonRecord, Correction, AudioRecordingMeta } from '../types'
import { generateFirstLesson } from '../lessons/lessonGenerator'
import { blobToArrayBuffer } from '../utils/blob'

async function blobText(blob: Blob): Promise<string> {
  return new TextDecoder().decode(await blobToArrayBuffer(blob))
}

const now = 1_700_000_000_000

function student(id = 'stu1'): StudentProfile {
  return {
    id,
    createdAt: now,
    updatedAt: now,
    name: 'Test',
    age: 25,
    ageBand: 'adult',
    nativeLanguage: 'Russian',
    otherLanguages: [],
    interfaceLanguage: 'en',
    goals: ['conversation'],
    interests: [],
    speakingConfidence: 3,
    pronunciationImportance: 3,
  }
}

beforeEach(async () => {
  _resetDBForTests()
  await clearAllData()
})

/* ==========================================================================
   Legacy records outlive releases.
   --------------------------------------------------------------------------
   A profile saved when the picker offered a different set of languages — or a
   backup edited by hand — carries a tag this build does not ship. Left alone
   it indexes the dictionary with `undefined` and takes the screen down, so it
   is repaired on the way out of storage and on the way back in.
   ========================================================================== */
describe('legacy stored data', () => {
  it('repairs a profile whose language this build no longer ships', async () => {
    await putStudent({ ...student('legacy1'), interfaceLanguage: 'pt' as never })
    expect((await getStudent('legacy1'))?.interfaceLanguage).toBe('en')
    const all = await getAllStudents()
    expect(all.find((s) => s.id === 'legacy1')?.interfaceLanguage).toBe('en')
  })

  it('narrows a regional tag to the locale that ships', async () => {
    await putStudent({ ...student('legacy2'), interfaceLanguage: 'ru-RU' as never })
    expect((await getStudent('legacy2'))?.interfaceLanguage).toBe('ru')
  })

  it('repairs an imported backup too', async () => {
    const payload = {
      app: 'english-with-benji',
      version: 1,
      exportedAt: now,
      students: [{ ...student('legacy3'), interfaceLanguage: 'pt-BR' as never }],
      learningModels: [],
      lessons: [],
      corrections: [],
      audio: [],
    }
    await importBackup(payload)
    expect((await getStudent('legacy3'))?.interfaceLanguage).toBe('en')
  })

  it('leaves a supported language exactly as it is', async () => {
    await putStudent({ ...student('fine'), interfaceLanguage: 'he' })
    expect((await getStudent('fine'))?.interfaceLanguage).toBe('he')
  })
})

describe('IndexedDB persistence', () => {
  it('creates and reads a student', async () => {
    await putStudent(student())
    expect((await getStudent('stu1'))?.name).toBe('Test')
    expect(await getAllStudents()).toHaveLength(1)
  })

  it('stores and reads a learning model + lesson + correction', async () => {
    const s = student()
    await putStudent(s)
    const model = initLearningModel(s.id, 'A2', now)
    await putLearningModel(model)
    const plan = generateFirstLesson(s, model)
    const lesson: LessonRecord = {
      id: plan.id,
      studentId: s.id,
      plan,
      status: 'completed',
      currentPhaseIndex: 0,
      elapsedSeconds: 0,
      responses: [],
      correctionIds: [],
      audioIds: [],
      vocabularyAdded: [],
    }
    await putLesson(lesson)
    const corr: Correction = {
      id: 'c1',
      studentId: s.id,
      category: 'grammar',
      said: 'she go',
      better: 'she goes',
      priority: 'high',
      at: now,
    }
    await putCorrection(corr)

    expect((await getLearningModel(s.id))?.studentId).toBe(s.id)
    expect(await getLessonsForStudent(s.id)).toHaveLength(1)
    expect(await getCorrectionsForStudent(s.id)).toHaveLength(1)
  })

  it('stores audio metadata + blob and reads them back', async () => {
    const meta: AudioRecordingMeta = {
      id: 'a1',
      studentId: 'stu1',
      date: now,
      target: 'three',
      area: 'th',
      role: 'baseline',
      mimeType: 'audio/webm',
    }
    const blob = new Blob(['hello'], { type: 'audio/webm' })
    await putAudio(meta, blob)
    expect(await getAudioMetaForStudent('stu1')).toHaveLength(1)
    const got = await getAudioBlob('a1')
    expect(got).toBeInstanceOf(Blob)
    expect(await blobText(got!)).toBe('hello')

    await deleteAudio('a1')
    expect(await getAudioMetaForStudent('stu1')).toHaveLength(0)
    expect(await getAudioBlob('a1')).toBeUndefined()
  })

  it('deletes a student and cascades to lessons, corrections, audio', async () => {
    const s = student()
    await putStudent(s)
    await putLearningModel(initLearningModel(s.id, 'A1', now))
    const plan = generateFirstLesson(s, initLearningModel(s.id, 'A1', now))
    await putLesson({
      id: plan.id,
      studentId: s.id,
      plan,
      status: 'planned',
      currentPhaseIndex: 0,
      elapsedSeconds: 0,
      responses: [],
      correctionIds: [],
      audioIds: [],
      vocabularyAdded: [],
    })
    await putCorrection({ id: 'c1', studentId: s.id, category: 'grammar', said: 'x', better: 'y', priority: 'low', at: now })
    await putAudio(
      { id: 'a1', studentId: s.id, date: now, target: 't', area: 'r', role: 'practice', mimeType: 'audio/webm' },
      new Blob(['x']),
    )

    await deleteStudent(s.id)

    expect(await getStudent(s.id)).toBeUndefined()
    expect(await getLearningModel(s.id)).toBeUndefined()
    expect(await getLessonsForStudent(s.id)).toHaveLength(0)
    expect(await getCorrectionsForStudent(s.id)).toHaveLength(0)
    expect(await getAudioMetaForStudent(s.id)).toHaveLength(0)
    expect(await getAudioBlob('a1')).toBeUndefined()
  })

  it('deletes all audio for a student', async () => {
    await putAudio(
      { id: 'a1', studentId: 's', date: now, target: 't', area: 'r', role: 'practice', mimeType: 'audio/webm' },
      new Blob(['x']),
    )
    await putAudio(
      { id: 'a2', studentId: 's', date: now, target: 't', area: 'th', role: 'practice', mimeType: 'audio/webm' },
      new Blob(['y']),
    )
    await deleteAllAudioForStudent('s')
    expect(await getAudioMetaForStudent('s')).toHaveLength(0)
  })
})

describe('backup export / import', () => {
  it('round-trips students, models, lessons, corrections, and audio', async () => {
    const s = student('stu-backup')
    await putStudent(s)
    await putLearningModel(initLearningModel(s.id, 'B1', now))
    await putCorrection({ id: 'c1', studentId: s.id, category: 'grammar', said: 'a', better: 'b', priority: 'low', at: now })
    await putAudio(
      { id: 'a1', studentId: s.id, date: now, target: 'three', area: 'th', role: 'baseline', mimeType: 'audio/webm' },
      new Blob(['audio-bytes'], { type: 'audio/webm' }),
    )

    const backup = await exportBackup()
    expect(backup.students).toHaveLength(1)
    expect(backup.audio).toHaveLength(1)

    await clearAllData()
    expect(await getAllStudents()).toHaveLength(0)

    await importBackup(backup)
    expect(await getAllStudents()).toHaveLength(1)
    expect(await getCorrectionsForStudent(s.id)).toHaveLength(1)
    const restored = await getAudioBlob('a1')
    expect(await blobText(restored!)).toBe('audio-bytes')
  })

  it('rejects a backup from a different app, or a corrupt one', () => {
    expect(() => validateBackup(null)).toThrow(BackupError)
    expect(() => validateBackup({ app: 'other' })).toThrow(BackupError)
    expect(() => validateBackup({ app: 'english-with-benji', version: 1 })).toThrow(BackupError)
  })

  it('accepts a well-formed backup with empty arrays', () => {
    expect(() =>
      validateBackup({
        app: 'english-with-benji',
        version: 1,
        exportedAt: now,
        students: [],
        learningModels: [],
        lessons: [],
        corrections: [],
        audio: [],
      }),
    ).not.toThrow()
  })
})
