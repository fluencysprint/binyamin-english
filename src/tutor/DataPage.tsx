import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { useI18n } from '../i18n/I18nProvider'
import { useToast } from '../components/Toast'
import { LockButton, ModeSwitcher } from './ModeSwitcher'
import { StudentProfile } from '../types'
import { listStudents } from '../students/studentService'
import { deleteStudent, deleteAllAudioForStudent, clearAllData } from '../data/db'
import { importBackup } from '../data/backup'
import { performBackup } from '../data/backupReminder'
import { DEMO_PROFILES, seedDemoStudent } from '../data/exampleData'
import { cefrLabel } from '../utils/cefr'
import { Bdi } from '../components/Bdi'
import { ArrowLeftIcon, DownloadIcon, LockIcon, PlusIcon, UploadIcon } from '../components/icons'
import styles from './DataPage.module.css'

/** Generous for a real backup (recordings included), far below what would
 *  wedge the tab if someone picks the wrong file. */
const MAX_BACKUP_BYTES = 200 * 1024 * 1024

export function DataPage() {
  const { t } = useI18n()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [students, setStudents] = useState<StudentProfile[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const refresh = () => listStudents().then(setStudents)
  useEffect(() => {
    refresh()
  }, [])

  const onExport = async () => {
    // Same call the reminder makes, so an export from either place counts as
    // the backup that silences it — otherwise the tutor backs up here and is
    // asked again on the next screen.
    await performBackup()
    toast(t('data.exported'), 'ok')
  }

  const onImportFile = async (file: File) => {
    // A backup with recordings is large, but not gigabytes. Reading an
    // arbitrary user-chosen file into a string first is the one place this app
    // can be made to exhaust memory, so the size is checked before the read.
    if (file.size > MAX_BACKUP_BYTES) {
      toast(t('data.fileTooLarge', { max: Math.round(MAX_BACKUP_BYTES / (1024 * 1024)) }), 'err')
      return
    }
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const summary = await importBackup(data)
      const restored =
        summary.students + summary.learningModels + summary.lessons + summary.corrections + summary.audio
      // Report what actually landed. A half-corrupt file used to say "imported".
      toast(
        summary.skipped > 0
          ? t('data.importedPartial', { restored, skipped: summary.skipped })
          : t('data.importedCount', { restored }),
        summary.skipped > 0 ? 'info' : 'ok',
      )
      refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      toast(t('data.importError', { message }), 'err')
    }
  }

  const onDeleteStudent = async (s: StudentProfile) => {
    if (!window.confirm(t('data.deleteStudentConfirm'))) return
    await deleteStudent(s.id)
    toast(t('common.done'), 'ok')
    refresh()
  }

  const onDeleteAudio = async (s: StudentProfile) => {
    if (!window.confirm(t('audio.deleteAllConfirm'))) return
    await deleteAllAudioForStudent(s.id)
    toast(t('common.done'), 'ok')
  }

  const onClearAll = async () => {
    if (!window.confirm(t('data.clearAllConfirm'))) return
    await clearAllData()
    toast(t('common.done'), 'ok')
    refresh()
  }

  const onSeed = async (profileId: string) => {
    const id = await seedDemoStudent(profileId)
    toast(t('common.done'), 'ok')
    navigate(`/tutor/student/${id}`)
  }

  return (
    <Layout
      headerExtra={
        <>
          <ModeSwitcher />
          <LockButton />
        </>
      }
    >
      <div className="container container-narrow" style={{ paddingBlock: 'var(--sp-6)' }}>
        <Link to="/tutor" className={styles.back}>
          <ArrowLeftIcon className="flip-in-rtl" /> {t('students.title')}
        </Link>
        <h1>{t('data.title')}</h1>
        <p className="muted" style={{ margin: 'var(--sp-3) 0 var(--sp-5)' }}>
          <LockIcon /> {t('data.storageNote')}
        </p>

        <section className={`card ${styles.section}`}>
          <div className="cluster">
            <button className="btn btn-primary" onClick={onExport}>
              <DownloadIcon /> {t('data.export')}
            </button>
            <button className="btn" onClick={() => fileRef.current?.click()}>
              <UploadIcon /> {t('data.import')}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onImportFile(f)
                e.target.value = ''
              }}
            />
          </div>
          <p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
            {t('data.importNote')}
          </p>
        </section>

        <section className={`card ${styles.section}`}>
          <h2 className={styles.h2}>{t('data.exampleStudent')}</h2>
          <div className="cluster">
            {DEMO_PROFILES.map((p) => (
              <button key={p.id} className="btn btn-ghost btn-sm" onClick={() => onSeed(p.id)}>
                <PlusIcon /> {p.name} · {t(`ageBands.${p.ageBand}`)} · <Bdi>{cefrLabel(p.level)}</Bdi>
              </button>
            ))}
          </div>
        </section>

        {students.length > 0 && (
          <section className={`card ${styles.section}`}>
            <h2 className={styles.h2}>{t('students.title')}</h2>
            <ul className={styles.list}>
              {students.map((s) => (
                <li key={s.id} className={styles.item}>
                  <span>{s.name}</span>
                  <div className="cluster">
                    <button className="btn btn-sm btn-ghost" onClick={() => onDeleteAudio(s)}>
                      {t('audio.deleteAll')}
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => onDeleteStudent(s)}>
                      {t('data.deleteStudent')}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className={`card ${styles.section} ${styles.danger}`}>
          <h2 className={styles.h2}>{t('data.clearAll')}</h2>
          <button className="btn btn-danger" onClick={onClearAll}>
            {t('data.clearAll')}
          </button>
        </section>
      </div>
    </Layout>
  )
}
