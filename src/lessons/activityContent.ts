/* ==========================================================================
   Reusable, parameterized activity content by age band.
   --------------------------------------------------------------------------
   Every entry carries a stable id so generation can avoid repeating what a
   student saw recently (see selection.ts). Banks are deliberately deep: a
   weekly learner should go months without meeting the same prompt twice, and
   an adult practising conversation should never run out of things to say.
   ========================================================================== */

import { AgeBand } from '../types'
import { pickIndex } from './selection'

export interface WarmupPrompt {
  id: string
  prompt: string
}

export interface ConversationTask {
  id: string
  /** Loose theme, used to keep a lesson's topics from clumping. */
  category: string
  prompt: string
}

/* -------------------------------------------------------------------------- */
/* Warm-ups                                                                   */
/* -------------------------------------------------------------------------- */

function warmupBank(band: AgeBand, prompts: string[]): WarmupPrompt[] {
  /* The prompt is all a warm-up needs to store. The tutor guidance that goes
     with it is built per band, in the tutor's language, in guidance.ts — one
     copy of it, not one per prompt. */
  return prompts.map((prompt, i) => ({
    id: `w-${band}-${String(i + 1).padStart(2, '0')}`,
    prompt,
  }))
}

export const warmups: Record<AgeBand, WarmupPrompt[]> = {
  '6-8': warmupBank('6-8', [
    'Say hello! Let’s name three things you can see that are your favorite color.',
    'Show me something you like. Tell me what it is!',
    'Let’s count together — how many fingers am I holding up?',
    'What did you eat today? Tell me one food.',
    'Point to something big, then something small.',
    'What animal do you like? Can you make its sound?',
    'Tell me one thing you did with your family.',
    'What toy or game do you play with the most?',
    'Show me happy. Now show me sleepy. Now tell me how you feel today.',
    'Look around — find something soft and tell me what it is.',
    'Show me your favorite book or drawing. Tell me one thing about it.',
    'What sound does a cow make? What about a duck?',
    'Let’s clap: clap once, clap twice, clap three times!',
    'Tell me the name of someone in your family.',
    'What’s your favorite song? Can you sing one word of it?',
    'Point to something round, then something square.',
  ]),
  '9-12': warmupBank('9-12', [
    'Quick warm-up: tell me three things you did today.',
    'What was the best part of your week so far?',
    'Tell me about something you learned recently.',
    'If you could have any pet, what would you pick and why?',
    'What do you usually do after school?',
    'Tell me about a game or app you like. How does it work?',
    'What’s your favorite meal? Who makes it?',
    'Describe your room to me — what’s in it?',
    'What’s something you’re good at? How did you get good at it?',
    'Tell me about a place you’ve visited.',
    'What made you laugh this week?',
    'If you had a free day tomorrow, what would you do?',
    'What’s a rule at your house? Do you think it’s fair?',
    'Tell me about a time you helped someone.',
    'What’s something new you tried this month?',
    'If you could visit any place in a story or movie, where would you go?',
    'What chores do you do at home?',
    'Tell me about your best friend — what do you like doing together?',
  ]),
  '13-17': warmupBank('13-17', [
    'Warm-up: what’s something you’re into right now — a show, a game, music? Tell me about it.',
    'How has your week been? Give me the highlights.',
    'What’s something you’ve watched or listened to lately that you’d recommend?',
    'If you could change one thing about school, what would it be?',
    'What are you looking forward to this month?',
    'Tell me about something you’re learning outside of class.',
    'What do you and your friends usually talk about?',
    'What’s a skill you wish you had? Why that one?',
    'Describe your ideal weekend.',
    'What’s an opinion you have that people around you disagree with?',
    'Tell me about a time something didn’t go as planned.',
    'What app or website do you use most? Why that one?',
    'What’s a goal you’re working toward right now?',
    'Tell me about a class or subject you actually enjoy.',
    'What’s something you changed your mind about recently?',
    'If you had an extra hour every day, what would you do with it?',
    'What’s a rule you think should be different?',
    'Tell me about someone you look up to and why.',
  ]),
  adult: warmupBank('adult', [
    'Warm-up: how has your week been? Tell me a little about it.',
    'What’s been taking up most of your time lately?',
    'Tell me about something good that happened recently, big or small.',
    'What did you do last weekend?',
    'Is there something you’re looking forward to?',
    'What’s a small thing that made your day easier this week?',
    'Tell me about your morning routine.',
    'What have you been reading, watching, or listening to?',
    'What’s something you’d like more time for?',
    'Describe where you live to someone who’s never been there.',
    'What’s changed for you in the last year?',
    'Tell me about a decision you’re thinking about right now.',
    'What’s something you’re proud of from this month?',
    'Tell me about a habit you’re trying to build or break.',
    'What’s the most interesting thing you read or heard recently?',
    'Describe your ideal Saturday.',
    'What’s something you’ve gotten better at over the years?',
    'Tell me about a small win from this week.',
  ]),
}

