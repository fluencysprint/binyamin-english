import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { useI18n } from '../i18n/I18nProvider'
import { useToast } from '../components/Toast'
import { ModeSwitcher, LockButton } from './ModeSwitcher'
import { AudioList } from '../audio/AudioList'
import { SkillLevels } from './SkillLevels'
import { AudioRecordingMeta, LessonPlan } from '../types'
import { StudentBundle, createLesson, loadStudentBundle, previewNextLesson } from '../students/studentService'
import { buildBriefing } from '../lessons/briefing'
import { objectiveRationale, objectiveTitle } from '../lessons/guidance'
import { teachingStringsStatus, useTeachingStrings } from '../i18n/teachingStrings'
import { HomeworkCard, LessonBriefingCard, ProgressSummary } from './ProgressView'
import { getAudioMetaForStudent } from '../data/db'
import { overallCefr } from '../utils/cefr'
import { useModeAccess } from '../app/ModeGate'
import { Bdi } from '../components/Bdi'
import { ArrowLeftIcon } from '../components/icons'
import styles from './StudentDashboardPage.module.css'

/**
 * One page, three audiences.
 *
 * This page used to render the same thing to everyone, which meant Student
 * mode showed the learner their own recurring weaknesses, the tutor's stated
 * reasoning for the next lesson, and a button to regenerate the plan. Nothing
 * here decides visibility on its own any more: every section names the
 * capability it needs (see app/modeAccess.ts), and the sections that carry a
 * judgement about the learner are not rendered at all — not dimmed, not
 * collapsed — when that capability is absent.
 */
