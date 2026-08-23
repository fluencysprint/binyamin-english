/* ==========================================================================
   Lesson generator — fully local and deterministic (no AI, no network).
   Builds a ~50-minute lesson. The FIRST lesson uses the diagnostic structure;
   later lessons are generated from the learning model, prioritizing:
     1. recurring communication problems
     2. partially-learned skills / spaced review
     3. pronunciation needs
     4. student goals, current levels, interests, variety, more speaking
   Strong C1 learners get the advanced communication-coaching structure.
   ========================================================================== */

import {
  ActivityGuide,
  AgeBand,
  CEFR,
  LearningModel,
  LessonActivity,
  LessonObjective,
  LessonPhase,
  LessonPlan,
  PreA1Stage,
  StudentProfile,
} from '../types'
import { cefrIndex, overallCefr } from '../utils/cefr'
import { uid } from '../utils/id'
import { grammarLibrary, getGrammarById, findGrammarForError } from '../data/grammarLibrary'
import { pronunciationLibrary, getPronunciationByArea } from '../data/pronunciationLibrary'
import { suggestedFirstObjective } from '../assessment/snapshot'
import { dueForReview } from '../students/learningModel'
import { ProgressSnapshot } from '../students/progress'
import {
  ConversationTask,
  warmups,
  communicationTasks,
  c1Tasks,
  readingByLevel,
  readingPassages,
  writingByLevel,
  pickInterest,
  followUpSample,
  followUpDepthFor,
  followUpsFor,
} from './activityContent'
import { fluencySprintActivity } from './fluency'
import {
  BeginnerActivityTemplate,
  movementActivity,
  selectBeginnerActivities,
} from './beginnerContent'
import { pickVaried } from './selection'

export function ageToBand(age: number): AgeBand {
  if (age <= 8) return '6-8'
  if (age <= 12) return '9-12'
  if (age <= 17) return '13-17'
  return 'adult'
}

function warmupActivity(
  band: AgeBand,
  recentIds: readonly string[] = [],
  rng: () => number = Math.random,
): LessonActivity {
  const w = pickVaried(warmups[band], (x) => x.id, recentIds, rng)
  return {
    id: uid('act'),
    kind: 'warmup',
    title: 'Warm-up',
    titleKey: 'phases.warmup',
    studentPrompt: w.prompt,
    // The tutor's opening line and the follow-ups that extend it are built
    // from the band at render time (see guidance.ts), in the tutor's language.
    guide: { src: 'warmup', id: w.id, params: { band } },
    ref: w.id,
  }
}

/**
 * An objective plus the two things the generator needs that a stored
 * `LessonObjective` does not carry: what KIND of thing it teaches, and — for
 * a learner's own recurring pattern — the pair of sentences that is the only
 * content behind it.
 */
export type ObjectiveChoice = LessonObjective & {
  kind: 'grammar' | 'pronunciation' | 'pattern'
  /** Set only for `kind: 'pattern'`. */
  said?: string
  better?: string
}

/**
 * Choose the single high-value objective for the next lesson.
 *
 * When a `progress` snapshot is supplied it goes first, because it is the only
 * input that knows the DIFFERENCE between a slip and a weakness: its ranked
 * focus list contains nothing that was said once, and nothing the learner has
 * stopped getting wrong. The rules below it still run — they are what a brand
 * new student, or one whose evidence points nowhere teachable, falls back to.
 */
