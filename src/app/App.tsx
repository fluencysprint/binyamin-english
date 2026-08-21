import { lazy, ReactNode, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { LandingPage } from '../pages/LandingPage'
import { AboutPage } from '../pages/AboutPage'
import { AssessmentPage } from '../pages/AssessmentPage'
import { BookingPage } from '../pages/BookingPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { PublicRoute } from './PublicRoute'
import { useI18n } from '../i18n/I18nProvider'
import { PrivateSeo } from '../seo/Seo'
import { PUBLIC_PAGES, PublicPageId, SEO_LANGUAGES, pagePath } from '../seo/site'

/* Both lazy: neither belongs in the bundle every landing-page visitor
   downloads. The sample report alone pulls in the full grammar/pronunciation/
   beginner content banks (it renders through the same ReportView the real
   tutor report uses), and the tutor area pulls in the lesson generator, idb
   and everything else behind the gate — see TutorApp.tsx. */
const SampleReportPage = lazy(() =>
  import('../pages/SampleReportPage').then((m) => ({ default: m.SampleReportPage })),
)
const TutorApp = lazy(() => import('./TutorApp'))

/** Placeholder for a lazy route while its chunk is in flight — the same
 *  bare "loading" text every other async screen in the app already uses. */
function RouteFallback() {
  const { t } = useI18n()
  return <div className="container" style={{ paddingBlock: 'var(--sp-8)' }}>{t('common.loading')}</div>
}

const PUBLIC_ELEMENTS: Record<PublicPageId, ReactNode> = {
  home: <LandingPage />,
  about: <AboutPage />,
  assessment: <AssessmentPage />,
  book: <BookingPage />,
  sampleReport: (
    <Suspense fallback={<RouteFallback />}>
      <SampleReportPage />
    </Suspense>
  ),
}

export function App() {
  /* The static HTML shipped for each public URL carries a crawlable copy of
     that page's headline, summary and links so GitHub Pages serves real
     content on the first byte. Once React has mounted it is duplicate markup,
     so it is removed here rather than hidden. */
  useEffect(() => {
    document.getElementById('seo-fallback')?.remove()
  }, [])

  return (
    <ErrorBoundary>
      <Routes>
        {/* Public — one real, crawlable URL per page per locale. */}
        {PUBLIC_PAGES.flatMap((page) =>
          SEO_LANGUAGES.map((lang) => (
            <Route
              key={`${page.id}:${lang}`}
              path={pagePath(page.id, lang)}
              element={
                <PublicRoute page={page.id} lang={lang}>
                  {PUBLIC_ELEMENTS[page.id]}
                </PublicRoute>
              }
            />
          )),
        )}

        {/* Legacy path from before the SEO URL map — keep old links working. */}
        <Route path="/assessment" element={<Navigate to={pagePath('assessment')} replace />} />

        {/* Tutor (gated) — never indexed. The whole subtree is one lazy
            chunk (see TutorApp.tsx), and TutorGate applies this same
            noindex signal again once it mounts — but a crawler (or this
            exact route) reading the head before that chunk resolves must
            never see the public page's indexable metadata still standing,
            so it is applied here too, synchronously, outside the Suspense
            boundary. */}
        <Route
          path="/tutor/*"
          element={
            <>
              <PrivateSeo titleKey="gate.title" />
              <Suspense fallback={<RouteFallback />}>
                <TutorApp />
              </Suspense>
            </>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  )
}
