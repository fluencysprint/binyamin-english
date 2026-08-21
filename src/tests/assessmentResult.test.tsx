/* ==========================================================================
   What the learner actually SEES after the check.
   --------------------------------------------------------------------------
   The reported failure was visible on screen: skill chips reading C1 / B2 / C1
   sitting under an "A1 · Beginner" headline, with A1 advice below them. These
   tests assert the rendered card cannot contradict itself, in English and in a
   right-to-left locale.
   ========================================================================== */

import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { I18nProvider } from '../i18n/I18nProvider'
import { SettingsProvider } from '../app/SettingsContext'
import { SnapshotCard } from '../components/SnapshotCard'
import { buildSnapshot } from '../assessment/snapshot'
import { buildDiagnosticPlan } from '../assessment/placement'
import { publicAssessmentItems } from '../data/assessmentBank'
import { CEFR, ItemResponse, UILanguage } from '../types'
import { cefrIndex } from '../utils/cefr'
import { locales } from '../locales'
import { flatten } from '../i18n/dict'

function renderCard(snapshot: ReturnType<typeof buildSnapshot>, lang: UILanguage = 'en') {
  return render(
    <SettingsProvider>
      <I18nProvider initialLang={lang}>
        <SnapshotCard snapshot={snapshot} />
      </I18nProvider>
    </SettingsProvider>,
  )
}

function nativeResponses(): ItemResponse[] {
  const plan = buildDiagnosticPlan({ pool: publicAssessmentItems, ageBand: 'adult' })
  return plan.map((it) => ({
    itemId: it.id,
    skill: it.skill,
    cefr: it.cefr,
    difficulty: it.difficulty,
    outcome: 'correct' as const,
    at: 0,
  }))
}

describe('the result card', () => {
  it('shows an advanced learner an advanced headline, not a beginner one', () => {
    const snapshot = buildSnapshot(nativeResponses())
    renderCard(snapshot)
    // The level appears as the headline and again on the skill chips.
    expect(screen.getAllByText('C1').length).toBeGreaterThan(0)
    expect(screen.getByText(/Advanced/)).toBeInTheDocument()
    expect(screen.queryByText(/Beginner/)).not.toBeInTheDocument()
  })

  it('says the level is the top of what the check can measure', () => {
    renderCard(buildSnapshot(nativeResponses()))
    expect(screen.getByText(/highest level this check can measure/i)).toBeInTheDocument()
  })

  it('states how many questions the estimate rests on, and how firm it is', () => {
    const snapshot = buildSnapshot(nativeResponses())
    renderCard(snapshot)
    expect(screen.getByText(new RegExp(`Based on ${snapshot.itemsAttempted} questions`))).toBeInTheDocument()
    expect(screen.getByText(/reliable estimate/i)).toBeInTheDocument()
  })

  it('names the skills it could not check instead of scoring them silently', () => {
    renderCard(buildSnapshot(nativeResponses()))
    const note = screen.getByText(/Not checked here/i)
    expect(note.textContent).toMatch(/Speaking/i)
    expect(note.textContent).toMatch(/Pronunciation/i)
  })

  it('never renders a skill level above the headline while calling it a lower level', () => {
    const snapshot = buildSnapshot(nativeResponses())
    const shown = (snapshot.skillEvidence ?? []).filter((e) => e.level)
    for (const e of shown) {
      // Every displayed skill must be consistent with the displayed overall.
      expect(Math.abs(cefrIndex(e.level!) - cefrIndex(snapshot.overallCEFR))).toBeLessThanOrEqual(1)
    }
  })

  it('gives an advanced learner advice that is not A1 boilerplate', () => {
    const snapshot = buildSnapshot(nativeResponses())
    renderCard(snapshot)
    const list = screen.getByRole('list')
    const text = within(list).getAllByRole('listitem').map((li) => li.textContent!.toLowerCase())
    expect(text.join(' ')).not.toMatch(/do\/does|he\/she \+ verb/)
  })

  it('localizes the advice rather than falling back to English', () => {
    const snapshot = buildSnapshot(nativeResponses())
    renderCard(snapshot, 'he')
    const he = flatten(locales.he)
    for (const key of snapshot.priorityKeys ?? []) {
      expect(screen.getByText(he[key])).toBeInTheDocument()
    }
  })

  it('marks a skill built on one or two questions as a rough indication', () => {
    const plan = buildDiagnosticPlan({ pool: publicAssessmentItems, ageBand: 'adult' })
    const responses = plan.map((it) => ({
      itemId: it.id,
      skill: it.skill,
      cefr: it.cefr,
      difficulty: it.difficulty,
      outcome: 'correct' as const,
      at: 0,
    }))
    // Keep a single reading item so that skill is thin on evidence.
    const readings = responses.filter((r) => r.skill === 'reading')
    const trimmed = [...responses.filter((r) => r.skill !== 'reading'), readings[0]]
    const snapshot = buildSnapshot(trimmed)
    expect(snapshot.skillEvidence!.find((e) => e.skill === 'reading')!.status).toBe('limited')
    renderCard(snapshot)
    expect(screen.getByText(/rough indication/i)).toBeInTheDocument()
  })

  it('stays coherent for a beginner too', () => {
    const plan = buildDiagnosticPlan({ pool: publicAssessmentItems, ageBand: 'adult' })
    const responses = plan.map((it) => ({
      itemId: it.id,
      skill: it.skill,
      cefr: it.cefr,
      difficulty: it.difficulty,
      outcome: cefrIndex(it.cefr) <= cefrIndex('A1' as CEFR) ? ('correct' as const) : ('needsWork' as const),
      at: 0,
    }))
    const snapshot = buildSnapshot(responses)
    expect(snapshot.overallCEFR).toBe('A1')
    renderCard(snapshot)
    expect(screen.getAllByText('A1').length).toBeGreaterThan(0)
    expect(screen.getByText(/Beginner/)).toBeInTheDocument()
    // A beginner's advice must be beginner advice — the same coherence rule,
    // pointing the other way.
    const list = screen.getByRole('list')
    const advice = within(list).getAllByRole('listitem').map((li) => li.textContent!)
    expect(advice.join(' ')).toMatch(/present simple|everyday|simple sentences|familiar words/i)
  })
})
