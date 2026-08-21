/* ==========================================================================
   Tutor guidance, rebuilt from content IDs in the language on screen.
   --------------------------------------------------------------------------
   A lesson plan stores WHAT is being taught (a grammar id, a pronunciation
   area, a warm-up id, the topic prompt) and never HOW the tutor should teach
   it. The how — NOW / DO / STUDENT DOES / LOOK FOR / HELP / CHALLENGE / DONE
   WHEN / NEXT, and the fuller tutor card underneath — is built here, every
   time it is rendered, from the language the tutor is reading right now.

   Two consequences, both deliberate:

     • Switching the interface language mid-lesson re-renders the guidance in
       that language. Nothing is regenerated and nothing is migrated.
     • A plan saved months ago in another language carries no stale English:
       it never carried any prose to begin with. Plans written before this
       existed still work — `legacyGuidance` below falls back to what they
       stored, and their content ids are enough to rebuild the rest.

   What stays English is everything the LEARNER is meant to hear: the SAY
   lines, the model sentences, the practice items, the minimal pairs, the
   conversation prompts. Those are the lesson, not instructions about it.
   ========================================================================== */

import {
  ActivityGuide,
  AgeBand,
  CEFR,
  LessonActivity,
  LessonPhaseKind,
  StudentProfile,
  TutorAutopilot,
  TutorCard,
  UILanguage,
} from '../types'
import { translate, translateList } from '../i18n/translate'
import { ct } from '../i18n/contentText'
import { beginnerKey, grammarKey, pronKey } from '../data/contentStrings'
import { getGrammarById } from '../data/grammarLibrary'
import { getPronunciationByArea } from '../data/pronunciationLibrary'
import { beginnerActivities } from './beginnerContent'
import { warmupFollowUps } from './activityContent'
import { roundsFor } from './fluency'
import { cefrIndex } from '../utils/cefr'

export interface GuidanceContext {
  lang: UILanguage
  /** Needed only where guidance depends on the learner (fluency clocks). */
  student?: StudentProfile
  level?: CEFR
}

type Params = Record<string, string | number>

/* -------------------------------------------------------------------------- */
/* Localized names for library content                                        */
/* -------------------------------------------------------------------------- */

/** A grammar concept's name, in the tutor's language. */
export function grammarTitle(lang: UILanguage, id: string): string | undefined {
  const g = getGrammarById(id)
  return g && ct(lang, grammarKey(id, 'title'), g.title)
}

/** A pronunciation area's name, in the tutor's language. */
export function pronunciationTitle(lang: UILanguage, area: string): string | undefined {
  const p = getPronunciationByArea(area)
  return p && ct(lang, pronKey(area, 'title'), p.title)
}

/** Any objective title (grammar, pronunciation, or a stored fallback). */
export function objectiveTitle(
  lang: UILanguage,
  objective: { ref: string; title: string; titleKey?: string; titleParams?: Params },
): string {
  if (objective.titleKey) return localizedTitle(lang, objective)
  return grammarTitle(lang, objective.ref) ?? pronunciationTitle(lang, objective.ref) ?? objective.title
}

/** The localized name of any content id, or undefined if it names nothing. */
export function conceptTitle(lang: UILanguage, ref: string | undefined): string | undefined {
  if (!ref) return undefined
  return grammarTitle(lang, ref) ?? pronunciationTitle(lang, ref) ?? beginnerTitle(lang, ref)
}

/** Why this lesson teaches what it teaches, in the tutor's language. */
export function objectiveRationale(
  lang: UILanguage,
  objective: { rationale: string; rationaleKey?: string; rationaleParams?: Params },
): string {
  if (!objective.rationaleKey) return objective.rationale
  const params = { ...objective.rationaleParams }
  const ref = params.ref
  if (typeof ref === 'string') {
    params.title =
      grammarTitle(lang, ref) ?? pronunciationTitle(lang, ref) ?? String(params.title ?? ref)
  }
  return translate(lang, objective.rationaleKey, params)
}

