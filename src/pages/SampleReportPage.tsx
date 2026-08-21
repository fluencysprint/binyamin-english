import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { useI18n } from '../i18n/I18nProvider'
import { ReportView } from '../reports/ReportView'
import { SAMPLE_LESSON_REPORT } from '../reports/sampleReport'
import { pagePath } from '../seo/site'
import styles from './SampleReportPage.module.css'

/** Public page: the report a student actually receives after a lesson, shown
 *  for a fictional learner so a visitor can see the deliverable before
 *  booking. Reuses <ReportView> — the same component and data shape real
 *  reports use — with `parentSection={false}`: real parents never see that
 *  section on a device directly either (see ModeAccess.diagnostics), so this
 *  shows exactly what a learner's own copy looks like. */
export function SampleReportPage() {
  const { t, lang } = useI18n()
  return (
    <Layout>
      <div className={`container container-narrow ${styles.intro}`}>
        <span className="badge badge-info">{t('sampleReport.badge')}</span>
        <h1 className={styles.title}>{t('sampleReport.title')}</h1>
        <p className="muted">{t('sampleReport.intro')}</p>
        <p className={styles.fictionalNote}>{t('sampleReport.fictionalNote')}</p>
      </div>

      <div className={`container container-narrow print-colors ${styles.reportWrap}`}>
        <ReportView report={SAMPLE_LESSON_REPORT} parentSection={false} />
      </div>

      <div className={`container container-narrow noPrint ${styles.ctaBlock}`}>
        <div className={`card card-pad-lg ${styles.ctaCard}`}>
          <p className={styles.ctaLine}>{t('sampleReport.ctaLine')}</p>
          <div className="cluster">
            <Link to={pagePath('book', lang)} className="btn btn-primary btn-lg">
              {t('landing.ctaBook')}
            </Link>
            <Link to={pagePath('assessment', lang)} className="btn btn-lg">
              {t('landing.ctaAssess')}
            </Link>
          </div>
          <p className={`muted ${styles.footerNote}`}>{t('sampleReport.footerNote')}</p>
        </div>
      </div>
    </Layout>
  )
}
