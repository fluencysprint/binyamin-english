import { HomeworkTask, ImprovementItem, LessonReport, ReportTopic, WentWellItem } from '../types'
import { conceptTitle, localizedTitle } from '../lessons/guidance'
import { getPhrase } from '../curriculum/phrases'
import { useI18n } from '../i18n/I18nProvider'
import { translate } from '../i18n/translate'
import { ArrowRightIcon, PrinterIcon } from '../components/icons'
import { useToast } from '../components/Toast'
import { cefrLabel } from '../utils/cefr'
import { formatDate } from '../utils/time'
import { PRONUNCIATION_RATING_KEY } from '../data/pronunciationLibrary'
import { Bdi } from '../components/Bdi'
import { BidiText } from '../components/BidiText'
import { BidiTrans } from '../components/BidiTrans'
import { quoted, localizeInlineQuotes } from '../utils/quotes'
import { hasRTL } from '../utils/bidi'
import { UILanguage } from '../types'
import styles from './ReportView.module.css'

type T = (key: string, params?: Record<string, string | number>) => string

/** One "we worked on…" line: the activity's name in the reader's language,
 *  with the English task it was about left exactly as it was. */
function topicText(item: ReportTopic, lang: UILanguage): string {
  const title = localizedTitle(lang, item)
  return item.prompt ? `${title}: ${item.prompt}` : title
}

function parentPracticed(report: LessonReport, lang: UILanguage): string[] {
  const parent = report.parent
  if (!parent) return []
  return parent.practicedItems?.length
    ? parent.practicedItems.map((item) => topicText(item, lang))
    : parent.practiced
}

function workedOnLines(report: LessonReport, lang: UILanguage): string[] {
  return report.workedOnItems?.length
    ? report.workedOnItems.map((item) => topicText(item, lang))
    : report.workedOn
}

function wentWellText(item: WentWellItem, t: T, lang: UILanguage): string {
  switch (item.kind) {
    case 'objectiveOutcome':
      return t(`report.wentWellItem.${item.outcome === 'correct' ? 'objectiveCorrect' : 'objectivePartial'}`, {
        title: localizedTitle(lang, item),
      })
    case 'greatExpression':
      return t('report.wentWellItem.greatExpression', { said: item.said })
    case 'selfCorrected':
      return t('report.wentWellItem.selfCorrected', { count: item.count })
    case 'engaged':
      return t('report.wentWellItem.engaged')
    case 'strongestArea':
      return t('report.wentWellItem.strongestArea', { goal: t(`goals.${item.goal}`) })
  }
}

function improvementText(item: ImprovementItem, t: T, lang: UILanguage): string {
  switch (item.kind) {
    case 'appliedCorrectly':
      return t('report.improvementItem.appliedCorrectly', { title: localizedTitle(lang, item) })
    case 'practicedIndependently':
      return t('report.improvementItem.practicedIndependently')
    case 'fixedAfterModeling':
      return t('report.improvementItem.fixedAfterModeling', { said: item.said, better: item.better })
  }
}

/**
 * Homework in the learner's own language, with the English they are practising
 * left in English. The English fragments are interpolated as one joined string
 * rather than as React nodes so the same function serves both the printed card
 * and the copy-to-clipboard text.
 */
