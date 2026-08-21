/* ==========================================================================
   Regression test for the dark-theme color tokens in theme.css.
   --------------------------------------------------------------------------
   The About page's LANGUAGES label and "Hi, I'm Binyamin." lede went
   unreadable in dark mode because --brand-strong (and, on inspection,
   --surface-border and --text-soft) were never overridden for
   :root[data-theme='dark'] — they silently fell back to light-mode values
   tuned against a light background, landing near-invisible against the dark
   one. This parses the real theme.css tokens (not a hand-copied snapshot)
   and checks WCAG contrast so a future edit can't reintroduce the gap.
   ========================================================================== */

import { describe, it, expect } from 'vitest'
import css from './theme.css?raw'

function extractBlock(source: string, selector: string): string {
  const start = source.indexOf(selector)
  if (start === -1) throw new Error(`selector not found: ${selector}`)
  const braceStart = source.indexOf('{', start)
  const braceEnd = source.indexOf('}', braceStart)
  return source.slice(braceStart + 1, braceEnd)
}

function parseDeclarations(block: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of block.split(';')) {
    const m = line.match(/--([\w-]+)\s*:\s*(.+)/s)
    if (m) out[`--${m[1]}`] = m[2].trim()
  }
  return out
}

const lightTokens = parseDeclarations(extractBlock(css, ':root {'))
const darkTokens = parseDeclarations(extractBlock(css, ":root[data-theme='dark'] {"))
const merged = { ...lightTokens, ...darkTokens }

function resolve(value: string, seen = new Set<string>()): string {
  const m = value.match(/^var\((--[\w-]+)\)$/)
  if (!m) return value
  const name = m[1]
  if (seen.has(name)) throw new Error(`circular var() reference: ${name}`)
  const next = merged[name]
  if (!next) throw new Error(`undefined token referenced: ${name}`)
  return resolve(next, new Set(seen).add(name))
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function relLuminance([r, g, b]: [number, number, number]): number {
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function contrast(hexA: string, hexB: string): number {
  const lA = relLuminance(hexToRgb(hexA))
  const lB = relLuminance(hexToRgb(hexB))
  const [lighter, darker] = lA > lB ? [lA, lB] : [lB, lA]
  return (lighter + 0.05) / (darker + 0.05)
}

function darkToken(name: string): string {
  return resolve(darkTokens[name] ?? merged[name])
}

describe('dark theme token contrast', () => {
  it('brand-strong text is readable on page, card, and tint backgrounds (AA 4.5:1)', () => {
    const fg = darkToken('--brand-strong')
    for (const bgName of ['--bg', '--bg-raised', '--brand-tint']) {
      expect(contrast(fg, darkToken(bgName))).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('text-soft is readable on page and card backgrounds (AA 4.5:1)', () => {
    const fg = darkToken('--text-soft')
    for (const bgName of ['--bg', '--bg-raised']) {
      expect(contrast(fg, darkToken(bgName))).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('surface-border is visible against page and card backgrounds (non-text UI 3:1)', () => {
    const fg = darkToken('--surface-border')
    for (const bgName of ['--bg', '--bg-raised', '--bg-sunken']) {
      expect(contrast(fg, darkToken(bgName))).toBeGreaterThanOrEqual(3)
    }
  })

  it('brand-strong is explicitly overridden for dark mode, not inherited from light', () => {
    expect(darkTokens['--brand-strong']).toBeDefined()
  })
})