export function StudentDashboardPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, lang } = useI18n()
  const { toast } = useToast()
  const access = useModeAccess()
  /* This page can be the very first screen a tutor sees after unlocking a
     non-English locale, and it reads the same lazily-loaded guide table as
     the lesson runner (objectiveTitle/objectiveRationale below) — so it needs
     the same subscription, or it would show English and never re-render once
     the chunk actually lands. */
  useTeachingStrings(lang)
  // A failed chunk falls back to English rather than sitting on "Loading…"
  // forever — the lesson runner is where a failure gets an explicit notice
  // and a retry; this preview just needs to not flash the wrong language.
  const teachingLoading = teachingStringsStatus(lang) === 'loading'

  const [bundle, setBundle] = useState<StudentBundle | null>(null)
  const [audio, setAudio] = useState<AudioRecordingMeta[]>([])
  const [notFound, setNotFound] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    const b = await loadStudentBundle(id)
    if (!b) {
      setNotFound(true)
      return
    }
    setBundle(b)
    setAudio(await getAudioMetaForStudent(id))
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  if (notFound) {
    return (
      <Layout>
        <div className="container" style={{ paddingBlock: 'var(--sp-8)' }}>
          <p>{t('errors.studentNotFound')}</p>
          <Link to="/tutor" className="btn">
            {t('errors.goHome')}
          </Link>
        </div>
      </Layout>
    )
  }
  if (!bundle) {
    return (
      <Layout>
        <div className="container" style={{ paddingBlock: 'var(--sp-8)' }}>
          {t('common.loading')}
        </div>
      </Layout>
    )
  }

  const { student, model, lessons, corrections, progress } = bundle
  const completed = lessons.filter((l) => l.status === 'completed')
  const planned = lessons.find((l) => l.status === 'planned' || l.status === 'inProgress')
  const level = overallCefr(model.skillEstimates)
  const nextPreview: LessonPlan = previewNextLesson(student, model, lessons, progress)
  const briefing = buildBriefing(bundle, Date.now(), nextPreview)

  const startLesson = async () => {
    if (planned) {
      navigate(`/tutor/student/${student.id}/lesson/${planned.id}`)
      return
    }
    const rec = await createLesson(student, model, lessons, progress)
    navigate(`/tutor/student/${student.id}/lesson/${rec.id}`)
  }

  const regenerate = async () => {
    // Force a fresh planned lesson (discarding any stale planned one is fine —
    // creating a new one just adds another planned record the tutor can start).
    await createLesson(student, model, lessons, progress)
    toast(t('dashboard.generateNext'), 'ok')
    load()
  }

  return (
    <Layout
      headerExtra={
        <>
          <ModeSwitcher studentId={student.id} />
          <LockButton />
        </>
      }
    >
      <div className="container" style={{ paddingBlock: 'var(--sp-5)' }}>
        <div className={styles.head}>
          <div>
            {/* The roster is other learners' names. Only the tutor gets a way
                back to it — and only the tutor can open it (see App routes). */}
            {access.roster && (
              <Link to="/tutor" className={styles.back}>
                <ArrowLeftIcon className="flip-in-rtl" /> {t('students.title')}
              </Link>
            )}
            <h1>{student.name}</h1>
            <p className="muted">
              {t(`ageBands.${student.ageBand}`)}
              {student.nativeLanguage ? (
                <>
                  {' · '}
                  <Bdi>{student.nativeLanguage}</Bdi>
                </>
              ) : (
                ''
              )}
              {student.goals.length ? ` · ${student.goals.map((g) => t(`goals.${g}`)).join(', ')}` : ''}
            </p>
          </div>
          {access.lessonPlanning && (
            <button className="btn btn-primary btn-lg" onClick={startLesson}>
              {planned ? t('lesson.resume') : completed.length === 0 ? t('lesson.startFirst') : t('lesson.start')}
            </button>
          )}
        </div>

        <div className={styles.grid}>
          {/* Left column: continuity, level, next lesson, progress */}
          <div className={styles.colMain}>
            {/* Continuity before anything else: the tutor is usually here two
                minutes before a lesson, and this is the only thing on the page
                that changes what they do in the first ten minutes. It is also
                the densest concentration of private material on the page —
                recurring weaknesses, corrections worth re-hearing, and the
                reasoning behind today's focus. */}
            {access.diagnostics && <LessonBriefingCard briefing={briefing} />}

            {/* What the learner was asked to practise: theirs to see. */}
            {!access.diagnostics && <HomeworkCard tasks={briefing.homework} />}

            {/* A CEFR band is a verdict about a person, written for the tutor. */}
            {access.diagnostics && (
              <section className={`card ${styles.section}`}>
                <h2 className={styles.h2}>{t('dashboard.approxLevel')}</h2>
                <div className={styles.levelHero}>
                  <div>
                    <div className={styles.bigLevel}>
                      <Bdi>{level}</Bdi> <span className={styles.levelName}>· {t(`cefr.${level}Name`)}</span>
                    </div>
                  </div>
                </div>
                <SkillLevels model={model} />
              </section>
            )}

            {access.lessonPlanning && (
              <section className={`card ${styles.section} ${styles.nextLesson}`}>
                <div className={styles.sectionHead}>
                  <h2 className={styles.h2}>{t('dashboard.recommendedNext')}</h2>
                </div>
                {/* The objective title is written in the tutor's vocabulary
                    ("First words and everyday chunks"), the same reason the
                    lesson runner keeps it off a shared screen. */}
                {access.tutorGuidance && (
                  <div className={styles.nextObjective}>
                    <span className="badge badge-info">{t('lesson.objective')}</span>
                    <strong dir="auto">
                      {teachingLoading ? t('lesson.guidanceLoading') : objectiveTitle(lang, nextPreview.objective)}
                    </strong>
                  </div>
                )}
                {/* The rationale is the tutor's reasoning about this learner's
                    gaps — it stays on the tutor's own device. */}
                {access.diagnostics && !teachingLoading && (
                  <p className="muted" dir="auto">
                    {objectiveRationale(lang, nextPreview.objective)}
                  </p>
                )}
                <ol className={styles.phaseList}>
                  {nextPreview.phases.map((p, i) => (
                    <li key={i}>
                      {/* dir=ltr: an RTL context would otherwise render the
                          range "0–5" as "5–0". */}
                      <span className={styles.phaseTime} dir="ltr">
                        {p.startMin}–{p.endMin}
                      </span>
                      <span className={styles.phaseName}>{t(`phases.${p.kind}`)}</span>
                    </li>
                  ))}
                </ol>
                <div className="cluster">
                  <button className="btn btn-primary" onClick={startLesson}>
                    {t('dashboard.startNext')}
                  </button>
                  {/* Regenerating rewrites the plan for this learner. That is
                      an edit to their record, so it is the tutor's alone. */}
                  {access.diagnostics && (
                    <button className="btn" onClick={regenerate}>
                      {t('dashboard.generateNext')}
                    </button>
                  )}
                </div>
              </section>
            )}

            <ProgressSummary
              progress={progress}
              studentId={student.id}
              focus={briefing.recommendedFocus}
              diagnostics={access.diagnostics}
            />
          </div>

          {/* Right column: reference material the tutor dips into, not the
              headline answer — that lives in the briefing and the progress card. */}
          <div className={styles.colSide}>
            {/* Sound-by-sound ratings ("problem", "needs practice") are the
                tutor's assessment of the learner's speech. */}
            {access.diagnostics && (
              <Panel title={t('dashboard.pronunciationTargets')}>
                {model.pronunciationFoci.filter((f) => f.rating !== 'clear').length ? (
                  <ul className={styles.plainList}>
                    {model.pronunciationFoci
                      .filter((f) => f.rating !== 'clear')
                      .map((f) => (
                        <li key={f.area}>
                          {t(`pron.${f.area}`)} —{' '}
                          <span className="muted">{t(`pron.rating${rSuffix(f.rating)}`)}</span>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p className="muted">—</p>
                )}
              </Panel>
            )}

            {/* The words they have learned. Theirs, in every mode. */}
            <Panel title={t('dashboard.vocabulary')}>
              {model.vocabulary.length ? (
                <div className="cluster">
                  {model.vocabulary.slice(-24).map((v) => (
                    <span key={v.id} className="chip is-selected">
                      <Bdi>{v.term}</Bdi>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="muted">{t('dashboard.noVocab')}</p>
              )}
            </Panel>

            {/* Their own voice, played back. Encouraging, not diagnostic. */}
            <Panel title={t('dashboard.audioSamples')}>
              <AudioList recordings={audio} onChange={load} />
            </Panel>
          </div>
        </div>

        {corrections.length === 0 && completed.length === 0 && (
          <p className="muted" style={{ marginTop: 'var(--sp-5)', fontSize: 'var(--fs-sm)' }}>
            {t('dashboard.noHistory')}
          </p>
        )}
      </div>
    </Layout>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={`card ${styles.panel}`}>
      <h3 className={styles.panelTitle}>{title}</h3>
      {children}
    </section>
  )
}

function rSuffix(rating: string): string {
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
