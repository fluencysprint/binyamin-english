/* ==========================================================================
   Every library string a tutor READS AS AN INSTRUCTION, with its content key.
   --------------------------------------------------------------------------
   One list, used twice: the guidance builders resolve these keys at render
   time, and the localization audit walks the same list to prove that he / ru /
   es / fr define all of them. Anything not listed here is content the learner
   is meant to hear in English — example sentences, minimal pairs, practice
   items, the words the tutor models — and is deliberately never translated.
   ========================================================================== */

import { UILanguage } from '../types'
import { grammarLibrary } from './grammarLibrary'
import { pronunciationLibrary } from './pronunciationLibrary'
import { beginnerActivities } from '../lessons/beginnerContent'

export interface ContentString {
  key: string
  en: string
}

const push = (out: ContentString[], key: string, en: string | undefined) => {
  if (en && en.trim()) out.push({ key, en })
}
const pushList = (out: ContentString[], base: string, list: readonly string[] | undefined) =>
  list?.forEach((en, i) => push(out, `${base}.${i}`, en))

/* ---- Grammar ------------------------------------------------------------ */

export const grammarKey = (id: string, field: string) => `grammar.${id}.${field}`

export function grammarContentStrings(): ContentString[] {
  const out: ContentString[] = []
  for (const g of grammarLibrary) {
    const k = (f: string) => grammarKey(g.id, f)
    push(out, k('title'), g.title)
    push(out, k('tutorExplanation'), g.tutorExplanation)
    push(out, k('studentExplanation'), g.studentExplanation)
    push(out, k('meaningFirst'), g.meaningFirst)
    push(out, k('correctionMethod'), g.correctionMethod)
    push(out, k('fallback'), g.fallback)
    push(out, k('extension'), g.extension)
    g.jargonBuster?.forEach((j, i) => push(out, k(`jargon.${i}`), j.plain))
  }
  return out
}

/* ---- Pronunciation ------------------------------------------------------ */

export const pronKey = (area: string, field: string) => `pron.${area}.${field}`

export function pronunciationContentStrings(): ContentString[] {
  const out: ContentString[] = []
  for (const p of pronunciationLibrary) {
    const k = (f: string) => pronKey(p.area, f)
    push(out, k('title'), p.title)
    push(out, k('why'), p.why)
    push(out, k('howTo'), p.howTo)
    push(out, k('tutorNotes'), p.tutorNotes)
    push(out, k('connectedSpeech'), p.connectedSpeech)
    push(out, k('recording.baseline'), p.recordingPlan.baseline)
    push(out, k('recording.practice'), p.recordingPlan.practice)
    push(out, k('recording.improved'), p.recordingPlan.improved)
  }
  return out
}

/**
 * First-language notes are selected BY language: the note about Russian
 * substitutions is only ever shown to someone reading Russian. Only that
 * diagonal needs translating, so the audit asks for `pron.th.l1.ru` from the
 * Russian locale and from no other.
 */
export function pronunciationL1Strings(): (ContentString & { lang: UILanguage })[] {
  const out: (ContentString & { lang: UILanguage })[] = []
  for (const p of pronunciationLibrary) {
    for (const [lang, note] of Object.entries(p.firstLanguageNotes ?? {})) {
      if (note?.trim()) out.push({ key: pronKey(p.area, `l1.${lang}`), en: note, lang: lang as UILanguage })
    }
  }
  return out
}

/* ---- Beginner (Pre-A1) activities --------------------------------------- */

export const beginnerKey = (id: string, field: string) => `beginner.${id}.${field}`

export function beginnerContentStrings(): ContentString[] {
  const out: ContentString[] = []
  for (const b of beginnerActivities) {
    const k = (f: string) => beginnerKey(b.id, f)
    push(out, k('title'), b.title)
    push(out, k('now'), b.autopilot.now)
    pushList(out, k('do'), b.autopilot.do)
    pushList(out, k('studentDoes'), b.autopilot.studentDoes)
    pushList(out, k('lookFor'), b.autopilot.lookFor)
    pushList(out, k('help'), b.autopilot.help)
    pushList(out, k('challenge'), b.autopilot.challenge)
    push(out, k('doneWhen'), b.autopilot.doneWhen)
    pushList(out, k('next'), b.autopilot.next)
    push(out, k('teacherTip'), b.autopilot.teacherTip)
    push(out, k('goal'), b.tutorCard.goal)
    pushList(out, k('listenFor'), b.tutorCard.listenFor)
    push(out, k('ifStruggle'), b.tutorCard.ifStruggle)
    push(out, k('ifSucceed'), b.tutorCard.ifSucceed)
    push(out, k('howToExplain'), b.tutorCard.howToExplain)
    pushList(out, k('practice'), b.tutorCard.practice)
    pushList(out, k('avoid'), b.tutorCard.avoid)
  }
  return out
}

/** Every content key that must exist in every non-English locale. */
export function contentStrings(): ContentString[] {
  return [
    ...grammarContentStrings(),
    ...pronunciationContentStrings(),
    ...beginnerContentStrings(),
  ]
}