/* -------------------------------------------------------------------------- */
/* Conversation tasks                                                         */
/* -------------------------------------------------------------------------- */

function taskBank(band: AgeBand, rows: [string, string][]): ConversationTask[] {
  return rows.map(([category, prompt], i) => ({
    id: `ct-${band}-${String(i + 1).padStart(2, '0')}`,
    category,
    prompt,
  }))
}

export const communicationTasks: Record<AgeBand, ConversationTask[]> = {
  '6-8': taskBank('6-8', [
    ['describe', 'Play “I see something…”. Describe an object; the tutor guesses.'],
    ['storytelling', 'Act out an animal and say a sentence about it.'],
    ['describe', 'Describe your favorite toy so I can draw it.'],
    ['everyday', 'Let’s pretend to shop. You ask for three things.'],
    ['storytelling', 'Tell me a story about a picture we make up together.'],
    ['everyday', 'Teach me how to do something you know how to do.'],
    ['describe', 'Look out the window and tell me everything you see.'],
    ['social', 'Pretend I’m a new friend. Ask me three questions.'],
    ['everyday', 'Tell me what you do before bed, step by step.'],
    ['describe', 'Pick a color. Name five things that are that color.'],
    ['describe', 'Show me a toy and tell me its color and shape.'],
    ['everyday', 'Pretend it’s morning. Show me what you do to get ready.'],
    ['storytelling', 'Make up a short story about a friendly monster.'],
    ['social', 'Pretend you meet a new friend at the park. Say hello and ask their name.'],
    ['everyday', 'Pretend we’re cooking. Tell me what we put in first, next, and last.'],
    ['describe', 'Look at your hand. Count your fingers out loud in English.'],
  ]),
  '9-12': taskBank('9-12', [
    ['planning', 'Plan an imaginary day out together — where, what, why.'],
    ['describe', 'Describe your favorite character and why you like them.'],
    ['opinions', 'What’s the best game or show right now? Convince me.'],
    ['storytelling', 'Tell me about the funniest thing that happened to you.'],
    ['hypotheticals', 'If you could be any age for a week, which age and why?'],
    ['explaining', 'Teach me the rules of a game you like.'],
    ['planning', 'You have $100 for a class party. Plan it and explain your choices.'],
    ['opinions', 'Should kids have homework? Give me three reasons.'],
    ['describe', 'Describe your perfect school day from start to finish.'],
    ['hypotheticals', 'If you could invent one thing to make life easier, what is it?'],
    ['storytelling', 'Tell me about a time you were really proud of yourself.'],
    ['social', 'A new student joins your class. What do you say and do?'],
    ['explaining', 'Explain how to get from your home to somewhere you go often.'],
    ['opinions', 'What’s something adults get wrong about kids your age?'],
    ['planning', 'Plan a trip anywhere in the world. Where, who with, and why?'],
    ['planning', 'Plan a birthday party for a friend — food, games, and guests.'],
    ['opinions', 'Which is better, summer or winter vacation? Give two reasons.'],
    ['hypotheticals', 'If your pet could talk for one day, what would it say?'],
    ['explaining', 'Explain how to make your favorite snack, step by step.'],
    ['storytelling', 'Tell me about a time you were scared, and what happened.'],
  ]),
  '13-17': taskBank('13-17', [
    ['opinions', 'Convince me to watch your favorite show — give three reasons.'],
    ['planning', 'Describe your ideal weekend and explain your choices.'],
    ['hypotheticals', 'If you could instantly master one skill, what would it be and why?'],
    ['opinions', 'Should social media have an age limit? Argue your position.'],
    ['storytelling', 'Tell me about a time you changed your mind about something.'],
    ['future', 'What do you imagine your life looks like in ten years?'],
    ['explaining', 'Explain something you’re good at to someone who knows nothing about it.'],
    ['opinions', 'What’s overrated right now? What’s underrated?'],
    ['social', 'How do you handle a disagreement with a friend?'],
    ['hypotheticals', 'You’re in charge of your school for a day. What changes?'],
    ['describe', 'Describe a place that matters to you and why.'],
    ['future', 'What job sounds interesting to you? What would be hard about it?'],
    ['opinions', 'Is it better to be early or spontaneous? Defend your side.'],
    ['storytelling', 'Tell me about something you worked hard for.'],
    ['explaining', 'Explain a trend to someone ten years older who doesn’t get it.'],
    ['social', 'How would you welcome someone who just moved to your city?'],
    ['opinions', 'Should students choose their own subjects? Argue your side.'],
    ['future', 'What does a typical day in your future job look like?'],
    ['hypotheticals', 'If you switched lives with a classmate for a week, what would surprise you?'],
    ['social', 'How do you decide who to trust with something private?'],
    ['explaining', 'Explain a hobby of yours well enough that I’d want to try it.'],
    ['storytelling', 'Tell me about a time you had to make a tough decision.'],
    ['opinions', 'Is it better to have a few close friends or many casual ones? Why?'],
    ['future', 'What’s one skill from school you think you’ll actually use later?'],
  ]),
  adult: taskBank('adult', [
    ['roleplay', 'Role-play: you’re recommending a restaurant to a colleague.'],
    ['explaining', 'Explain a decision you made recently and your reasons.'],
    ['storytelling', 'Describe a challenge at work or in daily life and how you handled it.'],
    ['work', 'Walk me through what you actually do on a typical workday.'],
    ['opinions', 'What’s something most people believe that you disagree with?'],
    ['hypotheticals', 'If you could restart one part of your life, which and why?'],
    ['roleplay', 'Role-play: you need to reschedule an important meeting. Call me.'],
    ['travel', 'Tell me about the best trip you’ve taken. What made it good?'],
    ['work', 'Describe a person you’ve learned a lot from.'],
    ['opinions', 'Is remote work better or worse? Argue the side you don’t hold.'],
    ['future', 'What would you like to be different about your life in five years?'],
    ['explaining', 'Explain your job to a ten-year-old, then to an expert.'],
    ['storytelling', 'Tell me about a time you were completely wrong about something.'],
    ['everyday', 'Describe how you make a decision when you’re torn between options.'],
    ['roleplay', 'Role-play: something you bought arrived broken. Sort it out with me.'],
    ['social', 'How do you keep in touch with people you care about?'],
    ['opinions', 'What advice do you think is genuinely bad?'],
    ['travel', 'Someone is visiting your city for two days. Plan it and justify it.'],
    ['work', 'Describe a project that didn’t work out. What would you change?'],
    ['hypotheticals', 'You get a year off, fully paid. What do you actually do?'],
    ['everyday', 'What’s something you’ve changed your habits about, and why?'],
    ['future', 'What skill are you most interested in building next?'],
    ['work', 'Describe your ideal workday, start to finish.'],
    ['roleplay', 'Role-play: you’re asking your manager for a schedule change.'],
    ['opinions', 'What’s a piece of conventional wisdom you think is wrong?'],
    ['everyday', 'Walk me through how you plan your week.'],
    ['travel', 'Describe a trip that didn’t go as planned. What did you do?'],
    ['future', 'If you changed careers tomorrow, what would you choose?'],
    ['social', 'Tell me about a friendship that’s lasted a long time. What keeps it going?'],
    ['hypotheticals', 'If you had to teach a class on something, what would it be?'],
  ]),
}

