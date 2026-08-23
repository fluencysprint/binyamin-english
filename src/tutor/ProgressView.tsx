/* ==========================================================================
   The two surfaces that make accumulated evidence usable:

     <LessonBriefingCard>  — read before a lesson. "Where we left off."
     <ProgressSummary>     — read any time. "What matters now?"

   Both are presentation only. Every judgement they show ("recurring",
   "improving", "settled") was made in src/students/progress.ts, with a stated
   reason attached, so nothing on screen is a number this file invented.
   ========================================================================== */

import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/I18nProvider'
import { Bdi } from '../components/Bdi'
import { BidiText } from '../components/BidiText'
import { formatDate } from '../utils/time'
import { homeworkText } from '../reports/ReportView'
import { BriefingFocus, LessonBriefing } from '../lessons/briefing'
import { Explanation, ProgressIssue, ProgressSnapshot } from '../students/progress'
import { conceptTitle } from '../lessons/guidance'
import { HomeworkReview, HomeworkTask, ScoreOutcome } from '../types'
import styles from './ProgressView.module.css'

type T = (key: string, params?: Record<string, string | number>) => string

const STATUS_BADGE: Record<ProgressIssue['status'], string> = {
  recurring: 'badge-warn',
  new: 'badge-neutral',
  improving: 'badge-info',
  mastered: 'badge-ok',
}

function why(e: Explanation, t: T): string {
  return t(e.key, e.params)
}

function outcomeLabel(outcome: ScoreOutcome | undefined, t: T): string {
  if (!outcome) return t('progress.notScored')
  return t(
    outcome === 'correct'
      ? 'progress.outcomeCorrect'
      : outcome === 'partial'
        ? 'progress.outcomePartial'
        : 'progress.outcomeNeedsWork',
  )
}

