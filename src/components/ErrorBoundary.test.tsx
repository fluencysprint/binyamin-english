import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { I18nProvider } from '../i18n/I18nProvider'
import { ErrorBoundary } from './ErrorBoundary'

function Bomb(): never {
  throw new Error('boom')
}

describe('ErrorBoundary', () => {
  it('renders a fallback instead of a blank screen when a child throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <I18nProvider>
        <ErrorBoundary>
          <Bomb />
        </ErrorBoundary>
      </I18nProvider>,
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
    spy.mockRestore()
  })

  it('renders children normally when nothing throws', () => {
    render(
      <I18nProvider>
        <ErrorBoundary>
          <p>all good</p>
        </ErrorBoundary>
      </I18nProvider>,
    )
    expect(screen.getByText('all good')).toBeInTheDocument()
  })
})
