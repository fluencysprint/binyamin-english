import { useState } from 'react'
import { useI18n } from '../i18n/I18nProvider'
import { CorrectionCategory, CORRECTION_CATEGORIES, Correction, Priority } from '../types'
import { uid } from '../utils/id'
import { FieldError } from '../components/FieldError'
import {
  LIMITS,
  collectIssues,
  isValid,
  validateOptionalText,
  validateText,
} from '../utils/validation'

const PRIORITIES: Priority[] = ['low', 'medium', 'high']
const PRIORITY_KEY: Record<Priority, string> = {
  low: 'corrections.priorityLow',
  medium: 'corrections.priorityMedium',
  high: 'corrections.priorityHigh',
}

/**
 * Fast correction capture — minimal typing, one or two taps to save.
 *
 * This opens mid-conversation, so everything that is not needed to record what
 * was said lives behind "More details". Category arrives pre-selected from the
 * step the tutor is actually on (a pronunciation step almost never produces a
 * word-order correction), and Enter in either field saves.
 */
export function CorrectionCapture({
  studentId,
  lessonId,
  defaultCategory = 'grammar',
  onSave,
}: {
  studentId: string
  lessonId?: string
  defaultCategory?: CorrectionCategory
  onSave: (c: Correction) => void
}) {
  const { t } = useI18n()
  const [category, setCategory] = useState<CorrectionCategory>(defaultCategory)
  const [showMore, setShowMore] = useState(false)
  const [said, setSaid] = useState('')
  const [better, setBetter] = useState('')
  const [explanation, setExplanation] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')

  /* Corrections are quotes of a real learner: they can legitimately contain
     any script, accents, apostrophes and angle brackets ("a > b"). The shared
     layer strips only control and bidi-override characters and caps the length;
     it never rewrites what the learner actually said. */
  const saidResult = validateText(said, { maxLength: LIMITS.line })
  const betterResult = validateText(better, { maxLength: LIMITS.line })
  const explanationResult = validateOptionalText(explanation, { maxLength: LIMITS.note, multiline: true })
  const issues = collectIssues({ said: saidResult, better: betterResult, explanation: explanationResult })

  const saidText = saidResult.ok ? saidResult.value : ''
  const canSave = isValid({ saidResult, betterResult, explanationResult }) && saidText !== ''

  const save = () => {
    if (!canSave) return
    const correction: Correction = {
      id: uid('corr'),
      studentId,
      lessonId,
      category,
      said: saidText,
      better: betterResult.ok ? betterResult.value : '',
      explanation: (explanationResult.ok && explanationResult.value) || undefined,
      priority,
      at: Date.now(),
    }
    onSave(correction)
  }

  return (
    <div className="stack">
      <div className="field">
        <span style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>{t('corrections.category')}</span>
        <div className="cluster">
          {CORRECTION_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className="chip"
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
            >
              {t(`corrections.${c}`)}
            </button>
          ))}
        </div>
      </div>

      <label className="field">
        <span>{t('corrections.said')}</span>
        {/* The learner's own words, in whatever language they came out in —
            hence no autocapitalize and no spellcheck fighting the tutor. */}
        <input
          className="input"
          value={said}
          onChange={(e) => setSaid(e.target.value)}
          autoFocus
          type="text"
          autoCapitalize="sentences"
          spellCheck={false}
          enterKeyHint="next"
          maxLength={LIMITS.line}
          aria-invalid={!saidResult.ok}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canSave) save()
          }}
        />
        <FieldError issue={issues.said} />
      </label>

      {category !== 'greatExpression' && (
        <label className="field">
          <span>{t('corrections.better')}</span>
          <input
            className="input"
            value={better}
            onChange={(e) => setBetter(e.target.value)}
            type="text"
            autoCapitalize="sentences"
            spellCheck={false}
            enterKeyHint="done"
            maxLength={LIMITS.line}
            aria-invalid={!betterResult.ok}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canSave) save()
            }}
          />
          <FieldError issue={issues.better} />
        </label>
      )}

      {/* An explanation and a priority are worth having on a review pass and
          almost never worth twenty seconds of a live lesson, so they are one
          tap away rather than in the middle of the form. */}
      {showMore ? (
        <>
          <label className="field">
            <span>{t('corrections.explanation')}</span>
            {/* A note, not a label — a textarea so it can hold a sentence. */}
            <textarea
              className="textarea"
              rows={2}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              maxLength={LIMITS.note}
              aria-invalid={!explanationResult.ok}
            />
            <FieldError issue={issues.explanation} />
          </label>

          <div className="field">
            <span style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>{t('corrections.priority')}</span>
            <div className="cluster">
              {PRIORITIES.map((p) => (
                <button key={p} type="button" className="chip" aria-pressed={priority === p} onClick={() => setPriority(p)}>
                  {t(PRIORITY_KEY[p])}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => setShowMore(true)}>
          {t('corrections.moreDetails')}
        </button>
      )}

      <button className="btn btn-primary btn-lg btn-block" onClick={save} disabled={!canSave}>
        {t('common.save')}
      </button>
    </div>
  )
}
