import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useI18n } from '../i18n/I18nProvider'
import { ScoreOutcome } from '../types'
import { ModeAccess } from '../app/modeAccess'
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  EyeIcon,
  EyeOffIcon,
  MenuIcon,
  NoteIcon,
  PartialIcon,
  PencilIcon,
  PlusIcon,
  RecordIcon,
  SkipIcon,
} from '../components/icons'
import styles from './StepActionBar.module.css'

export type CaptureKind = 'correction' | 'record' | 'notes' | 'vocab'

/**
 * The tutor's whole control surface for a micro-step, in one pinned bar.
 *
 * It replaced four separate control clusters that used to stack up under the
 * step card — a Previous/Next row, a "How did that go?" row, a full-bleed tray
 * of five capture buttons, and a "Skip this section" footer. Together they ran
 * to roughly 260px of chrome in a ragged auto-fit grid that left obvious holes
 * at some widths, and they gave the tutor four things that all looked like the
 * next thing to press.
 *
 * The hierarchy here is the order a tutor actually works in, top to bottom and
 * end to start:
 *
 *   1. JUDGE  — "How did that go?" is directly above the primary action, so
 *      the natural downward read is score-then-advance. Scoring is what feeds
 *      the learning model; below the primary button it simply got skipped.
 *   2. ADVANCE — one big primary. It says "Next step" until the last step of
 *      the last phase, where it becomes "Finish lesson": there is never a dead
 *      primary button, and never two of them competing.
 *   3. CAPTURE + SESSION — everything infrequent (correction, recording, new
 *      word, notes, skip a whole section, timer visibility) lives behind one
 *      "Tools" disclosure. Two taps, no permanent tray.
 *   4. BACK — an icon-only step-back, deliberately the smallest thing here.
 *
 * Pinned to the bottom with `position: sticky`, so it keeps its place in flow
 * and can never cover the end of the step card, and so a tutor reading the
 * middle of a long SAY/HELP block does not have to scroll past UI chrome to
 * act on it.
 */
