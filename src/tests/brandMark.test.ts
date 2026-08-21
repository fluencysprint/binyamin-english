/* ==========================================================================
   One brand mark, everywhere.
   --------------------------------------------------------------------------
   The installed Android PWA icon (teal rounded tile + a geometric white B made
   of a stem and two open bowls) is the canonical treatment. It used to be
   drawn three incompatible ways — a scanline rasterizer in the icon script, a
   Georgia <text> "B" in favicon.svg, and a CSS letter in the header — so the
   app looked nothing like its own home-screen icon.

   These tests keep every instance derived from src/brand/geometry.json.
   ========================================================================== */

import { describe, it, expect } from 'vitest'
import {
  BRAND_CANVAS,
  BRAND_INK,
  BRAND_TEAL,
  MASKABLE_SAFE_RADIUS,
  brandGlyphMaxRadius,
  brandGlyphPath,
  isInsideBrandGlyph,
} from '../brand/mark'
import geometry from '../brand/geometry.json'

const faviconSvg = (
  import.meta.glob('../../public/favicon.svg', { query: '?raw', import: 'default', eager: true }) as Record<
    string,
    string
  >
)['../../public/favicon.svg']

const iconScript = (
  import.meta.glob('../../scripts/gen-icons.mjs', { query: '?raw', import: 'default', eager: true }) as Record<
    string,
    string
  >
)['../../scripts/gen-icons.mjs']

const layoutSource = (
  import.meta.glob('../components/Layout.tsx', { query: '?raw', import: 'default', eager: true }) as Record<
    string,
    string
  >
)['../components/Layout.tsx']

describe('brand mark geometry', () => {
  it('draws a stem and two open bowls, not a font glyph', () => {
    // Inside the stem.
    expect(isInsideBrandGlyph(0.34, 0.5)).toBe(true)
    // The counters (holes) inside each bowl must be empty — that is what makes
    // this B distinctive rather than a solid blob.
    expect(isInsideBrandGlyph(0.39, 0.38)).toBe(false)
    expect(isInsideBrandGlyph(0.39, 0.62)).toBe(false)
    // The bowl strokes themselves are filled.
    expect(isInsideBrandGlyph(0.49, 0.38)).toBe(true)
    expect(isInsideBrandGlyph(0.49, 0.62)).toBe(true)
    // Nothing to the left of the stem or beyond the bowls.
    expect(isInsideBrandGlyph(0.2, 0.5)).toBe(false)
    expect(isInsideBrandGlyph(0.6, 0.5)).toBe(false)
  })

  it('fits inside a maskable icon’s safe circle at full size', () => {
    expect(brandGlyphMaxRadius(1)).toBeLessThan(MASKABLE_SAFE_RADIUS)
  })

  it('emits an SVG path covering the stem and both bowls', () => {
    const d = brandGlyphPath(BRAND_CANVAS)
    // Three subpaths: stem + two bowls.
    expect(d.match(/M/g)).toHaveLength(3)
    expect(d.match(/A/g)).toHaveLength(4) // outer + inner arc per bowl
    expect(d).not.toMatch(/NaN|undefined/)
  })
})

describe('every brand-mark instance shares one source of truth', () => {
  it('favicon.svg is generated from the same geometry', () => {
    expect(faviconSvg).toContain(brandGlyphPath(BRAND_CANVAS))
    expect(faviconSvg).toContain(BRAND_TEAL)
    expect(faviconSvg).toContain(BRAND_INK)
    // The old Georgia <text> B must not come back.
    expect(faviconSvg).not.toMatch(/<text/i)
  })

  it('the icon generator reads geometry.json rather than hardcoding numbers', () => {
    expect(iconScript).toContain("'brand', 'geometry.json'")
    expect(iconScript).not.toMatch(/const TEAL = \[/)
  })

  it('emits an icon for every manifest purpose plus an apple-touch icon', () => {
    for (const asset of [
      'icon-192.png',
      'icon-512.png',
      'icon-maskable-512.png',
      'apple-touch-icon.png',
      'favicon.svg',
    ]) {
      expect(iconScript, asset).toContain(asset)
    }
  })

  it('the header renders BrandMark instead of a styled letter', () => {
    expect(layoutSource).toContain('<BrandMark')
    expect(layoutSource).not.toMatch(/className=\{styles\.brandMark\}[^>]*>\s*B\s*</)
  })

  it('keeps the tile colors on the brand tokens', () => {
    expect(BRAND_TEAL).toBe('#2f6f6b')
    expect(geometry.tileRadiusRatio).toBeCloseTo(0.22)
  })

  it('the TS literal and geometry.json are the same numbers', () => {
    // mark.ts carries a literal (three module loaders, one of which cannot
    // import JSON) while gen-icons.mjs reads the JSON. This is the seam where
    // they could silently diverge, so it is asserted directly.
    const { _comment, ...json } = geometry as Record<string, unknown>
    expect(_comment, 'geometry.json lost its explanatory comment').toBeTruthy()
    expect(json).toEqual({
      canvas: BRAND_CANVAS,
      tileRadiusRatio: 0.22,
      teal: BRAND_TEAL,
      ink: BRAND_INK,
      stem: { left: 0.3, right: 0.38, top: 0.26, bottom: 0.74 },
      upperBowlThickness: 0.085,
      lowerBowlThickness: 0.095,
      maskableSafeRadius: MASKABLE_SAFE_RADIUS,
    })
  })
})
