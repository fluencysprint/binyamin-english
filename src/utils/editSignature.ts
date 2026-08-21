/* ==========================================================================
   What was actually corrected — the word-level edit between what a learner
   said and the better version.
   --------------------------------------------------------------------------
   A tutor types whole sentences, so the same weakness arrives dressed
   differently every week: "She go to school", "He go to work", "It go fast".
   Comparing the sentences finds three unrelated strings. Comparing the EDITS
   finds one repeated correction — go → goes — which is the thing the learner
   keeps getting wrong.

   Deliberately literal: no stemming, no morphology, no cleverness. Two
   corrections share a signature when the same word was changed to the same
   word, and otherwise they do not. That errs toward treating things as
   separate, which is the safe direction — the cost of splitting one weakness
   into two is a slightly slower diagnosis; the cost of merging two into one
   is teaching the wrong lesson.
   ========================================================================== */

function tokens(text: string): string[] {
  return text.toLocaleLowerCase().match(/[\p{L}\p{N}’']+/gu) ?? []
}

/**
 * The set of substitutions turning `wrong` into `right`, as `from→to` pairs.
 * Pure insertions and deletions are reported as `→to` and `from→`.
 * Returns an empty array when the two are the same, or either is blank.
 */
export function editSignature(wrong: string, right: string): string[] {
  const a = tokens(wrong)
  const b = tokens(right)
  if (a.length === 0 || b.length === 0) return []

  // Longest common subsequence, then read the edits off the alignment.
  const lcs: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1])
    }
  }

  const ops: { del: string[]; ins: string[] }[] = []
  let run: { del: string[]; ins: string[] } | null = null
  const flush = () => {
    if (run && (run.del.length || run.ins.length)) ops.push(run)
    run = null
  }
  let i = 0
  let j = 0
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      flush()
      i++
      j++
    } else if (j < b.length && (i === a.length || lcs[i][j + 1] >= lcs[i + 1][j])) {
      run ??= { del: [], ins: [] }
      run.ins.push(b[j++])
    } else {
      run ??= { del: [], ins: [] }
      run.del.push(a[i++])
    }
  }
  flush()

  /* One changed run of words is one substitution. Runs are kept whole rather
     than paired word-by-word, so "I no like" → "I don't like" is a single
     `no→don't like` rather than two edits that each look like noise. */
  const sigs = ops.map((op) => `${op.del.join(' ')}→${op.ins.join(' ')}`)
  return [...new Set(sigs)].sort()
}

/** Do two corrections change the same thing in the same way? */
export function signaturesOverlap(a: readonly string[], b: readonly string[]): boolean {
  if (a.length === 0 || b.length === 0) return false
  const set = new Set(b)
  return a.some((s) => set.has(s))
}