export function StepActionBar({
  access,
  outcome,
  onScore,
  onPrev,
  onNext,
  onFinish,
  atStart,
  atEnd,
  onCapture,
  showTimer,
  onToggleTimer,
  canSkipSection,
  onSkipSection,
}: {
  access: ModeAccess
  outcome?: ScoreOutcome
  onScore: (outcome: ScoreOutcome) => void
  onPrev: () => void
  onNext: () => void
  onFinish: () => void
  atStart: boolean
  atEnd: boolean
  onCapture: (kind: CaptureKind) => void
  showTimer: boolean
  onToggleTimer: () => void
  canSkipSection: boolean
  onSkipSection: () => void
}) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => setOpen(false), [])

  /* Publish the bar's height so other bottom-anchored overlays can clear it.
     Toasts are fixed to the bottom of the viewport, and "Saved" landing on top
     of "Next step" is both unreadable and a mis-tap waiting to happen. The
     height is not a constant: it changes with viewport width and with locale
     (Russian verdicts wrap to two lines where English does not), so it is
     measured rather than guessed. */
  useEffect(() => {
    const el = barRef.current
    if (!el) return
    const root = document.documentElement
    const publish = () =>
      root.style.setProperty('--bottom-bar-h', `${Math.round(el.getBoundingClientRect().height)}px`)
    publish()
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(publish)
    ro?.observe(el)
    return () => {
      ro?.disconnect()
      root.style.removeProperty('--bottom-bar-h')
    }
  }, [])

  // Escape closes, and opening moves focus into the panel so the disclosure is
  // usable from a keyboard as well as a thumb.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    panelRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const runTool = (fn: () => void) => () => {
    setOpen(false)
    fn()
  }

  // Notes are the tutor's private record of a learner. Together mode puts the
  // plan on a screen the student can see, so notes are tutor-only — the same
  // rule the old tray followed. Both answers come from one table now, so this
  // bar cannot drift out of step with the rest of the lesson screen.
  const showNotes = access.privateNotes
  const showCapture = access.captureTools

  return (
    <div className={styles.bar} ref={barRef} data-testid="step-action-bar">
      <div className={`container container-narrow ${styles.inner}`}>
        {/* 1. JUDGE — tutor mode only: on the learner's own device a verdict
            about them is not something to display, let alone tap. */}
        {access.scoring && (
          <div className={styles.outcomeRow}>
            <span className={styles.outcomeLabel} id={`${panelId}-score`}>
              {t('lesson.scoreThis')}
            </span>
            <div className={styles.segmented} role="group" aria-labelledby={`${panelId}-score`}>
              {(['correct', 'partial', 'needsWork'] as ScoreOutcome[]).map((o) => (
                <button
                  key={o}
                  type="button"
                  className={`${styles.seg} ${styles[o]}`}
                  aria-pressed={outcome === o}
                  onClick={() => onScore(o)}
                >
                  <OutcomeIcon outcome={o} />
                  <span className={styles.segLabel}>
                    {t(
                      `lesson.outcome${o === 'needsWork' ? 'NeedsWork' : o === 'partial' ? 'Partial' : 'Correct'}`,
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={styles.navRow}>
          {/* 4. BACK — smallest control in the bar, and never a second primary. */}
          <button
            type="button"
            className={styles.iconBtn}
            onClick={onPrev}
            disabled={atStart}
            aria-label={t('lesson.prev')}
            title={t('lesson.prev')}
          >
            <ChevronLeftIcon className="flip-in-rtl" />
          </button>

          {/* 3. TOOLS — one disclosure for everything infrequent. */}
          {(showCapture || canSkipSection) && (
            <button
              type="button"
              className={styles.toolsBtn}
              aria-expanded={open}
              aria-haspopup="true"
              aria-controls={panelId}
              onClick={() => setOpen((v) => !v)}
            >
              <MenuIcon />
              <span className={styles.toolsLabel}>{t('lesson.tools')}</span>
            </button>
          )}

          {/* 2. ADVANCE — the one thing that is always obviously next. */}
          {atEnd ? (
            <button type="button" className={`btn btn-primary ${styles.next}`} onClick={onFinish}>
              {t('lesson.finishLesson')} <ChevronRightIcon className="flip-in-rtl" />
            </button>
          ) : (
            <button type="button" className={`btn btn-primary ${styles.next}`} onClick={onNext}>
              {t('lesson.nextStepBtn')} <ChevronRightIcon className="flip-in-rtl" />
            </button>
          )}
        </div>
      </div>

      {open && (
        <>
          {/* A real backdrop rather than an outside-click listener: dismissing
              the menu must never also press the button underneath it, which on
              this bar would mean an unintended navigation. */}
          <div className={styles.backdrop} onClick={close} data-testid="tools-backdrop" />
          <div
            className={styles.panel}
            id={panelId}
            ref={panelRef}
            role="group"
            aria-label={t('lesson.tools')}
          >
            {showCapture && (
              <>
                <p className={styles.groupLabel}>{t('lesson.capture')}</p>
                <button
                  type="button"
                  className={styles.item}
                  onClick={runTool(() => onCapture('correction'))}
                >
                  <PencilIcon /> {t('lesson.quickCorrection')}
                </button>
                <button
                  type="button"
                  className={styles.item}
                  onClick={runTool(() => onCapture('record'))}
                >
                  <RecordIcon /> {t('lesson.record')}
                </button>
                <button
                  type="button"
                  className={styles.item}
                  onClick={runTool(() => onCapture('vocab'))}
                >
                  <PlusIcon /> {t('lesson.addVocab')}
                </button>
                {showNotes && (
                  <button
                    type="button"
                    className={styles.item}
                    onClick={runTool(() => onCapture('notes'))}
                  >
                    <NoteIcon /> {t('lesson.notes')}
                  </button>
                )}
              </>
            )}

            {(canSkipSection || access.timer) && (
              <>
                <p className={styles.groupLabel}>{t('lesson.session')}</p>
                {canSkipSection && (
                  <button type="button" className={styles.item} onClick={runTool(onSkipSection)}>
                    <SkipIcon className="flip-in-rtl" /> {t('lesson.skipSection')}
                  </button>
                )}
                {access.timer && (
                  <button type="button" className={styles.item} onClick={runTool(onToggleTimer)}>
                    {showTimer ? <EyeOffIcon /> : <EyeIcon />}{' '}
                    {showTimer ? t('lesson.hideTimer') : t('lesson.showTimer')}
                  </button>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function OutcomeIcon({ outcome }: { outcome: ScoreOutcome }) {
  if (outcome === 'correct') return <CheckIcon />
  if (outcome === 'partial') return <PartialIcon />
  return <CloseIcon />
}