/** C1 communication-coaching tasks — extended, nuanced, fluency-focused. */
export const c1Tasks: ConversationTask[] = [
  ['precision', 'Explain a difficult idea from your field simply, then again in 30 seconds with no jargon.'],
  ['argument', 'Defend a viewpoint you disagree with as convincingly as you can.'],
  ['constraint', 'Tell a story from your week, but you may not use the word “good” or “nice”.'],
  ['precision', 'Paraphrase this idea three different ways, each with a different tone.'],
  ['argument', 'Summarize a news story you read, then give your honest opinion with nuance.'],
  ['roleplay', 'Role-play a tricky professional conversation (declining a request politely but firmly).'],
  ['argument', 'Take a position you hold strongly and steel-man the opposite view.'],
  ['precision', 'Describe a process in your work precisely enough that I could do it.'],
  ['constraint', 'Explain something complex using only short sentences.'],
  ['roleplay', 'Role-play giving difficult feedback to someone who reports to you.'],
  ['abstract', 'What does “success” mean to you, and how has that definition shifted?'],
  ['argument', 'Argue that a widely praised thing is actually overrated.'],
  ['precision', 'Retell a recent conversation, capturing how each person actually sounded.'],
  ['constraint', 'Speak for two minutes on a topic I choose, with no preparation.'],
  ['roleplay', 'Role-play negotiating a deadline you think is unreasonable.'],
  ['abstract', 'Is it possible to be truly objective? Work through it out loud.'],
  ['precision', 'Describe a subtle difference between two similar words in your field.'],
  ['argument', 'Convince me to change my mind about something small but real.'],
  ['abstract', 'What do you think people misunderstand about your culture?'],
  ['roleplay', 'Role-play explaining a mistake to a client without losing their trust.'],
  ['constraint', 'Tell the same story twice: once formally, once casually.'],
  ['abstract', 'How much should someone’s work define who they are?'],
  ['precision', 'Give instructions for something physical without using your hands.'],
  ['argument', 'Pick a policy you care about and argue it to a skeptical audience.'],
  ['precision', 'Explain the difference between two things people often confuse.'],
  ['argument', 'Make the strongest possible case for a decision you actually regret.'],
  ['constraint', 'Describe your week without using any form of the verb “to be”.'],
  ['roleplay', 'Role-play talking a colleague out of a bad idea, tactfully.'],
  ['abstract', 'Is it better to be respected or liked? Defend your answer.'],
  ['precision', 'Summarize a book or film in exactly two sentences, then in one.'],
  ['argument', 'Argue against something you actually believe, as persuasively as you can.'],
  ['constraint', 'Describe a place using only sound and smell, no visual words.'],
  ['roleplay', 'Role-play apologizing for a mistake without over-explaining.'],
  ['abstract', 'What’s the difference between confidence and arrogance, exactly?'],
].map(([category, prompt], i) => ({
  id: `c1-${String(i + 1).padStart(2, '0')}`,
  category,
  prompt,
}))

