/* ==========================================================================
   One validation & sanitization layer for every user-controlled input.
   --------------------------------------------------------------------------
   Sources covered: onboarding, assessment, booking, tutor notes, corrections,
   pronunciation recording metadata, vocabulary, imported backups, URL/query
   values and anything read back out of localStorage/IndexedDB.

   Two principles the rest of this file exists to serve:

   1. NEVER silently alter meaningful text. Names, examples and notes are the
      product. Accents, Hebrew, Cyrillic, Spanish and French characters, ZWJ /
      ZWNJ, combining marks and emoji all survive untouched. What gets removed
      is only what cannot legitimately appear in a form field: C0/C1 control
      characters, and the bidi *override/isolate* controls (U+202A–202E,
      U+2066–2069) which can visually reorder a string into something other
      than what it says. LRM/RLM (U+200E/200F) are kept — Hebrew text uses them
      for real.

   2. Rejection is a message, not a mutation. Over-long or out-of-range input
      returns an i18n key the caller shows next to the field, instead of being
      quietly truncated or clamped behind the user's back.

   XSS note: React escapes everything it renders and the app uses no
   `dangerouslySetInnerHTML` anywhere, so a name of "<script>alert(1)</script>"
   is stored and displayed as those literal characters. That is correct
   behaviour, and `src/tests/validation.test.ts` pins it — we do not strip
   angle brackets, because "<3" and "a > b" are things people write.
   ========================================================================== */

/* -------------------------------------------------------------------------- */
/* Limits                                                                     */
/* -------------------------------------------------------------------------- */

export const LIMITS = {
  /** A first name or nickname. */
  name: 80,
  /** A language name, a school grade, a timezone label. */
  shortText: 60,
  /** A single free-text line: an example sentence, a target phrase, a goal. */
  line: 200,
  /** A multi-line note or message. */
  note: 4000,
  /** One vocabulary term or phrase. */
  term: 120,
  /** Items in a tag list (interests, other languages). */
  tags: 30,
  /** Contact details as typed (email address or phone). */
  contact: 254,
} as const

export const AGE_MIN = 5
export const AGE_MAX = 120

/* -------------------------------------------------------------------------- */
/* Result type                                                                */
/* -------------------------------------------------------------------------- */

export interface ValidationIssue {
  /** i18n key under `validation.*`. */
  key: string
  params?: Record<string, string | number>
}

export type Validated<T> = { ok: true; value: T } | { ok: false; issue: ValidationIssue }

const ok = <T>(value: T): Validated<T> => ({ ok: true, value })
const fail = (key: string, params?: ValidationIssue['params']): Validated<never> => ({
  ok: false,
  issue: { key, params },
})

/* -------------------------------------------------------------------------- */
/* Sanitization                                                               */
/* -------------------------------------------------------------------------- */

/* C0 minus tab/LF/CR (handled explicitly below), DEL, and the C1 range.
   Built from escape sequences rather than literal control characters so the
   source file stays copy-pasteable and greppable. */
const CONTROL_CLASS = '\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F-\\u009F'
/** Bidi overrides/embeddings/isolates — these reorder rendering, so a stored
 *  string can display as something other than what it says. LRM (U+200E) and
 *  RLM (U+200F) are deliberately absent: Hebrew text uses them for real. */
const BIDI_CLASS = '\\u202A-\\u202E\\u2066-\\u2069'

const STRIPPABLE = new RegExp(`[${CONTROL_CLASS}${BIDI_CLASS}]`, 'gu')

export interface SanitizeOptions {
  /** Keep newlines (textareas). Single-line fields collapse them to spaces. */
  multiline?: boolean
}

/**
 * Normalize and strip only what cannot legitimately be typed into a field.
 * Does not truncate, lowercase, transliterate, or strip markup characters.
 */
export function sanitizeText(raw: unknown, opts: SanitizeOptions = {}): string {
  if (typeof raw !== 'string') return ''
  // NFC so "é" typed as e + combining acute stores and compares as one form.
  const cleaned = raw.normalize('NFC').replace(STRIPPABLE, '')
  if (opts.multiline) {
    return cleaned
      .replace(/\r\n?/g, '\n')
      .replace(/\t/g, ' ')
      .split('\n')
      .map((line) => line.replace(/[ ]+$/u, ''))
      .join('\n')
      .replace(/^\s+|\s+$/gu, '')
  }
  // Single-line: newlines and tabs become spaces, runs of spaces collapse.
  return cleaned
    .replace(/[\r\n\t]/g, ' ')
    .replace(/ {2,}/g, ' ')
    .trim()
}

/** True when a string contains characters we refuse to store verbatim.
 *  Builds a fresh non-global regex so the check is never stateful. */
export function hasUnsafeControlCharacters(raw: string): boolean {
  return new RegExp(`[${CONTROL_CLASS}${BIDI_CLASS}]`, 'u').test(raw)
}

/* -------------------------------------------------------------------------- */
/* Text fields                                                                */
/* -------------------------------------------------------------------------- */

export interface TextRules {
  maxLength: number
  minLength?: number
  multiline?: boolean
  /** Field label key, echoed back in the message. */
  labelKey?: string
}