export function chooseObjective(
  model: LearningModel,
  level: CEFR,
  previousObjectiveRefs: string[],
  progress?: ProgressSnapshot,
): ObjectiveChoice {
  // Look back further than two lessons. With a library this size, a three-week
  // window is what stops a monthly cycle of the same four objectives.
  const recentlyUsed = new Set(previousObjectiveRefs.slice(-4))
  // Concepts the learner has already made secure are not worth a whole lesson.
  const secure = new Set(
    model.emerging.filter((s) => s.strength === 'secure').map((s) => s.ref),
  )
  const exclude = new Set([...recentlyUsed, ...secure])

  /* 0. Accumulated evidence across lessons. Ranked, deterministic, and already
        filtered: `focus` never contains a one-off mistake or something the
        learner has been getting right for three lessons. Anything the last
        four lessons already taught is skipped so a live weakness still gets
        variety rather than the identical lesson four weeks running. */
  if (progress) {
    const candidate = progress.focus.find((f) => !recentlyUsed.has(f.ref) && !secure.has(f.ref))
    if (candidate) {
      /* A pattern has no content id, so it cannot be titled by looking one up.
         Its title IS the corrected sentence, which is also exactly what the
         tutor needs to read at the top of the lesson. */
      if (candidate.kind === 'pattern') {
        return {
          ref: candidate.ref,
          title: candidate.better ?? candidate.title,
          titleKey: 'guide.title.patternFocus',
          titleParams: { better: candidate.better ?? candidate.title },
          rationale: candidate.rationale,
          rationaleKey: candidate.why.key,
          rationaleParams: candidate.why.params,
          kind: 'pattern',
          said: candidate.said,
          better: candidate.better,
        }
      }
      return {
        ref: candidate.ref,
        title: candidate.title,
        titleKey: 'guide.title.plain',
        titleParams: { ref: candidate.ref },
        rationale: candidate.rationale,
        /* The progress snapshot already explains its own ranking with a key
           and params (see students/progress.ts) — reusing it means the plan
           and the dashboard can never give two different reasons. */
        rationaleKey: candidate.why.key,
        rationaleParams: candidate.why.params,
        kind: candidate.kind,
      }
    }
  }

  // 1. Unresolved recurring grammar errors → the concept that actually TEACHES
  //    that error, matched on the error text, not merely something at the right
  //    level. "She go to school" should produce a present-simple lesson, not
  //    whichever A1 concept happens to sit first in the library.
  const grammarErr = model.recurringErrors
    .filter((e) => !e.resolved && e.category === 'grammar')
    .sort((a, b) => b.occurrences - a.occurrences)[0]
  if (grammarErr) {
    const matched =
      findGrammarForError(`${grammarErr.description} ${grammarErr.example ?? ''}`) ??
      pickGrammarNear(level, exclude, model)
    if (matched && !recentlyUsed.has(matched.id)) {
      /* An error is added to `recurringErrors` the FIRST time it is captured,
         so calling a single occurrence "recurring … seen 1×" was both wrong
         and self-contradicting — and a tutor who reads one falsely precise
         line stops trusting the rest. Say what actually happened. */
      const n = grammarErr.occurrences
      return {
        ref: matched.id,
        title: matched.title,
        titleKey: 'guide.title.plain',
        titleParams: { ref: matched.id },
        rationale:
          n >= 2
            ? `Recurring grammar issue — seen ${n} times (e.g. “${grammarErr.description}”).`
            : `Grammar issue noticed once so far (e.g. “${grammarErr.description}”).`,
        rationaleKey: n >= 2 ? 'guide.objective.recurringGrammar' : 'guide.objective.noticedOnce',
        rationaleParams: { times: n, example: grammarErr.description },
        kind: 'grammar',
      }
    }
  }

  // 2. Pronunciation problems flagged as needing work.
  const pronProblem = model.pronunciationFoci
    .filter((f) => f.rating === 'needsPractice' || f.rating === 'communicationProblem')
    .sort((a) => (a.rating === 'communicationProblem' ? -1 : 1))[0]
  if (pronProblem && !recentlyUsed.has(pronProblem.area)) {
    const p = getPronunciationByArea(pronProblem.area)
    if (p) {
      return {
        ref: p.area,
        title: p.title,
        titleKey: 'guide.title.plain',
        titleParams: { ref: p.area },
        rationale: `Pronunciation of “${p.title}” is affecting clarity — worth focused practice.`,
        rationaleKey: 'guide.objective.pronunciation',
        rationaleParams: { ref: p.area },
        kind: 'pronunciation',
      }
    }
  }

  // 3. Emerging skills due for spaced review. Never let a skill that is still
  //    only "emerging" quietly fall off the plan.
  const due = dueForReview(model).find((d) => getGrammarById(d.ref) && !recentlyUsed.has(d.ref))
  if (due) {
    const g = getGrammarById(due.ref)!
    return {
      ref: g.id,
      title: g.title,
      titleKey: 'guide.title.plain',
      titleParams: { ref: g.id },
      rationale: `Spaced review: “${g.title}” is due to be revisited so it becomes secure.`,
      rationaleKey: 'guide.objective.spacedReview',
      rationaleParams: { ref: g.id },
      kind: 'grammar',
    }
  }

  // 4. Otherwise advance to the next level-appropriate grammar concept.
  const next = pickGrammarNear(level, exclude, model)
  if (next) {
    return {
      ref: next.id,
      title: next.title,
      titleKey: 'guide.title.plain',
      titleParams: { ref: next.id },
      rationale: `A natural next focus for a learner around ${level}.`,
      rationaleKey: 'guide.objective.naturalNext',
      rationaleParams: { level },
      kind: 'grammar',
    }
  }

  // 5. Final fallback: a pronunciation staple this learner has not just done.
  const p = pronunciationLibrary.find((x) => !recentlyUsed.has(x.area)) ?? pronunciationLibrary[0]
  return {
    ref: p.area,
    title: p.title,
    titleKey: 'guide.title.plain',
    titleParams: { ref: p.area },
    rationale: 'Clear pronunciation is always worth practice.',
    rationaleKey: 'guide.objective.pronStaple',
    kind: 'pronunciation',
  }
}

