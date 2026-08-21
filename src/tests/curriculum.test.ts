/* ==========================================================================
   Curriculum coverage — the audit matrix, as an executable check.
   --------------------------------------------------------------------------
   The brief asks for coverage across age (5–7, 8–12, 13–17, adult, older
   adult) × level (P0–P3, A1–C1) × skill (listening, speaking, pronunciation,
   vocabulary, grammar, reading/literacy, writing).

   Rather than counting items — which rewards filler — these tests check that
   every combination the app can actually PRODUCE has real teaching content
   behind it, that no bank is so thin a weekly learner meets the same activity
   twice, and that every declared target is teachable.

   Two of these started as genuine holes: six of the fourteen declared
   pronunciation areas had no entry at all, and a P0 adult lesson could draw on
   three activities to fill six slots.
   ========================================================================== */

import { describe, it, expect } from 'vitest'
import {
  CEFR_LEVELS,
  PRE_A1_STAGES,
  PRONUNCIATION_AREAS,
  PreA1Stage,
  SKILLS,
  StudentProfile,
} from '../types'
import { grammarLibrary, findGrammarForError, getGrammarById } from '../data/grammarLibrary'
import { pronunciationLibrary, pronunciationAreasWithoutContent } from '../data/pronunciationLibrary'
import { beginnerActivities, beginnerActivitiesFor, selectBeginnerActivities } from '../lessons/beginnerContent'
import { warmups, communicationTasks, c1Tasks } from '../lessons/activityContent'
import { initLearningModel } from '../students/learningModel'
import { generateFirstLesson, generateLesson } from '../lessons/lessonGenerator'
import { locales } from '../locales'
import { flatten } from '../i18n/dict'
import { UI_LANGUAGES } from '../types'
import { activityGuidance } from '../lessons/guidance'

const now = 1_700_000_000_000

/* -------------------------------------------------------------------------- */
/* Grammar                                                                    */
/* -------------------------------------------------------------------------- */

