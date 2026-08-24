/* ==========================================================================
   `BidiTrans` renders `translateSegments`' output as DOM: every `ltr`
   segment in its own <bdi dir="ltr">, everything else as plain text. jsdom
   does not run the Unicode bidi algorithm, so these assert the isolation
   markup is present and the text is intact — the same contract
   src/tests/bidi.test.tsx asserts for BidiText. Verified visually in real
   Chromium in e2e/bidi.spec.ts.
   ========================================================================== */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BidiTrans } from './BidiTrans'
import { HomeworkItemText } from '../reports/ReportView'
import { HomeworkTask } from '../types'

describe('BidiTrans', () => {
  it('isolates a single phrase in its own <bdi>, trailing period included — the "חדש:" defect', () => {
    render(
      <BidiTrans
        lang="he"
        i18nKey="report.homeworkItem.sayPhrases"
        params={{ phrases: 'Just a moment, please.' }}
        ltr={['phrases']}
      />,
    )
    const bdi = screen.getByText('Just a moment, please.')
    expect(bdi.tagName).toBe('BDI')
    expect(bdi).toHaveAttribute('dir', 'ltr')
  })

  it('isolates the frame and the word list as two separate runs, leaving the Hebrew parenthetical outside both', () => {
    const { container } = render(
      <BidiTrans
        lang="he"
        i18nKey="report.homeworkItem.usePhraseFrame"
        params={{ frame: 'Good ___.', words: 'morning, afternoon, evening' }}
        ltr={['frame', 'words']}
      />,
    )
    const bdis = container.querySelectorAll('bdi')
    expect(Array.from(bdis).map((b) => b.textContent)).toEqual(['Good ___.', 'morning, afternoon, evening'])
    // The Hebrew "(אפשר לנסות: … )." wrapper is never inside a bdi.
    expect(container.textContent).toBe(
      'הרכיבו שלושה משפטים משלכם עם Good ___. (אפשר לנסות: morning, afternoon, evening).',
    )
  })

  it('renders 2+ phrases as one block per line, not one long wrapping run', () => {
    const { container } = render(
      <BidiTrans
        lang="he"
        i18nKey="report.homeworkItem.sayPhrases"
        params={{ phrases: ['Goodbye.', 'Can you say that again, please?', 'Can you speak slowly, please?'] }}
        ltr={['phrases']}
        block
      />,
    )
    const lines = container.querySelectorAll('.bidi-phrase')
    expect(Array.from(lines).map((l) => l.textContent)).toEqual([
      'Goodbye.',
      'Can you say that again, please?',
      'Can you speak slowly, please?',
    ])
  })

  it('renders plain text with no <bdi> at all for an LTR locale (English)', () => {
    const { container } = render(
      <BidiTrans
        lang="en"
        i18nKey="report.homeworkItem.sayPhrases"
        params={{ phrases: 'Just a moment, please.' }}
        ltr={['phrases']}
      />,
    )
    expect(container.querySelectorAll('bdi')).toHaveLength(0)
    expect(container.textContent).toContain('Just a moment, please.')
  })
})

describe('HomeworkItemText — the exact production defects', () => {
  it('renders "Good ___." and "morning, afternoon, evening" each in their own isolate — the "איפה עצרנו" card defect', () => {
    const task: HomeworkTask = { kind: 'usePhraseFrame', id: 'goodMorning', slots: ['morning', 'afternoon', 'evening'] }
    const { container } = render(<HomeworkItemText task={task} lang="he" />)
    const bdis = container.querySelectorAll('bdi')
    expect(Array.from(bdis).map((b) => b.textContent)).toEqual(['Good ___.', 'morning, afternoon, evening'])
    for (const b of bdis) expect(b).toHaveAttribute('dir', 'ltr')
  })

  it('renders "sayPhrases" with several phrases as one line each', () => {
    const task: HomeworkTask = { kind: 'sayPhrases', ids: ['hello', 'goodMorning'] }
    const { container } = render(<HomeworkItemText task={task} lang="he" />)
    const lines = container.querySelectorAll('.bidi-phrase')
    expect(Array.from(lines).map((l) => l.textContent)).toEqual(['Hello.', 'Good ___.'])
  })
})