/**
 * The next grammar concept for this learner: closest to their level, whose
 * prerequisites they have already met where we know, preferring something they
 * have never worked on. Ties break on how much of the library sits behind it,
 * so a learner moves forward rather than circling the same first entry.
 */
function pickGrammarNear(level: CEFR, exclude: Set<string>, model?: LearningModel) {
  const li = cefrIndex(level)
  const touched = new Set(model?.emerging.map((s) => s.ref) ?? [])
  const candidates = grammarLibrary.filter((g) => !exclude.has(g.id))
  if (candidates.length === 0) return undefined

  const score = (g: (typeof grammarLibrary)[number]) => {
    // Distance from the learner's level dominates.
    let s = Math.abs(cefrIndex(g.cefr) - li) * 100
    // Something already met, but not yet secure, is worth less than fresh
    // ground — it will come back through spaced review anyway.
    if (touched.has(g.id)) s += 30
    // Prefer concepts whose prerequisites are already in play.
    const unmetPrereqs = g.prerequisites.filter((p) => !touched.has(p)).length
    s += unmetPrereqs * 5
    return s
  }
  return [...candidates].sort((a, b) => score(a) - score(b))[0]
}

/** A pronunciation target this learner can actually work on at their level and
 *  has not met in recent lessons. */
function pickPronunciationNear(level: CEFR, recentIds: readonly string[] = []): string | undefined {
  const li = cefrIndex(level)
  const reachable = pronunciationLibrary.filter((p) => cefrIndex(p.cefrFrom) <= li)
  const pool = reachable.length > 0 ? reachable : pronunciationLibrary
  const fresh = pool.filter((p) => !recentIds.includes(p.area))
  return (fresh.length > 0 ? fresh : pool)[0]?.area
}

function readingActivity(level: CEFR, band: AgeBand): LessonActivity {
  const li = cefrIndex(level)
  let tier: keyof typeof readingByLevel = 'intermediate'
  if (li <= 0) tier = 'nonreader'
  else if (li === 1) tier = 'beginner'
  else if (li >= 4) tier = 'advanced'
  /* Age caps the tier, but never below what the child can actually read.
     This used to force EVERY 6–8-year-old to letter-sound matching regardless
     of their reading level, which insults a seven-year-old who reads fluently
     in English. The cap that does belong here is at the top: inference from an
     adult passage is a cognitive-load problem, not a decoding one. */
  if (band === '6-8' && (tier === 'intermediate' || tier === 'advanced')) tier = 'beginner'
  return {
    id: uid('act'),
    kind: 'reading',
    title: 'Reading',
    titleKey: 'phases.reading',
    studentPrompt: readingByLevel[tier],
    passage: readingPassages[tier],
    guide: { src: 'reading', params: { tier } },
    optional: band === '6-8' ? false : undefined,
  }
}

function writingActivity(level: CEFR, band: AgeBand): LessonActivity {
  const li = cefrIndex(level)
  let tier: keyof typeof writingByLevel = 'beginner'
  if (band === '6-8' || li <= 0) tier = 'early'
  else if (li >= 4) tier = 'advanced'
  else if (li >= 2) tier = 'intermediate'
  return {
    id: uid('act'),
    kind: 'writing',
    title: 'Writing & spelling',
    titleKey: 'phases.writing',
    studentPrompt: writingByLevel[tier],
    guide: { src: 'writing', params: { tier } },
    optional: true,
  }
}

function objectiveActivities(
  objective: Pick<ObjectiveChoice, 'ref' | 'title' | 'kind' | 'said' | 'better'>,
): LessonActivity[] {
  /* A pattern lesson teaches the learner's own two sentences, so the pair
     travels ON the activity rather than being looked up from a bank that has
     no entry for it. Everything downstream — micro-steps, the learner's board,
     the tutor card — is rebuilt from these two strings in whatever language
     is on screen, exactly as a grammar activity is rebuilt from its id. */
  const isPattern = objective.kind === 'pattern'
  const guide: ActivityGuide = isPattern
    ? {
        src: 'pattern',
        id: objective.ref,
        params: { said: objective.said ?? '', better: objective.better ?? objective.title },
      }
    : {
        src: objective.kind === 'grammar' ? 'grammar' : 'pronunciation',
        id: objective.ref,
      }
  const micro: LessonActivity = {
    id: uid('act'),
    kind: 'microLesson',
    title: `Focus: ${objective.title}`,
    ...(isPattern
      ? {
          titleKey: 'guide.title.patternFocus',
          titleParams: { better: objective.better ?? objective.title },
        }
      : { titleKey: 'guide.title.focus', titleParams: { ref: objective.ref } }),
    studentPrompt:
      objective.kind === 'pronunciation'
        ? 'Listen to the sound, watch how it’s made, then repeat and contrast.'
        : 'Notice the pattern together, hear examples, then try a few.',
    studentPromptKey:
      objective.kind === 'pronunciation' ? 'student.watchMyMouth' : 'student.spotThePattern',
    guide,
    ref: objective.ref,
  }
  const guided: LessonActivity = {
    id: uid('act'),
    kind: 'guidedPractice',
    title: 'Guided practice',
    titleKey: 'phases.guidedPractice',
    studentPrompt: 'Use the new pattern in a few sentences of your own, with help as needed.',
    studentPromptKey: 'student.yourTurnPractice',
    guide,
    ref: objective.ref,
  }
  return [micro, guided]
}

