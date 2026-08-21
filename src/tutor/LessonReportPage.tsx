import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useI18n } from '../i18n/I18nProvider'
import { ArrowLeftIcon } from '../components/icons'
import { ReportView } from '../reports/ReportView'
import { loadStudentBundle } from '../students/studentService'
import { useModeAccess } from '../app/ModeGate'
import { LessonRecord, StudentProfile } from '../types'
import styles from './LessonReportPage.module.css'

/** A bare page (no site header/nav/footer) holding exactly one lesson
 *  report — nothing else is in the DOM, so printing it needs no CSS tricks
 *  and can never produce blank trailing pages from hidden dashboard chrome. */
export function LessonReportPage() {
  const { id, lessonId } = useParams()
  const { t } = useI18n()
  const access = useModeAccess()
  const [student, setStudent] = useState<StudentProfile | null>(null)
  const [lesson, setLesson] = useState<LessonRecord | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!id || !lessonId) return
      const bundle = await loadStudentBundle(id)
      const rec = bundle?.lessons.find((l) => l.id === lessonId)
      if (cancelled) return
      if (!bundle || !rec || !rec.report) {
        setNotFound(true)
        return
      }
      setStudent(bundle.student)
      setLesson(rec)
    })()
    return () => {
      cancelled = true
    }
  }, [id, lessonId])

  if (notFound) {
    return (
      <div className="container container-narrow" style={{ paddingBlock: 'var(--sp-8)' }}>
        <p>{t('report.noReport')}</p>
        <Link className="btn" to={id ? `/tutor/student/${id}` : '/tutor'}>
          {t('errors.goHome')}
        </Link>
      </div>
    )
  }
  if (!student || !lesson || !lesson.report) {
    return (
      <div className="container container-narrow" style={{ paddingBlock: 'var(--sp-8)' }}>
        {t('common.loading')}
      </div>
    )
  }

  return (
    <div>
      <div className={`container container-narrow noPrint ${styles.backRow}`}>
        <Link to={`/tutor/student/${student.id}`} className="btn btn-sm btn-ghost">
          <ArrowLeftIcon className="flip-in-rtl" /> {student.name}
        </Link>
      </div>
      <div className={`container container-narrow print-colors ${styles.wrap}`}>
        <ReportView report={lesson.report} parentSection={access.diagnostics} />
      </div>
    </div>
  )
}
