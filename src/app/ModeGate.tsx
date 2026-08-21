/* ==========================================================================
   Enforcing the mode boundary at the route, not at the link.
   --------------------------------------------------------------------------
   Hiding a nav link hides nothing: /tutor/data is four keystrokes away in the
   address bar, and a back button will happily return to it after a mode
   switch. So the pages that exist only for the tutor check the capability
   themselves and render a plain notice instead of their content.
   ========================================================================== */

import { ReactNode } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useSettings } from './SettingsContext'
import { accessFor, Capability, ModeAccess } from './modeAccess'
import { useI18n } from '../i18n/I18nProvider'
import { Layout } from '../components/Layout'
import { ModeSwitcher, LockButton } from '../tutor/ModeSwitcher'
import { pagePath } from '../seo/site'

/** What the current mode is allowed to show. */
export function useModeAccess(): ModeAccess {
  const { mode } = useSettings()
  return accessFor(mode)
}

/**
 * Renders `children` only when the current mode has `need`.
 *
 * The fallback is deliberately dull: no alarm, no explanation of what is being
 * withheld, and — in Student mode — no invitation to switch. It is a wrong
 * turn, not an incident.
 */
export function ModeGate({ need, children }: { need: Capability; children: ReactNode }) {
  const access = useModeAccess()
  const { t, lang } = useI18n()

  if (access[need]) return <>{children}</>

  return (
    <Layout
      headerExtra={
        <>
          <ModeSwitcher />
          <LockButton />
        </>
      }
    >
      <div className="container container-narrow" style={{ paddingBlock: 'var(--sp-8)' }}>
        <div className="card card-pad-lg stack">
          <h1>{t('modes.blockedTitle')}</h1>
          <p className="muted">{t('modes.blockedBody')}</p>
          <Link to={pagePath('home', lang)} className="btn">
            {t('errors.goHome')}
          </Link>
        </div>
      </div>
    </Layout>
  )
}

/**
 * Enforces the Student-mode binding on every `/tutor/student/:id*` route.
 *
 * `ModeGate` decides WHAT a mode may show; this decides WHICH student's data
 * a mode may show — Student mode is bound to exactly one student the moment
 * it is entered (see ModeSwitcher / SettingsContext.setMode), and every one
 * of these routes reads its student from the URL. Without this gate, editing
 * the `:id` segment while the device is in the learner's hands would open a
 * different student's dashboard, lesson or report — their name, vocabulary
 * and progress included. So this is route-level, like `ModeGate`: it runs
 * before the page underneath ever reads `useParams` for itself.
 *
 * Tutor and Together mode are untouched — multi-student access there is
 * intentional and unrelated to this boundary.
 */
export function StudentScopeGate({ children }: { children: ReactNode }) {
  const { id } = useParams()
  const { mode, boundStudentId } = useSettings()
  const { t } = useI18n()

  if (mode !== 'student') return <>{children}</>

  // No binding at all — a corrupt/legacy settings blob, or Student mode
  // reached some other way this build did not anticipate. Fail closed: no
  // student's data renders, and nothing here guesses which one to show.
  if (!boundStudentId) {
    return (
      <Layout
        headerExtra={
          <>
            <ModeSwitcher />
            <LockButton />
          </>
        }
      >
        <div className="container container-narrow" style={{ paddingBlock: 'var(--sp-8)' }}>
          <div className="card card-pad-lg stack">
            <h1>{t('modes.noStudentTitle')}</h1>
            <p className="muted">{t('modes.noStudentBody')}</p>
          </div>
        </div>
      </Layout>
    )
  }

  // The URL names a different student than the one this mode is bound to —
  // a hand-edited address, a stale bookmark, a deep link. Resolve back to
  // the bound student rather than rendering what was asked for.
  if (id !== boundStudentId) {
    return <Navigate to={`/tutor/student/${boundStudentId}`} replace />
  }

  return <>{children}</>
}
