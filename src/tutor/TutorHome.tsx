import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { useI18n } from '../i18n/I18nProvider'
import { StudentProfile } from '../types'
import { listStudents } from '../students/studentService'
import { ModeSwitcher, LockButton } from './ModeSwitcher'
import { BackupReminder } from './BackupReminder'
import { cefrLabel } from '../utils/cefr'
import { Bdi } from '../components/Bdi'
import { ArrowRightIcon, PlusIcon } from '../components/icons'
import styles from './TutorHome.module.css'

export function TutorHome() {
  const { t } = useI18n()
  const [students, setStudents] = useState<StudentProfile[] | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    listStudents().then(setStudents)
  }, [])

  const filtered = useMemo(() => {
    if (!students) return []
    const q = query.trim().toLowerCase()
    return q ? students.filter((s) => s.name.toLowerCase().includes(q)) : students
  }, [students, query])

  return (
    <Layout
      headerExtra={
        <>
          <ModeSwitcher />
          <LockButton />
        </>
      }
    >
      <div className="container" style={{ paddingBlock: 'var(--sp-6)' }}>
        {/* Above the roster, below nothing: the tutor is between students here,
            which is the only moment in the app where stopping to think about
            backups costs no teaching time. */}
        <BackupReminder />

        <div className={styles.head}>
          <h1>{t('students.title')}</h1>
          <div className="cluster">
            <Link to="/tutor/data" className="btn btn-sm">
              {t('data.title')}
            </Link>
            <Link to="/tutor/new" className="btn btn-primary">
              <PlusIcon /> {t('students.add')}
            </Link>
          </div>
        </div>

        {students && students.length > 3 && (
          <input
            className="input"
            style={{ maxWidth: 360, marginBottom: 'var(--sp-4)' }}
            placeholder={t('students.searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        )}

        {students == null ? (
          <p>{t('common.loading')}</p>
        ) : students.length === 0 ? (
          <div className={`card card-pad-lg ${styles.empty}`}>
            <p className="muted">{t('students.empty')}</p>
            <Link to="/tutor/new" className="btn btn-primary btn-lg">
              + {t('students.add')}
            </Link>
          </div>
        ) : (
          <ul className={styles.grid}>
            {filtered.map((s) => (
              <li key={s.id}>
                <Link to={`/tutor/student/${s.id}`} className={`card ${styles.card}`}>
                  <div className={styles.avatar} aria-hidden="true">
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.info}>
                    <strong>{s.name}</strong>
                    <span className="muted">
                      {t(`ageBands.${s.ageBand}`)}
                      {s.selfEstimatedLevel ? (
                        <>
                          {' · '}
                          <Bdi>{cefrLabel(s.selfEstimatedLevel)}</Bdi>
                        </>
                      ) : (
                        ''
                      )}
                    </span>
                  </div>
                  <span className={styles.open} aria-hidden="true">
                    <ArrowRightIcon className="flip-in-rtl" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  )
}
