import { BRAND_CANVAS, BRAND_TILE_RADIUS_RATIO, brandGlyphPath } from '../brand/mark'

export interface BrandMarkProps {
  /** Rendered edge length in CSS pixels. */
  size?: number
  /**
   * 'tile'  — the full brand mark: teal rounded tile + white B (the installed
   *           PWA icon). Use where a logo belongs: app header, gate, splash.
   * 'glyph' — just the B, inheriting `currentColor`. For places that already
   *           sit on a brand-colored surface.
   */
  variant?: 'tile' | 'glyph'
  /** Accessible name. Omit for decorative use next to a visible wordmark. */
  title?: string
  className?: string
}

/**
 * The one and only brand mark in the app.
 *
 * The home-screen PWA icon is the canonical treatment, so this draws the exact
 * same geometry from src/brand/geometry.json rather than approximating it with
 * a styled letter "B". Anything that shows the logo — header, tutor gate, the
 * offline/loading shell, the installed icon, the favicon — is now the same
 * mark, at every size.
 *
 * Deliberately NOT used as decoration: a logo repeated through a lesson screen
 * is noise, and the lesson screen's job is to tell the tutor what to do next.
 */
export function BrandMark({ size = 32, variant = 'tile', title, className }: BrandMarkProps) {
  const s = BRAND_CANVAS
  const labelled = Boolean(title)
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={`0 0 ${s} ${s}`}
      role={labelled ? 'img' : undefined}
      aria-hidden={labelled ? undefined : true}
      focusable="false"
    >
      {labelled && <title>{title}</title>}
      {variant === 'tile' && (
        <rect width={s} height={s} rx={s * BRAND_TILE_RADIUS_RATIO} fill="var(--brand)" />
      )}
      <path d={brandGlyphPath(s)} fill={variant === 'tile' ? 'var(--on-brand)' : 'currentColor'} />
    </svg>
  )
}