describe('grammar library covers A1 → C1 with usable depth', () => {
  const teachable = CEFR_LEVELS.filter((l) => l !== 'preA1')

  for (const level of teachable) {
    it(`${level}: has enough concepts that a learner is not cycled through the same few`, () => {
      const at = grammarLibrary.filter((g) => g.cefr === level)
      // Three is the point at which a monthly learner stops repeating within a
      // level before moving up. Two was the old B1/B2 count.
      expect(at.length, `only ${at.length} concept(s) at ${level}`).toBeGreaterThanOrEqual(3)
    })
  }

  it('every concept gives an inexperienced tutor the whole teaching sequence', () => {
    for (const g of grammarLibrary) {
      // §6 of the brief, field by field.
      expect(g.tutorExplanation.length, `${g.id} tutorExplanation`).toBeGreaterThan(30)
      expect(g.studentExplanation.length, `${g.id} studentExplanation`).toBeGreaterThan(15)
      expect(g.meaningFirst.length, `${g.id} meaningFirst`).toBeGreaterThan(30)
      expect(g.correctExamples.length, `${g.id} examples`).toBeGreaterThanOrEqual(3)
      expect(g.noticePrompt.length, `${g.id} noticePrompt`).toBeGreaterThan(15)
      expect(g.commonErrors.length, `${g.id} commonErrors`).toBeGreaterThanOrEqual(2)
      expect(g.correctionScript.length, `${g.id} correctionScript`).toBeGreaterThanOrEqual(1)
      expect(g.controlledPractice.length, `${g.id} guided practice`).toBeGreaterThanOrEqual(1)
      expect(g.conversationPractice.length, `${g.id} speaking prompt`).toBeGreaterThanOrEqual(1)
      expect(g.retrievalCue.length, `${g.id} retrievalCue`).toBeGreaterThan(10)
      expect(g.fallback.length, `${g.id} fallback`).toBeGreaterThan(15)
      expect(g.extension.length, `${g.id} extension`).toBeGreaterThan(15)
    }
  })

  it('gives exact correcting words, never just "correct the mistake"', () => {
    for (const g of grammarLibrary) {
      // A script is something you can read aloud, so it quotes the target.
      const script = g.correctionScript.join(' ')
      expect(script.length, `${g.id}`).toBeGreaterThan(20)
      expect(/[“”"’']/.test(script), `${g.id} correctionScript has no quoted wording`).toBe(true)
    }
  })

  it('never opens a concept with an abstract rule', () => {
    // meaningFirst must describe something physical or situational: an object,
    // a gesture, a drawing, a real fact about the tutor or the learner.
    const concrete = /point|show|hold|mime|draw|timeline|object|photo|room|window|calendar|story|situation|pass|move|count|act|real|ask|say|tell|give|start|use|offer|put|look|describe|narrat|whisper|imagine|guess|laugh|hide/i
    for (const g of grammarLibrary) {
      expect(concrete.test(g.meaningFirst), `${g.id} meaningFirst is not concrete: ${g.meaningFirst}`).toBe(true)
    }
  })

  it('explains any terminology it uses, rather than assuming it', () => {
    // Words a native speaker with no teaching background would not know.
    const jargon = /\b(auxiliary|copula|gerund|infinitive|participle|subjunctive|determiner|morpheme|syllable|uncountable|third person singular|subject|irregular verb|article)\b/i
    for (const g of grammarLibrary) {
      const studentFacing = `${g.studentExplanation} ${g.noticePrompt} ${g.correctionScript.join(' ')}`
      const usesJargon = jargon.test(studentFacing)
      if (usesJargon) {
        const explained = (g.jargonBuster ?? []).map((j) => j.term.toLowerCase()).join(' ')
        const match = studentFacing.match(jargon)![0].toLowerCase()
        expect(explained, `${g.id} uses "${match}" without explaining it`).toContain(match)
      }
    }
  })

  it('every easier/harder variant points at a concept that exists', () => {
    for (const g of grammarLibrary) {
      for (const ref of [g.easierVariant, g.harderVariant, ...g.prerequisites]) {
        if (ref) expect(getGrammarById(ref), `${g.id} → ${ref}`).toBeDefined()
      }
    }
  })

  it('matches a real learner error to the concept that teaches it', () => {
    expect(findGrammarForError('She go to school')?.id).toBe('g_present_simple')
    expect(findGrammarForError('Yesterday I go to the shop')?.id).toBe('g_past_simple')
    expect(findGrammarForError('I have seen him yesterday')?.id).toBe('g_present_perfect')
    expect(findGrammarForError('I am teacher')?.id).toBe('g_articles')
    // Nonsense matches nothing rather than the first entry in the library.
    expect(findGrammarForError('')).toBeUndefined()
    expect(findGrammarForError('qqqq zzzz')).toBeUndefined()
  })

  it('has unique ids', () => {
    const ids = grammarLibrary.map((g) => g.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

/* -------------------------------------------------------------------------- */
/* Pronunciation                                                              */
/* -------------------------------------------------------------------------- */

describe('pronunciation covers every declared area', () => {
  it('no area can be set as a target without teaching content behind it', () => {
    // This was a real hole: 'l', 'vowels', 'americanR', 'finalConsonants',
    // 'consonantClusters' and 'rhythm' were selectable targets with no entry.
    expect(pronunciationAreasWithoutContent(PRONUNCIATION_AREAS)).toEqual([])
  })

  it('covers sounds, stress, rhythm, reduction, linking and intonation', () => {
    const areas = new Set(pronunciationLibrary.map((p) => p.area))
    for (const required of [
      'th',
      'r',
      'l',
      'vw',
      'vowels',
      'americanR',
      'finalConsonants',
      'consonantClusters',
      'wordStress',
      'sentenceStress',
      'rhythm',
      'reducedVowels',
      'linking',
      'intonation',
    ] as const) {
      expect(areas.has(required), `missing ${required}`).toBe(true)
    }
  })

  it('every concept has contrasts, connected speech, and a recording plan', () => {
    for (const p of pronunciationLibrary) {
      expect(p.why.length, `${p.area} why`).toBeGreaterThan(30)
      expect(p.howTo.length, `${p.area} howTo`).toBeGreaterThan(30)
      expect(p.minimalPairs.length, `${p.area} minimalPairs`).toBeGreaterThanOrEqual(1)
      expect(p.words.length, `${p.area} words`).toBeGreaterThanOrEqual(3)
      expect(p.sentences.length, `${p.area} sentences`).toBeGreaterThanOrEqual(1)
      expect(p.connectedSpeech.length, `${p.area} connectedSpeech`).toBeGreaterThan(30)
      for (const stage of ['baseline', 'practice', 'improved'] as const) {
        expect(p.recordingPlan[stage].length, `${p.area} recordingPlan.${stage}`).toBeGreaterThan(15)
      }
    }
  })

  it('claims no automatic scoring anywhere', () => {
    const text = JSON.stringify(pronunciationLibrary).toLowerCase()
    expect(text).not.toMatch(/automatic(ally)? scor|score of|\d+ ?% accura|our algorithm/)
  })

  it('carries first-language interference notes for the languages the app serves', () => {
    for (const p of pronunciationLibrary) {
      const notes = p.firstLanguageNotes ?? {}
      // The tutor's own languages plus the interface languages a learner picks.
      for (const lang of ['ru', 'he', 'es', 'fr'] as const) {
        expect(notes[lang], `${p.area} has no note for ${lang}`).toBeTruthy()
      }
    }
  })
})

/* -------------------------------------------------------------------------- */
/* Pre-A1 (P0…P3) × audience                                                  */
/* -------------------------------------------------------------------------- */

describe('Pre-A1 coverage across stage × audience', () => {
  const audiences = ['child', 'adult'] as const
  /** A lesson draws five (child) or six (adult) focus activities. */
  const slots: Record<(typeof audiences)[number], number> = { child: 5, adult: 6 }

  for (const stage of PRE_A1_STAGES) {
    for (const audience of audiences) {
      it(`${stage} × ${audience}: enough distinct activities to fill a lesson`, () => {
        const pool = beginnerActivitiesFor(stage, audience).filter((a) => !a.movement)
        expect(pool.length, `${stage}/${audience} pool is ${pool.length}`).toBeGreaterThanOrEqual(
          slots[audience],
        )
      })

      it(`${stage} × ${audience}: a lesson never repeats an activity within itself`, () => {
        const picked = selectBeginnerActivities({ stage, audience, seed: 3, count: slots[audience] })
        expect(picked).toHaveLength(slots[audience])
        expect(new Set(picked.map((p) => p.id)).size).toBe(picked.length)
      })

      it(`${stage} × ${audience}: two consecutive weeks do not repeat wholesale`, () => {
        const week1 = selectBeginnerActivities({ stage, audience, seed: 1, count: slots[audience] })
        const week2 = selectBeginnerActivities({
          stage,
          audience,
          seed: 2,
          count: slots[audience],
          exclude: new Set(week1.map((a) => a.id)),
        })
        const overlap = week2.filter((a) => week1.some((b) => b.id === a.id))
        expect(overlap.length, `${overlap.length}/${week2.length} repeated`).toBeLessThan(week2.length)
      })
    }
  }

  it('adult beginner activities are never childish', () => {
    // Word boundaries matter here: without them "using" trips the "sing" rule
    // and the test fails on perfectly dignified adult content.
    const childish = /\b(toys?|puppets?|peekaboo|wiggle|sing|clap your hands|monster|sticker)\b/i
    for (const a of beginnerActivities.filter((x) => x.audience === 'adult')) {
      const text = `${a.title} ${a.studentPrompt} ${JSON.stringify(activityGuidance(a, { lang: 'en' }).autopilot)}`
      expect(childish.test(text), `${a.id} reads as a children's activity`).toBe(false)
    }
  })

  it('P0 never demands English reading or writing', () => {
    for (const a of beginnerActivitiesFor('P0', 'child').concat(beginnerActivitiesFor('P0', 'adult'))) {
      expect(['reading', 'writing']).not.toContain(a.kind)
    }
  })

  it('every beginner activity has a native-language instruction in all five locales', () => {
    for (const a of beginnerActivities) {
      for (const lang of UI_LANGUAGES) {
        const flat = flatten(locales[lang])
        expect(flat[a.studentPromptKey], `${a.id} missing ${lang}:${a.studentPromptKey}`).toBeTruthy()
      }
    }
  })

  it('has unique ids', () => {
    const ids = beginnerActivities.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

/* -------------------------------------------------------------------------- */
/* Activity banks                                                             */
/* -------------------------------------------------------------------------- */

describe('conversation banks are deep enough for a weekly learner', () => {
  it('every age band has months of warm-ups and conversation tasks', () => {
    for (const band of ['6-8', '9-12', '13-17', 'adult'] as const) {
      expect(warmups[band].length, `${band} warm-ups`).toBeGreaterThanOrEqual(16)
      expect(communicationTasks[band].length, `${band} tasks`).toBeGreaterThanOrEqual(16)
    }
    expect(c1Tasks.length).toBeGreaterThanOrEqual(30)
  })

  it('C1 tasks span more than one kind of demand', () => {
    const categories = new Set(c1Tasks.map((t) => t.category))
    expect(categories.size).toBeGreaterThanOrEqual(4)
  })
})

/* -------------------------------------------------------------------------- */
/* Skill coverage in generated lessons                                        */
/* -------------------------------------------------------------------------- */

describe('a generated lesson touches the skills a learner at that level needs', () => {
  function studentAt(age: number, band: StudentProfile['ageBand']): StudentProfile {
    return {
      id: 'stu',
      createdAt: now,
      updatedAt: now,
      name: 'Sam',
      age,
      ageBand: band,
      nativeLanguage: 'Hebrew',
      otherLanguages: [],
      interfaceLanguage: 'en',
      goals: ['conversation'],
      interests: [],
      speakingConfidence: 3,
      pronunciationImportance: 3,
    }
  }

  it('an A2+ lesson covers speaking, listening, reading, writing, grammar and vocabulary', () => {
    const s = studentAt(30, 'adult')
    const plan = generateLesson(s, initLearningModel(s.id, 'A2', now), { label: 'L2' })
    const kinds = new Set(plan.phases.map((p) => p.kind))
    for (const kind of ['warmup', 'speakingListening', 'reading', 'writing', 'microLesson', 'communication']) {
      expect(kinds.has(kind as never), `missing ${kind}`).toBe(true)
    }
  })

  it('a Pre-A1 lesson is oral-first and never hands a non-reader a paragraph', () => {
    for (const stage of PRE_A1_STAGES) {
      const s = studentAt(68, 'adult')
      const model = { ...initLearningModel(s.id, 'preA1', now), preA1Stage: stage as PreA1Stage }
      const plan = generateFirstLesson(s, model)
      expect(plan.phases.map((p) => p.kind), stage).not.toContain('writing')
      for (const activity of plan.phases.flatMap((p) => p.activities)) {
        expect(activity.passage, `${stage}: ${activity.title} has a passage`).toBeUndefined()
      }
    }
  })

  it('pronunciation appears in EVERY lesson, not only once a problem is noticed', () => {
    // Clear American pronunciation is what these lessons are for. It used to
    // be woven in only after a focus had been recorded, so a brand-new student
    // could go several lessons without any pronunciation work at all.
    const s = studentAt(30, 'adult')
    for (const level of ['A1', 'A2', 'B1', 'B2'] as const) {
      const plan = generateLesson(s, initLearningModel(s.id, level, now), { label: 'L' })
      const refs = plan.phases.flatMap((p) => p.activities.map((a) => a.ref ?? ''))
      const hasPronunciation =
        plan.phases.some((p) => p.kind === 'pronunciation') ||
        refs.some((ref) => pronunciationLibrary.some((p) => p.area === ref))
      expect(hasPronunciation, `${level} lesson has no pronunciation work`).toBe(true)
    }
  })

  it('only offers a pronunciation target the learner’s level can reach', () => {
    const s = studentAt(30, 'adult')
    const plan = generateLesson(s, initLearningModel(s.id, 'A1', now), { label: 'L' })
    const areas = plan.phases
      .flatMap((p) => p.activities.map((a) => a.ref ?? ''))
      .filter((ref) => pronunciationLibrary.some((p) => p.area === ref))
    for (const area of areas) {
      const concept = pronunciationLibrary.find((p) => p.area === area)!
      expect(['preA1', 'A1'], `${area} starts at ${concept.cefrFrom}`).toContain(concept.cefrFrom)
    }
  })

  it('reading follows the learner’s reading level, not their age', () => {
    // A seven-year-old who reads English well should not be sent back to
    // letter-sound matching, and an adult who cannot read should not be handed
    // a paragraph. Age caps the ceiling; it does not set the floor.
    const strongReader = studentAt(7, '6-8')
    const model = initLearningModel(strongReader.id, 'A2', now)
    model.skillEstimates.reading = { level: 'A2', levelScore: 2, confidence: 0.6, evidenceCount: 4, updatedAt: now }
    const plan = generateLesson(strongReader, model, { label: 'L' })
    const reading = plan.phases.find((p) => p.kind === 'reading')!
    expect(reading.activities[0].studentPrompt).not.toMatch(/letter to its sound/i)

    // …but a young child never gets the adult inference passage.
    model.skillEstimates.reading = { level: 'C1', levelScore: 5, confidence: 0.6, evidenceCount: 4, updatedAt: now }
    const advanced = generateLesson(strongReader, model, { label: 'L' })
    const advancedReading = advanced.phases.find((p) => p.kind === 'reading')!
    expect(advancedReading.activities[0].studentPrompt).not.toMatch(/infer/i)
  })

  it('the skill vocabulary the app tracks is the one the brief audits', () => {
    expect([...SKILLS].sort()).toEqual(
      ['grammar', 'listening', 'pronunciation', 'reading', 'speaking', 'vocabulary', 'writing'].sort(),
    )
  })
})