/**
 * An activity or phase title, localized where the plan named a key.
 *
 * A `ref` in the params is resolved against the content banks first, so
 * "Focus: {{title}}" fills with the concept's name in the tutor's language
 * rather than with whatever English the plan was built from.
 */
export function localizedTitle(
  lang: UILanguage,
  item: { title: string; titleKey?: string; titleParams?: Params },
): string {
  if (!item.titleKey) return item.title
  const params = { ...item.titleParams }
  const ref = params.ref
  if (typeof ref === 'string') {
    params.title =
      grammarTitle(lang, ref) ??
      pronunciationTitle(lang, ref) ??
      beginnerTitle(lang, ref) ??
      String(params.title ?? item.title)
  }
  return translate(lang, item.titleKey, params)
}

/* -------------------------------------------------------------------------- */
/* Grammar                                                                    */
/* -------------------------------------------------------------------------- */

export function grammarTutorCard(lang: UILanguage, conceptId: string): TutorCard | undefined {
  const g = getGrammarById(conceptId)
  if (!g) return undefined
  const t = (k: string, p?: Params) => translate(lang, `guide.card.grammar.${k}`, p)
  const easier = g.easierVariant ? grammarTitle(lang, g.easierVariant) : undefined
  const harder = g.harderVariant ? grammarTitle(lang, g.harderVariant) : undefined
  return {
    goal: t('goal', {
      title: ct(lang, grammarKey(g.id, 'title'), g.title),
      explanation: ct(lang, grammarKey(g.id, 'tutorExplanation'), g.tutorExplanation),
    }),
    // English error → fix pairs: the language itself, not advice about it.
    listenFor: g.commonErrors.map((e) => `${e.wrong} → ${e.right}`),
    ifStruggle: easier ? t('stepBack', { title: easier }) : t('struggleDefault'),
    ifSucceed: harder ? t('extend', { title: harder }) : t('succeedDefault'),
    howToExplain: ct(lang, grammarKey(g.id, 'studentExplanation'), g.studentExplanation),
    model: g.correctExamples,
    practice: [...g.controlledPractice, ...g.conversationPractice],
    avoid: [t('avoid')],
  }
}

export function grammarAutopilot(lang: UILanguage, conceptId: string): TutorAutopilot | undefined {
  const g = getGrammarById(conceptId)
  if (!g) return undefined
  const t = (k: string, p?: Params) => translate(lang, `guide.auto.grammar.${k}`, p)
  const easier = g.easierVariant ? grammarTitle(lang, g.easierVariant) : undefined
  const harder = g.harderVariant ? grammarTitle(lang, g.harderVariant) : undefined
  return {
    say: g.correctExamples.slice(0, 2),
    do: [t('do')],
    lookFor: g.commonErrors.slice(0, 3).map((e) => `${e.wrong} → ${e.right}`),
    next: [
      harder ? t('nextHarder', { title: harder }) : t('nextHarderDefault'),
      t('nextClose'),
      easier ? t('nextEasier', { title: easier }) : t('nextEasierDefault'),
    ],
  }
}

/* -------------------------------------------------------------------------- */
/* Pronunciation                                                              */
/* -------------------------------------------------------------------------- */

export function pronTutorCard(lang: UILanguage, area: string): TutorCard | undefined {
  const p = getPronunciationByArea(area)
  if (!p) return undefined
  const t = (k: string, params?: Params) => translate(lang, `guide.card.pron.${k}`, params)
  return {
    goal: t('goal', {
      title: ct(lang, pronKey(p.area, 'title'), p.title),
      why: ct(lang, pronKey(p.area, 'why'), p.why),
    }),
    listenFor: [ct(lang, pronKey(p.area, 'tutorNotes'), p.tutorNotes)],
    ifStruggle: t('struggle'),
    ifSucceed: t('succeed'),
    howToExplain: ct(lang, pronKey(p.area, 'howTo'), p.howTo),
    model: p.words,
    practice: [
      ...p.minimalPairs.map((m) => t('contrast', { a: m.a, b: m.b })),
      ...p.sentences,
      p.conversationPrompt,
    ],
    avoid: [t('avoid')],
  }
}

