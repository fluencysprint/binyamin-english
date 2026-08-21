/* ==========================================================================
   The brand mark, derived once from src/brand/geometry.json.
   --------------------------------------------------------------------------
   The installed Android PWA icon is the canonical brand treatment: a teal
   rounded tile carrying a geometric white "B" — a vertical stem plus two open,
   right-facing bowls. It was previously drawn three different ways (a scanline
   rasterizer in scripts/gen-icons.mjs, a Georgia <text> glyph in favicon.svg,
   and a plain CSS letter in the header), so the app UI showed an ordinary "B"
   that looked nothing like the icon on the home screen.

   Everything now derives from the same numbers: this module builds the SVG
   paths for <BrandMark>, and scripts/gen-icons.mjs reads the same JSON to
   rasterize the PNGs and to write favicon.svg.
   ========================================================================== */

/**
 * The numbers, as a plain literal.
 *
 * They are ALSO in src/brand/geometry.json, which is what scripts/gen-icons.mjs
 * reads — a Node script cannot import TypeScript, and importing JSON from TS
 * needs an import attribute that Vite, tsc and Playwright's loader do not all
 * agree on. Rather than fight three module systems, the literal lives here and
 * `src/tests/brandMark.test.ts` asserts it is identical to the JSON, so the two
 * cannot drift.
 */
const geometry = {
  canvas: 64,
  tileRadiusRatio: 0.22,
  teal: '#2f6f6b',
  ink: '#faf9f6',
  stem: { left: 0.3, right: 0.38, top: 0.26, bottom: 0.74 },
  upperBowlThickness: 0.085,
  lowerBowlThickness: 0.095,
  maskableSafeRadius: 0.4,
} as const

export const BRAND_TEAL = geometry.teal
export const BRAND_INK = geometry.ink
export const BRAND_CANVAS = geometry.canvas
export const BRAND_TILE_RADIUS_RATIO = geometry.tileRadiusRatio

/** Derived glyph measurements, in normalized 0..1 space. */
export interface BrandGlyphGeometry {
  stemLeft: number
  stemRight: number
  top: number
  bottom: number
  mid: number
  upper: { cy: number; outer: number; inner: number }
  lower: { cy: number; outer: number; inner: number }
}

export function brandGlyphGeometry(): BrandGlyphGeometry {
  const { left: stemLeft, right: stemRight, top, bottom } = geometry.stem
  const mid = (top + bottom) / 2
  const upperCy = (top + mid) / 2
  const lowerCy = (mid + bottom) / 2
  const upperOuter = mid - upperCy
  const lowerOuter = bottom - lowerCy
  return {
    stemLeft,
    stemRight,
    top,
    bottom,
    mid,
    upper: { cy: upperCy, outer: upperOuter, inner: upperOuter - geometry.upperBowlThickness },
    lower: { cy: lowerCy, outer: lowerOuter, inner: lowerOuter - geometry.lowerBowlThickness },
  }
}

/**
 * Is this normalized point inside the "B"? The authoritative definition — the
 * PNG rasterizer samples exactly this predicate, and the SVG path below traces
 * the same three shapes analytically.
 */
export function isInsideBrandGlyph(px: number, py: number): boolean {
  const g = brandGlyphGeometry()
  if (px >= g.stemLeft && px <= g.stemRight && py >= g.top && py <= g.bottom) return true
  if (px < g.stemRight) return false
  const dx = px - g.stemRight
  const bowl = (cy: number, outer: number, inner: number) => {
    const dy = py - cy
    const d = Math.sqrt(dx * dx + dy * dy)
    return d <= outer && d >= inner
  }
  if (py <= g.mid && bowl(g.upper.cy, g.upper.outer, g.upper.inner)) return true
  if (py >= g.mid && bowl(g.lower.cy, g.lower.outer, g.lower.inner)) return true
  return false
}

const round = (n: number) => Math.round(n * 10000) / 10000

/**
 * SVG path data for the "B", scaled to a `size`-unit square and optionally
 * scaled about the centre (used by the full-bleed maskable icon, where the
 * glyph must sit inside the launcher's safe circle).
 */
export function brandGlyphPath(size = BRAND_CANVAS, scale = 1): string {
  const g = brandGlyphGeometry()
  const c = 0.5
  const x = (v: number) => round((c + (v - c) * scale) * size)
  const y = (v: number) => round((c + (v - c) * scale) * size)
  const r = (v: number) => round(v * scale * size)

  const stem = `M${x(g.stemLeft)} ${y(g.top)}H${x(g.stemRight)}V${y(g.bottom)}H${x(g.stemLeft)}Z`

  // Each bowl is a right half-annulus hinged on the stem's right edge: outer arc
  // out and down, straight in along the stem, inner arc back up.
  const bowl = (b: { cy: number; outer: number; inner: number }) => {
    const sx = x(g.stemRight)
    return [
      `M${sx} ${y(b.cy - b.outer)}`,
      `A${r(b.outer)} ${r(b.outer)} 0 0 1 ${sx} ${y(b.cy + b.outer)}`,
      `L${sx} ${y(b.cy + b.inner)}`,
      `A${r(b.inner)} ${r(b.inner)} 0 0 0 ${sx} ${y(b.cy - b.inner)}`,
      'Z',
    ].join('')
  }

  return `${stem}${bowl(g.upper)}${bowl(g.lower)}`
}

/** The furthest the glyph reaches from the icon centre, normalized. Used to
 *  prove the mark stays inside a maskable icon's safe circle. */
export function brandGlyphMaxRadius(scale = 1): number {
  const g = brandGlyphGeometry()
  const corners: [number, number][] = [
    [g.stemLeft, g.top],
    [g.stemLeft, g.bottom],
    [g.stemRight + g.upper.outer, g.upper.cy],
    [g.stemRight + g.lower.outer, g.lower.cy],
  ]
  return Math.max(
    ...corners.map(([px, py]) => {
      const dx = (px - 0.5) * scale
      const dy = (py - 0.5) * scale
      return Math.sqrt(dx * dx + dy * dy)
    }),
  )
}

export const MASKABLE_SAFE_RADIUS = geometry.maskableSafeRadius