/* -------------------------------------------------------------------------- */
/* Reading & writing                                                          */
/* -------------------------------------------------------------------------- */

export const readingByLevel = {
  nonreader: 'Match the letter to its sound, then find the picture that starts with it.',
  beginner: 'Read these short sentences aloud, then answer one question about each.',
  intermediate: 'Read this short paragraph, then tell me the main idea in your own words.',
  advanced: 'Read this passage and infer what the writer implies but does not say directly.',
}

/** The actual text referenced by readingByLevel's instructions — shown on the
 *  reading activity card so there is always something to read. */
export const readingPassages: Partial<Record<keyof typeof readingByLevel, string>> = {
  beginner: 'The cat is on the mat. The dog runs fast. I like my red ball.',
  intermediate:
    'Every morning, Maria walks her dog in the park near her house. She likes the fresh air and the quiet streets before the city wakes up. On weekends, she goes a little farther and brings a coffee to drink on a bench.',
  advanced:
    'The meeting ended earlier than planned, and no one seemed to mind. Sarah gathered her notes slowly, glancing at the door a few times before finally standing up. “We can pick this up tomorrow,” she said — though her tone suggested tomorrow wouldn’t be enough either.',
}

export const writingByLevel = {
  early: 'Copy and complete: “I like ___.” Draw or write your answer.',
  beginner: 'Write three sentences about your day.',
  intermediate: 'Write a short paragraph about your plans, using linking words.',
  advanced: 'Write a concise opinion (4–5 sentences) with a clear position and one counterpoint.',
}