function communicationActivity(
  band: AgeBand,
  interests: string[],
  seed: number,
  level: CEFR,
  recentIds: readonly string[] = [],
  rng: () => number = Math.random,
  /* The opening speaking block and the closing conversation are both real
     tasks from the same bank, so the second one has to know what the first
     took — otherwise a lesson can ask the same question twice. */
  kind: 'communication' | 'speakingListening' = 'communication',
): LessonActivity {
  const task = pickVaried(communicationTasks[band], (x) => x.id, recentIds, rng)
  /* Follow-ups are chosen for THIS task's category, not from a generic pool.
     "Why do you think that is?" is a fine opinion prompt and a strange thing
     to say after "Describe your favorite toy so I can draw it." */
  const depth = followUpDepthFor(band, cefrIndex(level))
  const [follow1, follow2, follow3, follow4] = followUpsFor(task.category, depth, seed, 4)
  const [generic] = followUpSample(seed, 1)
  return {
    id: uid('act'),
    kind,
    title: kind === 'communication' ? 'Real conversation' : 'Speaking & listening',
    titleKey: kind === 'communication' ? 'phases.communication' : 'phases.speakingListening',
    studentPrompt: task.prompt,
    ref: task.id,
    /* The follow-up questions are stored because they were CHOSEN here (a
       seeded pick the render cannot reproduce) — and they are English the
       tutor says out loud, not instructions about how to say it. */
    guide: {
      src: 'communication',
      id: task.id,
      params: {
        category: task.category,
        follow1,
        follow2,
        follow3,
        follow4: follow4 ?? generic,
        generic,
        ...(pickInterest(interests, seed) ? { interest: pickInterest(interests, seed)! } : {}),
      },
    },
  }
}

function feedbackActivity(): LessonActivity {
  return {
    id: uid('act'),
    kind: 'feedback',
    title: 'Feedback',
    titleKey: 'phases.feedback',
    studentPrompt: 'Let’s look at what we practiced, what went well, and one thing to focus on next.',
    studentPromptKey: 'student.listenToFeedback',
    guide: { src: 'feedback' },
  }
}

function isC1Pathway(model: LearningModel, level: CEFR): boolean {
  const speaking = cefrIndex(model.skillEstimates.speaking.level)
  return cefrIndex(level) >= cefrIndex('C1') || (cefrIndex(level) >= cefrIndex('B2') && speaking >= cefrIndex('C1'))
}

