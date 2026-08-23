import { Routes, Route, Navigate } from 'react-router-dom'
import { TutorGate } from '../tutor/TutorGate'
import { TutorHome } from '../tutor/TutorHome'
import { StudentOnboardingPage } from '../tutor/StudentOnboardingPage'
import { StudentDashboardPage } from '../tutor/StudentDashboardPage'
import { StudentHomePage } from '../student/StudentHomePage'
import { PracticePage } from '../practice/PracticePage'
import { LessonRunnerPage } from '../tutor/LessonRunnerPage'
import { LessonReportPage } from '../tutor/LessonReportPage'
import { DataPage } from '../tutor/DataPage'
import { ModeGate, StudentScopeGate } from './ModeGate'
import { useSettings } from './SettingsContext'

/**
 * Everything behind /tutor/*, as its own chunk.
 *
 * idb, the lesson generator, the grammar/pronunciation/beginner content
 * banks and the rest of the tutor's private tooling are of no use to a
 * landing-page or assessment visitor — this module exists so App.tsx can
 * load it with React.lazy instead of pulling all of it into the bundle
 * every public URL ships with. Routing is otherwise unchanged: this mounts
 * at the same "/tutor/*" path App.tsx always matched here.
 */
export default function TutorApp() {
  return (
    <TutorGate>
      <Routes>
        {/* Route-level, not link-level: /tutor/data typed into the
            address bar in Student mode must not render the page. */}
        <Route
          path="/"
          element={
            <ModeGate need="roster">
              <TutorHome />
            </ModeGate>
          }
        />
        <Route
          path="new"
          element={
            <ModeGate need="roster">
              <StudentOnboardingPage />
            </ModeGate>
          }
        />
        <Route
          path="data"
          element={
            <ModeGate need="dataAdmin">
              <DataPage />
            </ModeGate>
          }
        />
        <Route
          path="student/:id"
          element={
            <StudentScopeGate>
              <StudentLanding />
            </StudentScopeGate>
          }
        />
        {/* The learner's own practice. Not mode-gated: everything on it is
            their own material — their sentences, their words, their sounds —
            and a tutor wanting to run a set together on a shared screen is a
            legitimate use of it, not a leak. */}
        <Route
          path="student/:id/practice"
          element={
            <StudentScopeGate>
              <PracticePage />
            </StudentScopeGate>
          }
        />
        <Route
          path="student/:id/lesson/:lessonId"
          element={
            <StudentScopeGate>
              <LessonRunnerPage />
            </StudentScopeGate>
          }
        />
        <Route
          path="student/:id/lesson/:lessonId/report"
          element={
            <StudentScopeGate>
              <LessonReportPage />
            </StudentScopeGate>
          }
        />
        <Route path="*" element={<Navigate to="/tutor" replace />} />
      </Routes>
    </TutorGate>
  )
}

/**
 * One URL, two screens.
 *
 * `/tutor/student/:id` is the tutor's dashboard and it is also the address on
 * the learner's phone. They are not the same page with pieces removed: the
 * tutor's answers "what do I teach, and why?", the learner's answers "what do
 * I do now?", and neither is a subset of the other. Which one renders follows
 * the mode, at the route, so the decision is made once instead of by every
 * section on a shared page.
 */
function StudentLanding() {
  const { mode } = useSettings()
  return mode === 'student' ? <StudentHomePage /> : <StudentDashboardPage />
}