export function homeworkText(task: HomeworkTask, t: T, lang: UILanguage = 'en'): string {
  switch (task.kind) {
    case 'sayCorrected':
      return t('report.homeworkItem.sayCorrected', {
        // `quoted`, not a literal pair: a captured correction can itself
        // contain quotes, and two layers of them is the artifact.
        items: task.items.map((i) => quoted(i.better, lang)).join(' · '),
      })
    case 'sayWordsAloud':
      return t('report.homeworkItem.sayWordsAloud', { terms: task.terms.join(', ') })
    case 'useWordsInSentences':
      return t('report.homeworkItem.useWordsInSentences', { terms: task.terms.join(', ') })
    case 'repeatFluency':
      return t('report.homeworkItem.repeatFluency', { topic: task.topic, seconds: task.seconds })
    case 'practiceSound':
      return t('report.homeworkItem.practiceSound', {
        area: t(`pron.${task.area}`),
        words: task.words.join(', '),
      })
    case 'writeSentences':
      return t('report.homeworkItem.writeSentences', { count: task.count, target: task.target })
    case 'noticeLanguage':
      return t('report.homeworkItem.noticeLanguage', { target: task.target })
    case 'prepareAnswer':
      return t('report.homeworkItem.prepareAnswer', { question: task.question })
    /* The phrases keep their English; what the learner reads is the
       instruction around them. Chunks are joined with a middle dot rather
       than commas because several of them end in a comma of their own. */
    case 'sayPhrases':
      return t('report.homeworkItem.sayPhrases', {
        phrases: task.ids
          .map((id) => getPhrase(id)?.chunk)
          .filter(Boolean)
          .join(' · '),
      })
    case 'usePhraseFrame':
      return t('report.homeworkItem.usePhraseFrame', {
        frame: getPhrase(task.id)?.chunk ?? task.id,
        words: task.slots.join(', '),
      })
  }
}

/**
 * `homeworkText`, as React nodes with the English isolated by VALUE rather
 * than recovered by scanning the finished string — see `BidiTrans`. Mirrors
 * `homeworkText`'s switch exactly; the two must stay in sync, since this is
 * what renders on screen and `homeworkText` is what gets printed or copied.
 *
 * Sentence-shaped content (a corrected sentence, a phrase) gets its own line
 * when there are several — `sayCorrected`, `sayPhrases`. A short list of
 * words or examples (`terms`, `words`) stays one inline isolate, comma-joined,
 * matching how a Hebrew sentence would naturally introduce it ("try: morning,
 * afternoon, evening") rather than fragmenting every token onto its own line.
 */
export function HomeworkItemText({ task, lang }: { task: HomeworkTask; lang: UILanguage }) {
  switch (task.kind) {
    case 'sayCorrected':
      return (
        <BidiTrans
          lang={lang}
          i18nKey="report.homeworkItem.sayCorrected"
          params={{ items: task.items.map((i) => quoted(i.better, lang)) }}
          ltr={['items']}
          block
        />
      )
    case 'sayWordsAloud':
      return (
        <BidiTrans
          lang={lang}
          i18nKey="report.homeworkItem.sayWordsAloud"
          params={{ terms: task.terms.join(', ') }}
          ltr={['terms']}
        />
      )
    case 'useWordsInSentences':
      return (
        <BidiTrans
          lang={lang}
          i18nKey="report.homeworkItem.useWordsInSentences"
          params={{ terms: task.terms.join(', ') }}
          ltr={['terms']}
        />
      )
    case 'repeatFluency':
      return (
        <BidiTrans
          lang={lang}
          i18nKey="report.homeworkItem.repeatFluency"
          params={{ topic: task.topic, seconds: task.seconds }}
          ltr={['topic']}
        />
      )
    case 'practiceSound':
      return (
        <BidiTrans
          lang={lang}
          i18nKey="report.homeworkItem.practiceSound"
          params={{ area: translate(lang, `pron.${task.area}`), words: task.words.join(', ') }}
          ltr={['words']}
        />
      )
    case 'writeSentences':
      return (
        <BidiTrans
          lang={lang}
          i18nKey="report.homeworkItem.writeSentences"
          params={{ count: task.count, target: task.target }}
          ltr={['target']}
        />
      )
    case 'noticeLanguage':
      return (
        <BidiTrans
          lang={lang}
          i18nKey="report.homeworkItem.noticeLanguage"
          params={{ target: task.target }}
          ltr={['target']}
        />
      )
    case 'prepareAnswer':
      return (
        <BidiTrans
          lang={lang}
          i18nKey="report.homeworkItem.prepareAnswer"
          params={{ question: task.question }}
          ltr={['question']}
        />
      )
    case 'sayPhrases':
      return (
        <BidiTrans
          lang={lang}
          i18nKey="report.homeworkItem.sayPhrases"
          params={{
            phrases: task.ids
              .map((id) => getPhrase(id)?.chunk)
              .filter((c): c is string => Boolean(c)),
          }}
          ltr={['phrases']}
          block
        />
      )
    case 'usePhraseFrame':
      return (
        <BidiTrans
          lang={lang}
          i18nKey="report.homeworkItem.usePhraseFrame"
          params={{
            frame: getPhrase(task.id)?.chunk ?? task.id,
            words: task.slots.join(', '),
          }}
          ltr={['frame', 'words']}
        />
      )
  }
}

