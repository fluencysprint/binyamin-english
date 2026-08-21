import { CEFR, PronunciationArea, UILanguage } from './index'

/**
 * A teachable grammar concept.
 *
 * Every field exists to answer a question an inexperienced tutor actually asks
 * mid-lesson, in the order a good lesson asks them:
 *
 *   Meaning  → meaningFirst      "How do I show what this MEANS without a rule?"
 *   Model    → correctExamples   "What do I say?"
 *   Notice   → noticePrompt      "How do I get them to spot the pattern?"
 *   Guided   → controlledPractice
 *   Retrieval→ retrievalCue      "How do I bring this back next week?"
 *   Real use → conversationPractice
 *   Feedback → correctionScript  "What do I SAY when they get it wrong?"
 *
 * plus the two branches a tutor needs the moment reality diverges from the
 * plan: `fallback` (they cannot do it) and `extension` (it is too easy).
 */
export interface GrammarConcept {
  id: string
  title: string
  cefr: CEFR
  /** Short, plain-language explanation for the tutor. No terminology assumed. */
  tutorExplanation: string
  /** Student-friendly explanation, one sentence, no jargon. */
  studentExplanation: string
  /** How to establish MEANING before any talk about form — the object, gesture,
   *  timeline or situation the tutor uses first. Never start with a rule. */
  meaningFirst: string
  correctExamples: string[]
  /** The question that makes the learner notice the pattern themselves. */
  noticePrompt: string
  commonErrors: { wrong: string; right: string }[]
  correctionMethod: string
  /** Exact wording the tutor can use when correcting, verbatim. */
  correctionScript: string[]
  controlledPractice: string[]
  conversationPractice: string[]
  /** A short cue for bringing this back in a LATER lesson (spaced review). */
  retrievalCue: string
  /** What to do instead when the learner simply cannot do it today. */
  fallback: string
  /** How to raise the challenge when it lands immediately. */
  extension: string
  /** Grammar terminology, explained plainly — only where the word genuinely
   *  helps. The tutor is not assumed to know any of it. */
  jargonBuster?: { term: string; plain: string }[]
  easierVariant?: string
  harderVariant?: string
  prerequisites: string[]
  /** Keywords that map observed errors to this concept. */
  tags: string[]
}

/** A pronunciation target with a full practice progression. */
export interface PronunciationConcept {
  area: PronunciationArea
  title: string
  cefrFrom: CEFR
  /** Why it matters for being understood. */
  why: string
  /** How to make the sound / pattern, in plain language. */
  howTo: string
  /** Minimal pairs and contrasts to drill. */
  minimalPairs: { a: string; b: string }[]
  /** Single words to model and repeat. */
  words: string[]
  /** Sentences for connected-speech practice. */
  sentences: string[]
  /** Common first-language interference notes for the tutor. */
  tutorNotes: string
  /** Interference specific to a learner's first language, keyed by the same
   *  codes the interface languages use. The tutor speaks English, Hebrew and
   *  Russian, and the app is offered in five languages — knowing *why* a
   *  particular learner substitutes a sound is what makes the fix land. */
  firstLanguageNotes?: Partial<Record<UILanguage, string>>
  /** Practice flow: Listen -> Model -> Repeat -> Contrast -> Sentence -> Conversation. */
  conversationPrompt: string
  /**
   * What to record, and when. There is no automatic scoring anywhere in this
   * app — the evidence is the learner hearing their own before and after, and
   * the tutor's ear deciding. This names the three samples worth capturing.
   */
  recordingPlan: {
    baseline: string
    practice: string
    improved: string
  }
  /** How this target behaves in real connected speech, not in isolated words —
   *  the difference between "correct" and "intelligible". */
  connectedSpeech: string
}
