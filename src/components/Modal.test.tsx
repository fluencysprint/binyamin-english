import { describe, it, expect } from 'vitest'
import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nProvider } from '../i18n/I18nProvider'
import { Modal } from './Modal'

// Regression test for a focus-loss bug: the lesson runner re-renders its
// parent on an independent 1s timer, which recreates the inline
// `onClose={() => setModal(null)}` closure passed to <Modal> on every tick.
// Modal's effect used to depend on `[onClose]` and call `ref.current?.focus()`
// inside that effect, so any parent re-render (for any reason) re-focused the
// dialog wrapper and yanked focus away from an input the user was typing
// into. This harness forces a fresh `onClose` closure on every keystroke —
// the same "parent re-rendered independently, prop identity changed" shape
// as the real timer bug, just deterministic instead of racing a real clock.
function Harness() {
  const [, forceParentRerender] = useState(0)
  const [value, setValue] = useState('')
  return (
    <Modal title="Pronunciation recordings" onClose={() => forceParentRerender((n) => n + 1)}>
      <label htmlFor="target">Target word or sentence</label>
      <input
        id="target"
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          forceParentRerender((n) => n + 1)
        }}
      />
    </Modal>
  )
}

describe('Modal', () => {
  it('does not steal focus from an input inside it when the parent re-renders with a new onClose', async () => {
    const user = userEvent.setup()
    render(
      <I18nProvider>
        <Harness />
      </I18nProvider>,
    )

    const input = screen.getByLabelText('Target word or sentence')
    await user.click(input)
    expect(input).toHaveFocus()

    const sentence = 'I worked there for three years.'
    await user.type(input, sentence)

    expect(input).toHaveValue(sentence)
    expect(input).toHaveFocus()
  })
})