/** Build the standard ~50-minute lesson phases. */
function standardPhases(
  student: StudentProfile,
  model: LearningModel,
  _level: CEFR,
  objective: Pick<ObjectiveChoice, 'ref' | 'title' | 'kind' | 'said' | 'better'>,
  seed: number,
  rng: () => number = Math.random,
): LessonPhase[] {
  const band = student.ageBand
  const [micro, guided] = objectiveActivities(objective)


  /* A short pronunciation moment in EVERY lesson, not only once a problem has
     already been noticed. Clear American pronunciation is the thing these
     lessons are for; leaving it out until something goes wrong made it the one
     skill the app never taught proactively. A recorded focus still wins — that
     is the learner's actual difficulty — but with none, a level-appropriate
     target this learner has not met recently is chosen instead. */
  const pronFocus = model.pronunciationFoci
    .filter((f) => f.rating !== 'clear')
    .sort((a) => (a.rating === 'communicationProblem' ? -1 : 1))[0]
  const pronArea = pronFocus?.area ?? pickPronunciationNear(_level, model.recentContentIds)
  const pronActivity: LessonActivity | null =
    objective.kind === 'pronunciation' || !pronArea
      ? null
      : {
          id: uid('act'),
          kind: 'pronunciation',
          title: 'Pronunciation moment',
          titleKey: 'guide.title.pronMoment',
          studentPrompt: 'Listen, then repeat. We are polishing one sound.',
          studentPromptKey: 'student.repeatAfterMe',
          guide: { src: 'pronunciation', id: pronArea },
          ref: pronArea,
          // Optional only when it is a proactive pick; a noticed problem is not
          // something to skip.
          optional: pronFocus ? undefined : true,
        }

  const vocab: LessonActivity = {
    id: uid('act'),
    kind: 'vocabulary',
    title: 'Useful words',
    titleKey: 'guide.title.usefulWords',
    studentPrompt: 'Pick 2–4 useful words from today and use each one in a sentence of your own.',
    studentPromptKey: 'student.newWords',
    guide: { src: 'vocabulary' },
  }

  /* Repeated timed speaking. Where it suits the learner it takes six minutes
     back from the literacy block, which is the right trade in a lesson whose
     whole point is that a human is listening: reading and writing are the two
     things a learner CAN practise alone between lessons. */
  const fluency = fluencySprintActivity(student, _level, model.recentContentIds, rng)

  const conversation = communicationActivity(
    band,
    student.interests,
    seed,
    _level,
    model.recentContentIds,
    rng,
  )

  /* The eight minutes after the warm-up used to hold an activity with no topic
     at all — "Let's talk. Answer out loud" — which meant the tutor invented
     the first third of every lesson live and the learner's screen was blank
     for it. It is now a real task from the same bank, chosen away from the
     closing conversation so a lesson never asks the same question twice. */
  const speaking = communicationActivity(
    band,
    student.interests,
    seed + 5,
    _level,
    [...model.recentContentIds, conversation.ref ?? ''],
    rng,
    'speakingListening',
  )

  /* Timing follows the brief's arc: warm up → retrieval (rides at the front of
     the warm-up, in the runner) → main speaking → target language → guided
     practice → literacy → fluency → real use → close. */
  const phases: LessonPhase[] = [
    {
      kind: 'warmup',
      title: 'Warm-up',
      titleKey: 'phases.warmup',
      startMin: 0,
      endMin: 5,
      activities: [warmupActivity(band, model.recentContentIds, rng)],
    },
    {
      kind: 'speakingListening',
      title: 'Speaking & listening',
      titleKey: 'phases.speakingListening',
      startMin: 5,
      endMin: 13,
      activities: pronActivity ? [speaking, pronActivity] : [speaking],
    },
    {
      kind: 'microLesson',
      title: `Focus: ${objective.title}`,
      ...(objective.kind === 'pattern'
        ? {
            titleKey: 'guide.title.patternFocus',
            titleParams: { better: objective.better ?? objective.title },
          }
        : { titleKey: 'guide.title.focus', titleParams: { ref: objective.ref } }),
      startMin: 13,
      endMin: 20,
      activities: [micro],
    },
    {
      kind: 'guidedPractice',
      title: 'Guided practice',
      titleKey: 'phases.guidedPractice',
      startMin: 20,
      endMin: 26,
      activities: [guided],
    },
    // Reading/writing are gated on the learner's ACTUAL reading/writing skill,
    // not the overall level — an orally-A1 learner who cannot yet read English
    // must never be handed a paragraph to read (skills are modeled separately).
    {
      kind: 'reading',
      title: 'Reading',
      titleKey: 'phases.reading',
      startMin: 26,
      endMin: 31,
      activities: [readingActivity(model.skillEstimates.reading.level, band)],
    },
    {
      kind: 'writing',
      title: 'Writing & spelling',
      titleKey: 'phases.writing',
      startMin: 31,
      endMin: 35,
      activities: [writingActivity(model.skillEstimates.writing.level, band)],
    },
  ]

  if (fluency) {
    phases.push({
      kind: 'fluency',
      title: 'Fluency sprint',
      titleKey: 'phases.fluency',
      startMin: 35,
      endMin: 41,
      activities: [fluency],
    })
    phases.push({
      kind: 'communication',
      title: 'Real conversation',
      titleKey: 'phases.communication',
      startMin: 41,
      endMin: 47,
      activities: [conversation, vocab],
    })
  } else {
    // No sprint (a 6–8-year-old, or a learner with too little language for it
    // to be anything but pressure) — the minutes go to free conversation,
    // never to more literacy.
    phases.push({
      kind: 'communication',
      title: 'Real conversation',
      titleKey: 'phases.communication',
      startMin: 35,
      endMin: 47,
      activities: [conversation, vocab],
    })
  }

  phases.push({
    kind: 'feedback',
    title: 'Feedback',
    titleKey: 'phases.feedback',
    startMin: 47,
    endMin: 50,
    activities: [feedbackActivity()],
  })
  return phases
}

