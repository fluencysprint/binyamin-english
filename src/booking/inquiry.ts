import { BookingInquiry } from '../types'

/**
 * Build a readable plain-text enquiry from the form + optional snapshot.
 *
 * The labels are English on purpose: this text is read by the tutor, not by
 * the visitor, and an enquiry arriving in five different label languages is
 * harder to answer than one that always looks the same. The visitor's own
 * words (name, goals, message) are of course untouched.
 */
export function formatInquiry(inquiry: BookingInquiry, heading: string): string {
  const lines: string[] = [heading, '']
  const add = (label: string, value?: string) => {
    if (value && value.trim()) lines.push(`${label}: ${value.trim()}`)
  }
  add('Name', inquiry.name)
  add('Email', inquiry.email)
  add('Learner', inquiry.ageGroup)
  add('Goals', inquiry.goals.join(', '))
  add('Time zone', inquiry.timezone)
  add('Approx. level', inquiry.approxLevel)
  if (inquiry.message) {
    lines.push('', 'Message:', inquiry.message.trim())
  }
  if (inquiry.assessmentSummary) {
    lines.push('', '— English Snapshot —', inquiry.assessmentSummary.trim())
  }
  return lines.join('\n')
}

/** Best-effort guess of the user's IANA time zone. */
export function guessTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || ''
  } catch {
    return ''
  }
}

/* --------------------------------------------------------------------------
   Draft persistence.
   --------------------------------------------------------------------------
   A visitor who types their goals, switches to their mail app to check their
   own address and comes back must not find an empty form. There is no backend
   to hold a draft, so it lives in localStorage — same device, same browser,
   cleared once the enquiry has actually been sent.
   -------------------------------------------------------------------------- */

const DRAFT_KEY = 'ewb:bookingDraft'

export function saveDraft(inquiry: BookingInquiry): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(inquiry))
  } catch {
    /* Private mode, or a full quota. A lost draft is not worth an error. */
  }
}

/** A previously typed draft, or null. Shape is re-validated, never trusted. */
export function loadDraft(): Partial<BookingInquiry> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    const draft = parsed as Record<string, unknown>
    const text = (v: unknown) => (typeof v === 'string' ? v : undefined)
    return {
      name: text(draft.name),
      email: text(draft.email),
      ageGroup: text(draft.ageGroup),
      goals: Array.isArray(draft.goals) ? draft.goals.filter((g): g is string => typeof g === 'string') : undefined,
      message: text(draft.message),
    }
  } catch {
    return null
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {
    /* Nothing to do. */
  }
}
