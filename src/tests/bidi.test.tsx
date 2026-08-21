/* ==========================================================================
   Regression tests for bidi isolation of embedded LTR content (English
   sentences, CEFR codes, free-text words) rendered inside Hebrew/RTL UI.
   --------------------------------------------------------------------------
   jsdom does not run the Unicode bidi algorithm, so these tests cannot see
   punctuation flip visually — they instead assert the semantic isolation
   markup (`<bdi>` / dir="ltr" / dir="auto") is actually present on the
   embedded content, which is what makes the browser render it correctly.
   Verified visually in real Chromium separately (see e2e/).
   ========================================================================== */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { I18nProvider } from '../i18n/I18nProvider'
import { SettingsProvider } from '../app/SettingsContext'
import { ToastProvider } from '../components/Toast'
import { Bdi } from '../components/Bdi'
import { MicroStepView } from '../tutor/MicroStepView'
import { TutorCardView } from '../tutor/TutorCardView'
import { SnapshotCard } from '../components/SnapshotCard'
import { MicroStep } from '../lessons/microSteps'
import { AssessmentSnapshot, TutorCard } from '../types'

function renderHebrew(children: React.ReactNode) {
  document.documentElement.dir = 'rtl'
  document.documentElement.lang = 'he'
  return render(
    <SettingsProvider>
      <I18nProvider initialLang="he">
        <ToastProvider>{children}</ToastProvider>
      </I18nProvider>
    </SettingsProvider>,
  )
}

describe('Bdi', () => {
  it('wraps its content in a semantic <bdi> element', () => {
    render(<Bdi>A1</Bdi>)
    const el = screen.getByText('A1')
    expect(el.tagName).toBe('BDI')
  })
})

describe('bidi isolation inside Hebrew (RTL) UI', () => {
  it('isolates an English sentence ending in punctuation (micro-step SAY line)', () => {
    const step: MicroStep = {
      id: 'ms-test',
      activityId: 'act-test',
      move: 'model',
      minutes: 3,
      now: 'Model the greeting.',
      say: ['Hello! I’m Binyamin.'],
      do: ['Point to yourself.'],
      studentDoes: ['Listens, then copies.'],
      lookFor: ['A confident greeting.'],
      help: ['Just wave.'],
      challenge: ['Add “How are you?”'],
      doneWhen: 'They greet you back.',
      next: 'Move to names.',
      studentKey: 'student.watchAndListen',
    }
    renderHebrew(<MicroStepView step={step} stepNumber={1} stepCount={3} />)

    const li = screen.getByText(/Hello! I’m Binyamin\./)
    // The full English sentence — including its trailing period — sits inside
    // an explicit dir="ltr" node, so the punctuation cannot be reordered by
    // the surrounding RTL paragraph direction.
    expect(li.closest('li')).toHaveAttribute('dir', 'ltr')
  })

  it('isolates an English word/phrase embedded inline in Hebrew prose (tutor card goal)', () => {
    const card: TutorCard = {
      goal: 'Practice the present perfect.',
      listenFor: [],
      ifStruggle: 'Model the sentence once more.',
      ifSucceed: 'Move to freer practice.',
      howToExplain: 'Compare to the simple past.',
      model: [],
      practice: [],
      avoid: [],
    }
    renderHebrew(<TutorCardView card={card} />)

    const goalText = screen.getByText('Practice the present perfect.')
    expect(goalText.closest('bdi')).not.toBeNull()

    // Hebrew label text ("מטרה") sits OUTSIDE the isolated English run, so the
    // isolation is scoped to just the embedded phrase, not the whole line.
    expect(screen.getByText('מטרה')).toBeInTheDocument()
  })

  it('isolates CEFR level codes shown next to a localized level name', () => {
    const snapshot: AssessmentSnapshot = {
      overallCEFR: 'B1',
      perSkill: { speaking: 'B1' },
      strongestSkill: 'speaking',
      priorities: ['לדייק דקדוק'],
    }
    renderHebrew(<SnapshotCard snapshot={snapshot} />)

    const levels = screen.getAllByText('B1')
    expect(levels.length).toBeGreaterThan(0)
    for (const level of levels) expect(level.tagName).toBe('BDI')
  })
})