/** C1 advanced communication-coaching structure (5 / 10 / 25 / 5 / 5). */
function c1Phases(
  student: StudentProfile,
  model: LearningModel,
  seed: number,
  rng: () => number = Math.random,
): { phases: LessonPhase[]; task: ConversationTask } {
  const task = pickVaried(c1Tasks, (x) => x.id, model.recentContentIds, rng)
  const reviewRefs = [
    ...model.recurringErrors.filter((e) => !e.resolved).map((e) => e.description),
    ...model.pronunciationFoci.filter((f) => f.rating !== 'clear').map((f) => f.area),
  ].slice(0, 4)
  const [c1Follow1, c1Follow2, c1Follow3] = followUpsFor(task.category, 'advanced', seed + 3, 3)
  const c1Fluency = fluencySprintActivity(student, 'C1', model.recentContentIds, rng)

  const phases: LessonPhase[] = [
    {
      kind: 'warmup',
      title: 'Warm-up',
      titleKey: 'phases.warmup',
      startMin: 0,
      endMin: 5,
      activities: [warmupActivity('adult', model.recentContentIds, rng)],
    },
    {
      kind: 'guidedPractice',
      title: 'Language & pronunciation review',
      titleKey: 'guide.title.langPronReview',
      startMin: 5,
      endMin: 15,
      activities: [
        {
          id: uid('act'),
          kind: 'guidedPractice',
          title: 'Recurring language review',
          titleKey: 'guide.title.recurringReview',
          studentPrompt: 'A quick look back at a few things worth keeping sharp.',
          studentPromptKey: 'student.sayItAgain',
          /* The refs are this learner's own slips, captured in their own
             words — data, not instruction, so they are carried as parameters
             and shown back unchanged. */
          guide: { src: 'c1Review', params: { refs: reviewRefs.join(' | ') } },
        },
      ],
    },
    {
      kind: 'communication',
      title: 'Deep conversation',
      titleKey: 'guide.title.deepConversation',
      startMin: 15,
      endMin: c1Fluency ? 36 : 40,
      activities: [
        {
          id: uid('act'),
          kind: 'communication',
          title: 'Extended communication task',
          titleKey: 'guide.title.extendedTask',
          studentPrompt: task.prompt,
          studentPromptKey: 'student.talkAboutYou',
          ref: task.id,
          guide: {
            src: 'c1Communication',
            id: task.id,
            params: {
              category: task.category,
              follow1: c1Follow1,
              follow2: c1Follow2,
              follow3: c1Follow3,
              ...(pickInterest(student.interests, seed)
                ? { interest: pickInterest(student.interests, seed)! }
                : {}),
            },
          },
        },
      ],
    },
    {
      kind: 'feedback',
      title: 'Precision corrections',
      titleKey: 'guide.title.precisionCorrections',
      startMin: c1Fluency ? 42 : 40,
      endMin: c1Fluency ? 46 : 45,
      activities: [
        {
          id: uid('act'),
          kind: 'feedback',
          title: 'Precision corrections',
          titleKey: 'guide.title.precisionCorrections',
          studentPrompt: 'A few small upgrades to how you said things today.',
          studentPromptKey: 'student.listenToFeedback',
          guide: { src: 'c1Feedback' },
        },
      ],
    },
    {
      kind: 'vocabulary',
      title: 'Consolidation',
      titleKey: 'guide.title.consolidation',
      startMin: c1Fluency ? 46 : 45,
      endMin: 50,
      activities: [
        {
          id: uid('act'),
          kind: 'vocabulary',
          title: 'Vocabulary & pronunciation consolidation',
          titleKey: 'guide.title.vocabPronConsolidation',
          studentPrompt: 'Say your best two or three phrases from today one more time.',
          studentPromptKey: 'student.sayItAgain',
          guide: { src: 'c1Consolidation' },
        },
      ],
    },
  ]

  /* At C1 the sprint is not about finding words — it is about saying the same
     thing again with less filler and more precision, which is exactly what
     stops advanced speakers from plateauing. */
  if (c1Fluency) {
    phases.splice(3, 0, {
      kind: 'fluency',
      title: 'Fluency sprint',
      titleKey: 'phases.fluency',
      startMin: 36,
      endMin: 42,
      activities: [c1Fluency],
    })
  }
  return { phases, task }
}

/* -------------------------------------------------------------------------- */
/* Beginner (Pre-A1) pathway — P0…P3 aware, age-appropriate presentation.     */
/* -------------------------------------------------------------------------- */

/** A learner at Pre-A1 needs the dedicated beginner curriculum, never an A1
 *  lesson down-shifted. */
export function isBeginnerPathway(level: CEFR): boolean {
  return cefrIndex(level) <= cefrIndex('preA1')
}

/** Young learners get playful, movement-rich child presentation; teens/adults
 *  get dignified adult content. (Ages 5–12 → child; 13+ → adult.) */
export function beginnerAudience(band: AgeBand): 'child' | 'adult' {
  return band === '6-8' || band === '9-12' ? 'child' : 'adult'
}

const STAGE_OBJECTIVE: Record<PreA1Stage, { title: string; rationale: string }> = {
  P0: {
    title: 'First spoken English: hello, your name, yes / no',
    rationale: 'Starting from the foundations — useful spoken English, listening, and pronunciation before any reading.',
  },
  P1: {
    title: 'First words and everyday chunks',
    rationale: 'Building a small store of high-frequency words and phrases with lots of listening and repetition.',
  },
  P2: {
    title: 'Emerging communication and early literacy',
    rationale: 'Following simple instructions, short exchanges, and recognizing first sounds and letters.',
  },
  P3: {
    title: 'Getting ready for A1: simple sentences and first reading',
    rationale: 'Using simple sentences with support and beginning to read very familiar words.',
  },
}

