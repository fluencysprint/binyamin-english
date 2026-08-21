import { Component, ReactNode } from 'react'
import { useI18n } from '../i18n/I18nProvider'

interface FallbackProps {
  t: (key: string) => string
  dir: 'ltr' | 'rtl'
}

interface Props extends FallbackProps {
  children: ReactNode
}

interface State {
  hasError: boolean
}

/** Catches render-time crashes anywhere below it and shows a recovery
 *  screen instead of a blank page. Class-only: componentDidCatch and
 *  getDerivedStateFromError have no hook equivalent. */
class ErrorBoundaryInner extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error(error)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    const { t, dir } = this.props
    return (
      <div
        role="alert"
        dir={dir}
        className="container container-narrow text-center"
        style={{ paddingBlock: 'var(--sp-8)' }}
      >
        <p style={{ margin: '0 0 var(--sp-4)' }}>{t('errors.generic')}</p>
        <button
          className="btn btn-primary btn-lg"
          onClick={() => {
            window.location.hash = '/'
            window.location.reload()
          }}
        >
          {t('errors.goHome')}
        </button>
      </div>
    )
  }
}

export function ErrorBoundary({ children }: { children: ReactNode }) {
  const { t, dir } = useI18n()
  return (
    <ErrorBoundaryInner t={t} dir={dir}>
      {children}
    </ErrorBoundaryInner>
  )
}