function IssueRows({ items }: { items: ProgressIssue[] }) {
  const { t, lang } = useI18n()
  return (
    <ul className={styles.list}>
      {items.map((i) => (
        <li key={i.key} className={styles.row}>
          <span className={styles.item}>
            <span className={`badge ${STATUS_BADGE[i.status]}`}>{t(`progress.status${cap(i.status)}`)}</span>
            <span className={styles.label} dir="auto">
              {/* A weakness that maps to a concept is named by the concept,
                  in the tutor's language. One that is just the learner's own
                  sentence stays exactly as they said it. */}
              <Bdi>{conceptTitle(lang, i.grammarRef ?? i.pronunciationRef) ?? i.label}</Bdi>
            </span>
            <span className={styles.why}>{why(i.why, t)}</span>
          </span>
          {i.said && i.said !== i.label && (
            <span className={styles.issueText}>
              {i.said}
              {i.better ? <span className="muted"> → {i.better}</span> : null}
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={styles.block}>
      <h3 className={styles.h3}>{title}</h3>
      {children}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Briefing                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Everything the tutor needs before pressing Start, and nothing else.
 *
 * For a first lesson it collapses to one honest sentence rather than showing
 * five empty sections — an empty briefing is worse than no briefing, because
 * it teaches the tutor that this card is never worth reading.
 */
export function LessonBriefingCard({
  briefing,
  studentId,
  onReviewHomework,
}: {
  briefing: LessonBriefing
  /** So the tutor can open the same set the learner sees, and run it on a
   *  shared screen. Reading their own homework is not a tutor capability. */
  studentId: string
  /** Records whether the last set of homework came back. Absent when there is
   *  nothing to record against — a first lesson, or a read-only surface. */
  onReviewHomework?: (review: HomeworkReview) => void
}) {
  const { t, lang } = useI18n()

  if (briefing.isFirstLesson) {
    return (
      <section className={`card ${styles.section} ${styles.briefing}`} aria-label={t('briefing.title')}>
        <h2 className={styles.h2}>{t('briefing.title')}</h2>
        <p className="muted">{t('briefing.firstLesson')}</p>
      </section>
    )
  }

  const { lastLesson } = briefing
  const when =
    lastLesson === undefined
      ? ''
      : lastLesson.daysAgo === 0
        ? t('briefing.today')
        : lastLesson.daysAgo === 1
          ? t('briefing.yesterday')
          : t('briefing.daysAgo', { days: lastLesson.daysAgo })

  return (
    <section className={`card ${styles.section} ${styles.briefing}`} aria-label={t('briefing.title')}>
      <h2 className={styles.h2}>{t('briefing.title')}</h2>

      {lastLesson && (
        <Block title={t('briefing.lastLesson')}>
          <p className={styles.headline}>
            <strong dir="auto">
              <Bdi>{conceptTitle(lang, lastLesson.objectiveRef) ?? lastLesson.objectiveTitle}</Bdi>
            </strong>
            <span className="badge badge-neutral">{outcomeLabel(lastLesson.objectiveOutcome, t)}</span>
            <span className="muted">
              {when} · {formatDate(lastLesson.completedAt, lang)}
            </span>
          </p>
        </Block>
      )}

      <div className={styles.briefingGrid}>
        {briefing.recurringWeaknesses.length > 0 && (
          <Block title={t('briefing.weaknesses')}>
            <IssueRows items={briefing.recurringWeaknesses} />
          </Block>
        )}

        {briefing.keyCorrections.length > 0 && (
          <Block title={t('briefing.corrections')}>
            <ul className={styles.list}>
              {briefing.keyCorrections.map((c, i) => (
                <li key={i} className={styles.row}>
                  <span className={styles.issueText}>
                    {c.said}
                    <span className="muted"> → {c.better}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Block>
        )}

        {briefing.vocabularyToRecall.length > 0 && (
          <Block title={t('briefing.vocabulary')}>
            <div className="cluster">
              {briefing.vocabularyToRecall.map((v) => (
                <span key={v.id} className="chip is-selected">
                  <Bdi>{v.term}</Bdi>
                </span>
              ))}
            </div>
          </Block>
        )}

        {/* The phrase curriculum, for a beginner. Ordered the way a tutor
            uses it: a win to open on, the ones that have gone quiet, and how
            much the recall block is about to ask for. */}
        {briefing.phrases && (briefing.phrases.canSay.length > 0 || briefing.phrases.shaky.length > 0) && (
          <Block title={t('briefing.phrases')}>
            {briefing.phrases.canSay.length > 0 && (
              <>
                <p className={styles.why}>{t('briefing.phrasesCanSay')}</p>
                <div className="cluster">
                  {briefing.phrases.canSay.map((phrase) => (
                    <span key={phrase} className="chip is-selected" dir="ltr" lang="en">
                      <Bdi>{phrase}</Bdi>
                    </span>
                  ))}
                </div>
              </>
            )}
            {briefing.phrases.shaky.length > 0 && (
              <>
                <p className={styles.why}>{t('briefing.phrasesShaky')}</p>
                <div className="cluster">
                  {briefing.phrases.shaky.map((phrase) => (
                    <span key={phrase} className="chip" dir="ltr" lang="en">
                      <Bdi>{phrase}</Bdi>
                    </span>
                  ))}
                </div>
              </>
            )}
            {briefing.phrases.dueCount > 0 && (
              <p className="muted">{t('briefing.phrasesDue', { count: briefing.phrases.dueCount })}</p>
            )}
          </Block>
        )}

        {briefing.improving.length > 0 && (
          <Block title={t('briefing.improving')}>
            <IssueRows items={briefing.improving} />
          </Block>
        )}

        {briefing.homework.length > 0 && (
          <Block title={t('briefing.homework')}>
            <ul className={styles.list}>
              {briefing.homework.map((task, i) => (
                <li key={i} className={styles.why} dir="auto">
                  <BidiText text={homeworkText(task, t, lang)} />
                </li>
              ))}
            </ul>
            {/* One question, asked once, at the moment the tutor is already
                looking at what was set. Without it the homework loop ends
                here: a set of tasks the app hands out and never hears about
                again, so it can neither shorten the next set nor tell the
                learner what a term of practice actually did. */}
            {/* What the app actually knows, before the tutor asks anything.
                A count with its denominator — "5 of 7 came back unaided" —
                is the one line here that changes how the first ten minutes
                are spent, so it goes above the question, not below it. */}
            {briefing.homeworkPractice && briefing.homeworkPractice.answered > 0 && (
              <p className={styles.headline}>
                <span className="badge badge-ok">
                  {t('briefing.homeworkPractised', {
                    answered: briefing.homeworkPractice.answered,
                    total: briefing.homeworkPractice.total,
                  })}
                </span>
                <span className={styles.why}>
                  {t('briefing.homeworkUnaided', {
                    correct: briefing.homeworkPractice.independent,
                    answered: briefing.homeworkPractice.answered,
                  })}
                </span>
              </p>
            )}
            <Link className="btn btn-sm" to={`/tutor/student/${studentId}/practice`}>
              {t('briefing.openPractice')}
            </Link>
            {briefing.homeworkPractice?.responses.length ? (
              <ul className={styles.list}>
                {briefing.homeworkPractice.responses.map((r, i) => (
                  <li key={i} className={styles.issueText} dir="ltr" lang="en">
                    {r.response}
                  </li>
                ))}
              </ul>
            ) : null}
            {onReviewHomework ? (
              <>
                <p className={styles.empty}>{t('briefing.homeworkCheck')}</p>
                <div className="cluster">
                  {(['done', 'partly', 'notDone'] as HomeworkReview[]).map((r) => (
                    <button
                      key={r}
                      className="chip"
                      aria-pressed={briefing.homeworkReview === r}
                      onClick={() => onReviewHomework(r)}
                    >
                      {t(`briefing.homework${r === 'notDone' ? 'NotDone' : r === 'partly' ? 'Partly' : 'Done'}`)}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className={styles.empty}>{t('briefing.homeworkCheck')}</p>
            )}
            {briefing.homeworkHistory.checked >= 2 && (
              <p className={styles.why}>
                {t('briefing.homeworkRate', {
                  done: briefing.homeworkHistory.done,
                  total: briefing.homeworkHistory.checked,
                })}
              </p>
            )}
          </Block>
        )}
      </div>

      {briefing.recommendedFocus && (
        <Block title={t('briefing.focus')}>
          <p className={styles.headline}>
            <span className={styles.focusTitle} dir="auto">
              <Bdi>
                {conceptTitle(lang, briefing.recommendedFocus.ref) ?? briefing.recommendedFocus.title}
              </Bdi>
            </span>
            <span className={styles.why}>{why(briefing.recommendedFocus.why, t)}</span>
          </p>
        </Block>
      )}
    </section>
  )
}

/**
 * What the learner was asked to practise, on its own.
 *
 * Homework is the one part of the briefing that belongs to the learner, so it
 * is extracted here rather than gated inside the tutor's card: on a handed-over
 * device it is the whole point of the screen.
 */
export function HomeworkCard({ tasks, studentId }: { tasks: HomeworkTask[]; studentId: string }) {
  const { t, lang } = useI18n()
  if (tasks.length === 0) return null
  return (
    <section className={`card ${styles.section}`} aria-label={t('briefing.homework')}>
      <h2 className={styles.h2}>{t('briefing.homework')}</h2>
      <ul className={styles.list}>
        {tasks.map((task, i) => (
          <li key={i} className={styles.why} dir="auto">
            <BidiText text={homeworkText(task, t, lang)} />
          </li>
        ))}
      </ul>
      {/* Reading the list is not doing it. On a shared screen this is the
          control that turns "here is your homework" into five minutes of
          retrieval practice done together before the lesson ends. */}
      <Link className="btn" to={`/tutor/student/${studentId}/practice`}>
        {t('briefing.openPractice')}
      </Link>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* Progress                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * "What matters now?" — answerable in a few seconds by tutor or student.
 *
 * Sections appear only when they have something in them, except the two that
 * carry the headline answer (current focus, still needs work): those state
 * plainly that there is nothing, which is itself useful information.
 */
export function ProgressSummary({
  progress,
  studentId,
  focus,
  diagnostics,
}: {
  progress: ProgressSnapshot
  studentId: string
  /** What the next lesson will actually teach. Passed in rather than read off
   *  the ranking so this card, the briefing and the plan preview cannot end up
   *  naming three different things on one screen. */
  focus?: BriefingFocus
  /** Whether the caller's mode may see the tutor's reasoning — the ranked
   *  focus and its "why", and the weakness lists. Required, not defaulted:
   *  a caller that forgets must fail closed, and a new caller must decide.
   *  See app/modeAccess.ts. */
  diagnostics: boolean
}) {
  const { t, lang } = useI18n()
  const nextFocus = focus ?? progress.focus[0]

  return (
    <section className={`card ${styles.section}`} aria-label={t('progress.title')}>
      <h2 className={styles.h2}>{t('progress.title')}</h2>
      <p className="muted">
        {progress.lessonCount === 0
          ? t('progress.noLessonsYet')
          : progress.lessonCount === 1
            ? t('progress.lessonSoFarOne')
            : t('progress.lessonsSoFar', { count: progress.lessonCount })}
      </p>

      {/* The ranked focus, the "why" behind it and the weakness lists are the
          tutor's working notes about this learner. On a shared or handed-over
          screen they are not softened — they are not rendered. */}
      {diagnostics && (
        <>
          <Block title={t('progress.suggestedNext')}>
            {nextFocus ? (
              <p className={styles.headline}>
                <span className={styles.focusTitle} dir="auto">
                  <Bdi>{conceptTitle(lang, nextFocus.ref) ?? nextFocus.title}</Bdi>
                </span>
                <span className={styles.why}>{why(nextFocus.why, t)}</span>
              </p>
            ) : (
              <p className={styles.empty}>{t('progress.nothingYet')}</p>
            )}
          </Block>

          <Block title={t('progress.stillNeedsWork')}>
            {progress.needsWork.length ? (
              <IssueRows items={progress.needsWork.slice(0, 5)} />
            ) : (
              <p className={styles.empty}>{t('progress.noWeaknesses')}</p>
            )}
          </Block>

          {progress.improving.length > 0 && (
            <Block title={t('progress.improving')}>
              <IssueRows items={progress.improving.slice(0, 5)} />
            </Block>
          )}
        </>
      )}

      {(progress.secureSkills.length > 0 ||
        progress.developingSkills.length > 0 ||
        progress.recentVocabulary.length > 0) && (
        <Block title={t('progress.recentlyLearned')}>
          <ul className={styles.list}>
            {[...progress.secureSkills, ...progress.developingSkills].slice(0, 6).map((s) => (
              <li key={s.ref} className={styles.item}>
                <span className={`badge ${s.strength === 'secure' ? 'badge-ok' : 'badge-info'}`}>
                  {t(`dashboard.${s.strength === 'secure' ? 'secure' : 'emerging'}`)}
                </span>
                <span className={styles.label} dir="auto">
                  <Bdi>{s.label}</Bdi>
                </span>
              </li>
            ))}
          </ul>
          {progress.recentVocabulary.length > 0 && (
            <div className="cluster" style={{ marginTop: 'var(--sp-2)' }}>
              {progress.recentVocabulary.slice(0, 12).map((term) => (
                <span key={term} className="chip is-selected">
                  <Bdi>{term}</Bdi>
                </span>
              ))}
            </div>
          )}
        </Block>
      )}

      {diagnostics && progress.dueVocabulary.length > 0 && (
        <Block title={t('progress.dueForRecall')}>
          <div className="cluster">
            {progress.dueVocabulary.map((v) => (
              <span key={v.id} className="chip">
                <Bdi>{v.term}</Bdi>
              </span>
            ))}
          </div>
        </Block>
      )}

      {progress.history.length > 0 && (
        <Block title={t('progress.recentLessons')}>
          <ul className={styles.history}>
            {progress.history.map((h) => (
              <li key={h.id} className={styles.historyRow}>
                <span className={styles.label} dir="auto">
                  <Bdi>{h.objectiveTitle}</Bdi>
                </span>
                <span className="badge badge-neutral">{outcomeLabel(h.objectiveOutcome, t)}</span>
                <span className={styles.historyWhen}>{formatDate(h.completedAt, lang)}</span>
                <Link className="btn btn-sm" to={`/tutor/student/${studentId}/lesson/${h.id}/report`}>
                  {t('dashboard.viewReport')}
                </Link>
              </li>
            ))}
          </ul>
        </Block>
      )}
    </section>
  )
}
