import { AgeBand, EnglishLiteracyLevel, EnglishOralLevel } from '../types'
import { oralStrength } from '../students/beginnerModel'

/**
 * Whether to run the picture/listening foundational check instead of the full
 * text diagnostic.
 *
 * Oral ability and English literacy are independent (see beginnerModel.ts): a
 * fluent speaker who never learned the alphabet is not a beginner, and neither
 * is a fluent adult who simply clicked "not sure" about reading. So a strong
 * oral self-report always overrides a weak reading answer — otherwise a
 * capable learner gets funnelled into a Pre-A1-only item pool and can never
 * place above beginner no matter how well they do.
 *
 * It also takes explicit evidence to route someone here: only a stated
 * "cannot" / "only a few words" counts. "Not sure" is an absence of
 * information, not a claim of inability, and an unanswered question is
 * likewise neutral — both get the real diagnostic.
 */
export function shouldUseFoundationalCheck(opts: {
  ageBand: AgeBand
  englishReading?: EnglishLiteracyLevel
  englishListening?: EnglishOralLevel
  englishSpeaking?: EnglishOralLevel
}): boolean {
  if (opts.ageBand === '6-8') return true
  const oral = Math.max(oralStrength(opts.englishListening), oralStrength(opts.englishSpeaking))
  if (oral >= 2) return false
  return opts.englishReading === 'cannot' || opts.englishReading === 'fewWords'
}
