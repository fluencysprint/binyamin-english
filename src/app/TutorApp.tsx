import { Routes, Route, Navigate } from 'react-router-dom'
import { TutorGate } from '../tutor/TutorGate'
import { TutorHome } from '../tutor/TutorHome'
import { StudentOnboardingPage } from '../tutor/StudentOnboardingPage'
import { StudentDashboardPage } from '../tutor/StudentDashboardPage'
import { LessonRunnerPage } from '../tutor/LessonRunnerPage'
import { LessonReportPage } from '../tutor/LessonReportPage'
import { DataPage } from '../tutor/DataPage'
import { ModeGate, StudentScopeGate } from './ModeGate'

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
              <StudentDashboardPage />
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