export function pronAutopilot(lang: UILanguage, area: string): TutorAutopilot | undefined {
  const p = getPronunciationByArea(area)
  if (!p) return undefined
  const t = (k: string, params?: Params) => translate(lang, `guide.auto.pron.${k}`, params)
  const pair = p.minimalPairs[0]
  return {
    say: p.words.slice(0, 3),
    do: [t('do')],
    lookFor: pair
      ? [t('lookForPair', { a: pair.a, b: pair.b })]
      : [ct(lang, pronKey(p.area, 'tutorNotes'), p.tutorNotes)],
    next: translateList(lang, 'guide.auto.pron.next'),
  }
}

/* -------------------------------------------------------------------------- */
/* Everything else the generator can produce                                  */
/* -------------------------------------------------------------------------- */

/** English opening lines. They are spoken to the learner, so they never move
 *  into a locale file — a Russian tutor still says "Tell me about…". */
const SAY: Record<string, string[]> = {
  'warmup.6-8': ['Hi! Ready to talk?', 'Tell me…'],
  'warmup.9-12': ['Tell me about…', 'Why?'],
  'warmup.13-17': ['Tell me about…', 'What do you think about that?'],
  'warmup.adult': ['How has your week been?', 'Tell me a bit about it.'],
  speaking: ['Tell me about…', 'What did you…?', 'What are you going to…?'],
  'reading.nonreader': ['What sound does this letter make?', 'Can you find the picture that starts with it?'],
  'reading.beginner': ['Read that word to me.', 'Now this sentence — one word at a time.'],
  'reading.intermediate': ['Read the paragraph, then tell me the main idea in your own words.'],
  'reading.advanced': ['What does the writer imply here, without saying it directly?'],
  'writing.early': ['Copy this: “I like ___.” What do you like?'],
  'writing.beginner': ['Write three sentences about your day.'],
  'writing.intermediate': ['Write a short paragraph about your plans, using linking words.'],
  'writing.advanced': ['Write a concise opinion with a clear position and one counterpoint.'],
  vocabulary: ['What’s one word or phrase from today worth keeping?'],
  feedback: ['Today your ___ was much clearer.', 'Next time, let’s work on ___.'],
  c1Feedback: ['A more precise way to say that would be…', 'One thing to refine for next time: …'],
  c1Consolidation: ['Let’s lock in the best phrasing from today — say it once more.'],
  c1ReviewEmpty: ['Any phrasing that felt off last time we can polish now.'],
  beginnerRecapChild: ['You did SO well today!', 'Can you say “hello”? …“my name is”?', 'High five!'],
  beginnerRecapAdult: ['Today you used real English — nice work.', 'Let’s say your best phrase one more time.'],
}

/** Model / practice lines for the deeper card — also English by design. */
const CARD_EN: Record<string, { model: string[]; practice: string[] }> = {
  'warmup.6-8': { model: ['It’s a red ball.', 'I see a blue chair.'], practice: ['Point and say it.'] },
  'warmup.9-12': {
    model: ['This morning I woke up early and ate breakfast.'],
    practice: ['Say two or three sentences about it.'],
  },
  'warmup.13-17': { model: ['I’m really into… because…'], practice: ['Give me one thing you like and why.'] },
  'warmup.adult': {
    model: ['It’s been pretty busy — I had a big deadline, so…'],
    practice: ['Tell me two things about it.'],
  },
  speaking: {
    model: ['Tell me about… / What did you… / What are you going to…?'],
    practice: ['Aim for the student speaking far more than you.'],
  },
  feedback: {
    model: ['Today your V/W contrast was much clearer.', 'Next time, we’ll work on linking words.'],
    practice: ['Ask the student what they want to focus on next.'],
  },
  c1Review: {
    model: ['A more natural way to say that is…'],
    practice: ['Re-say the corrected version in a fresh sentence.'],
  },
  c1Communication: {
    model: ['Consider: “arguably”, “to some extent”, “that said…”.'],
    practice: ['Keep the learner talking; interject only to elevate.'],
  },
  beginnerRecap: { model: ['Today you learned: hello, thank you.'], practice: ['Recall 2–3 words from today.'] },
}

