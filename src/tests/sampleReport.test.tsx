/* ==========================================================================
   The public sample lesson report — proof of the deliverable in the funnel.
   --------------------------------------------------------------------------
   Three things must hold: the fixture can never collide with a real record,
   the page always reads as a labeled sample rather than a real result, and it
   only shows what a learner's own copy of a report actually contains (no
   parent/diagnostic section — see ModeAccess.diagnostics and ReportView's
   `parentSection` prop).
   ========================================================================== */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppProviders } from '../app/AppProviders'
import { SampleReportPage } from '../pages/SampleReportPage'
import { SAMPLE_LESSON_REPORT } from '../reports/sampleReport'
import { UI_LANGUAGES, UILanguage } from '../types'
import { locales } from '../locales'
import { flatten } from '../i18n/dict'
import { DEFAULT_SETTINGS, saveSettings } from '../data/settings'

beforeEach(() => {
  localStorage.clear()
})

function renderSample(lang: UILanguage = 'en') {
  saveSettings({ ...DEFAULT_SETTINGS, language: lang })
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppProviders>
        <SampleReportPage />
      </AppProviders>
    </MemoryRouter>,
  )
}

describe('the sample lesson report fixture', () => {
  it('uses IDs that can never collide with a real student or lesson record', () => {
    expect(SAMPLE_LESSON_REPORT.studentId).toBe('sample-student')
    expect(SAMPLE_LESSON_REPORT.lessonId).toBe('sample-lesson')
  })

  it('carries no parent section — only what a learner\'s own report contains', () => {
    expect(SAMPLE_LESSON_REPORT.parent).toBeUndefined()
  })

  it('is a plain data fixture, not wired to student storage', () => {
    // Guards against a future edit reaching into IndexedDB / the real
    // roster — the sample must stay a static object.
    const src = readFileSync(join(process.cwd(), 'src/reports/sampleReport.ts'), 'utf-8')
    expect(src).not.toMatch(/studentService|loadStudentBundle|idb|indexedDB/i)
  })
})

describe('sample lesson report page', () => {
  it('labels itself a sample everywhere, and never as a real student', () => {
    renderSample('en')
    expect(screen.getAllByText('Sample lesson report').length).toBeGreaterThan(0)
    expect(screen.getByText(/fictional example/i)).toBeInTheDocument()
    expect(screen.getByText(/not a testimonial/i)).toBeInTheDocument()
  })

  it('shows the learner-facing report content: focus, corrections, vocabulary, homework, next focus', () => {
    renderSample('en')
    expect(screen.getAllByText(/Talking about last weekend/).length).toBeGreaterThan(0)
    expect(screen.getByText("I went to my cousin's house")).toBeInTheDocument()
    expect(screen.getByText('actually')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Homework' })).toBeInTheDocument()
    expect(screen.getByText(/Irregular past tense verbs/)).toBeInTheDocument()
  })

  it('never renders the parent/diagnostic section — real parents do not see it on a screen either', () => {
    renderSample('en')
    expect(screen.queryByText('For parents')).not.toBeInTheDocument()
    expect(screen.queryByText('Approximate level')).not.toBeInTheDocument()
  })

  it('links back to booking and the level check', () => {
    renderSample('en')
    expect(screen.getByRole('link', { name: /book a private lesson/i })).toHaveAttribute('href', '/book/')
    expect(screen.getByRole('link', { name: /check your english level/i })).toHaveAttribute(
      'href',
      '/check-english/',
    )
  })

  for (const lang of UI_LANGUAGES) {
    it(`renders the sample badge and fictional disclaimer in ${lang}`, () => {
      const flat = flatten(locales[lang])
      renderSample(lang)
      expect(screen.getAllByText(flat['sampleReport.badge']).length).toBeGreaterThan(0)
      expect(screen.getByText(flat['sampleReport.fictionalNote'])).toBeInTheDocument()
    })
  }

  it('the Hebrew page is RTL and keeps the English corrections left-to-right', () => {
    renderSample('he')
    expect(screen.getByText("I went to my cousin's house").closest('[dir]')).toHaveAttribute('dir', 'ltr')
  })
})
