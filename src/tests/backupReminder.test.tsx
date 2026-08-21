/* ==========================================================================
   The backup reminder — thresholds, then the card that shows them.
   --------------------------------------------------------------------------
   Two things can go wrong with a reminder like this, and only one of them is
   obvious. The obvious one is staying silent while a tutor's whole history sits
   unbacked in a browser profile. The quiet one is crying wolf: a card that
   appears on every visit gets dismissed without reading, and then it is not a
   safety net, it is furniture. So the thresholds are asserted exactly, and
   "goes away and stays away" is tested as carefully as "appears".
   ========================================================================== */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AppProviders } from '../app/AppProviders'
import { App } from '../app/App'
import { _resetDBForTests, clearAllData, countLocalData, putLesson, putStudent } from '../data/db'
import { seedDemoStudent } from '../data/exampleData'
import {
  LESSONS_BETWEEN_REMINDERS,
  SNOOZE_MS,
  STALE_BACKUP_MS,
  evaluateBackupReminder,
  loadBackupRecord,
  loadSnoozedUntil,
  recordBackup,
  snoozeBackupReminder,
} from '../data/backupReminder'
import { LessonRecord, StudentProfile } from '../types'

const DAY = 24 * 60 * 60 * 1000
const NOW = 1_700_000_000_000

beforeEach(async () => {
  await _resetDBForTests()
  await clearAllData()
  localStorage.clear()
})

/* -------------------------------------------------------------------------- */
/* The decision                                                                */
/* -------------------------------------------------------------------------- */

describe('when the reminder is allowed to speak', () => {
  const backedUp = (at: number, lessons: number) => ({ v: 1 as const, at, completedLessons: lessons })

  it('says nothing on a device with nothing to lose', () => {
    expect(evaluateBackupReminder({ students: 0, completedLessons: 0 }, null, 0, NOW)).toBeNull()
    // A profile typed in but never taught is a few minutes of work, not a
    // history — not worth interrupting anyone over.
    expect(evaluateBackupReminder({ students: 3, completedLessons: 0 }, null, 0, NOW)).toBeNull()
  })

  it('speaks once the first lesson has actually been taught', () => {
    const r = evaluateBackupReminder({ students: 1, completedLessons: 1 }, null, 0, NOW)
    expect(r).toEqual({ reason: 'never', unbackedLessons: 1 })
  })

  it('goes quiet the moment a backup covers everything', () => {
    const stats = { students: 1, completedLessons: 4 }
    expect(evaluateBackupReminder(stats, backedUp(NOW - DAY, 4), 0, NOW)).toBeNull()
  })

  it('waits for three more lessons, not one', () => {
    const record = backedUp(NOW - DAY, 4)
    for (let extra = 1; extra < LESSONS_BETWEEN_REMINDERS; extra++) {
      expect(
        evaluateBackupReminder({ students: 1, completedLessons: 4 + extra }, record, 0, NOW),
        `${extra} new lessons`,
      ).toBeNull()
    }
    expect(
      evaluateBackupReminder(
        { students: 1, completedLessons: 4 + LESSONS_BETWEEN_REMINDERS },
        record,
        0,
        NOW,
      ),
    ).toEqual({ reason: 'lessons', unbackedLessons: LESSONS_BETWEEN_REMINDERS, lastBackupAt: record.at })
  })

  it('speaks after a month, but only if a lesson happened in it', () => {
    const old = backedUp(NOW - STALE_BACKUP_MS - DAY, 4)
    // Old backup, nothing new taught: the file is still complete. Silence.
    expect(evaluateBackupReminder({ students: 1, completedLessons: 4 }, old, 0, NOW)).toBeNull()
    expect(evaluateBackupReminder({ students: 1, completedLessons: 5 }, old, 0, NOW)).toEqual({
      reason: 'stale',
      unbackedLessons: 1,
      lastBackupAt: old.at,
    })
  })

  it('respects "not now" for a week and then asks again', () => {
    const stats = { students: 1, completedLessons: 2 }
    expect(evaluateBackupReminder(stats, null, NOW + SNOOZE_MS, NOW)).toBeNull()
    expect(evaluateBackupReminder(stats, null, NOW + 1, NOW)).toBeNull()
    expect(evaluateBackupReminder(stats, null, NOW, NOW)?.reason).toBe('never')
  })

  it('never claims something it cannot support', () => {
    // The record says it covered more lessons than the device now holds — the
    // database was cleared or rolled back since. Any count would be a lie, so
    // there is no message rather than a wrong one.
    const record = backedUp(NOW - STALE_BACKUP_MS - DAY, 9)
    expect(evaluateBackupReminder({ students: 1, completedLessons: 4 }, record, 0, NOW)).toBeNull()
  })
})

