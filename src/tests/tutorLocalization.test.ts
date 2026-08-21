/* ==========================================================================
   The tutor reads the lesson in their own language — held to it by tests.
   --------------------------------------------------------------------------
   Three separate promises, and each one has failed in this app before:

     1. COMPLETENESS. Every tutor-facing string in the content banks has a
        translation in all four non-English locales. A missing key falls back
        to English silently at runtime, so this audit is the only thing that
        stops English creeping back in one entry at a time.

     2. NO ENGLISH INSTRUCTIONS. Walking a real generated lesson step by step
        in each locale, every instruction field is in that language — while
        the English the learner is meant to hear is byte-identical everywhere.

     3. LIVE, AND WITHOUT REGENERATION. The same plan object, rendered in five
        languages, gives five sets of instructions and one set of English
        targets. A plan saved before any of this existed behaves the same way.
   ========================================================================== */

import { describe, it, expect, beforeAll } from 'vitest'
import { CEFR, LessonActivity, LessonPlan, StudentProfile, UILanguage, UI_LANGUAGES } from '../types'
import { initLearningModel } from '../students/learningModel'
import { generateFirstLesson, generateLesson } from '../lessons/lessonGenerator'
import { buildMicroSteps, buildRetrievalStep, MicroStep } from '../lessons/microSteps'
import { localizedTitle, objectiveTitle, objectiveRationale } from '../lessons/guidance'
import { contentStrings, pronunciationL1Strings } from '../data/contentStrings'
import { contentTable, guideTable, loadTeachingStrings } from '../i18n/teachingStrings'
import { splitBidiRuns } from '../utils/bidi'

const now = 1_700_000_000_000
const OTHERS: UILanguage[] = ['he', 'ru', 'es', 'fr']

/* The teaching prose is fetched on demand in the app (see TutorGate); tests
 * ask for all five up front so every assertion below sees the real strings
 * rather than the English fallback. */
beforeAll(async () => {
  await Promise.all(UI_LANGUAGES.map(loadTeachingStrings))
})

/** Scripts that prove a string was actually translated, not copied. */
const SCRIPT: Partial<Record<UILanguage, RegExp>> = { he: /[֐-׿]/, ru: /[Ѐ-ӿ]/ }

/** English prose = four or more space-separated Latin words OUTSIDE quotes.
 *  Quoted English is the point of a language app, so it is stripped first. */
