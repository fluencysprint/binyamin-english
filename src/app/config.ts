/* ==========================================================================
   App configuration. Values here are PUBLIC — this is a static site whose
   code ships to the browser. Do not put secrets here.
   ========================================================================== */

/** Product brand. */
export const BRAND = 'Binyamin English'

/**
 * Tutor gate — a convenience latch, NOT authentication.
 *
 * This is a static site: every byte of this file ships to the browser and can
 * be read by anyone who opens devtools. The gate exists so an ordinary visitor
 * who wanders to /tutor sees a door instead of another person's lesson notes.
 * It stops nobody who is actually trying. Student data is protected by staying
 * on the tutor's own device (IndexedDB, never uploaded), not by this phrase.
 *
 * Change the phrase here — it is the single place it is defined. Anything that
 * needs real access control needs a server, which this project deliberately
 * does not have.
 */
export const TUTOR_GATE_PHRASE = 'teach'

/** Normalize before comparing: case, surrounding space and Unicode form are
 *  not meant to be part of the phrase. */
function normalizePhrase(phrase: string): string {
  return phrase.normalize('NFC').trim().toLowerCase()
}

/** djb2 string hash — small, dependency-free, NOT cryptographic. Kept because
 *  the comparison is constant work regardless of phrase length; it obscures
 *  nothing and is not presented as if it did. */
export function djb2(str: string): number {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i)
  }
  return h >>> 0
}

export const TUTOR_GATE_HASH = djb2(TUTOR_GATE_PHRASE)

export function checkTutorPhrase(phrase: string): boolean {
  return djb2(normalizePhrase(phrase)) === TUTOR_GATE_HASH
}