function card(lang: UILanguage, base: string, en: { model: string[]; practice: string[] }): TutorCard {
  const t = (k: string) => translate(lang, `guide.card.${base}.${k}`)
  return {
    goal: t('goal'),
    listenFor: translateList(lang, `guide.card.${base}.listenFor`),
    ifStruggle: t('ifStruggle'),
    ifSucceed: t('ifSucceed'),
    howToExplain: t('howToExplain'),
    model: en.model,
    practice: en.practice,
    avoid: translateList(lang, `guide.card.${base}.avoid`),
  }
}

function auto(
  lang: UILanguage,
  base: string,
  say: string[],
  extra: Partial<TutorAutopilot> = {},
  params?: Params,
): TutorAutopilot {
  const key = `guide.auto.${base}`
  const list = (f: string) => translateList(lang, `${key}.${f}`, params)
  const one = (f: string) => translate(lang, `${key}.${f}`, params)
  const optional = (f: string) => {
    const v = list(f)
    return v.length ? v : undefined
  }
  const optionalOne = (f: string) => {
    const v = one(f)
    return v === `${key}.${f}` ? undefined : v
  }
  return {
    now: optionalOne('now'),
    say,
    do: list('do'),
    studentDoes: optional('studentDoes'),
    lookFor: list('lookFor'),
    help: optional('help'),
    challenge: optional('challenge'),
    doneWhen: optionalOne('doneWhen'),
    next: list('next'),
    teacherTip: optionalOne('teacherTip'),
    ...extra,
  }
}

/* ---- Beginner templates -------------------------------------------------- */

function beginnerGuidance(
  lang: UILanguage,
  id: string,
): { autopilot?: TutorAutopilot; card?: TutorCard } {
  const b = beginnerActivities.find((x) => x.id === id)
  if (!b) return {}
  const k = (f: string) => beginnerKey(id, f)
  const list = (f: string, en: readonly string[] | undefined) =>
    en?.map((s, i) => ct(lang, `${k(f)}.${i}`, s))
  const one = (f: string, en: string | undefined) => (en ? ct(lang, k(f), en) : undefined)
  return {
    autopilot: {
      now: one('now', b.autopilot.now),
      say: b.autopilot.say,
      do: list('do', b.autopilot.do) ?? [],
      studentDoes: list('studentDoes', b.autopilot.studentDoes),
      lookFor: list('lookFor', b.autopilot.lookFor) ?? [],
      help: list('help', b.autopilot.help),
      challenge: list('challenge', b.autopilot.challenge),
      doneWhen: one('doneWhen', b.autopilot.doneWhen),
      next: list('next', b.autopilot.next) ?? [],
      teacherTip: one('teacherTip', b.autopilot.teacherTip),
    },
    card: {
      goal: ct(lang, k('goal'), b.tutorCard.goal),
      listenFor: list('listenFor', b.tutorCard.listenFor) ?? [],
      ifStruggle: ct(lang, k('ifStruggle'), b.tutorCard.ifStruggle),
      ifSucceed: ct(lang, k('ifSucceed'), b.tutorCard.ifSucceed),
      howToExplain: ct(lang, k('howToExplain'), b.tutorCard.howToExplain),
      model: b.tutorCard.model,
      practice: list('practice', b.tutorCard.practice) ?? [],
      avoid: list('avoid', b.tutorCard.avoid) ?? [],
    },
  }
}

/** The English title of a beginner template, localized. */
export function beginnerTitle(lang: UILanguage, id: string): string | undefined {
  const b = beginnerActivities.find((x) => x.id === id)
  return b && ct(lang, beginnerKey(id, 'title'), b.title)
}

/* -------------------------------------------------------------------------- */
/* Dispatch                                                                   */
/* -------------------------------------------------------------------------- */

function fluencyRounds(ctx: GuidanceContext) {
  const level = ctx.level ?? 'B1'
  const band: AgeBand = ctx.student?.ageBand ?? 'adult'
  return roundsFor(cefrIndex(level), band)
}