function englishProse(value: string): boolean {
  const outsideQuotes = value
    .replace(/«[^»]*»/g, '')
    .replace(/[“"][^”"]*[”"]/g, '')
    .replace(/‘[^’]*’/g, '')
  return /\b[A-Za-z]+\s+[A-Za-z]+\s+[A-Za-z]+\s+[A-Za-z]+\b/.test(outsideQuotes)
}

function student(over: Partial<StudentProfile> = {}): StudentProfile {
  return {
    id: 'stu',
    createdAt: now,
    updatedAt: now,
    name: 'Alex',
    age: 34,
    ageBand: 'adult',
    nativeLanguage: 'Russian',
    otherLanguages: [],
    interfaceLanguage: 'ru',
    goals: ['conversation'],
    interests: ['cooking'],
    speakingConfidence: 3,
    pronunciationImportance: 4,
    ...over,
  }
}

/** Every micro-step of a whole plan, in one language. */
function walk(plan: LessonPlan, s: StudentProfile, level: CEFR, lang: UILanguage): MicroStep[] {
  const model = initLearningModel(s.id, level, now)
  const steps: MicroStep[] = []
  plan.phases.forEach((phase) =>
    phase.activities.forEach((activity, activityIndex) =>
      steps.push(...buildMicroSteps(activity, { student: s, model, level, lang, activityIndex })),
    ),
  )
  return steps
}

/** The nine sections a tutor READS as instruction (SAY is deliberately absent —
 *  it is the English they say out loud). */
function instructionText(step: MicroStep): string[] {
  return [step.now, ...step.do, ...step.studentDoes, ...step.lookFor, ...step.help, ...step.challenge, step.doneWhen, step.next]
}

/* -------------------------------------------------------------------------- */
/* 1. Completeness of the content banks                                       */
/* -------------------------------------------------------------------------- */

describe('every tutor-facing library string is translated', () => {
  const strings = contentStrings()

  it('has a non-trivial number of content keys to check', () => {
    expect(strings.length).toBeGreaterThan(500)
  })

  for (const lang of OTHERS) {
    describe(`locale: ${lang}`, () => {
      /* Read inside each test, never at collection time: the tables are
         fetched in beforeAll, which runs after the describe bodies. */
      const table = () => contentTable(lang) ?? {}

      it('defines every content key', () => {
        const missing = strings.filter((s) => !(s.key in table())).map((s) => s.key)
        expect(missing).toEqual([])
      })

      it('defines no key the banks do not ask for', () => {
        const known = new Set([
          ...strings.map((s) => s.key),
          ...pronunciationL1Strings().map((s) => s.key),
        ])
        expect(Object.keys(table()).filter((k) => !known.has(k))).toEqual([])
      })

      it('has no empty translations', () => {
        const empty = Object.entries(table())
          .filter(([, v]) => !String(v).trim())
          .map(([k]) => k)
        expect(empty).toEqual([])
      })

      const script = SCRIPT[lang]
      if (script) {
        it('is actually written in its own script', () => {
          const untranslated = strings
            .filter((s) => s.en.length > 20 && !script.test(table()[s.key] ?? ''))
            .map((s) => s.key)
          expect(untranslated).toEqual([])
        })

        it('carries no English prose outside the quoted English targets', () => {
          const leaks = strings.filter((s) => englishProse(table()[s.key] ?? '')).map((s) => s.key)
          expect(leaks).toEqual([])
        })
      } else {
        /* es/fr share English's script, so the prose-pattern check above
           would flag real Spanish/French sentences as false positives — a
           translated sentence is still four-or-more Latin-script words. What
           a genuine translation essentially never does past a short phrase is
           come back BYTE-IDENTICAL to the English source, so identity is the
           signal that is safe here instead. */
        it('carries no content string left as an untranslated copy of English', () => {
          const leaks = strings
            .filter((s) => s.en.length > 20 && table()[s.key] === s.en)
            .map((s) => s.key)
          expect(leaks).toEqual([])
        })
      }
    })
  }

  describe('the guidance namespace', () => {
    const english = () => guideTable('en') ?? {}

    it('is a substantial namespace in English', () => {
      expect(Object.keys(english()).length).toBeGreaterThan(300)
    })

    for (const lang of OTHERS) {
      it(`${lang} has exactly the same keys, placeholders and no English prose`, () => {
        const en = english()
        const enKeys = Object.keys(en).sort()
        const flat = guideTable(lang) ?? {}
        expect({
          missing: enKeys.filter((k) => !(k in flat)),
          extra: Object.keys(flat).filter((k) => !(k in en)),
        }).toEqual({ missing: [], extra: [] })

        const placeholders = (v: string) =>
          (v.match(/\{\{\s*\w+\s*\}\}/g) ?? []).map((x) => x.replace(/\s/g, '')).sort().join(',')
        expect(enKeys.filter((k) => placeholders(en[k]) !== placeholders(flat[k]))).toEqual([])

        const script = SCRIPT[lang]
        if (script) {
          expect(enKeys.filter((k) => en[k].length > 20 && !script.test(flat[k]))).toEqual([])
          expect(enKeys.filter((k) => englishProse(flat[k]))).toEqual([])
        } else {
          // Same reasoning as the content-bank check above: for a Latin-script
          // locale, an untranslated guidance line shows up as an exact copy of
          // the English source, not as "prose" (real translations are prose too).
          expect(enKeys.filter((k) => en[k].length > 20 && flat[k] === en[k])).toEqual([])
        }
      })
    }
  })

  it('translates each first-language pronunciation note into that language', () => {
    const missing = pronunciationL1Strings()
      .filter((s) => s.lang !== 'en' && !(s.key in (contentTable(s.lang) ?? {})))
      .map((s) => s.key)
    expect(missing).toEqual([])
  })
})

/* -------------------------------------------------------------------------- */
/* 2. A real lesson, walked step by step, in every locale                     */
/* -------------------------------------------------------------------------- */

const LEARNERS: { label: string; student: StudentProfile; level: CEFR }[] = [
  {
    label: 'pre-reader (age 6, from zero)',
    student: student({ id: 'a', name: 'Noa', age: 6, ageBand: '6-8', interfaceLanguage: 'he', englishReading: 'cannot' }),
    level: 'preA1',
  },
  {
    label: 'adult beginner',
    student: student({ id: 'b', name: 'Yosef', age: 68, interfaceLanguage: 'ru', englishReading: 'cannot' }),
    level: 'preA1',
  },
  { label: 'teenager at A2', student: student({ id: 'c', name: 'Dana', age: 15, ageBand: '13-17' }), level: 'A2' },
  { label: 'adult at B1', student: student({ id: 'd', name: 'Igor' }), level: 'B1' },
  { label: 'advanced adult at C1', student: student({ id: 'e', name: 'Maya', age: 45 }), level: 'C1' },
]

describe.each(LEARNERS)('$label', ({ student: s, level }) => {
  const model = initLearningModel(s.id, level, now)
  const plan = generateFirstLesson(s, model, () => 0.42)

  for (const lang of ['he', 'ru'] as const) {
    it(`shows no English instruction anywhere in ${lang}`, () => {
      const script = SCRIPT[lang]!
      const leaks: string[] = []
      for (const step of walk(plan, s, level, lang)) {
        for (const line of instructionText(step)) {
          // A line with no letters of its own script AND four English words in
          // a row is an untranslated instruction, not a target phrase.
          if (!script.test(line) && englishProse(line)) leaks.push(`${step.id}: ${line}`)
        }
      }
      expect(leaks).toEqual([])
    })
  }

  it('gives the tutor different instructions in all five languages', () => {
    const nows = UI_LANGUAGES.map((lang) => walk(plan, s, level, lang).map((x) => x.now).join('|'))
    expect(new Set(nows).size).toBe(UI_LANGUAGES.length)
  })

  it('keeps every English target identical in all five languages', () => {
    const says = UI_LANGUAGES.map((lang) =>
      walk(plan, s, level, lang)
        .map((x) => [...x.say, x.speak ?? ''].join('¶'))
        .join('|'),
    )
    // The retrieval cue is spoken to the learner in their own language, so it
    // is excluded from the plan-level walk by construction: no due material.
    expect(new Set(says).size).toBe(1)
  })

  it('localizes every activity and phase title', () => {
    for (const phase of plan.phases) {
      expect(localizedTitle('he', phase), `phase ${phase.kind}`).not.toBe(localizedTitle('ru', phase))
      for (const activity of phase.activities) {
        expect(localizedTitle('ru', activity), `activity ${activity.kind}`).not.toBe(
          localizedTitle('es', activity),
        )
      }
    }
  })

  it('localizes the objective and the reason for it', () => {
    expect(objectiveTitle('he', plan.objective)).not.toBe(objectiveTitle('ru', plan.objective))
    expect(objectiveRationale('he', plan.objective)).not.toBe(objectiveRationale('fr', plan.objective))
  })
})

/* -------------------------------------------------------------------------- */
/* 3. Live switching, stored plans, and legacy records                        */
/* -------------------------------------------------------------------------- */

describe('switching the interface language', () => {
  const s = student()
  const model = initLearningModel(s.id, 'B1', now)
  const plan = generateFirstLesson(s, model, () => 0.42)

  it('changes the guidance without touching the stored plan', () => {
    const before = JSON.stringify(plan)
    const he = walk(plan, s, 'B1', 'he')
    const ru = walk(plan, s, 'B1', 'ru')
    expect(he[0].now).not.toBe(ru[0].now)
    expect(JSON.stringify(plan)).toBe(before)
  })

  it('stores no instructional prose on the plan at all', () => {
    const activities = plan.phases.flatMap((p) => p.activities)
    expect(activities.every((a) => a.autopilot === undefined && a.tutorCard === undefined)).toBe(true)
    expect(activities.every((a) => a.guide !== undefined)).toBe(true)
  })

  it('leaks no generation-time locale into a lesson generated under one', () => {
    // Two plans for the same learner, generated with different interface
    // languages set on the profile, must be identical apart from ids.
    const strip = (p: LessonPlan) => JSON.stringify(p).replace(/"(id|createdAt)":"?[^",]*"?/g, '')
    const heProfile = { ...s, interfaceLanguage: 'he' as const }
    const frProfile = { ...s, interfaceLanguage: 'fr' as const }
    expect(strip(generateLesson(heProfile, model, { label: 'L', seed: 3, rng: () => 0.3 }))).toBe(
      strip(generateLesson(frProfile, model, { label: 'L', seed: 3, rng: () => 0.3 })),
    )
  })
})

describe('a lesson saved before any of this existed', () => {
  const s = student()
  const level: CEFR = 'B1'

  /** A plan as it was stored in an older release: English prose baked in,
   *  no `guide`, no title keys — but the content ids it always carried. */
  function legacyPlan(): LessonPlan {
    const plan = generateFirstLesson(s, initLearningModel(s.id, level, now), () => 0.42)
    return {
      ...plan,
      objective: { ref: plan.objective.ref, title: plan.objective.title, rationale: plan.objective.rationale },
      phases: plan.phases.map((phase) => ({
        kind: phase.kind,
        title: phase.title,
        startMin: phase.startMin,
        endMin: phase.endMin,
        activities: phase.activities.map(
          (a): LessonActivity => ({
            id: a.id,
            kind: a.kind,
            title: a.title,
            studentPrompt: a.studentPrompt,
            speak: a.speak,
            ref: a.ref,
            autopilot: { say: ['Tell me about…'], do: ['Ask, then wait.'], lookFor: ['Tense control'], next: ['Move on'] },
            tutorCard: {
              goal: 'Stale English goal',
              listenFor: [],
              ifStruggle: 'Stale English',
              ifSucceed: 'Stale English',
              howToExplain: 'Stale English',
              model: [],
              practice: [],
              avoid: [],
            },
          }),
        ),
      })),
    }
  }

  it('still loads, and rebuilds its guidance in the tutor’s language', () => {
    const steps = walk(legacyPlan(), s, level, 'ru')
    expect(steps.length).toBeGreaterThan(3)
    const script = SCRIPT.ru!
    const leaks = steps
      .flatMap(instructionText)
      .filter((line) => !script.test(line) && englishProse(line))
    expect(leaks).toEqual([])
  })

  it('never shows the stale English prose it happens to carry', () => {
    const text = walk(legacyPlan(), s, level, 'he').flatMap(instructionText).join(' ')
    expect(text).not.toMatch(/Stale English/)
  })

  it('is never left without an instruction', () => {
    for (const step of walk(legacyPlan(), s, level, 'fr')) {
      expect(step.now.trim(), step.id).not.toBe('')
      expect(step.do.length, step.id).toBeGreaterThan(0)
      expect(step.lookFor.length, step.id).toBeGreaterThan(0)
      expect(step.help.length, step.id).toBeGreaterThan(0)
      expect(step.challenge.length, step.id).toBeGreaterThan(0)
    }
  })
})

/* -------------------------------------------------------------------------- */
/* 4. Hebrew: RTL instruction, LTR English inside it                          */
/* -------------------------------------------------------------------------- */

describe('Hebrew instructions that embed English', () => {
  const s = student({ interfaceLanguage: 'he' })
  const model = initLearningModel(s.id, 'A2', now)
  const plan = generateFirstLesson(s, model, () => 0.42)

  it('isolates every embedded English run instead of spacing it by hand', () => {
    const mixed = walk(plan, s, 'A2', 'he')
      .flatMap(instructionText)
      .filter((line) => /[֐-׿]/.test(line) && /[A-Za-z]/.test(line))
    expect(mixed.length).toBeGreaterThan(0)
    for (const line of mixed) {
      const runs = splitBidiRuns(line)
      expect(runs.some((r) => r.isolate), line).toBe(true)
      // Nothing is padded with directional marks or manual spacing hacks.
      expect(line, line).not.toMatch(/[‎‏‪-‮]/)
      expect(runs.map((r) => r.text).join(''), line).toBe(line)
    }
  })
})

/* -------------------------------------------------------------------------- */
/* 5. Fluency sprint and pronunciation coaching specifically                  */
/* -------------------------------------------------------------------------- */

describe('Fluency Sprint', () => {
  const s = student()
  const model = initLearningModel(s.id, 'B1', now)
  const plan = generateFirstLesson(s, model, () => 0.42)
  const fluency = plan.phases.find((p) => p.kind === 'fluency')

  it('is in the lesson at all', () => {
    expect(fluency).toBeDefined()
  })

  it('gives its round-by-round instructions in the tutor’s language, clocks intact', () => {
    const activity = fluency!.activities[0]
    for (const lang of OTHERS) {
      const steps = buildMicroSteps(activity, { student: s, model, level: 'B1', lang, activityIndex: 0 })
      expect(steps.length).toBeGreaterThan(2)
      const script = SCRIPT[lang]
      for (const step of steps) {
        if (script) expect(script.test(step.now), `${lang}: ${step.now}`).toBe(true)
      }
      // Every round step still names its clock, in digits, in every language.
      for (const step of steps.filter((x) => x.move !== 'feedback')) {
        expect(instructionText(step).join(' '), `${lang}: ${step.id}`).toMatch(/\d/)
      }
      // The topic the learner speaks about is still the English prompt.
      expect(steps[0].say[0]).toBe(activity.studentPrompt)
    }
  })
})

describe('pronunciation coaching', () => {
  const s = student({ interfaceLanguage: 'ru' })
  const model = initLearningModel(s.id, 'A2', now)

  it('keeps the sounds English and the coaching in the tutor’s language', () => {
    const activity: LessonActivity = {
      id: 'p1',
      kind: 'pronunciation',
      title: 'Pronunciation moment',
      titleKey: 'guide.title.pronMoment',
      studentPrompt: 'Listen, then repeat.',
      guide: { src: 'pronunciation', id: 'th' },
      ref: 'th',
    }
    const ru = buildMicroSteps(activity, { student: s, model, level: 'A2', lang: 'ru', activityIndex: 0 })
    const en = buildMicroSteps(activity, { student: s, model, level: 'A2', lang: 'en', activityIndex: 0 })
    expect(ru.map((x) => x.say.join('|'))).toEqual(en.map((x) => x.say.join('|')))
    expect(ru.map((x) => x.now).join(' ')).toMatch(SCRIPT.ru!)
    // The first-language note about Russian speakers is itself in Russian.
    expect(ru[0].do.join(' ')).toMatch(SCRIPT.ru!)
  })
})

/* -------------------------------------------------------------------------- */
/* 6. Spaced recall — the cue is spoken in the shared language                 */
/* -------------------------------------------------------------------------- */

describe('the recall step', () => {
  it('asks in the tutor’s language and keeps the English word English', () => {
    const s = student()
    const model = initLearningModel(s.id, 'B1', now)
    model.vocabulary.push({
      id: 'v1',
      term: 'stubborn',
      meaning: 'не хочет менять мнение',
      addedAt: now - 1000,
      strength: 'emerging',
      reviewDue: now - 1,
    })
    const step = buildRetrievalStep(
      { student: s, model, level: 'B1', lang: 'ru', activityIndex: 0 },
      'act-1',
      now,
    )
    expect(step).toBeTruthy()
    expect(step!.say.join(' ')).toMatch(SCRIPT.ru!)
    expect(step!.say.join(' ')).toMatch(/stubborn|не хочет/)
  })
})