/* -------------------------------------------------------------------------- */
/* Personalization                                                            */
/* -------------------------------------------------------------------------- */

/**
 * A tutor-facing hint for steering a task toward something the learner
 * actually cares about, rotating through ALL of their interests rather than
 * always leaning on the first one. Returns null when we know nothing about them.
 *
 * This used to be appended to the student's own prompt, which meant the learner
 * (and their parents, on the printed report) read "Describe your ideal day
 * (try connecting it to travel if it fits)" — a stage direction for the tutor,
 * printed as if it were part of the task.
 */
export function pickInterest(interests: string[], seed = 0): string | null {
  if (interests.length === 0) return null
  return interests[pickIndex(seed, interests.length)]
}

/** The same hint as a finished English sentence — used where a caller needs
 *  text rather than the interest to interpolate into a localized line. */
export function personalizeHint(interests: string[], seed = 0): string | null {
  const pick = pickInterest(interests, seed)
  if (!pick) return null
  return `If it fits, steer this toward ${pick} — they care about it.`
}

/* -------------------------------------------------------------------------- */
/* Open-ended follow-up questions                                             */
/* -------------------------------------------------------------------------- */

/**
 * Reusable prompts for keeping a learner talking once the main task runs dry.
 * These are the tutor's "what do I say next?" safety net — deliberately
 * content-free so they work on top of any topic at all.
 */
export const followUpMoves: string[] = [
  'What made you feel that way?',
  'Can you give me an example?',
  'What would you do differently next time?',
  'How would someone who disagrees answer that?',
  'What’s the hardest part about that?',
  'How did that compare to what you expected?',
  'What happened right before that?',
  'Why do you think that is?',
  'What would have to change for that to work?',
  'Who else does that affect, and how?',
  'How would you explain that to a child?',
  'What’s the best case, and the worst case?',
  'Has that always been true for you?',
  'What would you tell a friend in that situation?',
  'What part of that surprised you most?',
]

/** Rotate a window of `count` follow-up moves, keyed off the same seed the
 *  lesson already uses — different lessons surface different ready-to-use
 *  prompts for when a conversation runs dry, without needing to track these
 *  content-free lines through recentContentIds (a student would never
 *  notice "What made you feel that way?" repeating the way a task would). */
export function followUpSample(seed: number, count = 3): string[] {
  const n = followUpMoves.length
  const start = pickIndex(seed, n)
  return Array.from({ length: Math.min(count, n) }, (_, i) => followUpMoves[(start + i) % n])
}

/* -------------------------------------------------------------------------- */
/* Contextual follow-ups                                                      */
/* -------------------------------------------------------------------------- */

/**
 * How deep a follow-up question can go for this learner. A seven-year-old and
 * a C1 adult both need "keep talking" prompts, but "What would have to change
 * for that to work?" is unusable for one and insulting to the other.
 */
export type FollowUpDepth = 'simple' | 'standard' | 'advanced'

export function followUpDepthFor(band: AgeBand, levelIndex: number): FollowUpDepth {
  // levelIndex is the CEFR ordinal (preA1=0 … C1=5) — passed in rather than
  // imported so this module stays free of the CEFR machinery.
  if (band === '6-8' || levelIndex <= 1) return 'simple'
  if (levelIndex >= 4 && band !== '9-12') return 'advanced'
  return 'standard'
}