function build(
  activity: LessonActivity,
  guide: ActivityGuide,
  ctx: GuidanceContext,
): { autopilot?: TutorAutopilot; card?: TutorCard } {
  const lang = ctx.lang
  const p = guide.params ?? {}
  const prompt = activity.studentPrompt

  switch (guide.src) {
    case 'grammar':
      return {
        autopilot: guide.id ? grammarAutopilot(lang, guide.id) : undefined,
        card: guide.id ? grammarTutorCard(lang, guide.id) : undefined,
      }
    case 'pronunciation':
      return {
        autopilot: guide.id ? pronAutopilot(lang, guide.id) : undefined,
        card: guide.id ? pronTutorCard(lang, guide.id) : undefined,
      }
    case 'warmup': {
      const band = (p.band as AgeBand) ?? 'adult'
      const follows = warmupFollowUps[band] ?? warmupFollowUps.adult
      const base = `warmup.${band}`
      const a = auto(lang, base, [prompt, ...SAY[base].slice(1)])
      return {
        autopilot: {
          ...a,
          do: [...a.do, translate(lang, 'guide.auto.warmup.followUps', { a: follows[0], b: follows[1] })],
        },
        card: card(lang, base, CARD_EN[base]),
      }
    }
    case 'speaking':
      return { autopilot: auto(lang, 'speaking', SAY.speaking), card: card(lang, 'speaking', CARD_EN.speaking) }
    case 'reading': {
      const tier = String(p.tier ?? 'intermediate')
      return { autopilot: auto(lang, `reading.${tier}`, SAY[`reading.${tier}`]) }
    }
    case 'writing': {
      const tier = String(p.tier ?? 'beginner')
      return { autopilot: auto(lang, `writing.${tier}`, SAY[`writing.${tier}`]) }
    }
    case 'communication': {
      const a = auto(lang, 'communication', [prompt], {}, p)
      const hint = p.interest
        ? [translate(lang, 'guide.auto.communication.interest', { interest: String(p.interest) })]
        : []
      return { autopilot: { ...a, do: [...a.do, ...hint] } }
    }
    case 'fluency': {
      const rounds = fluencyRounds(ctx)
      const [r1, r2, r3] = rounds.seconds
      const params: Params = { r1, r2, last: r3 ?? r2, count: rounds.seconds.length }
      const a = auto(lang, 'fluency', [prompt, translate(lang, 'guide.auto.fluency.clock', { seconds: r1 })], {}, params)
      return {
        autopilot: a,
        card: {
          ...card(lang, 'fluency', { model: [], practice: [] }),
          model: [translate(lang, 'guide.card.fluency.shape', params)],
          practice: [fluencyRoundsLabel(lang, rounds.seconds.length, params)],
        },
      }
    }
    case 'vocabulary':
      return { autopilot: auto(lang, 'vocabulary', SAY.vocabulary) }
    case 'feedback':
      return { autopilot: auto(lang, 'feedback', SAY.feedback), card: card(lang, 'feedback', CARD_EN.feedback) }
    case 'beginner':
      return guide.id ? beginnerGuidance(lang, guide.id) : {}
    case 'beginnerRecap': {
      const child = p.audience === 'child'
      const base = child ? 'beginnerRecap.child' : 'beginnerRecap.adult'
      return {
        autopilot: auto(lang, base, child ? SAY.beginnerRecapChild : SAY.beginnerRecapAdult),
        card: card(lang, 'beginnerRecap', CARD_EN.beginnerRecap),
      }
    }
    case 'c1Review': {
      const refs = String(p.refs ?? '')
        .split(' | ')
        .filter(Boolean)
      const a = auto(lang, 'c1Review', refs.length
        ? refs.slice(0, 2).map((r) => `Let's revisit: “${r}.”`)
        : SAY.c1ReviewEmpty)
      return {
        autopilot: { ...a, lookFor: refs.length ? refs : a.lookFor },
        card: {
          ...card(lang, 'c1Review', CARD_EN.c1Review),
          listenFor: refs.length ? refs : translateList(lang, 'guide.card.c1Review.listenFor'),
        },
      }
    }
    case 'c1Communication': {
      const a = auto(lang, 'c1Communication', [prompt], {}, p)
      const hint = p.interest
        ? [translate(lang, 'guide.auto.communication.interest', { interest: String(p.interest) })]
        : []
      return { autopilot: { ...a, do: [...a.do, ...hint] }, card: card(lang, 'c1Communication', CARD_EN.c1Communication) }
    }
    case 'c1Feedback':
      return { autopilot: auto(lang, 'c1Feedback', SAY.c1Feedback), card: card(lang, 'feedback', CARD_EN.feedback) }
    case 'c1Consolidation':
      return { autopilot: auto(lang, 'c1Consolidation', SAY.c1Consolidation) }
    default:
      return {}
  }
}