function pronunciationText(item: LessonReport['pronunciation'][number], t: T, lang: UILanguage): string {
  const area = t(`pron.${item.area}`)
  const rating = t(PRONUNCIATION_RATING_KEY[item.rating])
  // A tutor's freeform note may quote a word or two with plain ASCII quotes
  // ("think" came out as "sink") — normalize those to the locale's own marks
  // rather than leaving raw `"` for BidiText/the bidi algorithm to fight over.
  const note = item.note ? localizeInlineQuotes(item.note, lang) : undefined
  return note ? `${area}: ${rating} — ${note}` : `${area}: ${rating}`
}

/** Exported for the cross-locale punctuation regression sweep — see
 *  reportPunctuation.test.ts — as well as internal use by the copy buttons. */
export function reportToText(report: LessonReport, t: T, parent: boolean, lang: UILanguage): string {
  const lines: string[] = [t('common.appName'), '']
  if (parent && report.parent) {
    lines.push(t('report.parentReport'))
    lines.push(`${t('report.approxLevel')}: ${cefrLabel(report.parent.approxLevel)}`)
    lines.push(`${t('report.strengths')}: ${report.parent.strengths.map((w) => wentWellText(w, t, lang)).join('; ')}`)
    lines.push(`${t('report.practiced')}: ${parentPracticed(report, lang).join('; ')}`)
    lines.push(
      `${t('report.improvement')}: ${report.parent.improvement.map((i) => improvementText(i, t, lang)).join('; ')}`,
    )
    lines.push(`${t('report.priorities')}: ${report.parent.priorities.join('; ')}`)
    lines.push(
      `${t('report.nextFocus')}: ${conceptTitle(lang, report.parent.nextFocusRef) ?? report.parent.nextFocusTitle}`,
    )
  } else {
    lines.push(t('report.studentReport'))
    lines.push(`${t('report.workedOn')}: ${workedOnLines(report, lang).join('; ')}`)
    lines.push(`${t('report.wentWell')}: ${report.wentWell.map((w) => wentWellText(w, t, lang)).join('; ')}`)
    if (report.corrections.length)
      lines.push(
        `${t('report.corrections')}: ${report.corrections.map((c) => `${c.said} → ${c.better}`).join('; ')}`,
      )
    if (report.vocabulary.length) lines.push(`${t('report.vocabulary')}: ${report.vocabulary.join(', ')}`)
    if (report.reviewed?.recalled.length)
      lines.push(`${t('report.reviewedRecalled')}: ${report.reviewed.recalled.join(', ')}`)
    if (report.reviewed?.missed.length)
      lines.push(`${t('report.reviewedMissed')}: ${report.reviewed.missed.join(', ')}`)
    if (report.pronunciation.length)
      lines.push(`${t('report.pronunciation')}: ${report.pronunciation.map((p) => pronunciationText(p, t, lang)).join('; ')}`)
    lines.push(
      `${t('report.nextFocus')}: ${conceptTitle(lang, report.nextFocusRef) ?? report.nextFocusTitle}`,
    )
  }
  if (report.homework?.length) {
    lines.push('')
    lines.push(`${t('report.homework')}:`)
    report.homework.forEach((task, i) => lines.push(`${i + 1}. ${homeworkText(task, t, lang)}`))
  }
  return lines.join('\n')
}

