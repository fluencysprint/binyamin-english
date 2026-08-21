/* ==========================================================================
   Imported backups are the one place this app reads a file it did not write.
   --------------------------------------------------------------------------
   The file can have been hand-edited, truncated mid-write, produced by a
   different tool, or simply be the wrong file entirely. None of those should
   throw an opaque IndexedDB error at the tutor, and none should abort a
   restore that is otherwise fine — a corrupt recording must not cost someone
   their students.
   ========================================================================== */

import { describe, it, expect, beforeEach } from 'vitest'
import { BACKUP_VERSION, BackupError, exportBackup, importBackup, validateBackup } from '../data/backup'
import { _resetDBForTests, clearAllData, getAllStudents, getLessonsForStudent } from '../data/db'
import { StudentProfile } from '../types'

const now = 1_700_000_000_000

function student(id: string, over: Partial<StudentProfile> = {}): StudentProfile {
  return {
    id,
    createdAt: now,
    updatedAt: now,
    name: 'Sam',
    age: 30,
    ageBand: 'adult',
    nativeLanguage: 'Russian',
    otherLanguages: [],
    interfaceLanguage: 'en',
    goals: [],
    interests: [],
    speakingConfidence: 3,
    pronunciationImportance: 3,
    ...over,
  }
}

function backup(over: Record<string, unknown> = {}) {
  return {
    app: 'english-with-benji',
    version: BACKUP_VERSION,
    exportedAt: now,
    students: [],
    learningModels: [],
    lessons: [],
    corrections: [],
    audio: [],
    ...over,
  }
}

beforeEach(async () => {
  await _resetDBForTests()
  await clearAllData()
})

describe('validateBackup rejects files that are not backups', () => {
  const rejected: [string, unknown][] = [
    ['null', null],
    ['undefined', undefined],
    ['a number', 42],
    ['a string', '{"app":"english-with-benji"}'],
    ['an array', [{ app: 'english-with-benji' }]],
    ['an empty object', {}],
    ['a different app', backup({ app: 'some-other-app' })],
    ['no version', backup({ version: undefined })],
    ['a non-numeric version', backup({ version: '1' })],
    ['a NaN version', backup({ version: NaN })],
    ['a newer version', backup({ version: BACKUP_VERSION + 1 })],
    ['students missing', backup({ students: undefined })],
    ['students as an object', backup({ students: {} })],
    ['lessons missing', backup({ lessons: undefined })],
    ['corrections missing', backup({ corrections: undefined })],
    ['audio as an object', backup({ audio: {} })],
  ]

  for (const [label, value] of rejected) {
    it(`rejects ${label}`, () => {
      expect(() => validateBackup(value)).toThrow(BackupError)
    })
  }

  it('accepts a well-formed empty backup', () => {
    expect(() => validateBackup(backup())).not.toThrow()
  })

  it('accepts a backup with no audio key at all', () => {
    expect(() => validateBackup(backup({ audio: undefined }))).not.toThrow()
  })
})

describe('importBackup survives partly-corrupt files', () => {
  it('skips records with no id instead of throwing', async () => {
    const summary = await importBackup(
      backup({
        students: [student('s1'), { name: 'no id' }, null, 'not an object', { id: '' }],
      }),
    )
    expect(summary.students).toBe(1)
    expect(summary.skipped).toBe(4)
    const stored = await getAllStudents()
    expect(stored.map((s) => s.id)).toEqual(['s1'])
  })

  it('skips a lesson with no plan rather than storing an unusable record', async () => {
    const good = {
      id: 'l1',
      studentId: 's1',
      plan: { id: 'l1', studentId: 's1', createdAt: now, label: 'L', objective: {}, phases: [], totalMinutes: 50, source: 'manual' },
      status: 'completed',
      currentPhaseIndex: 0,
      elapsedSeconds: 0,
      responses: [],
      correctionIds: [],
      audioIds: [],
      vocabularyAdded: [],
    }
    const summary = await importBackup(
      backup({ students: [student('s1')], lessons: [good, { id: 'l2', studentId: 's1' }, { plan: {} }] }),
    )
    expect(summary.lessons).toBe(1)
    expect(summary.skipped).toBe(2)
    expect(await getLessonsForStudent('s1')).toHaveLength(1)
  })

  it('skips a corrupt recording without losing the students in the same file', async () => {
    const summary = await importBackup(
      backup({
        students: [student('s1'), student('s2')],
        audio: [
          { meta: { id: 'a1', studentId: 's1' }, dataUrl: 'not-a-data-url' },
          { meta: { id: 'a2', studentId: 's1' } },
          { dataUrl: 'data:audio/webm;base64,AAAA' },
        ],
      }),
    )
    expect(summary.students).toBe(2)
    expect(summary.audio).toBe(0)
    expect(summary.skipped).toBe(3)
    expect(await getAllStudents()).toHaveLength(2)
  })

  it('reports an honest count so a partial restore is not announced as a clean one', async () => {
    const summary = await importBackup(
      backup({ students: [student('s1'), {}], corrections: [{ id: 'c1', studentId: 's1' }, {}] }),
    )
    expect(summary.students).toBe(1)
    expect(summary.corrections).toBe(1)
    expect(summary.skipped).toBe(2)
  })

  it('imports a learning model keyed by studentId, not id', async () => {
    const summary = await importBackup(
      backup({
        students: [student('s1')],
        learningModels: [{ studentId: 's1', skillEstimates: {}, updatedAt: now }, { id: 'nope' }],
      }),
    )
    expect(summary.learningModels).toBe(1)
    expect(summary.skipped).toBe(1)
  })
})

describe('round trip', () => {
  it('exports what was imported, including international names', async () => {
    await importBackup(
      backup({
        students: [
          student('s1', { name: 'בנימין' }),
          student('s2', { name: 'Биньямин' }),
          student('s3', { name: 'José Muñoz' }),
        ],
      }),
    )
    const exported = await exportBackup()
    expect(exported.app).toBe('english-with-benji')
    expect(exported.students.map((s) => s.name).sort()).toEqual(['José Muñoz', 'Биньямин', 'בנימין'].sort())
    // And the export re-validates as a backup.
    expect(() => validateBackup(exported)).not.toThrow()
  })
})
