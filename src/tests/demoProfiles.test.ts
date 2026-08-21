import { describe, it, expect, beforeEach } from 'vitest'
import { clearAllData, _resetDBForTests } from '../data/db'
import { listStudents, loadStudentBundle } from '../students/studentService'
import { DEMO_PROFILES, seedDemoStudent } from '../data/exampleData'
import { AGE_BANDS, CEFR_LEVELS } from '../types'

beforeEach(async () => {
  localStorage.clear()
  _resetDBForTests()
  await clearAllData()
})

describe('demo profiles', () => {
  it('covers a spread of ages, age bands, levels, and native languages, not one repeated template', () => {
    const ages = new Set(DEMO_PROFILES.map((p) => p.input.age))
    const bands = new Set(DEMO_PROFILES.map((p) => p.ageBand))
    const levels = new Set(DEMO_PROFILES.map((p) => p.level))
    const languages = new Set(DEMO_PROFILES.map((p) => p.input.nativeLanguage))
    const names = new Set(DEMO_PROFILES.map((p) => p.name))

    expect(DEMO_PROFILES.length).toBeGreaterThanOrEqual(6)
    expect(names.size).toBe(DEMO_PROFILES.length)
    expect(ages.size).toBe(DEMO_PROFILES.length)
    expect(bands.size).toBeGreaterThan(1)
    expect(languages.size).toBe(DEMO_PROFILES.length)
    // At least Pre-A1 and something advanced (B2/C1) are represented.
    expect(levels.has('preA1')).toBe(true)
    expect([...levels].some((l) => l === 'B2' || l === 'C1')).toBe(true)

    for (const p of DEMO_PROFILES) {
      expect(AGE_BANDS).toContain(p.ageBand)
      expect(CEFR_LEVELS).toContain(p.level)
    }
  })

  it('includes a true Pre-A1 non-reading child and an older complete-beginner adult', () => {
    const child = DEMO_PROFILES.find((p) => p.ageBand === '6-8' && p.level === 'preA1')
    expect(child).toBeDefined()
    expect(child!.input.englishReading).toBe('cannot')

    const olderBeginner = DEMO_PROFILES.find((p) => p.ageBand === 'adult' && p.level === 'preA1')
    expect(olderBeginner).toBeDefined()
    expect(olderBeginner!.input.age).toBeGreaterThan(50)
  })

  it('seeds every profile as a distinct student without touching any other student', async () => {
    const ids: string[] = []
    for (const p of DEMO_PROFILES) {
      const id = await seedDemoStudent(p.id)
      ids.push(id)
    }

    expect(new Set(ids).size).toBe(DEMO_PROFILES.length)

    const all = await listStudents()
    expect(all.length).toBe(DEMO_PROFILES.length)

    for (let i = 0; i < DEMO_PROFILES.length; i++) {
      const bundle = await loadStudentBundle(ids[i])
      expect(bundle!.student.name).toBe(DEMO_PROFILES[i].name)
    }
  })

  it('adding one demo student does not alter an already-seeded one', async () => {
    const firstId = await seedDemoStudent(DEMO_PROFILES[0].id)
    const before = (await loadStudentBundle(firstId))!.student.updatedAt

    await seedDemoStudent(DEMO_PROFILES[1].id)

    const after = (await loadStudentBundle(firstId))!.student.updatedAt
    expect(after).toBe(before)
    expect((await listStudents()).length).toBe(2)
  })

  it('throws on an unknown profile id instead of silently seeding something', async () => {
    await expect(seedDemoStudent('does-not-exist')).rejects.toThrow()
  })
})
