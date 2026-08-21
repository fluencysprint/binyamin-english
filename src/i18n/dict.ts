import { UILanguage } from '../types'
import { CLOSER_FOR, embedQuoted } from '../utils/quotes'

/** A nested dictionary of translation strings. Arrays are allowed so a locale
 *  can write a guidance list as a list — they flatten to `key.0`, `key.1`. */
export type Dict = { [key: string]: DictValue }
export type DictValue = string | Dict | readonly DictValue[]

/** Flatten a nested dict into dot-separated keys → string. */
export function flatten(dict: Dict, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(dict)) {
    Object.assign(out, flattenValue(v, prefix ? `${prefix}.${k}` : k))
  }
  return out
}

function flattenValue(v: DictValue, key: string): Record<string, string> {
  if (typeof v === 'string') return { [key]: v }
  if (Array.isArray(v)) {
    const out: Record<string, string> = {}
    v.forEach((item, i) => Object.assign(out, flattenValue(item, `${key}.${i}`)))
    return out
  }
  return flatten(v as Dict, key)
}

/** Whitespace a locale may put between a quote mark and the text it wraps —
 *  French sets « » with a narrow no-break space. */
const QUOTE_SPACE = /[\s\u00A0\u202F]/

/**
 * The quote pair a TEMPLATE has already written around this placeholder, if
 * any: `Nice expression: “{{said}}”.` → `{ open: '“', close: '”' }`.
 */
function templateQuotes(
  template: string,
  start: number,
  end: number,
): { open: string; close: string } | undefined {
  let l = start - 1
  while (l >= 0 && QUOTE_SPACE.test(template[l])) l--
  const open = l >= 0 ? template[l] : ''
  const close = CLOSER_FOR[open]
  if (!close) return undefined
  let r = end
  while (r < template.length && QUOTE_SPACE.test(template[r])) r++
  return template[r] === close ? { open, close } : undefined
}

/**
 * Interpolate {{name}} placeholders.
 *
 * Where the template already puts QUOTES around a placeholder, the value is
 * normalized so it cannot supply a second set: student-entered text like
 * `he said “hi”` becomes a valid nested quote instead of closing the
 * template's quote early, and a value that arrives pre-quoted has its outer
 * pair dropped rather than doubled. Doing it here means every locale gets it,
 * including keys added later.
 */
export function interpolate(
  template: string,
  params?: Record<string, string | number>,
  lang: UILanguage = 'en',
): string {
  if (!params) return template
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name: string, offset: number) => {
    if (!(name in params)) return `{{${name}}}`
    const value = String(params[name])
    const outer = templateQuotes(template, offset, offset + match.length)
    return outer ? embedQuoted(value, lang, outer) : value
  })
}