export function fluencyRoundsLabel(lang: UILanguage, count: number, params: Params): string {
  return translate(lang, `guide.card.fluency.rounds${count === 2 ? 2 : 3}`, params)
}

/**
 * Guidance for a plan written before content ids were recorded.
 *
 * The `ref` such a plan already stores is enough to name the content, so most
 * legacy activities rebuild exactly like a new one. What genuinely cannot be
 * recovered falls back to the plain kind-based guidance rather than to the
 * English prose the record happens to carry — a lesson taught in Hebrew must
 * not switch to English half way down the screen.
 */
function legacyGuide(activity: LessonActivity): ActivityGuide | undefined {
  const ref = activity.ref
  if (ref && getGrammarById(ref)) return { src: 'grammar', id: ref }
  if (ref && getPronunciationByArea(ref)) return { src: 'pronunciation', id: ref }
  if (ref && beginnerActivities.some((b) => b.id === ref)) return { src: 'beginner', id: ref }
  if (ref?.startsWith('w-')) {
    const band = ref.slice(2, ref.lastIndexOf('-')) as AgeBand
    return { src: 'warmup', params: { band } }
  }
  if (ref?.startsWith('fs-')) return { src: 'fluency' }
  switch (activity.kind) {
    case 'warmup':
      return { src: 'warmup', params: { band: 'adult' } }
    case 'speakingListening':
      return { src: 'speaking' }
    case 'reading':
      return { src: 'reading', params: { tier: 'intermediate' } }
    case 'writing':
      return { src: 'writing', params: { tier: 'beginner' } }
    case 'communication':
      return { src: 'communication' }
    case 'fluency':
      return { src: 'fluency' }
    case 'vocabulary':
      return { src: 'vocabulary' }
    case 'feedback':
      return { src: 'feedback' }
    default:
      return undefined
  }
}

/**
 * The tutor guidance for one activity, in the language on screen. Never reads
 * instructional prose off the stored plan.
 */
export function activityGuidance(
  activity: LessonActivity,
  ctx: GuidanceContext,
): { autopilot?: TutorAutopilot; card?: TutorCard } {
  const guide = activity.guide ?? legacyGuide(activity)
  if (!guide) return {}
  return build(activity, guide, ctx)
}

/**
 * The English follow-up questions chosen for this activity when its plan was
 * built. They belong in the tutor's MOUTH, so they are English everywhere —
 * and they are what a "go deeper" step should offer, rather than the localized
 * NEXT lines, which are decisions about the lesson, not things to say.
 */
export function followUpQuestions(activity: LessonActivity): string[] {
  const p = activity.guide?.params ?? {}
  return ['follow1', 'follow2', 'follow3']
    .map((k) => p[k])
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
}

/** Default STUDENT DOES / DONE WHEN for a phase kind, localized. */
export function defaultStudentDoes(lang: UILanguage, kind: LessonPhaseKind): string {
  return translate(lang, `guide.defaults.studentDoes.${kind}`)
}

export function defaultDoneWhen(lang: UILanguage, kind: LessonPhaseKind): string {
  return translate(lang, `guide.defaults.doneWhen.${kind}`)
}