/* -------------------------------------------------------------------------- */
/* The stored record                                                           */
/* -------------------------------------------------------------------------- */

describe('the backup record itself', () => {
  it('round-trips and survives a reload', () => {
    recordBackup(6, NOW)
    expect(loadBackupRecord()).toEqual({ v: 1, at: NOW, completedLessons: 6 })
  })

  it('clears a pending snooze — the tutor answered the question properly', () => {
    snoozeBackupReminder(NOW)
    expect(loadSnoozedUntil()).toBe(NOW + SNOOZE_MS)
    recordBackup(2, NOW)
    expect(loadSnoozedUntil()).toBe(0)
  })

  it('treats a record it cannot trust as no record at all', () => {
    // Erring toward reminding is the safe direction: the worst case is one
    // extra card, versus silently claiming a backup that never happened.
    for (const junk of [
      '"nonsense"',
      '{"v":2,"at":1,"completedLessons":1}',
      '{"v":1,"completedLessons":3}',
      '{"v":1,"at":"yesterday","completedLessons":3}',
      '{"v":1,"at":0,"completedLessons":3}',
      'not json at all',
    ]) {
      localStorage.setItem('ewb:lastBackup', junk)
      expect(loadBackupRecord(), junk).toBeNull()
    }
  })

  it('reads nothing as never-backed-up, which is what a legacy install is', () => {
    expect(loadBackupRecord()).toBeNull()
    expect(loadSnoozedUntil()).toBe(0)
  })
})

/* -------------------------------------------------------------------------- */
/* Counting what is actually on the device                                     */
/* -------------------------------------------------------------------------- */

describe('counting local data', () => {
  it('counts completed lessons only — a planned one is not history yet', async () => {
    const id = await seedDemoStudent('jordan')
    const before = await countLocalData()
    expect(before).toEqual({ students: 1, completedLessons: 1 })

    await putLesson({
      id: 'planned1',
      studentId: id,
      status: 'planned',
      currentPhaseIndex: 0,
      elapsedSeconds: 0,
      responses: [],
      correctionIds: [],
      audioIds: [],
      vocabularyAdded: [],
      plan: {
        id: 'planned1',
        studentId: id,
        createdAt: NOW,
        label: 'Next',
        objective: { ref: 'g_present_be', title: 'x', rationale: 'y' },
        phases: [],
        totalMinutes: 50,
        source: 'generated',
      },
    } as LessonRecord)

    expect(await countLocalData()).toEqual({ students: 1, completedLessons: 1 })
  })

  it('survives a legacy record with no status field', async () => {
    // Rows written by an early build, or restored from a hand-edited backup,
    // must not throw the count that decides whether to remind.
    await putStudent({ id: 'legacy', name: 'Old', createdAt: NOW, updatedAt: NOW } as StudentProfile)
    await putLesson({ id: 'legacyLesson', studentId: 'legacy', plan: {} } as unknown as LessonRecord)
    expect(await countLocalData()).toEqual({ students: 1, completedLessons: 0 })
  })
})

/* -------------------------------------------------------------------------- */
/* The card                                                                    */
/* -------------------------------------------------------------------------- */

function renderTutorHome() {
  localStorage.setItem(
    'ewb:settings',
    JSON.stringify({ tutorUnlocked: true, mode: 'tutor', language: 'en' }),
  )
  return render(
    <MemoryRouter initialEntries={['/tutor']}>
      <AppProviders>
        <App />
      </AppProviders>
    </MemoryRouter>,
  )
}

