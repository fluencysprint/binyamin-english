/* ==========================================================================
   The key that decides whether two corrections are the same weakness.
   --------------------------------------------------------------------------
   Its own module because four things now need it and they must all agree:
   the longitudinal progress snapshot, the completion pass that resolves a
   recurring error, the evidence timeline, and the practice sets built from a
   learner's own slips. A drill that grouped "I am agree" differently from the
   dashboard would record evidence against a target nothing else could see.
   ========================================================================== */

import { Correction, CorrectionCategory, PronunciationArea } from '../types'
import { findGrammarByCorrection, findGrammarForError } from '../data/grammarLibrary'
import { editSignature } from '../utils/editSignature'
import { findPronunciationForError } from '../data/pronunciationLibrary'

function normalize(text: string): string {
  return text
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}\s'’]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Categories where the underlying weakness is a STRUCTURE, so two different
 *  sentences with the same broken structure are the same issue. */
const STRUCTURAL: CorrectionCategory[] = ['grammar', 'wordOrder']

/**
 * The key that decides whether two corrections are the same weakness.
 *
 * Grammar and word order group by the concept the error belongs to, because
 * "she go to school" and "he don't like it" are both third-person -s and both
 * teachable as one thing; grouping them by their literal text would file every
 * sentence a learner ever said as its own separate, permanently-new issue.
 * Everything else groups by the normalized text, because a vocabulary or word-
 * choice slip really is about that specific word.
 */
export function issueKeyFor(c: Pick<Correction, 'category' | 'said' | 'better'>): {
  key: string
  grammarRef?: string
  pronunciationRef?: PronunciationArea
} {
  if (STRUCTURAL.includes(c.category)) {
    const concept =
      findGrammarByCorrection(c.said, c.better ?? '') ??
      findGrammarForError(`${c.said} ${c.better ?? ''}`)
    if (concept) return { key: `g:${concept.id}`, grammarRef: concept.id }
    /* No concept in the library teaches this. Group on the edit anyway, so a
       learner who keeps making the same correction is still seen to be making
       ONE mistake repeatedly rather than a new one every week. */
    const sig = editSignature(c.said, c.better ?? '')
    if (sig.length) return { key: `${c.category}#${sig.join('|')}` }
  }
  if (c.category === 'pronunciation') {
    const concept = findPronunciationForError(`${c.said} ${c.better ?? ''}`)
    if (concept) return { key: `p:${concept.area}`, pronunciationRef: concept.area }
  }
  return { key: `${c.category}:${normalize(c.said)}` }
}