type FollowUpSet = Record<FollowUpDepth, string[]>

/**
 * Follow-up questions written FOR THE TOPIC, not for conversation in general.
 * A generic "Why do you think that is?" fits an opinion task and lands
 * strangely on "Describe your favorite toy so I can draw it."
 *
 * Every conversation task in the bank carries a `category`, so the tutor's
 * "what do I say next?" line can be about the thing actually being discussed.
 */
const followUpsByCategory: Record<string, FollowUpSet> = {
  describe: {
    simple: ['What color is it?', 'Is it big or small?', 'Do you like it? Why?'],
    standard: ['What does it look like exactly?', 'What is it made of?', 'Where do you keep it?', 'How is it different from a normal one?'],
    advanced: ['If I had never seen one, how would you describe it?', 'What detail would most people miss?', 'What does it remind you of, and why?'],
  },
  storytelling: {
    simple: ['What happened next?', 'Who was there?', 'Was it fun?'],
    standard: ['What happened next?', 'How did you feel then?', 'What did the other person say?', 'How did it end?'],
    advanced: ['What was the turning point?', 'How would the other person tell this story?', 'What do you make of it now, looking back?'],
  },
  everyday: {
    simple: ['And then what?', 'Every day?', 'Who does it with you?'],
    standard: ['What do you do first, and what comes after?', 'How long does that take?', 'What happens if you are late?', 'Would you change any part of it?'],
    advanced: ['Which part of that is habit and which is a real choice?', 'How has that routine changed over the years?', 'What would you cut if you had half the time?'],
  },
  social: {
    simple: ['What do you say?', 'Are they nice?', 'What do you do together?'],
    standard: ['What would you say first?', 'How would you know they were comfortable?', 'What if they said no?', 'Has that happened to you?'],
    advanced: ['Where is the line between polite and dishonest there?', 'How would you handle it if it went badly?', 'What does that say about how you deal with people?'],
  },
  planning: {
    simple: ['What do we need?', 'Who comes with us?', 'What do we do first?'],
    standard: ['Why that one and not another?', 'What is your budget for it?', 'What could go wrong?', 'What is the first thing you would organise?'],
    advanced: ['What would you cut if you lost half the budget?', 'What is the biggest risk in that plan?', 'How would you know afterwards that it worked?'],
  },
  opinions: {
    simple: ['Why?', 'Do you like it?', 'What about the other one?'],
    standard: ['Why do you think that?', 'Can you give me an example?', 'What would someone who disagrees say?', 'Has that always been your view?'],
    advanced: ['What is the strongest argument against you?', 'What evidence would change your mind?', 'Is that a principle, or is it about this case only?'],
  },
  hypotheticals: {
    simple: ['What would you do?', 'Would that be fun?', 'Who would you take?'],
    standard: ['What would be the first thing you did?', 'What would be hard about it?', 'Would you tell anyone?', 'Would you do it again?'],
    advanced: ['What would you have to give up for that?', 'How would you feel about it a year later?', 'What does choosing that say about what you value?'],
  },
  explaining: {
    simple: ['What comes first?', 'Then what?', 'Can you show me?'],
    standard: ['What is the very first step?', 'What do people usually get wrong?', 'How would you explain it to a child?', 'What do you need before you start?'],
    advanced: ['Explain it again in half the words.', 'What is the part experts argue about?', 'What analogy would make it click for a beginner?'],
  },
  future: {
    simple: ['What do you want to be?', 'Is that soon?', 'Who will help you?'],
    standard: ['What is the first step toward that?', 'What would make it difficult?', 'When do you think it will happen?', 'What would you need to learn?'],
    advanced: ['What are you actually doing about it now?', 'What would make you abandon that plan?', 'How is that different from what you wanted five years ago?'],
  },
  roleplay: {
    simple: ['What do you say now?', 'Say it again, politely.', 'What if I say no?'],
    standard: ['Now I say no — what do you say?', 'How would you say that more politely?', 'What if I am in a hurry?', 'Try it once more, more directly.'],
    advanced: ['Say the same thing, but to your boss.', 'Now I am annoyed — handle it.', 'Do it again in half the words, without sounding rude.'],
  },
  work: {
    simple: ['What is your job?', 'Is it hard?', 'Do you like it?'],
    standard: ['What does a normal day look like?', 'What part do you enjoy most?', 'What would you change about it?', 'Who do you work with most closely?'],
    advanced: ['What does good work look like in your field, exactly?', 'What would you do differently with the same resources?', 'What do outsiders misunderstand about it?'],
  },
  travel: {
    simple: ['Where did you go?', 'Who went with you?', 'Was it good?'],
    standard: ['What did you do there?', 'What surprised you?', 'Would you go back? Why?', 'What would you tell someone going for the first time?'],
    advanced: ['What did that place change about how you see things?', 'What was the least touristy part of it?', 'How would you describe it without using the word "beautiful"?'],
  },
  precision: {
    simple: ['Say it again, shorter.', 'One more time, clearly.', 'Which word is best?'],
    standard: ['Can you say that in one sentence?', 'Is there a more exact word?', 'Say it again without the filler words.', 'What is the key point?'],
    advanced: ['Say the same thing in half the words.', 'Which word there is doing the least work?', 'Now say it so a specialist would nod.'],
  },
  argument: {
    simple: ['Why?', 'Give me one reason.', 'Do you agree?'],
    standard: ['What is your strongest reason?', 'What would the other side say?', 'Can you give an example?', 'Is there a case where you would change your mind?'],
    advanced: ['Steel-man the opposite view for me.', 'Where is your own argument weakest?', 'What would count as evidence against you?'],
  },
  constraint: {
    simple: ['Again, but shorter.', 'Try without that word.', 'One more time.'],
    standard: ['Now say it without that word.', 'Say the same thing in three sentences.', 'Try again, more formally.', 'Now do it in ten seconds.'],
    advanced: ['Do it again with no adjectives.', 'Same idea, opposite register.', 'Now the version you would say on the radio.'],
  },
  abstract: {
    simple: ['What do you think?', 'Is that good or bad?', 'Why?'],
    standard: ['What makes you say that?', 'Where did that idea come from for you?', 'Is it always true?', 'Can you give me a real example?'],
    advanced: ['Where does that definition break down?', 'Who benefits from believing that?', 'Has your answer to that changed with age?'],
  },
}