export function ReportView({
  report,
  parentSection,
}: {
  report: LessonReport
  /** Whether to render the parent-facing section. It carries a CEFR band and
   *  the tutor's priority list — a report ABOUT the learner written for
   *  somebody else — so it is not shown on a device the learner is holding.
   *  Required rather than defaulted: a caller that has not thought about it
   *  must say so. See app/modeAccess.ts. */
  parentSection: boolean
}) {
  const { t, lang } = useI18n()
  const { toast } = useToast()

  const copy = async (parent: boolean) => {
    try {
      await navigator.clipboard.writeText(reportToText(report, t, parent, lang))
      toast(t('common.copied'), 'ok')
    } catch {
      toast(t('errors.generic'), 'err')
    }
  }

  const print = () => window.print()

  return (
    <div className={styles.report}>
      <div className={styles.headerRow}>
        <div>
          <span className={styles.brandLine}>{t('common.appName')}</span>
          <h2>{t('report.title')}</h2>
        </div>
        <span className="muted">{t('report.generatedOn', { date: formatDate(report.generatedAt, lang) } as any)}</span>
      </div>

      {/* Student section */}
      <section className={`card ${styles.section}`}>
        <div className={styles.sectionHead}>
          <h3>{t('report.studentReport')}</h3>
          <button className="btn btn-sm" onClick={() => copy(false)}>
            {t('report.copyStudent')}
          </button>
        </div>

        <ReportBlock title={t('report.workedOn')} items={workedOnLines(report, lang)} />
        <ReportBlock
          title={t('report.wentWell')}
          items={report.wentWell.map((w) => wentWellText(w, t, lang))}
          tone="ok"
        />

        {report.corrections.length > 0 && (
          <div className={styles.block}>
            <div className={styles.blockTitle}>{t('report.corrections')}</div>
            {report.corrections.map((c, i) => (
              <div key={i} className={styles.correction}>
                <span className={styles.said} dir="ltr">
                  {c.said || '—'}
                </span>
                {/* A plain "→" always points right, which is backwards once an
                    RTL page puts the correction on the LEFT of the original.
                    `flip-in-rtl` mirrors the icon so it always points from the
                    original toward the correction, whichever side that is. */}
                <ArrowRightIcon className={`${styles.arrow} flip-in-rtl`} />
                <span className="sr-only">{t('report.correctedTo')}</span>
                <span className={styles.better} dir="ltr">
                  {c.better}
                </span>
              </div>
            ))}
          </div>
        )}

        {report.vocabulary.length > 0 && (
          <div className={styles.block}>
            <div className={styles.blockTitle}>{t('report.vocabulary')}</div>
            <div className="cluster">
              {report.vocabulary.map((v) => (
                <span key={v} className="chip is-selected" dir="ltr">
                  {v}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Words from EARLIER lessons that were asked for again today. A student
            reading their own report should see that coming back to a word is
            normal and that some of them have stuck. */}
        {report.reviewed && (report.reviewed.recalled.length > 0 || report.reviewed.missed.length > 0) && (
          <div className={styles.block}>
            <div className={styles.blockTitle}>{t('report.reviewed')}</div>
            {report.reviewed.recalled.length > 0 && (
              <div className="cluster">
                <span className="badge badge-ok">{t('report.reviewedRecalled')}</span>
                {report.reviewed.recalled.map((v) => (
                  <span key={v} className="chip is-selected" dir="ltr">
                    {v}
                  </span>
                ))}
              </div>
            )}
            {report.reviewed.missed.length > 0 && (
              <div className="cluster">
                <span className="badge badge-warn">{t('report.reviewedMissed')}</span>
                {report.reviewed.missed.map((v) => (
                  <span key={v} className="chip" dir="ltr">
                    {v}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {report.pronunciation.length > 0 && (
          <ReportBlock
            title={t('report.pronunciation')}
            items={report.pronunciation.map((p) => pronunciationText(p, t, lang))}
          />
        )}

        <div className={styles.next}>
          <span className="badge badge-info">{t('report.nextFocus')}</span>{' '}
          <span dir="auto">{conceptTitle(lang, report.nextFocusRef) ?? report.nextFocusTitle}</span>
        </div>
      </section>

      {/* Homework — every lesson ends with something small to take away.
          Its own block, not a line inside the report, because it is the one
          part the student is meant to act on. */}
      {report.homework && report.homework.length > 0 && (
        <section className={`card ${styles.section} ${styles.homework}`}>
          <div className={styles.sectionHead}>
            <h3>{t('report.homework')}</h3>
          </div>
          <p className="muted">{t('report.homeworkNote')}</p>
          {/* `list-style: none` below (needed for the per-item bullet fix)
              makes Safari drop the implicit list/listitem roles — restore
              them explicitly rather than lose that structure for AT users. */}
          <ol className={styles.homeworkList} role="list">
            {report.homework.map((task, i) => {
              const text = homeworkText(task, t, lang)
              return (
                <li key={i} dir={hasRTL(text) ? 'auto' : 'ltr'}>
                  <HomeworkItemText task={task} lang={lang} />
                </li>
              )
            })}
          </ol>
        </section>
      )}

      {/* Parent section */}
      {parentSection && report.parent && (
        <section className={`card ${styles.section} ${styles.parent}`}>
          <div className={styles.sectionHead}>
            <h3>{t('report.parentReport')}</h3>
            <button className="btn btn-sm" onClick={() => copy(true)}>
              {t('report.copyParent')}
            </button>
          </div>
          <div className={styles.levelRow}>
            <span className="muted">{t('report.approxLevel')}</span>
            <strong className={styles.level}>
              <Bdi>{cefrLabel(report.parent.approxLevel)}</Bdi>
            </strong>
          </div>
          <ReportBlock
            title={t('report.strengths')}
            items={report.parent.strengths.map((w) => wentWellText(w, t, lang))}
            tone="ok"
          />
          <ReportBlock title={t('report.practiced')} items={parentPracticed(report, lang)} />
          <ReportBlock
            title={t('report.improvement')}
            items={report.parent.improvement.map((i) => improvementText(i, t, lang))}
            tone="ok"
          />
          <ReportBlock title={t('report.priorities')} items={report.parent.priorities} />
          <div className={styles.next}>
            <span className="badge badge-info">{t('report.nextFocus')}</span>{' '}
            <span dir="auto">
              {conceptTitle(lang, report.parent.nextFocusRef) ?? report.parent.nextFocusTitle}
            </span>
          </div>
        </section>
      )}

      <button className="btn" onClick={print}>
        <PrinterIcon /> {t('report.print')}
      </button>
    </div>
  )
}

function ReportBlock({ title, items, tone }: { title: string; items: string[]; tone?: 'ok' }) {
  if (items.length === 0) return null
  return (
    <div className={styles.block}>
      <div className={styles.blockTitle}>{title}</div>
      {/* See the homework list above: `list-style: none` needs `role="list"`
          put back explicitly for Safari. */}
      <ul className={`${styles.list} ${tone === 'ok' ? styles.listOk : ''}`} role="list">
        {items.map((it, i) => (
          // A line with NO Hebrew/RTL characters at all (an English-only
          // lesson topic in an otherwise-Hebrew report) renders as its own
          // LTR unit — bullet, indent and text alignment all agree — rather
          // than lean on `dir="auto"`, which only steers the TEXT run and
          // leaves the list marker following the RTL container's gutter.
          <li key={i} dir={hasRTL(it) ? 'auto' : 'ltr'}>
            {/* Report lines interpolate English (a correction, a word list)
                into translated prose, so an RTL locale needs the embedded runs
                isolated or their punctuation lands at the wrong end. */}
            <BidiText text={it} />
          </li>
        ))}
      </ul>
    </div>
  )
}