export function validateText(raw: unknown, rules: TextRules): Validated<string> {
  const value = sanitizeText(raw, { multiline: rules.multiline })
  if (value.length > rules.maxLength) {
    return fail('validation.tooLong', { max: rules.maxLength })
  }
  if (rules.minLength && value.length > 0 && value.length < rules.minLength) {
    return fail('validation.tooShort', { min: rules.minLength })
  }
  return ok(value)
}

export function validateRequiredText(raw: unknown, rules: TextRules): Validated<string> {
  const result = validateText(raw, rules)
  if (!result.ok) return result
  if (result.value === '') return fail('validation.required')
  return result
}

/** Optional field: empty is fine and becomes `undefined`, not `''`. */
export function validateOptionalText(raw: unknown, rules: TextRules): Validated<string | undefined> {
  const result = validateText(raw, rules)
  if (!result.ok) return result
  return ok(result.value === '' ? undefined : result.value)
}

/* -------------------------------------------------------------------------- */
/* Numbers                                                                    */
/* -------------------------------------------------------------------------- */

export interface IntegerRules {
  min: number
  max: number
}

/**
 * Strict integer parsing. `parseInt` happily reads "12abc" as 12 and "1.9" as
 * 1; neither is what a user meant to enter, so both are rejected here.
 */
export function validateInteger(raw: unknown, rules: IntegerRules): Validated<number> {
  const text = typeof raw === 'number' ? String(raw) : sanitizeText(raw)
  if (text === '') return fail('validation.required')
  if (!/^[+-]?\d+$/.test(text)) {
    return /^[+-]?\d*[.,]\d+$/.test(text)
      ? fail('validation.wholeNumber')
      : fail('validation.notANumber')
  }
  const n = Number(text)
  if (!Number.isSafeInteger(n)) return fail('validation.notANumber')
  if (n < rules.min || n > rules.max) {
    return fail('validation.outOfRange', { min: rules.min, max: rules.max })
  }
  return ok(n)
}

export function validateAge(raw: unknown): Validated<number> {
  return validateInteger(raw, { min: AGE_MIN, max: AGE_MAX })
}

/* -------------------------------------------------------------------------- */
/* Email                                                                      */
/* -------------------------------------------------------------------------- */

/* Deliberately permissive: one @, something either side, a dot in the domain,
   no whitespace. Stricter patterns reject valid addresses far more often than
   they catch invalid ones, and there is no server here to verify against. */
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/u

export function looksLikeEmail(raw: string): boolean {
  return EMAIL_RE.test(raw)
}

export function validateEmail(raw: unknown, required = true): Validated<string | undefined> {
  const value = sanitizeText(raw)
  if (value === '') return required ? fail('validation.required') : ok(undefined)
  if (value.length > LIMITS.contact) return fail('validation.tooLong', { max: LIMITS.contact })
  if (!looksLikeEmail(value)) return fail('validation.invalidEmail')
  return ok(value)
}

/* -------------------------------------------------------------------------- */
/* Enums & lists                                                              */
/* -------------------------------------------------------------------------- */

export function validateEnum<T extends string>(raw: unknown, allowed: readonly T[]): Validated<T> {
  const value = sanitizeText(raw)
  if (value === '') return fail('validation.required')
  if (!(allowed as readonly string[]).includes(value)) return fail('validation.invalidChoice')
  return ok(value as T)
}

/** Same, but an unknown value simply falls back — for persisted/URL values
 *  where a stale enum should degrade rather than block the user. */
export function coerceEnum<T extends string>(raw: unknown, allowed: readonly T[], fallback: T): T {
  const result = validateEnum(raw, allowed)
  return result.ok ? result.value : fallback
}

export function validateTagList(
  raw: unknown,
  rules: { maxItems?: number; maxLength: number } = { maxLength: LIMITS.shortText },
): Validated<string[]> {
  if (!Array.isArray(raw)) return fail('validation.invalidChoice')
  const maxItems = rules.maxItems ?? LIMITS.tags
  const seen = new Set<string>()
  const out: string[] = []
  for (const entry of raw) {
    const value = sanitizeText(entry)
    if (value === '') continue
    if (value.length > rules.maxLength) return fail('validation.tooLong', { max: rules.maxLength })
    const key = value.toLocaleLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(value)
  }
  if (out.length > maxItems) return fail('validation.tooManyItems', { max: maxItems })
  return ok(out)
}

/* -------------------------------------------------------------------------- */
/* Form helpers                                                               */
/* -------------------------------------------------------------------------- */

/** Collect issues for a whole form: `{ field: Validated<…> }` → first issue per
 *  field, so a page can render every message at once rather than one at a time. */
export function collectIssues(
  results: Record<string, Validated<unknown>>,
): Record<string, ValidationIssue> {
  const issues: Record<string, ValidationIssue> = {}
  for (const [field, result] of Object.entries(results)) {
    if (!result.ok) issues[field] = result.issue
  }
  return issues
}

export function isValid(results: Record<string, Validated<unknown>>): boolean {
  return Object.values(results).every((r) => r.ok)
}
