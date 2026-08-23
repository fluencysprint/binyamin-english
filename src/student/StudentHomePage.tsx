/* ==========================================================================
   Student Home — "what should I do now?", answered in about three seconds.
   --------------------------------------------------------------------------
   Until now the device in a learner's hands showed the tutor's dashboard with
   the tutor's half removed: a level card gone, a briefing gone, a plan gone,
   and whatever was left arranged in two columns for a laptop. Subtracting is
   not designing. A learner opening that could not tell what to do next,
   because nothing on it was ever written to answer that question.

   This screen is written to answer exactly one question, and the rest of it
   is arranged so nothing competes with the answer:

     TODAY      one action, one button, and why it is the right one
     LAST LESSON what got better, and the one thing to keep working on
     REVIEW     what is waiting, but only when it is not already the action
     PROGRESS   a small amount of evidence, each line a real count

   What is deliberately NOT here: XP, streaks, badges, coins, a calendar, a
   grid of statistics, a CEFR band, the tutor's reasoning, a percentage of
   anything. Every number on this page is something the learner did, over the
   number of times they were asked.

   Sections below TODAY disappear entirely when they have no evidence. An
   empty section is worse than no section: it teaches the learner that this
   screen is mostly scaffolding.
   ========================================================================== */

import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { useI18n } from '../i18n/I18nProvider'
import { Bdi } from '../components/Bdi'
import { BidiText } from '../components/BidiText'
import { ModeSwitcher, LockButton } from '../tutor/ModeSwitcher'
import { formatDate } from '../utils/time'
import { StudentBundle, loadStudentBundle } from '../students/studentService'
import { EvidenceStatement, learnerEvidence } from '../students/evidence'
import { choosePracticeSet, PracticePlan } from '../practice/practiceService'
import { wordCount } from '../practice/practiceSet'
import styles from './StudentHomePage.module.css'