function templateToActivity(tpl: BeginnerActivityTemplate): LessonActivity {
  return {
    id: uid('act'),
    kind: tpl.kind,
    title: tpl.title,
    titleKey: 'guide.title.plain',
    titleParams: { ref: tpl.id },
    studentPrompt: tpl.studentPrompt,
    studentPromptKey: tpl.studentPromptKey,
    speak: tpl.speak,
    guide: { src: 'beginner', id: tpl.id },
    ref: tpl.id,
    optional: tpl.movement || undefined,
  }
}

function beginnerFeedbackPhase(startMin: number, isChild: boolean): LessonPhase {
  const activity: LessonActivity = {
    id: uid('act'),
    kind: 'feedback',
    title: isChild ? 'Success recap' : 'Recap & one win',
    titleKey: isChild ? 'guide.title.successRecap' : 'guide.title.recapOneWin',
    studentPrompt: isChild
      ? 'Let’s remember the words we learned today. You did great!'
      : 'Let’s recap the useful English you used today, and one thing to keep.',
    studentPromptKey: isChild ? 'beginner.prompt.recapChild' : 'beginner.prompt.recapAdult',
    guide: { src: 'beginnerRecap', params: { audience: isChild ? 'child' : 'adult' } },
  }
  return {
    kind: 'feedback',
    title: activity.title,
    titleKey: activity.titleKey,
    startMin,
    endMin: startMin + 5,
    activities: [activity],
  }
}

/** Build a Pre-A1 lesson: short activity cycles, listening/visual/repetition
 *  heavy, no free writing / paragraph reading / grammar lecture. Young children
 *  get movement breaks woven between focus activities. */
function beginnerPhases(
  student: StudentProfile,
  stage: PreA1Stage,
  seed: number,
  recentIds: readonly string[] = [],
): { phases: LessonPhase[]; totalMinutes: number } {
  const audience = beginnerAudience(student.ageBand)
  const isChild = audience === 'child'
  /* The lesson is booked for fifty minutes, so it has to fill fifty minutes.
     A plan that ran out at thirty-two left an inexperienced tutor with a third
     of the lesson and no instruction for it — which is the exact uncertainty
     this app exists to remove. Activities are added until the hour is full,
     with the last five minutes reserved for the close. */
  const CLOSE_MINUTES = 5
  const ACTIVITY_BUDGET = 50 - CLOSE_MINUTES

  // Skip what this learner met recently; selectBeginnerActivities falls back to
  // the full pool if that would leave too few activities for a whole lesson.
  const templates = selectBeginnerActivities({
    stage,
    audience,
    seed,
    count: 12,
    exclude: new Set(recentIds),
  })

  const phases: LessonPhase[] = []
  let t = 0
  const pushPhase = (tpl: BeginnerActivityTemplate, revisit = false) => {
    const dur = tpl.minutes
    phases.push({
      kind: tpl.kind,
      // A second pass at the same content is not padding at Pre-A1 — it is the
      // method. Labelling it as a revisit tells the tutor to expect more from
      // the learner this time, not to teach it again from scratch.
      title: revisit ? `Again: ${tpl.title}` : tpl.title,
      titleKey: revisit ? 'guide.title.again' : 'guide.title.plain',
      titleParams: { ref: tpl.id },
      startMin: t,
      endMin: t + dur,
      activities: [templateToActivity(tpl)],
    })
    t += dur
  }

  let breakCount = 0
  let i = 0
  // P0 has fewer distinct activities than a fifty-minute lesson can hold, so
  // the list wraps: the learner meets today's material a second time rather
  // than meeting nothing. The guard is the clock, not the pool size.
  while (templates.length > 0 && i < templates.length * 3) {
    const tpl = templates[i % templates.length]
    if (t + tpl.minutes > ACTIVITY_BUDGET) break
    pushPhase(tpl, i >= templates.length)
    // Movement/reset break after every couple of focus activities for children.
    // The seed rotates WHICH break so the same one is not used twice in a
    // lesson, or in the same slot every week.
    if (isChild && i % 2 === 1) {
      const m = movementActivity(stage, seed + breakCount)
      if (m && t + m.minutes <= ACTIVITY_BUDGET) {
        pushPhase(m)
        breakCount += 1
      }
    }
    i += 1
  }

  const feedback = beginnerFeedbackPhase(t, isChild)
  phases.push(feedback)
  return { phases, totalMinutes: feedback.endMin }
}