describe('the reminder card on the students list', () => {
  it('is absent on a device with no lessons', async () => {
    renderTutorHome()
    await screen.findByRole('heading', { name: /^students$/i })
    expect(screen.queryByRole('region', { name: /back up your students/i })).toBeNull()
  })

  it('appears once there is a taught lesson and no backup has ever been made', async () => {
    await seedDemoStudent('jordan')
    renderTutorHome()

    const card = await screen.findByRole('region', { name: /back up your students/i })
    expect(card).toHaveTextContent(/nothing on this device has been backed up yet/i)
    // It says where the data actually lives, without dressing it as an alarm.
    expect(card).toHaveTextContent(/this browser, on this device only/i)
    expect(screen.getByRole('button', { name: /back up now/i })).toBeInTheDocument()
  })

  it('disappears after a successful backup, and stays gone on the next visit', async () => {
    const user = userEvent.setup()
    // downloadBackup reaches for URL.createObjectURL, which jsdom does not have.
    const createObjectURL = vi.fn(() => 'blob:test')
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() }))

    await seedDemoStudent('jordan')
    const { unmount } = renderTutorHome()
    await screen.findByRole('region', { name: /back up your students/i })

    await user.click(screen.getByRole('button', { name: /back up now/i }))
    await waitFor(() =>
      expect(screen.queryByRole('region', { name: /back up your students/i })).toBeNull(),
    )
    expect(createObjectURL).toHaveBeenCalled()
    // And the fact was written down, not just hidden in component state.
    expect(loadBackupRecord()).toMatchObject({ v: 1, completedLessons: 1 })

    unmount()
    renderTutorHome()
    await screen.findByRole('heading', { name: /^students$/i })
    expect(screen.queryByRole('region', { name: /back up your students/i })).toBeNull()
  })

  it('“Not now” dismisses it for this visit and the next', async () => {
    const user = userEvent.setup()
    await seedDemoStudent('jordan')
    const { unmount } = renderTutorHome()
    await screen.findByRole('region', { name: /back up your students/i })

    await user.click(screen.getByRole('button', { name: /not now/i }))
    expect(screen.queryByRole('region', { name: /back up your students/i })).toBeNull()
    expect(loadSnoozedUntil()).toBeGreaterThan(Date.now())

    unmount()
    renderTutorHome()
    await screen.findByRole('heading', { name: /^students$/i })
    expect(screen.queryByRole('region', { name: /back up your students/i })).toBeNull()
  })

  it('comes back once enough new lessons have piled up', async () => {
    const id = await seedDemoStudent('jordan')
    // One backup, taken now, covering the single lesson on the device.
    recordBackup(1)
    for (let i = 0; i < LESSONS_BETWEEN_REMINDERS; i++) {
      await putLesson({
        id: `extra${i}`,
        studentId: id,
        status: 'completed',
        completedAt: Date.now(),
        currentPhaseIndex: 0,
        elapsedSeconds: 3000,
        responses: [],
        correctionIds: [],
        audioIds: [],
        vocabularyAdded: [],
        plan: {
          id: `extra${i}`,
          studentId: id,
          createdAt: Date.now(),
          label: `Extra ${i}`,
          objective: { ref: 'g_present_be', title: 'x', rationale: 'y' },
          phases: [],
          totalMinutes: 50,
          source: 'generated',
        },
      } as LessonRecord)
    }

    renderTutorHome()
    const card = await screen.findByRole('region', { name: /back up your students/i })
    expect(card).toHaveTextContent(
      new RegExp(`${LESSONS_BETWEEN_REMINDERS} lessons have been taught`, 'i'),
    )
  })

  it('never appears on a shared or handed-over screen', async () => {
    // Backing up is an admin action. The card is on a tutor-only route already,
    // so this is belt and braces — and it is the cheap kind.
    await seedDemoStudent('jordan')
    localStorage.setItem(
      'ewb:settings',
      JSON.stringify({ tutorUnlocked: true, mode: 'student', language: 'en' }),
    )
    render(
      <MemoryRouter initialEntries={['/tutor']}>
        <AppProviders>
          <App />
        </AppProviders>
      </MemoryRouter>,
    )
    await screen.findByRole('heading', { name: /not available in this mode/i })
    expect(screen.queryByRole('region', { name: /back up your students/i })).toBeNull()
  })
})