export function StudentHomePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, lang } = useI18n()

  const [bundle, setBundle] = useState<StudentBundle | null>(null)
  const [plan, setPlan] = useState<PracticePlan | null>(null)
  const [notFound, setNotFound] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    const b = await loadStudentBundle(id)
    if (!b) {
      setNotFound(true)
      return
    }
    setBundle(b)
    setPlan(choosePracticeSet(b.student, b.model, b.lessons))
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  if (notFound) {
    return (
      <Shell>
        <p>{t('errors.studentNotFound')}</p>
      </Shell>
    )
  }
  if (!bundle) {
    return (
      <Shell>
        <p className="muted">{t('common.loading')}</p>
      </Shell>
    )
  }

  const { student, model, lessons, progress } = bundle
  const evidence = learnerEvidence(bundle)
  const completed = lessons
    .filter((l) => l.status === 'completed')
    .sort((a, b) => (a.completedAt ?? 0) - (b.completedAt ?? 0))
  const last = completed[completed.length - 1]

  const started = (plan?.doneItemIds.size ?? 0) > 0
  const words = plan ? wordCount(plan.set) : 0
  /* The headline names what the set IS, not how long it takes, whenever the
     set is one recognisable kind of thing — "Review 3 words" tells a learner
     more in less space than "4-minute practice". A mixed homework set has no
     such name, so it is described by its length instead. */
  const wordsOnly = plan !== null && words === plan.set.items.length && words > 0

  return (
    <Shell studentId={student.id}>
      <p className={styles.greeting}>
        {t('studentHome.greeting', { name: student.name })}
      </p>

      {/* ---- TODAY --------------------------------------------------- */}
      <section className={styles.today} aria-labelledby="today-heading">
        <h1 id="today-heading" className={styles.sectionLabel}>
          {t('studentHome.today')}
        </h1>
        {plan ? (
          <>
            <p className={styles.action}>
              {wordsOnly
                ? t('studentHome.reviewWords', { count: words })
                : t('studentHome.minutePractice', { minutes: plan.set.minutes })}
            </p>
            <p className={styles.actionWhy}>
              {t(
                plan.set.source === 'homework'
                  ? 'studentHome.fromYourLesson'
                  : 'studentHome.dueToRemember',
              )}
            </p>
            <button
              className="btn btn-primary btn-lg btn-block"
              onClick={() => navigate(`/tutor/student/${student.id}/practice`)}
            >
              {started ? t('common.continue') : t('common.start')}
            </button>
          </>
        ) : (
          <>
            <p className={styles.action}>{t('studentHome.allCaughtUp')}</p>
            <p className={styles.actionWhy}>{t('studentHome.allCaughtUpWhy')}</p>
            {last && (
              <Link
                className="btn btn-lg btn-block"
                to={`/tutor/student/${student.id}/lesson/${last.id}/report`}
              >
                {t('studentHome.seeLastLesson')}
              </Link>
            )}
          </>
        )}
      </section>

      {/* ---- LAST LESSON --------------------------------------------- */}
      {last && (
        <section className={styles.block} aria-labelledby="last-heading">
          <h2 id="last-heading" className={styles.sectionLabel}>
            {t('studentHome.lastLesson')}
          </h2>
          <p className={styles.when}>
            <Bdi>{formatDate(last.completedAt ?? last.plan.createdAt, lang)}</Bdi>
          </p>
          {evidence.wins.length > 0 || evidence.keepWorking.length > 0 ? (
            <ul className={styles.lines}>
              {evidence.wins.slice(0, 2).map((s) => (
                <Line key={s.id} statement={s} />
              ))}
              {evidence.keepWorking.slice(0, 1).map((s) => (
                <Line key={s.id} statement={s} />
              ))}
            </ul>
          ) : (
            <p className="muted">{t('studentHome.noEvidenceYet')}</p>
          )}
          <Link className={styles.quietLink} to={`/tutor/student/${student.id}/lesson/${last.id}/report`}>
            {t('studentHome.seeLastLesson')}
          </Link>
        </section>
      )}

      {/* ---- REVIEW ---------------------------------------------------
          Only what is genuinely waiting, and only when it is not already the
          action at the top — repeating "3 words" twice on one screen makes
          both mentions mean less. */}
      {plan?.set.source !== 'review' && (
        <ReviewBlock
          words={progress.dueVocabulary.length}
          sounds={progress.pronunciationTargets.filter((p) => p.rating !== 'understandable').length}
        />
      )}

      {/* ---- PROGRESS ------------------------------------------------- */}
      {(evidence.practice.itemsAttempted > 0 || evidence.knownWords.length > 0 || completed.length > 0) && (
        <section className={styles.block} aria-labelledby="progress-heading">
          <h2 id="progress-heading" className={styles.sectionLabel}>
            {t('studentHome.progress')}
          </h2>
          <ul className={styles.lines}>
            {completed.length > 0 && (
              <li className={styles.line}>
                {completed.length === 1
                  ? t('studentHome.lessonDoneOne')
                  : t('studentHome.lessonsDone', { count: completed.length })}
              </li>
            )}
            {/* A score needs a denominator worth stating. "1 of 1" is true
                and useless, and it is the shape a learner stops believing. */}
            {evidence.practice.itemsAttempted >= 3 && (
              <li className={styles.line}>
                {t('studentHome.practiceDone', {
                  correct: evidence.practice.independent,
                  total: evidence.practice.itemsAttempted,
                })}
              </li>
            )}
            {evidence.knownWords.length > 0 && (
              <li className={styles.line}>
                {t('studentHome.wordsFromMemory', { count: evidence.knownWords.length })}
              </li>
            )}
          </ul>

          {/* Everything else is one tap away and nothing above depends on it. */}
          {(model.vocabulary.length > 0 || completed.length > 0) && (
            <details className={styles.more}>
              <summary>{t('studentHome.seeMore')}</summary>
              {model.vocabulary.length > 0 && (
                <>
                  <h3 className={styles.subLabel}>{t('studentHome.yourWords')}</h3>
                  <div className="cluster">
                    {model.vocabulary.slice(-20).map((v) => (
                      <span key={v.id} className="chip is-selected">
                        <Bdi>{v.term}</Bdi>
                      </span>
                    ))}
                  </div>
                </>
              )}
              {completed.length > 0 && (
                <>
                  <h3 className={styles.subLabel}>{t('studentHome.yourLessons')}</h3>
                  <ul className={styles.lessonList}>
                    {[...completed].reverse().slice(0, 8).map((l) => (
                      <li key={l.id}>
                        <Link to={`/tutor/student/${student.id}/lesson/${l.id}/report`}>
                          <Bdi>{formatDate(l.completedAt ?? l.plan.createdAt, lang)}</Bdi>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </details>
          )}
        </section>
      )}
    </Shell>
  )
}

function Line({ statement }: { statement: EvidenceStatement }) {
  const { t } = useI18n()
  return (
    <li className={`${styles.line} ${statement.tone === 'win' ? styles.win : styles.work}`}>
      <BidiText text={t(statement.key, statement.params)} />
    </li>
  )
}

function ReviewBlock({ words, sounds }: { words: number; sounds: number }) {
  const { t } = useI18n()
  if (words === 0 && sounds === 0) return null
  return (
    <section className={styles.block} aria-labelledby="review-heading">
      <h2 id="review-heading" className={styles.sectionLabel}>
        {t('studentHome.review')}
      </h2>
      <ul className={styles.lines}>
        {words > 0 && <li className={styles.line}>{t('studentHome.wordsWaiting', { count: words })}</li>}
        {sounds > 0 && <li className={styles.line}>{t('studentHome.soundWaiting', { count: sounds })}</li>}
      </ul>
    </section>
  )
}

function Shell({ studentId, children }: { studentId?: string; children: React.ReactNode }) {
  return (
    <Layout
      headerExtra={
        <>
          <ModeSwitcher studentId={studentId} />
          <LockButton />
        </>
      }
    >
      <div className={`container container-narrow ${styles.page}`}>{children}</div>
    </Layout>
  )
}
