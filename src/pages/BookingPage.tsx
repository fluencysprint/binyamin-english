import { useEffect, useMemo, useRef, useState } from 'react'
import { Layout } from '../components/Layout'
import { useI18n } from '../i18n/I18nProvider'
import { useToast } from '../components/Toast'
import { BOOKING_GOALS, BookingInquiry, Goal } from '../types'
import { ChipGroup } from '../components/ui'
import { clearDraft, formatInquiry, guessTimezone, loadDraft, saveDraft } from '../booking/inquiry'
import { loadLastSnapshot } from '../assessment/snapshotStore'
import { snapshotToText } from '../assessment/snapshot'
import { cefrLabel } from '../utils/cefr'
import { contactEmail, openMailto, telegramEnabled, telegramUrl } from '../app/contact'
import { FieldError } from '../components/FieldError'
import { LIMITS, collectIssues, isValid, validateEmail, validateOptionalText, validateRequiredText } from '../utils/validation'
import { CheckIcon, ClipboardIcon, MailIcon } from '../components/icons'
import styles from './BookingPage.module.css'

const AGE_GROUPS = ['ageChild', 'ageTeen', 'ageAdult'] as const

export function BookingPage() {
  const { t } = useI18n()
  const { toast } = useToast()
  const snapshot = useMemo(() => loadLastSnapshot(), [])

  /* A draft typed on an earlier visit outranks an empty form. Restored once,
     on mount — re-reading it later would fight the user's own typing. */
  const [form, setForm] = useState<BookingInquiry>(() => {
    const draft = loadDraft()
    return {
      name: draft?.name ?? '',
      email: draft?.email ?? '',
      ageGroup: draft?.ageGroup ?? '',
      goals: draft?.goals ?? [],
      message: draft?.message ?? '',
      timezone: guessTimezone(),
    }
  })

  useEffect(() => saveDraft(form), [form])

  const set = <K extends keyof BookingInquiry>(key: K, value: BookingInquiry[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const buildInquiry = (): BookingInquiry => ({
    ...form,
    /* Level and the full snapshot ride along silently. Asking a visitor to
       retype a level the site just measured is asking them to do the site's
       job. */
    approxLevel: snapshot ? cefrLabel(snapshot.overallCEFR) : undefined,
    assessmentSummary: snapshot ? snapshotToText(snapshot) : undefined,
  })

  /* Only two things are validated, because only two are required: a name to
     write to and an address to write to it at. Nothing here is a security
     boundary — the visitor composes and sends the mail themselves — but a
     mistyped address is a lesson request that can never be answered. */
  const [showErrors, setShowErrors] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)

  const results = {
    name: validateRequiredText(form.name, { maxLength: LIMITS.name }),
    email: validateEmail(form.email, true),
    message: validateOptionalText(form.message, { maxLength: LIMITS.note, multiline: true }),
  }
  const issues = collectIssues(results)
  const complete = isValid(results)

  const inquiryText = () => formatInquiry(buildInquiry(), t('booking.inquiryHeading'))

  /* The send buttons stay ENABLED even when the form is incomplete. A greyed
     primary with a warning already showing is the first thing a visitor met
     on this page; now the button works, and pressing it points at whatever is
     actually missing. */
  const guard = (): boolean => {
    if (complete) return true
    setShowErrors(true)
    const target = results.name.ok ? emailRef.current : nameRef.current
    target?.focus()
    return false
  }

  /** Revealed only after the visitor asks to send — see app/contact.ts. */
  const [showFallback, setShowFallback] = useState(false)

  const onEmail = () => {
    if (!guard()) return
    openMailto(t('booking.inquiryHeading'), inquiryText())
    setShowFallback(true)
    clearDraft()
  }

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast(t('common.copied'), 'ok')
      return
    } catch {
      // Fall through to the textarea route below.
    }
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    try {
      document.execCommand('copy')
      toast(t('common.copied'), 'ok')
    } catch {
      toast(t('errors.generic'), 'err')
    }
    ta.remove()
  }

  const onCopy = async () => {
    if (!guard()) return
    await copy(inquiryText())
    setShowFallback(true)
  }

  return (
    <Layout>
      <div className="container container-narrow" style={{ paddingBlock: 'var(--sp-7)' }}>
        <h1>{t('booking.title')}</h1>
        <p className="muted" style={{ marginTop: 'var(--sp-3)' }}>
          {t('booking.subtitle')}
        </p>

        {/* The price is stated before the form, not after it. Someone who is
            not going to pay it should be able to leave without typing. */}
        <div className={`card ${styles.pricing}`}>
          <strong>{t('booking.pricingTitle')}</strong>
          <span className="muted">{t('booking.pricingBody')}</span>
        </div>

        <form className="stack-lg" onSubmit={(e) => e.preventDefault()} style={{ marginTop: 'var(--sp-6)' }}>
          <Field label={t('booking.name')} error={showErrors && <FieldError issue={issues.name} />}>
            <input
              ref={nameRef}
              className="input"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              type="text"
              autoComplete="name"
              autoCapitalize="words"
              enterKeyHint="next"
              maxLength={LIMITS.name}
              required
              aria-invalid={showErrors && !results.name.ok}
            />
          </Field>

          <Field
            label={t('booking.email')}
            hint={t('booking.emailHint')}
            error={showErrors && <FieldError issue={issues.email} />}
          >
            <input
              ref={emailRef}
              className="input"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="next"
              maxLength={LIMITS.contact}
              required
              aria-invalid={showErrors && !results.email.ok}
            />
          </Field>

          <Field group label={t('booking.ageGroup')}>
            <div className="cluster">
              {AGE_GROUPS.map((k) => {
                const label = t(`booking.${k}`)
                return (
                  <button
                    key={k}
                    type="button"
                    className="chip"
                    aria-pressed={form.ageGroup === label}
                    onClick={() => set('ageGroup', form.ageGroup === label ? '' : label)}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </Field>

          <Field group label={t('booking.goals')} hint={t('booking.goalsHint')}>
            <ChipGroup<Goal>
              options={BOOKING_GOALS}
              value={form.goals as Goal[]}
              onChange={(g) => set('goals', g)}
              labelFor={(g) => t(`goals.${g}`)}
            />
          </Field>

          <Field
            label={`${t('booking.message')} (${t('common.optional')})`}
            error={<FieldError issue={issues.message} />}
          >
            <textarea
              className="textarea"
              value={form.message}
              onChange={(e) => set('message', e.target.value)}
              placeholder={t('booking.messagePlaceholder')}
              rows={3}
              maxLength={LIMITS.note}
              aria-invalid={!results.message.ok}
            />
          </Field>

          {snapshot && (
            <p className={styles.snapshotNote}>
              <CheckIcon /> {t('booking.includeSnapshot')}
            </p>
          )}

          {/* Two ways to send, both driven by the same generated text. The
              email address is never rendered up front: buildMailto() runs
              inside the click handler, so no `mailto:` sits in the served HTML
              for a scraper to harvest. That reduces casual harvesting only —
              the address is in the JS bundle and is not a secret. */}
          <div className={`card ${styles.send}`}>
            <strong>{t('booking.sendTitle')}</strong>
            <div className="cluster">
              <button type="button" className="btn btn-primary btn-lg" onClick={onEmail}>
                <MailIcon /> {t('booking.sendEmail')}
              </button>
              <button type="button" className="btn btn-lg" onClick={onCopy}>
                <ClipboardIcon /> {t('booking.copyBtn')}
              </button>
              {telegramEnabled() && (
                <a className="btn btn-lg" href={telegramUrl()!} target="_blank" rel="noreferrer noopener">
                  Telegram
                </a>
              )}
            </div>
            {showErrors && !complete && (
              <p className={styles.sendBlocked} role="alert">
                {t('booking.invalidHint')}
              </p>
            )}
            <p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
              {t('booking.sendEmailHint')} {t('booking.copyHint')}
            </p>

            {/* A mail client that never opens is the one real failure mode of
                a mailto: on a static site, and it fails silently. Once the
                visitor has asked to send, the address is simply shown. */}
            {showFallback && (
              <div className={styles.fallback}>
                <strong>{t('booking.fallbackTitle')}</strong>
                <p className="muted">{t('booking.fallbackBody')}</p>
                <div className="cluster">
                  <code className={styles.address} dir="ltr">
                    {contactEmail()}
                  </code>
                  <button type="button" className="btn btn-sm" onClick={() => copy(contactEmail())}>
                    <ClipboardIcon /> {t('booking.copyEmail')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* No backend received anything, and the page says so plainly. */}
          <div className={styles.next}>
            <h2 className={styles.nextTitle}>{t('booking.nextTitle')}</h2>
            <ol className={styles.nextList}>
              {[1, 2, 3].map((n) => (
                <li key={n}>{t(`booking.next${n}`)}</li>
              ))}
            </ol>
            <p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
              {t('booking.sentNote')}
            </p>
          </div>
        </form>
      </div>
    </Layout>
  )
}

/**
 * A labelled field.
 *
 * A real `<label>` wrapping a single control labels it implicitly, with no ids
 * to keep in sync — but everything the label CONTAINS becomes part of the
 * control's accessible name, so a hint and an error message underneath it get
 * read out as if they were the field's title. Both live outside the label and
 * are attached with `aria-describedby` instead, which is what a screen reader
 * announces separately, after the name.
 *
 * `group` is for the chip rows, where a `<label>` would be actively wrong —
 * chips are `<button>`s, which ARE labelable, so a wrapping label would fire
 * the first chip on every caption click.
 */
function Field({
  label,
  group,
  hint,
  error,
  children,
}: {
  label: string
  /** The children are a set of controls (chips), not one input. */
  group?: boolean
  hint?: string
  error?: React.ReactNode
  children: React.ReactNode
}) {
  const caption = <span style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>{label}</span>
  const extras = (
    <>
      {hint && <span className="hint">{hint}</span>}
      {error}
    </>
  )
  if (group) {
    return (
      <div className="field" role="group" aria-label={label}>
        {caption}
        {children}
        {extras}
      </div>
    )
  }
  return (
    <div className="field">
      <label className={styles.labelled}>
        {caption}
        {children}
      </label>
      {extras}
    </div>
  )
}
