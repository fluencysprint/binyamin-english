/* ==========================================================================
   Tutor guidance — the English source.
   --------------------------------------------------------------------------
   Everything the tutor reads AS AN INSTRUCTION lives here, keyed by what it
   guides rather than written into the lesson-building code. The four other
   locales carry the same keys, which is what lets the same lesson be taught
   in five languages without being generated five times.

   What is NOT here: the English the learner is meant to hear. Example
   sentences, minimal pairs, model lines, practice items and conversation
   prompts stay in the content banks and in guidance.ts, in English, in every
   locale — translating them would delete the lesson.
   ========================================================================== */

import { Dict } from '../../i18n/dict'

const guide: Dict = {
  /* ---- Activity and phase names --------------------------------------- */
  title: {
    patternFocus: 'Fixing: “{{better}}”',
    plain: '{{title}}',
    focus: 'Focus: {{title}}',
    again: 'Again: {{title}}',
    pronMoment: 'Pronunciation moment',
    usefulWords: 'Useful words',
    recurringReview: 'Recurring language review',
    langPronReview: 'Language & pronunciation review',
    extendedTask: 'Extended communication task',
    deepConversation: 'Deep conversation',
    precisionCorrections: 'Precision corrections',
    consolidation: 'Consolidation',
    vocabPronConsolidation: 'Vocabulary & pronunciation consolidation',
    successRecap: 'Success recap',
    recapOneWin: 'Recap & one win',
    phrase: {
      recall: 'Come back to it',
      meet: 'New: {{phrases}}',
      use: 'Swap the words: {{phrases}}',
      exchange: 'Put it together',
      realUse: 'Real use',
      close: 'What you can say now',
    },
  },

  /* ---- Why this lesson teaches what it teaches ------------------------ */
  objective: {
    pattern:
      'Said “{{example}}” in {{lessons}} separate lessons. No concept in the grammar library teaches it, so it is taught as a habit: contrast, drill, use.',
    recurringGrammar: 'Recurring grammar issue — seen {{times}} times (e.g. “{{example}}”).',
    noticedOnce: 'Grammar issue noticed once so far (e.g. “{{example}}”).',
    pronunciation: 'Pronunciation of “{{title}}” is affecting clarity — worth focused practice.',
    spacedReview: 'Spaced review: “{{title}}” is due to be revisited so it becomes secure.',
    naturalNext: 'A natural next focus for a learner around {{level}}.',
    pronStaple: 'Clear pronunciation is always worth practice.',
    firstLesson: 'A level-appropriate focus while the tutor gets to know the learner’s real speaking.',
    c1: {
      title: 'Advanced communication coaching',
      rationale:
        'At strong C1, lessons shift to sustained, nuanced communication with precision feedback.',
    },
    c1First:
      'At this level, lessons are sustained, nuanced communication with precision feedback — not remedial grammar.',
    beginner: {
      P0: {
        title: 'First spoken English: hello, your name, yes / no',
        rationale:
          'Starting from the foundations — useful spoken English, listening, and pronunciation before any reading.',
      },
      P1: {
        title: 'First words and everyday chunks',
        rationale:
          'Building a small store of high-frequency words and phrases with lots of listening and repetition.',
      },
      P2: {
        title: 'Emerging communication and early literacy',
        rationale:
          'Following simple instructions, short exchanges, and recognizing first sounds and letters.',
      },
      P3: {
        title: 'Getting ready for A1: simple sentences and first reading',
        rationale: 'Using simple sentences with support and beginning to read very familiar words.',
      },
    },
  },

  /* ---- Defaults for anything a content bank leaves out ----------------- */
  /* The ten phrase-curriculum units, and what each one buys the learner. */
  unit: {
    1: {
      title: 'Meeting people',
      can: 'By the end: they can greet someone, say thank you and say goodbye without help.',
    },
    2: {
      title: 'When you don’t understand',
      can: 'By the end: they can stop a conversation and ask for help instead of nodding through it.',
    },
    3: {
      title: 'Introducing yourself',
      can: 'By the end: they can give their name, where they are from, and ask the same back.',
    },
    4: {
      title: 'Talking about yourself',
      can: 'By the end: they can say what they like, what they have and what they do.',
    },
    5: {
      title: 'Asking for what you need',
      can: 'By the end: they can ask for something politely, and turn something down politely.',
    },
    6: {
      title: 'Asking questions',
      can: 'By the end: they can ask what, where, who, how much and what time.',
    },
    7: {
      title: 'Everyday actions',
      can: 'By the end: they can say what they are doing, what they can do and what they cannot.',
    },
    8: {
      title: 'Keeping a conversation going',
      can: 'By the end: they can react, agree, disagree and hand the question back.',
    },
    9: {
      title: 'Out in the world',
      can: 'By the end: they can buy something, ask the way and say something is wrong.',
    },
    10: {
      title: 'Making plans',
      can: 'By the end: they can suggest a time, accept a plan and turn one down kindly.',
    },
  },

  defaults: {
    help: 'Model it once yourself, then hand it straight back to them.',
    challenge: 'Ask for one more, about something personal to them.',
    studentDoes: {
      warmup: 'Talks freely about something easy — no accuracy pressure.',
      speakingListening: 'Answers your questions out loud, in whole sentences where they can.',
      listening: 'Listens and responds by pointing, choosing or doing — speech is not required.',
      reading: 'Reads aloud or silently, then tells you what it meant.',
      writing: 'Writes on paper while you stay quiet.',
      microLesson: 'Watches and listens, then tries the new language once.',
      guidedPractice: 'Produces the target language with your prompting, several times.',
      communication: 'Does most of the talking. You are the audience, not the star.',
      fluency: 'Speaks without stopping for a fixed time, then says the same thing again in less time.',
      pronunciation: 'Listens, watches your mouth, and repeats out loud.',
      vocabulary: 'Says the new word in a sentence of their own.',
      feedback: 'Listens, then repeats the improved version once.',
    },
    doneWhen: {
      warmup: 'They have said a few sentences and look settled.',
      speakingListening: 'They have answered three or four questions without stalling.',
      listening: 'They respond correctly to what they hear, two or three times running.',
      reading: 'They can tell you the main idea in their own words.',
      writing: 'They have written something they can read back to you.',
      microLesson: 'They have produced the target language once, correctly, with help.',
      guidedPractice: 'They produce it three times with only light prompting.',
      communication: 'They have spoken for a real stretch and the topic is genuinely finished.',
      fluency: 'The final round is noticeably smoother than the first.',
      pronunciation: 'The target is noticeably clearer than at the start of the step.',
      vocabulary: 'They use the word in a new sentence, unprompted.',
      feedback: 'They have heard one specific win and one specific next focus.',
    },
  },

  /* ---- The deeper tutor card ------------------------------------------ */
  card: {
    pattern: {
      goal: 'Replace one habit: they should reach for “{{better}}” without thinking about it.',
      explain:
        'Do not teach a rule. They said “{{said}}” — say both versions, let them pick the English one, then have them produce “{{better}}” until it comes out on its own.',
      avoid: [
        'Do not explain the grammar unless they ask. This is a habit, not a gap in knowledge.',
        'Do not correct every occurrence in the conversation block — note it and come back at the end.',
      ],
    },
    grammar: {
      goal: 'Teach: {{title}}. {{explanation}}',
      stepBack: 'Step back to: {{title}}.',
      struggleDefault: 'Give a sentence frame and model it slowly.',
      extend: 'Extend toward: {{title}}.',
      succeedDefault: 'Ask them to use it in a personal sentence.',
      avoid: 'Long grammar lectures — notice, model, then let them use it.',
    },
    pron: {
      goal: 'Pronunciation: {{title}}. {{why}}',
      struggle: 'Slow down, exaggerate the target, use a mirror, then blend back to normal speed.',
      succeed: 'Move from single words to a full sentence, then free conversation.',
      contrast: 'Contrast: {{a}} / {{b}}',
      avoid: 'Claiming a “score” — use your ear and qualitative ratings.',
    },
    warmup: {
      '6-8': {
        goal: 'Settle in, hear the child speak, keep it playful.',
        listenFor: ['clear single words', 'willingness to try', 'confidence'],
        ifStruggle: 'Point, name it together, and let them copy you.',
        ifSucceed: 'Ask one simple follow-up question.',
        howToExplain: 'Model a short sentence they can copy.',
        avoid: ['Long instructions — keep it short and warm.'],
      },
      '9-12': {
        goal: 'Ease in and sample everyday speaking.',
        listenFor: ['sentence length', 'time words', 'verb forms'],
        ifStruggle: 'Give a sentence frame to start them off.',
        ifSucceed: 'Ask “Why?” once to extend the answer.',
        howToExplain: 'Offer the natural phrasing, then let them re-say it.',
        avoid: ['Correcting everything — just listen and note.'],
      },
      '13-17': {
        goal: 'Build rapport around real interests; sample fluency.',
        listenFor: ['vocabulary range', 'natural phrasing', 'confidence'],
        ifStruggle: 'Offer choices instead of an open question.',
        ifSucceed: 'Ask “What do you like about it?” to extend.',
        howToExplain: 'Add a reason with “because”.',
        avoid: ['Sounding like a teacher quizzing them.'],
      },
      adult: {
        goal: 'Relaxed opener; sample natural connected speech.',
        listenFor: ['tense control', 'fluency', 'filler words'],
        ifStruggle: 'Ask a concrete either/or question.',
        ifSucceed: 'Follow up for detail and opinion.',
        howToExplain: 'Link ideas with “and”, “but”, “so”.',
        avoid: ['Jumping straight into correction.'],
      },
    },
    speaking: {
      goal: 'Adaptive speaking/listening. Probe present, past, future, description, opinion.',
      listenFor: ['tense control', 'question forms', 'range', 'pronunciation to note for later'],
      ifStruggle: 'Simplify questions to yes/no; give sentence frames.',
      ifSucceed: 'Push for reasons, detail, and a hypothetical (“What would you…?”).',
      howToExplain: 'Keep grammar terms hidden — just model the correct form.',
      avoid: ['Talking more than the student.'],
    },
    feedback: {
      goal: 'Give specific, supportive feedback and set the next focus.',
      listenFor: [],
      ifStruggle: 'Keep it to one clear priority; end on a genuine strength.',
      ifSucceed: 'Name exactly what improved: “Your past tense was accurate today.”',
      howToExplain: 'Be specific and truthful, never generic praise.',
      avoid: ['Vague praise like “good job” with no detail.'],
    },
    fluency: {
      goal: 'Fluency, not accuracy. The same content, told repeatedly against a shrinking clock, until delivery gets smooth. Do not teach anything new here.',
      listenFor: [
        'Long pauses in the middle of sentences — are there fewer each round?',
        'Restarts and self-repair — do they drop away by the last round?',
        'Does round two say MORE than round one, in less time?',
      ],
      ifStruggle: 'Give them the same clock again instead of a shorter one. Repetition is the medicine, not the pressure.',
      ifSucceed: 'Add a constraint on the last round: no “and then”, or one new detail they have not said yet.',
      howToExplain: 'Tell them plainly: same story each time, less time each time. It should feel easier, not harder.',
      avoid: [
        'Correcting anything mid-round. Interrupting a fluency round destroys the exercise.',
        'A new topic between rounds — the whole benefit comes from repeating the same one.',
      ],
      shape: 'Round 1 — take your time. Round 2 — same story, a bit faster. The last round — smooth, no stopping.',
      rounds2: 'Two rounds — the second one faster and one detail longer.',
      rounds3: 'Three rounds — same content, tighter each time.',
    },
    c1Review: {
      goal: 'Consolidate recurring language and pronunciation points.',
      listenFor: ['Any slips from recent lessons.'],
      ifStruggle: 'Re-model once and move on — keep it light.',
      ifSucceed: 'Note it as improving; raise the challenge.',
      howToExplain: 'Offer the more natural version and let them re-say it.',
      avoid: ['Turning review into a long lecture.'],
    },
    c1Communication: {
      goal: 'Sustained, nuanced communication. The learner drives; you shape.',
      listenFor: ['precision', 'natural collocation', 'register', 'intonation for emphasis'],
      ifStruggle: 'Offer a scaffold or a sharper angle, then step back.',
      ifSucceed: 'Add a constraint (time limit, banned word, opposite view).',
      howToExplain: 'Note precise upgrades: “‘significant’ fits better than ‘big’ here.”',
      avoid: ['Reverting to textbook drills at this level.'],
    },
    beginnerRecap: {
      goal: 'Consolidate today’s items and end on a real success.',
      listenFor: ['Recall of the day’s words and chunks'],
      ifStruggle: 'Recap just two items with pictures.',
      ifSucceed: 'Ask them to teach one word back to you.',
      howToExplain: 'Keep it warm, short, and specific.',
      avoid: ['Vague praise — name the actual win.'],
    },
    phrase: {
      avoid: [
        'Explaining grammar. The phrase is one piece until the learner is well past this stage.',
        'Correcting during the real-use minute — it is the one part of the lesson where fluency outranks accuracy.',
        'Marking “said it alone” for something you said first. That one habit would make every claim on the learner’s screen untrue.',
      ],
      recall: {
        goal: 'Find out what survived the week, before you add anything to it.',
        howToExplain: '“Let’s see what you still have. I will give you the meaning; you give me the English.”',
      },
      meet: {
        goal: 'First contact: they understand the phrase and hear it said properly.',
        howToExplain: 'Show the moment it is used in. The phrase is one piece — never explain its parts.',
      },
      use: {
        goal: 'Turn a sentence into a frame they can fill with their own words.',
        howToExplain: '“The start stays the same. Only the end changes.” Show it, do not name it.',
      },
      exchange: {
        goal: 'Make today’s phrases work as a conversation, not as a list.',
        howToExplain: '“I say this, you say that.” Then swap, so they hold both halves.',
      },
      realUse: {
        goal: 'See which phrases they reach for when nobody tells them to.',
        howToExplain: 'Explain nothing here. Ask a real question and let the silence do the teaching.',
      },
      close: {
        goal: 'Leave them with one true thing they can now say, and record what you saw.',
        howToExplain: '“Last week you had none of this. Today you said these.” Say the phrases back to them.',
      },
    },
  },

  /* ---- The at-a-glance autopilot -------------------------------------- */
  auto: {
    grammar: {
      do: 'Model it once, then have them try it in a sentence of their own.',
      nextHarder: 'Got it right → tap Harder ({{title}})',
      nextHarderDefault: 'Got it right → have them use it in a sentence about themselves',
      nextClose: 'Close but shaky → model it once more, then try again',
      nextEasier: 'Still stuck → tap Easier ({{title}})',
      nextEasierDefault: 'Still stuck → give a sentence frame and move on',
    },
    pron: {
      do: 'Say it slowly and exaggerated, then at normal speed — have them copy both.',
      lookForPair: 'Can they hear the difference: “{{a}}” vs. “{{b}}”?',
      next: [
        'Clear → move to a full sentence, then free conversation',
        'Close → repeat the word two or three more times',
        'Not there yet → note it, move on, revisit next lesson',
      ],
    },
    warmup: {
      followUps: 'If the answer is short: “{{a}}” or “{{b}}”',
      '6-8': {
        do: ['Smile, keep eye contact, point at things as you ask.'],
        lookFor: ['Any attempt to answer in English, even one word.'],
        next: [
          'Answers freely → move to the lesson',
          'Needs help → point or mime the answer with them',
          'Silent → give the answer yourself, move on warmly',
        ],
        teacherTip: 'This is about connection, not correctness — keep it light.',
      },
      '9-12': {
        do: ['Listen fully before responding; nod along.'],
        lookFor: ['Sentence length', 'willingness to add a second sentence unprompted'],
        next: [
          'Talks freely → move to the lesson',
          'One-word answers → ask one easy follow-up',
          'Stuck → give a sentence starter and move on',
        ],
      },
      '13-17': {
        do: ['Treat it like a real conversation, not a quiz.'],
        lookFor: ['Vocabulary range', 'confidence', 'natural phrasing vs. translation'],
        next: [
          'Engaged and talking → move to the lesson',
          'Short answers → offer a choice (“A or B?”)',
          'Reluctant → drop it, move on, try again next time',
        ],
      },
      adult: {
        do: ['Listen for a genuine thread to follow up on.'],
        lookFor: ['Tense control', 'fluency', 'a detail worth asking more about'],
        next: [
          'Talking easily → move to the lesson',
          'Brief → ask one specific follow-up',
          'Tired or rushed → keep it short, move on',
        ],
      },
    },
    speaking: {
      do: ['Ask one question, then wait — resist filling the pause.'],
      lookFor: ['tense control', 'question forms', 'a sound worth noting for later'],
      next: [
        'Answering easily → push for a reason or a hypothetical (“What would you…?”)',
        'Struggling → simplify to yes/no, or give a sentence frame',
        'Silent → model the answer yourself, then hand it back to them',
      ],
    },
    reading: {
      nonreader: {
        do: ['Point to the letter, say the sound, point to the picture.'],
        lookFor: ['Do they match sound to picture, even with help?'],
        next: [
          'Matches confidently → try a second letter',
          'Needs help → do it together once more',
          'Lost → switch to listening only, revisit reading later',
        ],
      },
      beginner: {
        do: ['Point under each word as they read; supply a stuck word after two or three seconds.'],
        lookFor: ['Sounding out vs. memorized recognition', 'do they self-correct?'],
        next: [
          'Reads smoothly → ask the comprehension question',
          'Slow but accurate → let them finish, praise the effort',
          'Guessing → read it aloud together, then have them repeat',
        ],
      },
      intermediate: {
        do: ['Let them read silently first; resist correcting pronunciation mid-read.'],
        lookFor: ['Do they get the gist, not just individual words?'],
        next: [
          'Clear main idea → ask one detail question',
          'Vague → ask “What happens first?”',
          'Missed it → reread one sentence together, try again',
        ],
      },
      advanced: {
        do: ['Let them reread the key sentence if they want to.'],
        lookFor: ['Inference, not just literal comprehension', 'can they point to the clue?'],
        next: [
          'Gets the implication → ask what clue gave it away',
          'Close → point to the key phrase, ask again',
          'Missed it → explain the inference, move on',
        ],
      },
    },
    writing: {
      early: {
        do: ['Write the frame for them if needed; let them fill the blank.'],
        lookFor: ['Letter formation', 'do they know what the word says after writing it?'],
        next: [
          'Writes it → have them read it back',
          'Needs a model → write it once together, then they copy',
        ],
      },
      beginner: {
        do: ['Give them quiet time; don’t hover over every letter.'],
        lookFor: ['Basic sentence structure', 'spelling of high-frequency words'],
        next: [
          'Three clear sentences → pick one to say aloud',
          'One or two → that’s fine, praise what’s there',
          'Stuck → give a sentence starter',
        ],
      },
      intermediate: {
        do: ['Remind them of one linking word (and / but / so) if they stall.'],
        lookFor: ['Linking words used correctly', 'a clear, connected idea'],
        next: [
          'Well linked → ask them to add one more reason',
          'Choppy → point out where “and” or “so” would connect two ideas',
        ],
      },
      advanced: {
        do: ['Let them plan silently for a minute before writing.'],
        lookFor: ['A clear stance', 'an actual counterpoint, not just more support'],
        next: [
          'Clear position and a real counterpoint → note it as strong',
          'Position but no counterpoint → ask “What would someone who disagrees say?”',
        ],
      },
    },
    communication: {
      now: 'Real conversation — they talk, you listen and keep it going.',
      interest: 'If it fits, steer this toward {{interest}} — they care about it.',
      do: [
        'Ask the question, then stay quiet — let the silence be theirs to fill, not yours.',
        'Ready follow-ups for this topic: “{{follow1}}” · “{{follow2}}” · “{{follow3}}”',
      ],
      studentDoes: ['Does most of the talking — several sentences at a time, not one-word answers.'],
      lookFor: ['Are they elaborating, or giving one-word answers?', 'Do they run out of things to say?'],
      help: ['Offer your own short answer as a model, then hand it straight back with “{{follow4}}”'],
      challenge: ['Push for depth: “{{generic}}”'],
      doneWhen: 'They have spoken in real stretches and the topic is genuinely finished.',
      next: [
        'Talking easily → keep it going: “{{follow1}}”',
        'Slowing down → “{{follow2}}”',
        'Stuck → “{{follow3}}”, or offer your own short answer as a model',
      ],
    },
    fluency: {
      clock: 'You have {{seconds}} seconds. Start when you are ready.',
      now: 'Fluency sprint — the same story, told again with less time each round.',
      do: [
        'Time it out loud or on your phone. Say nothing at all while they speak.',
        'Between rounds, give ONE piece of praise and no corrections.',
      ],
      studentDoes: ['Talks without stopping for the whole round, then does it again, shorter.'],
      lookFor: [
        'Fewer long pauses each round.',
        'Fewer restarts — “I went… no, I was going…” should fade.',
        'More content in less time by the final round.',
      ],
      help: ['Repeat the same clock instead of shortening it, or let them make notes before round one.'],
      challenge: ['Final round in {{last}} seconds with no filler words.'],
      doneWhen: 'The last round ({{last}}s) is noticeably smoother than the first.',
      next: [
        'Smoother each round → say exactly what improved, then move on',
        'Same as round one → run one more round at the SAME clock, not shorter',
        'Ran out of things to say → shorten the clock, keep the topic',
      ],
      teacherTip: 'Say nothing while they speak. Your silence is the exercise.',
    },
    vocabulary: {
      do: ['Write it down together, right when it comes up — don’t wait until the end.'],
      lookFor: ['Can they use it again, unprompted, in a different sentence?'],
      next: [
        'Used correctly → tap Add word to save it',
        'Shaky → say it together once more, save it anyway',
        'Nothing comes to mind → offer one from the conversation yourself',
      ],
    },
    feedback: {
      do: ['Pick exactly ONE thing that went well and ONE thing to focus on next — not a list.'],
      lookFor: ['Do they seem to actually recognize the specific example you gave?'],
      next: ['Ends the lesson — no branching. Say it, then move to wrap-up.'],
    },
    c1Review: {
      do: ['Offer the more natural version once, then have them re-say it in a fresh sentence.'],
      lookFor: ['Any slips carried over from recent lessons.'],
      next: [
        'Fixed easily → move on, note it as improving',
        'Still shaky → one more model, then let it go for today',
        'Nothing recurring right now → skip straight to the conversation',
      ],
    },
    c1Communication: {
      do: ['Interject only to elevate — a sharper word, a harder angle, a constraint.'],
      lookFor: [
        'Precision and register (this is a “{{category}}” task) — not just correctness.',
        'Do they reach for the easy word or the precise one?',
      ],
      next: [
        'Fluent and precise → raise it: “{{follow1}}”',
        'Good but generic → push for nuance: “{{follow2}}”',
        'Flagging → “{{follow3}}”, or add a constraint (banned word, time limit, opposite view)',
      ],
    },
    c1Feedback: {
      do: ['Give two or three precise upgrades, not a long list — quality over quantity at this level.'],
      lookFor: ['Do they immediately see why the alternative is better?'],
      next: ['Ends the lesson — no branching. Deliver it, then move to consolidation.'],
    },
    c1Consolidation: {
      do: ['Pick two or three precise words or phrasings from the conversation, plus one pronunciation point.'],
      lookFor: ['Can they reproduce the precise version unprompted?'],
      next: [
        'Reproduces it → note it as learned',
        'Needs the model again → say it once more, save it anyway',
      ],
    },
    beginnerRecap: {
      child: {
        do: ['Celebrate warmly. Recap two or three words with pictures.', 'If a parent is present, share one specific win.'],
        lookFor: ['Can they recall two or three items from today?', 'Do they leave feeling successful?'],
        next: [
          'Recalled easily → next lesson can advance a stage',
          'Recalled with help → repeat similar content',
          'Little recall → keep this content, go slower',
        ],
        teacherTip: 'End every beginner lesson on a genuine success. Confidence is the curriculum.',
      },
      adult: {
        do: ['Name one concrete success.', 'Note one thing to practice next time.'],
        lookFor: ['Can they recall two or three items from today?', 'Do they leave feeling successful?'],
        next: [
          'Recalled easily → next lesson can advance a stage',
          'Recalled with help → repeat similar content',
          'Little recall → keep this content, go slower',
        ],
        teacherTip: 'End every beginner lesson on a genuine success. Confidence is the curriculum.',
      },
    },
  },

  /* ---- Micro-steps: the teaching sequence itself ----------------------- */
  step: {
    pattern: {
      notice: {
        now: 'Two versions of the same sentence. Let them find which one is English.',
        say: 'Listen: “{{said}}” … “{{better}}”. Which one sounds right to you?',
        do: [
          'Say both at the same speed and the same volume. Do not lean on the right one.',
          'Then wait. Let them choose before you say anything else.',
        ],
        studentDoes: ['Listens to both, picks one, and says it out loud.'],
        lookFor: 'Can they hear any difference at all? That decides how long this takes.',
        help: ['Say the correct version twice on its own, then ask again.'],
        challenge: ['Ask them what actually changed between the two.'],
        doneWhen: 'They can pick the English version and say it once.',
        next: 'Drill it — they say the right version, then use it in a sentence of their own.',
      },
    },
    grammar: {
      meaning: {
        now: 'Show what “{{title}}” MEANS — no rule, no terminology yet.',
        studentDoes: ['Watches and listens. Nothing to produce yet.'],
        lookFor: ['A flicker of recognition — a nod, a repeat, an answer in their own language.'],
        help: ['Make the situation more concrete: a real object, a drawing, a gesture.'],
        challenge: ['Ask them to give you a second example of the same situation from their own life.'],
        doneWhen: 'They show they understand the situation, in any language.',
        next: 'Model the language twice.',
      },
      model: {
        now: 'Model the language — say it, don’t explain it.',
        do: [
          'Say each example twice: once at normal speed, once slowly.',
          'Do not ask them to repeat yet — just let them hear it.',
        ],
        studentDoes: ['Listens. Repeats only if they want to.'],
        lookFor: ['Are they listening, or already trying to produce it? Either is fine.'],
        help: ['Cut to one example and say it four times.'],
        challenge: ['Add a fourth example that is closer to their real life.'],
        doneWhen: 'They have heard the pattern at least three times.',
        next: 'Ask the noticing question.',
      },
      notice: {
        now: 'Let THEM find the pattern. Do not tell them.',
        do: [
          'Ask the question, then stay quiet. Count to five in your head.',
          'If terminology helps, keep it to one plain sentence.',
        ],
        studentDoes: ['Thinks, then says what they noticed — in any language.'],
        lookFor: ['Can they point at what changed, even without naming it?'],
        help: 'Say two examples side by side and ask what is different. Or just tell them: {{explanation}}',
        challenge: ['Ask them to predict a fourth example before you say it.'],
        doneWhen: 'They can point to what changes, however they phrase it.',
        next: 'Move to guided practice.',
      },
      guided: {
        now: 'Guided practice — they produce it, you prompt.',
        do: ['Give one prompt at a time.', 'Wait. Prompt only if they stall for more than about five seconds.'],
        studentDoes: ['Says each answer out loud, in a full sentence.'],
        lookFor: ['Accuracy on the target — ignore everything else for now.'],
        doneWhen: 'They get three right in a row with only light prompting.',
        next: 'Move to real use — a question they actually want to answer.',
      },
      realUse: {
        now: 'Real use — the same language, but about their actual life.',
        do: ['Ask, then listen. Do not correct mid-sentence.', 'Note anything worth fixing for the feedback step.'],
        studentDoes: ['Talks about something real, using the new language when it fits.'],
        lookFor: ['Does the target appear on its own, without a prompt?', 'Are they thinking about content, not form?'],
        help: ['Give a sentence starter, then let them finish it.'],
        challenge: 'Ask for a reason, then a hypothetical.',
        challengeHarder: 'Push toward {{title}}.',
        doneWhen: 'They have used the target at least once while genuinely communicating.',
        next: 'Give one piece of specific feedback.',
      },
      feedback: {
        now: 'One correction. Not a list.',
        do: 'Pick the ONE error that mattered most. Ignore the rest today.',
        studentDoes: ['Says the improved version once, correctly.'],
        lookFor: ['Do they say it back accurately?', 'Do they look encouraged rather than deflated?'],
        help: 'Let it go for today and note it.',
        helpEasier: 'Step back to {{title}} next lesson rather than pushing now.',
        challenge: ['Ask them to use the corrected form in a fresh sentence immediately.'],
        doneWhen: 'They have produced the improved version once, out loud.',
        next: 'Score how it went and move to the next activity.',
      },
    },
    pron: {
      meaning: {
        now: 'Show why {{title}} is worth two minutes.',
        forThisLearner: 'For this learner specifically: {{note}}',
        studentDoes: ['Listens for the difference. Says nothing yet.'],
        lookFor: ['Can they hear that the two are different at all?'],
        help: ['Exaggerate both until the difference is unmissable, then shrink it back.'],
        challenge: ['Say one of the pair at random and have them tell you which it was.'],
        doneWhen: 'They can tell the two apart by ear, three times running.',
        next: 'Show them how the sound is made.',
      },
      model: {
        now: 'Model the sound with your mouth visible.',
        do: 'Face them. Exaggerate once, then say it normally.',
        studentDoes: ['Watches your mouth, then copies out loud.'],
        lookFor: ['Mouth position first, sound second.', 'Are they willing to look silly? That helps.'],
        help: ['Use a mirror so they can see their own mouth next to the target.'],
        challenge: ['Move straight to the word inside a phrase.'],
        doneWhen: 'They produce the sound recognisably in isolation.',
        next: 'Contrast it against the sound they currently substitute.',
      },
      guided: {
        now: 'Contrast and repeat — pairs, then words, then a sentence.',
        do: ['Alternate the pair, then let them lead.', 'Move to the full sentence only once the word is stable.'],
        studentDoes: ['Says the pairs, then the words, then one full sentence.'],
        help: ['Back to single words. A clear word beats a muddy sentence.'],
        doneWhen: 'The target is clear inside a whole sentence, not just alone.',
        next: 'Record the improved version as evidence.',
      },
      record: {
        now: 'Capture evidence — their own before and after.',
        do: 'Play the baseline and the new one back to back. Let them hear it, and say what YOU hear.',
        studentDoes: ['Records a sample, then listens to both.'],
        lookFor: ['Do THEY hear the difference? That matters more than whether you do.'],
        help: ['Skip recording if it makes them self-conscious. Just say what improved.'],
        challenge: ['Record a natural-speed sentence rather than a careful one.'],
        doneWhen: 'They have heard their own before and after.',
        next: 'Rate it with your ear and move on.',
      },
      realUse: {
        now: 'Use it in real conversation, where it actually counts.',
        do: ['Let them talk. Note the target silently — do not interrupt to fix a sound.'],
        studentDoes: ['Has a real conversation, with the target sound appearing naturally.'],
        lookFor: ['Does the sound survive at conversational speed?', 'Intelligibility over perfection.'],
        help: ['Shorten to a single sentence they can control.'],
        challenge: ['Speed it up, or add a distracting topic so they cannot focus on the sound.'],
        doneWhen: 'They have spoken freely for a stretch with the target mostly intact.',
        next: 'Rate the target and move on.',
      },
    },
    fluency: {
      round: {
        now: 'Round {{round}} of {{count}} — {{seconds}} seconds, same topic.',
        timer: 'Start a {{seconds}}-second timer where they can see it.',
        silence: 'Say nothing at all while they speak. Not even “mm-hm”.',
        noteGood: 'Note one specific thing that was good — you will say it between rounds.',
        betweenRounds: 'Between rounds: one line of praise, zero corrections.',
        studentDoes: 'Speaks continuously for {{seconds}} seconds on the same topic.',
        lookForFirst: [
          'How much content is there? That is the baseline for the next round.',
          'Where do the long pauses fall?',
        ],
        lookForLater: ['Fewer long pauses than last round?', 'Fewer restarts and self-corrections?'],
        lookForMiddle: 'Any new detail that was not there before?',
        lookForFinal: 'Does the delivery finally sound easy?',
        helpFirst: 'Let them jot three words on paper first. Notes are fine; reading a script aloud is not.',
        helpLater: 'Run the SAME clock again instead of a shorter one. Repetition is the medicine, not the pressure.',
        challenge: 'Ask for one extra reason or example inside the same time.',
        challengeFinal: 'Ban a word they lean on (“and then”, “like”, “very”), then run it once more.',
        doneWhen: 'They have spoken for the whole {{seconds}} seconds without you filling a pause.',
        next: 'Run the next round — {{next}} seconds, same topic.',
        nextFinal: 'Tell them exactly what got better, then move on.',
      },
      recap: {
        now: 'Name what actually improved. This is the payoff of the whole exercise.',
        do: [
          'Be specific: fewer pauses, faster start, a longer sentence, less translating.',
          'Do NOT correct grammar here. Accuracy work belongs in another part of the lesson.',
        ],
        studentDoes: ['Hears one concrete thing that got better.'],
        lookFor: ['Do they recognise the improvement themselves? That is what makes them do it again at home.'],
        help: ['If nothing improved, say so kindly and keep the same topic for next lesson.'],
        challenge: ['Ask them which round felt easiest, and why.'],
        doneWhen: 'They have heard one specific, true thing that got better.',
        next: 'Move into the free conversation.',
      },
    },
    generic: {
      scoreAndMoveOn: 'Score how it went, then move on.',
      handOver: 'Hand it to them to try.',
      turn: {
        now: 'Their turn — they say it, you only prompt.',
        do: [
          'Say it once more, then stay silent and wait. Count to five before helping.',
          'Praise the attempt before correcting anything about it.',
        ],
        studentDoes: ['Says the target out loud, several times, with less help each time.'],
        lookFor: ['Are they producing it themselves, or still echoing you word for word?'],
        doneWhen: 'They produce it once without you saying it first.',
      },
      deeper: {
        now: 'Go deeper on the same topic — do not change subject yet.',
        do: ['Follow the thread they are most interested in.', 'Say noticeably less than they do.'],
        studentDoes: ['Elaborates, gives reasons and examples, asks you something back.'],
        lookFor: ['Longer turns than at the start.', 'Are they reaching for new words, or staying safe?'],
        help: ['Offer your own short answer as a model, then hand it straight back.'],
        challenge: ['Add a constraint: a time limit, a banned word, or the opposite view.'],
        doneWhen: 'The conversation has genuinely run its course — not when the clock says so.',
        next: 'Capture one useful word or phrase from what they said.',
      },
    },
    fix: {
      now: 'Fix drill — the slips this learner keeps making, said the right way.',
      cue: 'You said “{{said}}”. The English is “{{better}}”. Say it with me.',
      do: [
        'One pair at a time. They say the RIGHT version out loud, twice.',
        'Then ask for a sentence of their own with it — the fix has to leave the drill.',
        'Do not explain the rule unless they ask. This is about the habit, not the theory.',
      ],
      studentDoes: ['Says the correct version out loud, then uses it in a sentence of their own.'],
      lookFor: [
        'Do they self-correct before you say anything? That is the win.',
        'Does it survive the sentence of their own, or only the repetition?',
      ],
      help: ['Say the correct version and have them echo it. Echoing today is producing next week.'],
      challenge: ['Ask for the same form three times inside one longer answer.'],
      doneWhen: 'Each one has been said correctly at least once, in their own sentence.',
      next: 'Note anything they fixed without help — it belongs in the report.',
    },
    retrieval: {
      now: 'Quick recall of things from earlier lessons that are due.',
      cueMeaning: 'What’s the English for: {{meaning}}?',
      cueTerm: 'Use “{{term}}” in a sentence.',
      do: [
        'Ask them to produce each one from memory. Do not show them the word first.',
        'If it takes more than a few seconds, give it to them and move on.',
      ],
      studentDoes: ['Recalls each item and uses it in a sentence of their own.'],
      lookForRecall: 'Recall WITHOUT a prompt is the evidence that matters.',
      lookForErrors: 'Watch for: {{errors}}',
      lookForSlips: 'Any old slips creeping back.',
      help: ['Give the first sound, then the whole word. Recognition is still progress.'],
      challenge: ['Ask for two items in the same sentence.'],
      doneWhen: 'Each item has been recalled or re-taught once.',
      next: 'Move into the main focus of the lesson.',
    },
    phrase: {
      recall: {
        retrieval: {
          now: 'Ask for the phrases they already met — before you teach anything new.',
          do: [
            'Give the meaning in their language, or point at the card on their screen.',
            'Then wait. Count to five in your head before you help.',
            'Only after they try, say the English.',
          ],
          studentDoes: [
            'Tries to produce each phrase from the meaning alone.',
          ],
          lookFor: [
            'Which ones arrive on their own, and which need you to start them.',
            'A slow right answer is still shaky — note it as such.',
          ],
          help: [
            'Say the first word only, then stop.',
            'If it still does not come, say the whole phrase and have them repeat it — that is “said it with help”.',
          ],
          challenge: [
            'Ask them to use one of them in a sentence about today.',
          ],
          doneWhen: 'Every phrase on the card has been asked for once.',
          next: 'Mark what you saw, then start the new set.',
        },
      },
      meet: {
        meaning: {
          now: 'Make the meaning obvious before you say the English.',
          do: [
            'Build the situation first — a gesture, an object, a moment they recognise.',
            'Say the phrase inside that situation, not as a word to learn.',
            'Do not translate unless they are lost, and do not explain grammar at all.',
          ],
          studentDoes: [
            'Watches you. Nothing to produce yet.',
          ],
          lookFor: [
            'A nod, a smile, an answer in their own language — any sign the meaning landed.',
          ],
          help: [
            'Make it more concrete: a real object, a drawing, act it out bigger.',
            'One word in their language is fine. Then go straight back to the English.',
          ],
          challenge: [
            'Ask where they would use it — a shop, a phone call, at work.',
          ],
          doneWhen: 'They show they understand what it is for, in any language.',
          next: 'Say it twice, and let them just listen.',
        },
        model: {
          now: 'Say it. Do not explain it.',
          do: [
            'Say each phrase twice: once at normal speed, once slowly.',
            'If it has an answer, say both halves so they hear the whole exchange.',
            'Do not ask them to repeat yet.',
          ],
          studentDoes: [
            'Listens. Repeats only if it comes out by itself.',
          ],
          lookFor: [
            'Are they listening, or already trying to say it? Either is fine.',
          ],
          help: [
            'Drop to one phrase and say it four times.',
          ],
          challenge: [
            'Say it once at real conversational speed and ask if they still caught it.',
          ],
          doneWhen: 'They have heard each phrase at least twice.',
          next: 'Hand it over — now they say it.',
        },
        guided: {
          now: 'Their turn. The whole phrase, not word by word.',
          do: [
            'Say it, then open your hand toward them and wait.',
            'Keep the phrase as one piece. Do not break it into words.',
            'Three tries each is plenty — more turns it into a drill.',
          ],
          studentDoes: [
            'Says each phrase out loud, copying the rhythm.',
          ],
          lookFor: [
            'Is it one flowing piece, or separate words?',
            'Can you understand it? That is the bar here, not perfection.',
          ],
          help: [
            'Say the last two words, then the whole thing. Let them join in with you.',
          ],
          challenge: [
            'Say it back to them faster and see if they can match it.',
          ],
          doneWhen: 'Each phrase has come out of their mouth at least once.',
          next: 'Now change the words inside it.',
        },
      },
      use: {
        guided: {
          now: 'Same phrase, different words in the gap.',
          do: [
            'Say one version, then offer a new word and let them build the next.',
            'Keep the frame identical. Only the gap changes.',
            'Use words about THEIR life — their job, their family, their street.',
          ],
          studentDoes: [
            'Makes new sentences from the same frame.',
          ],
          lookFor: [
            'Do they keep the frame steady while the word changes?',
            'That is the whole point: they are learning a machine, not a sentence.',
          ],
          help: [
            'Go back to one fixed version and repeat it twice before swapping again.',
          ],
          challenge: [
            'Ask for a word you did not offer — something from their own life.',
          ],
          doneWhen: 'They have made at least three different sentences from one frame.',
          next: 'Now ask for it cold, with nothing on the screen.',
        },
        retrieval: {
          now: 'Ask for it with nothing shown. This is the part that counts.',
          do: [
            'Give the meaning only — in their language, or by acting it out.',
            'Say nothing in English first. If you say it, they are copying, not remembering.',
            'Wait. The silence is the work.',
          ],
          studentDoes: [
            'Produces the phrase from meaning alone.',
          ],
          lookFor: [
            'Did it come without you starting it? That is the only thing that counts as “said it alone”.',
          ],
          help: [
            'Give the first sound, not the first word.',
            'If it still does not come, say it and have them repeat — that is “said it with help”, and it is honest.',
          ],
          challenge: [
            'Ask for it inside a question instead of on its own.',
          ],
          doneWhen: 'Every phrase in this set has been asked for once, cold.',
          next: 'Mark each one, then keep going.',
        },
      },
      exchange: {
        guided: {
          now: 'Two lines, back and forth. You start.',
          do: [
            'You say the first line, they answer. Then swap roles.',
            'Run it three or four times so the answer stops needing thought.',
            'Keep your own line exactly the same each time.',
          ],
          studentDoes: [
            'Takes both sides of a short exchange.',
          ],
          lookFor: [
            'Does the answer come without a pause?',
            'Are they still with you when you swap roles?',
          ],
          help: [
            'Take the harder side yourself and let them keep the easy one.',
          ],
          challenge: [
            'Change one word in your line without warning and see if they adjust.',
          ],
          doneWhen: 'They can take either side of the exchange without help.',
          next: 'Drop the script and just talk.',
        },
      },
      realUse: {
        realUse: {
          now: 'Just talk. Nothing scripted, nothing on the screen.',
          do: [
            'Ask a real question and mean it.',
            'Let them reach. If they get stuck, wait longer than feels comfortable.',
            'Correct nothing here unless you genuinely did not understand.',
          ],
          studentDoes: [
            'Talks with you, reaching for whatever English they have.',
          ],
          lookFor: [
            'Which phrases they reach for on their own — the strongest evidence in the lesson.',
            'Where the conversation dies. That is the next lesson.',
          ],
          help: [
            'Ask something easier and closer to them, then come back.',
          ],
          challenge: [
            'Give a short answer of your own and wait for them to ask you something.',
          ],
          doneWhen: 'They have used at least one of today’s phrases without being asked to.',
          next: 'Close the lesson and mark what you saw.',
        },
      },
      close: {
        recap: {
          now: 'Say back what they managed today, then mark it honestly.',
          do: [
            'Read out the phrases they used and let them say a favourite once more.',
            'Name one specific thing that got better. Not “good job”.',
            'Then go down the list and mark what you actually saw.',
          ],
          studentDoes: [
            'Hears what they achieved, and says one phrase one last time.',
          ],
          lookFor: [
            'Which ones they still light up at, and which they have gone quiet about.',
          ],
          help: [
            'If the list feels long, name the three that went best and stop there.',
          ],
          challenge: [
            'Ask which one they will use before the next lesson, and where.',
          ],
          doneWhen: 'Every phrase has a mark, and the learner has heard one real thing they did well.',
          next: 'Finish the lesson — the homework builds itself from these marks.',
        },
      },
    },
  },
}

export default guide
