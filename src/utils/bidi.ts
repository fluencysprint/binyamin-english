/* ==========================================================================
   Splitting mixed-direction prose into runs the browser can lay out correctly.
   --------------------------------------------------------------------------
   A Hebrew instruction that embeds English — `הקשיבו, ואז אמרו: “My name is
   ___.”` — is a single string with no markup, so the Unicode bidi algorithm
   resolves its NEUTRAL characters (the quotes, the blank, the final period)
   against the RTL paragraph. The quotes and the period therefore jump to the
   far left of the line, which is what the screenshots showed.

   The fix is isolation, not rearranged punctuation: find the embedded
   left-to-right runs, INCLUDING the quotes or brackets that belong to them,
   and let the view wrap each one in a `<bdi dir="ltr">`. Sentence punctuation
   that belongs to the Hebrew sentence stays outside the isolate, where RTL
   placement at the left edge is exactly right.
   ========================================================================== */

/** Hebrew + Arabic-script ranges: the characters that make a line RTL. */
const RTL_RE =
  /[\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\u0780-\u07BF\uFB1D-\uFDFF\uFE70-\uFEFC]/

/** What an embedded LTR run is built from. The low line is deliberate: `___`
 *  is the blank in "My name is ___", and belongs to the English run. */
const LTR_CORE_RE = /[A-Za-z\u00C0-\u024F\u0400-\u04FF_]/

/** Punctuation allowed between the end of an LTR run and its closing mark —
 *  `“Hello!”` must isolate the `!` too, or the quote is orphaned. */
const TRAILING_RE = /[.,!?;:… ]/

/** Closing mark → the opening mark that must precede the run to pair with it. */
const OPENER_FOR: Record<string, string> = {
  '”': '“',
  '’': '‘',
  '»': '«',
  ')': '(',
  ']': '[',
  '"': '"',
}

export interface BidiRun {
  text: string
  /** True when this run must be rendered inside its own LTR isolate. */
  isolate: boolean
}

/**
 * Split `text` into alternating plain and isolate runs. Returns a single plain
 * run for anything with no RTL characters at all, so left-to-right locales are
 * untouched and pay nothing.
 */
export function splitBidiRuns(text: string): BidiRun[] {
  if (!text || !RTL_RE.test(text)) return [{ text, isolate: false }]

  const runs: BidiRun[] = []
  let cursor = 0
  let i = 0

  while (i < text.length) {
    if (!LTR_CORE_RE.test(text[i]) || RTL_RE.test(text[i])) {
      i++
      continue
    }

    // Grow the core to the last LTR character reachable without crossing an
    // RTL one, so `“I’m good”, “I’m tired”` stays one isolate rather than two.
    let start = i
    let end = i
    let j = i
    while (j < text.length && !RTL_RE.test(text[j])) {
      if (LTR_CORE_RE.test(text[j])) end = j
      j++
    }

    // Absorb the quote/bracket pair wrapping the run, plus any sentence
    // punctuation that sits INSIDE it.
    for (;;) {
      let r = end + 1
      while (r < text.length && TRAILING_RE.test(text[r])) r++
      const opener = OPENER_FOR[text[r]]
      if (!opener) break
      let l = start - 1
      while (l >= 0 && text[l] === ' ') l--
      if (l < 0 || text[l] !== opener) break
      start = l
      end = r
    }

    if (start > cursor) runs.push({ text: text.slice(cursor, start), isolate: false })
    runs.push({ text: text.slice(start, end + 1), isolate: true })
    cursor = end + 1
    i = end + 1
  }

  if (cursor < text.length) runs.push({ text: text.slice(cursor), isolate: false })
  return runs
}

/** True when `text` mixes an RTL script with an embedded LTR run. */
export function isMixedDirection(text: string): boolean {
  return splitBidiRuns(text).some((r) => r.isolate)
}
