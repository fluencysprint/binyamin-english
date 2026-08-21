import { useState } from 'react'
import { useI18n } from '../i18n/I18nProvider'
import { RecordIcon } from '../components/icons'
import { useSettings } from '../app/SettingsContext'
import { useToast } from '../components/Toast'
import { AudioRole, PronunciationArea, PRONUNCIATION_AREAS, PronunciationRating } from '../types'
import { PRONUNCIATION_RATING_KEY } from '../data/pronunciationLibrary'
import { useAudioRecorder } from './useAudioRecorder'
import { putAudio } from '../data/db'
import { uid } from '../utils/id'
import { LIMITS, validateOptionalText, validateText } from '../utils/validation'
import styles from './RecorderPanel.module.css'

const RATINGS: PronunciationRating[] = ['clear', 'understandable', 'needsPractice', 'communicationProblem']
const RATING_KEY = PRONUNCIATION_RATING_KEY
const ROLES: AudioRole[] = ['baseline', 'practice', 'improved']
const ROLE_KEY: Record<AudioRole, string> = {
  baseline: 'audio.roleBaseline',
  practice: 'audio.rolePractice',
  improved: 'audio.roleImproved',
}

export function RecorderPanel({
  studentId,
  lessonId,
  defaultArea,
  defaultTarget,
  onSaved,
}: {
  studentId: string
  lessonId?: string
  defaultArea?: PronunciationArea
  defaultTarget?: string
  onSaved?: () => void
}) {
  const { t } = useI18n()
  const { micNoticeAcknowledged, setMicNoticeAcknowledged } = useSettings()
  const { toast } = useToast()
  const rec = useAudioRecorder()

  const [target, setTarget] = useState(defaultTarget ?? '')
  const [area, setArea] = useState<PronunciationArea>(defaultArea ?? 'th')
  const [rating, setRating] = useState<PronunciationRating>('understandable')
  const [role, setRole] = useState<AudioRole>('practice')
  const [note, setNote] = useState('')

  if (rec.status === 'unsupported') {
    return <p className={styles.notice}>{t('audio.unsupported')}</p>
  }

  if (!micNoticeAcknowledged) {
    return (
      <div className={styles.privacy}>
        <h3>{t('audio.privacyTitle')}</h3>
        <p className="muted">{t('audio.privacyBody')}</p>
        <button className="btn btn-primary" onClick={() => setMicNoticeAcknowledged(true)}>
          {t('audio.privacyAck')}
        </button>
      </div>
    )
  }

  const save = async () => {
    if (!rec.blob) return
    // Recording metadata is user text that later appears in reports and
    // backups. Trim and cap it; leave every character the tutor meant to type
    // (an English target sentence, a note in Hebrew or Russian) intact.
    const targetResult = validateText(target, { maxLength: LIMITS.line })
    const noteResult = validateOptionalText(note, { maxLength: LIMITS.note })
    const issue = !targetResult.ok ? targetResult.issue : !noteResult.ok ? noteResult.issue : null
    if (issue) {
      toast(t(issue.key, issue.params), 'err')
      return
    }
    if (!targetResult.ok || !noteResult.ok) return
    try {
      await putAudio(
        {
          id: uid('audio'),
          studentId,
          lessonId,
          date: Date.now(),
          target: targetResult.value || t('audio.target'),
          area,
          rating,
          note: noteResult.value,
          role,
          mimeType: rec.mimeType || 'audio/webm',
          durationMs: rec.durationMs,
        },
        rec.blob,
      )
    } catch (err) {
      console.error(err)
      toast(t('errors.generic'), 'err')
      return
    }
    toast(t('audio.saved'), 'ok')
    rec.reset()
    setNote('')
    onSaved?.()
  }

  return (
    <div className={styles.panel}>
      {rec.status === 'denied' && <p className={styles.notice}>{t('audio.permissionDenied')}</p>}

      <div className="field">
        <label htmlFor="rec-target">{t('audio.target')}</label>
        <input
          id="rec-target"
          className="input"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder={t('audio.targetPlaceholder')}
          type="text"
          autoCapitalize="sentences"
          spellCheck={false}
          enterKeyHint="done"
          maxLength={LIMITS.line}
        />
      </div>

      <div className={styles.controls}>
        {(rec.status === 'idle' || rec.status === 'denied' || rec.status === 'error') && (
          <button className="btn btn-primary" onClick={rec.start}>
            <RecordIcon /> {t('audio.record')}
          </button>
        )}
        {rec.status === 'requesting' && <span className="muted">{t('audio.micNeeded')}…</span>}
        {rec.status === 'recording' && (
          <button className="btn btn-danger" onClick={rec.stop}>
            <span className={styles.pulse} aria-hidden="true" /> {t('audio.stop')}
          </button>
        )}
        {rec.status === 'recorded' && rec.url && (
          <>
            <audio controls src={rec.url} className={styles.audio} />
            <button className="btn" onClick={rec.start}>
              {t('audio.reRecord')}
            </button>
          </>
        )}
      </div>

      {rec.status === 'recorded' && (
        <div className={styles.meta}>
          <div className={styles.row2}>
            <label className="field">
              <span>{t('audio.area')}</span>
              <select className="select" value={area} onChange={(e) => setArea(e.target.value as PronunciationArea)}>
                {PRONUNCIATION_AREAS.map((a) => (
                  <option key={a} value={a}>
                    {t(`pron.${a}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>{t('audio.rating')}</span>
              <select
                className="select"
                value={rating}
                onChange={(e) => setRating(e.target.value as PronunciationRating)}
              >
                {RATINGS.map((r) => (
                  <option key={r} value={r}>
                    {t(RATING_KEY[r])}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="field">
            <span style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>{t('audio.role')}</span>
            <div className="cluster">
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  className="chip"
                  aria-pressed={role === r}
                  onClick={() => setRole(r)}
                >
                  {t(ROLE_KEY[r])}
                </button>
              ))}
            </div>
          </div>

          <label className="field">
            <span>{t('audio.note')}</span>
            <input
              className="input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              type="text"
              enterKeyHint="done"
              maxLength={LIMITS.note}
            />
          </label>

          <div className="cluster">
            <button className="btn btn-primary" onClick={save}>
              {t('audio.save')}
            </button>
            <button className="btn btn-ghost" onClick={rec.reset}>
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