/** When a task's category has no dedicated set — still adapted to depth. */
const followUpsDefault: FollowUpSet = {
  simple: ['Tell me more.', 'Why?', 'What else?'],
  standard: ['Can you give me an example?', 'Why do you think that is?', 'What happened next?', 'How did you feel about it?'],
  advanced: ['What would you do differently?', 'How would someone who disagrees answer that?', 'What is the part you are least sure about?'],
}

/**
 * Follow-ups for a specific conversation task. `seed` rotates the window so two
 * lessons on the same category do not open with the same line, while the
 * questions stay about the topic actually on the table.
 */
export function followUpsFor(
  category: string,
  depth: FollowUpDepth,
  seed = 0,
  count = 3,
): string[] {
  const set = followUpsByCategory[category] ?? followUpsDefault
  const pool = set[depth].length ? set[depth] : followUpsDefault[depth]
  const start = pickIndex(seed, pool.length)
  return Array.from({ length: Math.min(count, pool.length) }, (_, i) => pool[(start + i) % pool.length])
}

/** Warm-up follow-ups — short, warm, and about the person, by age band. */
export const warmupFollowUps: Record<AgeBand, string[]> = {
  '6-8': ['Tell me one more thing!', 'What color is it?', 'Do you like it?', 'Who was with you?'],
  '9-12': ['Tell me more about that.', 'Why that one?', 'What was the best part?', 'What happened after?'],
  '13-17': ['What made that stand out?', 'Would you do it again?', 'What did you think of it?', 'How come?'],
  adult: ['How did that go?', 'What made you pick that?', 'Was that a good week or a hard one?', 'Tell me more about that part.'],
}
