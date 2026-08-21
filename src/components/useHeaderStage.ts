import { RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

/* ==========================================================================
   How much header fits, measured rather than assumed.
   --------------------------------------------------------------------------
   The header used to switch layouts at a fixed `min-width: 900px`, a number
   derived from ENGLISH labels. "Проверить английский / Записаться на урок /
   Преподаватель" is roughly 30% wider than its English original, so at 900–
   1200px the Russian and French headers overflowed: the wordmark was squeezed
   to zero width and its text painted straight over the navigation, and the
   page itself scrolled sideways.

   No breakpoint can be right for five locales at once, so this measures the
   row instead. Each stage drops the least valuable thing still in it, and the
   width that stage NEEDED is remembered so growing the window restores it —
   hysteresis, so a stage change can never oscillate.
   ========================================================================== */

/** Ordered richest → sparsest. Every step removes one thing from the row. */
export const HEADER_STAGES = ['full', 'compact', 'menu', 'mini'] as const
export type HeaderStage = (typeof HEADER_STAGES)[number]

/** Always start from the richest layout and step DOWN to what fits. Starting
 *  narrow would leave the hook with no measurement of the wider stages and so
 *  no width to step back up at. Measurement happens before paint, so the
 *  intermediate renders are never seen; under SSR/jsdom, where there is no
 *  layout at all, this stays `full` — the superset, so nothing is hidden from
 *  a crawler or from a test that never lays anything out. */
const INITIAL_STAGE: HeaderStage = 'full'

/** Breathing room so items never render edge-to-edge before stepping down. */
const SLACK = 8

/**
 * Returns the richest header stage whose contents actually fit `rowRef`.
 *
 * `resetKey` should change whenever the row's CONTENT changes (locale, or
 * whether the tutor controls are present): remembered widths describe the old
 * labels and must not survive it.
 */
export function useHeaderStage(rowRef: RefObject<HTMLElement>, resetKey: unknown): HeaderStage {
  const [stage, setStage] = useState<HeaderStage>(INITIAL_STAGE)
  /** Row width each stage was measured to require, once we have seen it. */
  const needed = useRef<Partial<Record<HeaderStage, number>>>({})

  useLayoutEffect(() => {
    needed.current = {}
    setStage(INITIAL_STAGE)
  }, [resetKey])

  const measure = useCallback(() => {
    const row = rowRef.current
    if (!row || typeof getComputedStyle !== 'function') return
    const style = getComputedStyle(row)
    // clientWidth INCLUDES the row's own inline padding; the children only get
    // the content box, so the padding has to come off or a padded container
    // looks 32px roomier than it is.
    const available =
      row.clientWidth - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0)
    if (available <= 0) return

    const children = Array.from(row.children) as HTMLElement[]
    const gap = parseFloat(style.columnGap) || 0
    // Children never shrink (see Layout.module.css), so each one's border box
    // IS its natural width and the sum is what the row genuinely needs.
    let required = gap * Math.max(0, children.length - 1)
    for (const child of children) required += child.getBoundingClientRect().width

    setStage((current) => {
      const index = HEADER_STAGES.indexOf(current)
      if (required > available - SLACK) {
        if (index === HEADER_STAGES.length - 1) return current
        needed.current[current] = required + SLACK
        return HEADER_STAGES[index + 1]
      }
      if (index > 0) {
        const richer = HEADER_STAGES[index - 1]
        const need = needed.current[richer]
        if (need != null && available >= need) return richer
      }
      return current
    })
  }, [rowRef])

  // Measured before paint, so stepping down is never a visible flash of the
  // overlapping layout.
  useLayoutEffect(measure)

  useEffect(() => {
    const row = rowRef.current
    if (!row || typeof ResizeObserver !== 'function') return
    const observer = new ResizeObserver(measure)
    observer.observe(row)
    return () => observer.disconnect()
  }, [measure, rowRef])

  return stage
}
