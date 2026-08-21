/* ==========================================================================
   The reminder itself — one card, on the students list, or nothing.
   --------------------------------------------------------------------------
   Not a dialog, not a banner that follows you, and never on a lesson screen.
   It sits where the tutor already pauses between students, states a fact, and
   offers the one action that resolves it. "Not now" is a real answer that
   lasts a week (see data/backupReminder.ts).
   ========================================================================== */

import { useCallback, useEffect, useState } from 'react'
import { useI18n } from '../i18n/I18nProvider'
import { useToast } from '../components/Toast'
import { useModeAccess } from '../app/ModeGate'
import { countLocalData } from '../data/db'
import {
  BackupReminder as Reminder,
  evaluateBackupReminder,
  loadBackupRecord,
  loadSnoozedUntil,
  performBackup,
  snoozeBackupReminder,
} from '../data/backupReminder'
import { formatDate } from '../utils/time'
import { DownloadIcon, LockIcon } from '../components/icons'
import styles from './BackupReminder.module.css'

export function BackupReminder({ onBackedUp }: { onBackedUp?: () => void }) {
  const { t, lang } = useI18n()
  const { toast } = useToast()
  const access = useModeAccess()
  const [reminder, setReminder] = useState<Reminder | null>(null)
  const [busy, setBusy] = useState(false)

  const evaluate = useCallback(async () => {
    const stats = await countLocalData()
    setReminder(evaluateBackupReminder(stats, loadBackupRecord(), loadSnoozedUntil()))
  }, [])

  useEffect(() => {
    evaluate()
  }, [evaluate])

  // Backing up IS an admin action; the card never renders outside tutor mode
  // even if a future caller puts it on a shared screen.
  if (!access.dataAdmin || !reminder) return null

  const onBackup = async () => {
    setBusy(true)
    try {
      await performBackup()
      toast(t('data.exported'), 'ok')
      onBackedUp?.()
    } catch (err) {
      toast(t('data.importError', { message: err instanceof Error ? err.message : String(err) }), 'err')
    } finally {
      setBusy(false)
      // Re-read rather than assume: if the export failed, the card must stay.
      evaluate()
    }
  }

  const onLater = () => {
    snoozeBackupReminder()
    setReminder(null)
  }

  const headline =
    reminder.reason === 'never'
      ? t('backup.never')
      : reminder.reason === 'lessons'
        ? reminder.unbackedLessons === 1
          ? t('backup.sinceOne')
          : t('backup.since', { count: reminder.unbackedLessons })
        : t('backup.stale', {
            date: reminder.lastBackupAt ? formatDate(reminder.lastBackupAt, lang) : '',
          })

  return (
    <section className={`card ${styles.card}`} aria-label={t('backup.title')}>
      <div className={styles.text}>
        <h2 className={styles.title}>{t('backup.title')}</h2>
        <p className={styles.headline}>{headline}</p>
        <p className="muted">
          <LockIcon /> {t('backup.where')}
        </p>
      </div>
      <div className={styles.actions}>
        <button className="btn btn-primary" onClick={onBackup} disabled={busy}>
          <DownloadIcon /> {busy ? t('common.loading') : t('backup.action')}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onLater} disabled={busy}>
          {t('backup.later')}
        </button>
      </div>
    </section>
  )
}
