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

/** Every mark this app can emit as an OPENER — the reverse direction of
 *  `OPENER_FOR`, used to recognize a quote/bracket sitting just before a run
 *  starts. */
const OPENERS = new Set(Object.values(OPENER_FOR))

/** Opener → its closer, the inverse of `OPENER_FOR`. */
const CLOSER_OF: Record<string, string> = Object.fromEntries(
  Object.entries(OPENER_FOR).map(([closer, opener]) => [opener, closer]),
)

/** Separator this app joins phrase/chunk lists with (`phraseList`,
 *  `homeworkText`'s `sayPhrases`) — never used for a short word list, which
 *  joins on `, ` instead. Its presence inside an isolate run is therefore an
 *  unambiguous signal that the run is several full phrases, not one. */
const PHRASE_SEP = ' · '

export interface BidiRun {
  text: string
  /** True when this run must be rendered inside its own LTR isolate. */
  isolate: boolean
  /** Set when `text` is 2+ phrases joined by `PHRASE_SEP`. A consumer that
   *  opts in (`BidiText`'s `block` prop) can render these as a dedicated
   *  LTR list instead of one long inline run — the shape that survives
   *  wrapping inside an RTL paragraph without scattering punctuation or
   *  gluing sentences together across a line break. */
  phrases?: string[]
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

    // A closing bracket/quote sitting right after the run whose OPENER is
    // already INSIDE it — `weekend (past simple)` — belongs to the run too.
    // The core-growth above only widens `end` on letters, so a trailing
    // closer with no more letters after it (nothing left to widen `end` to)
    // is stranded one character short even though it closes something the
    // run already opened, unlike the wrapping-pair case below where the
    // opener sits OUTSIDE the run, right before `start`.
    for (;;) {
      const closer = text[end + 1]
      const opener = closer && OPENER_FOR[closer]
      if (!opener) break
      const slice = text.slice(start, end + 1)
      const opens = slice.split(opener).length - 1
      const closes = slice.split(closer).length - 1
      if (opens <= closes) break
      end++
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

    // A quote/bracket that opens immediately before the run belongs to its
    // content even when the matching closer lands INSIDE the run rather than
    // at its far end — one quoted word mid-sentence ("think" came out as
    // "sink"), not a pair wrapping the whole thing. Left outside, that lone
    // opener is a neutral character bordering RTL text, and the bidi
    // algorithm renders it on the wrong side of the content it introduces.
    let lead = start - 1
    while (lead >= 0 && text[lead] === ' ') lead--
    if (lead >= 0 && OPENERS.has(text[lead])) {
      const closer = CLOSER_OF[text[lead]]
      if (closer && text.slice(start, end + 1).includes(closer)) start = lead
    }

    // The LAST phrase in a " · "-joined list has nothing after it to push
    // `end` past its own terminal punctuation — every earlier phrase's `?`
    // or `.` sits BEFORE the next phrase's letters and rides along for free,
    // but the final one has no such letter to hide behind, so it was left
    // outside the isolate for the outer (Hebrew) context to place — which is
    // where a trailing "?" ending up on the wrong visual line comes from. A
    // single embedded fragment with no PHRASE_SEP keeps the old behaviour
    // (its trailing punctuation may genuinely belong to the Hebrew sentence).
    if (text.slice(start, end + 1).includes(PHRASE_SEP)) {
      let r = end + 1
      while (r < text.length && /[.!?…]/.test(text[r])) r++
      if (r > end + 1) end = r - 1
    }

    if (start > cursor) runs.push({ text: text.slice(cursor, start), isolate: false })
    const runText = text.slice(start, end + 1)
    const phrases = runText.includes(PHRASE_SEP)
      ? runText.split(PHRASE_SEP).map((p) => p.trim()).filter(Boolean)
      : []
    runs.push(
      phrases.length > 1
        ? { text: runText, isolate: true, phrases }
        : { text: runText, isolate: true },
    )
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

/** True when `text` contains any RTL-script character. A list item with NONE
 *  should render as its own LTR unit (`dir="ltr"`) rather than lean on
 *  `dir="auto"` heuristics — the bullet, indent and text alignment all need
 *  to agree it is LTR, not just the text run inside it. */
export function hasRTL(text: string): boolean {
  return RTL_RE.test(text)
}
