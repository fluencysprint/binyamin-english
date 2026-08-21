import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SkillLevels } from './SkillLevels'
import { I18nProvider } from '../i18n/I18nProvider'
import { initLearningModel } from '../students/learningModel'
import { makeEstimate } from '../utils/cefr'

function renderRows() {
  const model = initLearningModel('stu1', 'B1', 0)
  // Confidence below 0.45 renders a "~" (low-confidence) marker; above does not.
  // Mixing both in one model is exactly the case that used to misalign rows.
  model.skillEstimates.speaking = makeEstimate('C1', 0.8, 5, 0)
  model.skillEstimates.grammar = makeEstimate('C1', 0.2, 0, 0)
  // Widest possible label, to prove it shares the same grid track as "C1".
  model.skillEstimates.writing = makeEstimate('preA1', 0.9, 5, 0)

  render(
    <I18nProvider initialLang="en">
      <SkillLevels model={model} />
    </I18nProvider>,
  )
  return model
}

describe('SkillLevels', () => {
  it('renders every skill row for a mix of high- and low-confidence estimates', () => {
    renderRows()

    expect(screen.getByText('Listening')).toBeInTheDocument()
    expect(screen.getByText('Speaking')).toBeInTheDocument()
    expect(screen.getByText('Grammar')).toBeInTheDocument()
    expect(screen.getByText('Pre-A1')).toBeInTheDocument()
  })

  it('keeps the confidence marker in its own cell so level labels stay aligned', () => {
    renderRows()

    // Every row renders the same four cells — name, bar, level, confidence —
    // so the shared grid can give each one an identical track. The marker cell
    // is present but empty when confidence is high, which is what keeps "C1"
    // and "C1~" starting at the same x (SkillLevels.module.css).
    for (const skill of ['Speaking', 'Grammar', 'Writing']) {
      const row = screen.getByText(skill).closest('[class*="row"]')!
      expect(row.querySelectorAll('[class*="confidence"]')).toHaveLength(1)
      expect(row.querySelectorAll('[class*="level"]')).toHaveLength(1)
    }

    const speakingRow = screen.getByText('Speaking').closest('[class*="row"]')!
    expect(speakingRow.querySelector('[class*="confidence"]')!.textContent).toBe('')

    const grammarRow = screen.getByText('Grammar').closest('[class*="row"]')!
    expect(grammarRow.querySelector('[class*="confidence"]')!.textContent).toBe('~')
    // The level cell itself never contains the marker.
    expect(grammarRow.querySelector('[class*="level"]')!.textContent).toBe('C1')
  })
})
