import { useEffect, useState } from 'react'
import { AudioRecordingMeta } from '../types'
import { useI18n } from '../i18n/I18nProvider'
import { useToast } from '../components/Toast'
import { getAudioBlob, deleteAudio } from '../data/db'
import { formatDate } from '../utils/time'
import styles from './AudioList.module.css'

/** Plays a single stored recording. Loads the blob lazily on demand. */
function AudioPlayer({ meta }: { meta: AudioRecordingMeta }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let revoked = false
    let objectUrl: string | null = null
    getAudioBlob(meta.id).then((blob) => {
      if (blob && !revoked) {
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      }
    })
    return () => {
      revoked = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [meta.id])
  return url ? <audio controls src={url} className={styles.audio} /> : <span className="muted">…</span>
}

const ROLE_KEY: Record<string, string> = {
  baseline: 'audio.roleBaseline',
  practice: 'audio.rolePractice',
  improved: 'audio.roleImproved',
}

export function AudioList({
  recordings,
  onChange,
}: {
  recordings: AudioRecordingMeta[]
  onChange: () => void
}) {
  const { t, lang } = useI18n()
  const { toast } = useToast()

  if (recordings.length === 0) {
    return <p className="muted">{t('audio.noRecordings')}</p>
  }

  // Group by pronunciation area for before/after comparison.
  const byArea = new Map<string, AudioRecordingMeta[]>()
  for (const r of recordings) {
    const list = byArea.get(r.area) ?? []
    list.push(r)
    byArea.set(r.area, list)
  }

  const remove = async (id: string) => {
    await deleteAudio(id)
    toast(t('common.done'), 'ok')
    onChange()
  }

  return (
    <div className={styles.wrap}>
      {[...byArea.entries()].map(([area, items]) => {
        const sorted = [...items].sort((a, b) => a.date - b.date)
        const earliest = sorted[0]
        const latest = sorted[sorted.length - 1]
        const showCompare = sorted.length > 1
        return (
          <div key={area} className={`card ${styles.group}`}>
            <div className={styles.groupHead}>
              <strong>{t(`pron.${area}`)}</strong>
              <span className="muted">{items.length}</span>
            </div>

            {showCompare && (
              <div className={styles.compare}>
                <div className={styles.compareCol}>
                  <span className="badge badge-neutral">{t('audio.earlier')}</span>
                  <div className={styles.target}>{earliest.target}</div>
                  <AudioPlayer meta={earliest} />
                  <span className="muted">{formatDate(earliest.date, lang)}</span>
                </div>
                <div className={styles.compareCol}>
                  <span className="badge badge-ok">{t('audio.current')}</span>
                  <div className={styles.target}>{latest.target}</div>
                  <AudioPlayer meta={latest} />
                  <span className="muted">{formatDate(latest.date, lang)}</span>
                </div>
              </div>
            )}

            <ul className={styles.list}>
              {sorted.map((r) => (
                <li key={r.id} className={styles.item}>
                  <div className={styles.itemMain}>
                    <span className={styles.target}>{r.target}</span>
                    <span className="cluster" style={{ gap: 'var(--sp-1)' }}>
                      <span className="badge badge-neutral">{t(ROLE_KEY[r.role])}</span>
                      {r.rating && <span className="muted">· {t(`pron.rating${ratingSuffix(r.rating)}`)}</span>}
                      <span className="muted">· {formatDate(r.date, lang)}</span>
                    </span>
                    {r.note && <span className="muted">{r.note}</span>}
                  </div>
                  <AudioPlayer meta={r} />
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => remove(r.id)}
                    aria-label={`${t('common.delete')} ${r.target}`}
                  >
                    {t('common.delete')}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

function ratingSuffix(rating: string): string {
  switch (rating) {
    case 'clear':
      return 'Clear'
    case 'understandable':
      return 'Understandable'
    case 'needsPractice':
      return 'NeedsPractice'
    default:
      return 'Problem'
  }
}