function buildBeginnerLesson(
  student: StudentProfile,
  model: LearningModel,
  opts: { label: string; seed: number; source: LessonPlan['source'] },
): LessonPlan {
  const stage = model.preA1Stage ?? 'P1'
  const { phases, totalMinutes } = beginnerPhases(student, stage, opts.seed, model.recentContentIds)
  const obj = STAGE_OBJECTIVE[stage]
  return {
    id: uid('lesson'),
    studentId: student.id,
    createdAt: Date.now(),
    label: opts.label,
    objective: {
      ref: `beginner:${stage}`,
      title: obj.title,
      titleKey: `guide.objective.beginner.${stage}.title`,
      rationale: obj.rationale,
      rationaleKey: `guide.objective.beginner.${stage}.rationale`,
    },
    phases,
    totalMinutes,
    source: opts.source,
  }
}

export interface GenerateOptions {
  label: string
  seed?: number
  previousObjectiveRefs?: string[]
  /** Longitudinal evidence. Supplied by the service layer, which has the
   *  lesson history; omitted by callers that only hold a learning model. */
  progress?: ProgressSnapshot
  source?: LessonPlan['source']
  /** Injectable RNG for content selection — defaults to Math.random. Tests
   *  can pass a fixed function for reproducibility; production never does. */
  rng?: () => number
}

export function generateLesson(
  student: StudentProfile,
  model: LearningModel,
  opts: GenerateOptions,
): LessonPlan {
  const level = overallCefr(model.skillEstimates)
  const seed = opts.seed ?? (student.name.length + (opts.previousObjectiveRefs?.length ?? 0) * 7)
  const rng = opts.rng ?? Math.random
  const now = Date.now()

  if (isBeginnerPathway(level)) {
    return buildBeginnerLesson(student, model, {
      label: opts.label,
      seed,
      source: opts.source ?? 'generated',
    })
  }

  if (isC1Pathway(model, level)) {
    const { phases } = c1Phases(student, model, seed, rng)
    return {
      id: uid('lesson'),
      studentId: student.id,
      createdAt: now,
      label: opts.label,
      objective: {
        ref: 'c1-communication',
        title: 'Advanced communication coaching',
        titleKey: 'guide.objective.c1.title',
        rationale:
          'At strong C1, lessons shift to sustained, nuanced communication with precision feedback.',
        rationaleKey: 'guide.objective.c1.rationale',
      },
      phases,
      totalMinutes: 50,
      source: opts.source ?? 'generated',
    }
  }

  const objective = chooseObjective(model, level, opts.previousObjectiveRefs ?? [], opts.progress)
  const phases = standardPhases(student, model, level, objective, seed, rng)
  return {
    id: uid('lesson'),
    studentId: student.id,
    createdAt: now,
    label: opts.label,
    objective,
    phases,
    totalMinutes: 50,
    source: opts.source ?? 'generated',
  }
}

/** The very first lesson — diagnostic-leaning, level-appropriate objective. */
export function generateFirstLesson(
  student: StudentProfile,
  model: LearningModel,
  rng: () => number = Math.random,
): LessonPlan {
  const level = overallCefr(model.skillEstimates)
  const seed0 = student.name.length + student.age

  // A brand-new absolute beginner gets the dedicated beginner first lesson:
  // spoken English, listening and pronunciation before any reading.
  if (isBeginnerPathway(level)) {
    return buildBeginnerLesson(student, model, {
      label: 'First lesson',
      seed: seed0,
      source: 'firstLesson',
    })
  }

  // An already-fluent learner starts where they actually are: sustained
  // communication coaching, not a grammar point they mastered years ago.
  if (isC1Pathway(model, level)) {
    const { phases } = c1Phases(student, model, seed0, rng)
    return {
      id: uid('lesson'),
      studentId: student.id,
      createdAt: Date.now(),
      label: 'First lesson',
      objective: {
        ref: 'c1-communication',
        title: 'Advanced communication coaching',
        titleKey: 'guide.objective.c1.title',
        rationale:
          'At this level, lessons are sustained, nuanced communication with precision feedback — not remedial grammar.',
        rationaleKey: 'guide.objective.c1First',
      },
      phases,
      totalMinutes: 50,
      source: 'firstLesson',
    }
  }

  const objectiveId = suggestedFirstObjective(level)
  const g = getGrammarById(objectiveId)
  const seed = student.name.length + student.age
  const phases = standardPhases(
    student,
    model,
    level,
    { ref: objectiveId, title: g?.title ?? 'Core structure', kind: 'grammar' },
    seed,
    rng,
  )
  return {
    id: uid('lesson'),
    studentId: student.id,
    createdAt: Date.now(),
    label: 'First lesson',
    objective: {
      ref: objectiveId,
      title: g?.title ?? 'Core structure',
      titleKey: 'guide.title.plain',
      titleParams: { ref: objectiveId },
      rationale:
        'A level-appropriate focus while the tutor gets to know the learner’s real speaking.',
      rationaleKey: 'guide.objective.firstLesson',
    },
    phases,
    totalMinutes: 50,
    source: 'firstLesson',
  }
}
