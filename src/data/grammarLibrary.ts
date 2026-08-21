/* ==========================================================================
   Grammar teaching library — A1 through C1.
   --------------------------------------------------------------------------
   Written for a tutor who speaks English natively and has never taught. Every
   entry carries the whole teaching sequence, so nothing has to be invented at
   the table:

     meaningFirst → correctExamples → noticePrompt → controlledPractice
       → retrievalCue → conversationPractice → correctionScript

   plus `fallback` (they can't do it), `extension` (too easy) and, where a word
   like "auxiliary" would otherwise be assumed knowledge, a `jargonBuster` that
   explains it in one plain line.

   Selection favours grammar that actually shows up in learner speech. There is
   no filler here to pad a count: each concept is one a real A1–C1 learner
   trips over in conversation, in roughly the order they meet it.
   ========================================================================== */

import { GrammarConcept } from '../types/content'
import { editSignature, signaturesOverlap } from '../utils/editSignature'

export const grammarLibrary: GrammarConcept[] = [
  /* ======================================================================== */
  /* A1 — the first sentences a learner can actually use                      */
  /* ======================================================================== */
  {
    id: 'g_present_be',
    title: 'The verb “to be” (am / is / are)',
    cefr: 'A1',
    tutorExplanation:
      'Present forms of “be”: I am, you/we/they are, he/she/it is. It links a subject to a description or identity. It is the single most common verb in English.',
    studentExplanation: 'Use am / is / are to say what something is or how it feels.',
    meaningFirst:
      'Point at yourself: “I am Binyamin.” Point at them: “You are ___.” Point at an object: “It is a cup.” Meaning comes from the pointing, not from an explanation.',
    correctExamples: ['I am tired.', 'She is a teacher.', 'They are at home.'],
    noticePrompt: 'I said “I am”, “she is”, “they are”. What changed each time — the person, or the little word?',
    commonErrors: [
      { wrong: 'She are happy.', right: 'She is happy.' },
      { wrong: 'I is a student.', right: 'I am a student.' },
      { wrong: 'He teacher.', right: 'He is a teacher.' },
    ],
    correctionMethod: 'Point to the subject, then choose the matching form. Have them say it again correctly.',
    correctionScript: [
      '“She… IS happy.” Say it with me.',
      'Almost — with “she” we use “is”. Try again: “She is happy.”',
    ],
    controlledPractice: ['I ___ (be) hungry.', 'He ___ (be) my friend.', 'We ___ (be) ready.'],
    conversationPractice: ['Tell me three things about your best friend using “is”.'],
    retrievalCue: 'Before we start — tell me two things about yourself using “I am”.',
    fallback: 'Drop to “I am ___” only. One form, said about themselves, ten times, is real progress.',
    extension: 'Add the negative (“I’m not…”) and the question (“Are you…?”), then let them interview you.',
    jargonBuster: [
      { term: 'subject', plain: 'the person or thing doing it — the word before the verb.' },
    ],
    harderVariant: 'g_present_simple',
    prerequisites: [],
    tags: ['be', 'am is are', 'copula'],
  },
  {
    id: 'g_pronouns_possessives',
    title: 'People words (I / my, you / your, he / his…)',
    cefr: 'A1',
    tutorExplanation:
      'Subject pronouns (I, you, he, she, it, we, they) and the matching possessives (my, your, his, her, its, our, their). Learners whose first language marks gender differently mix up his/her constantly.',
    studentExplanation: 'Use “I / you / he / she” for the person, and “my / your / his / her” for what belongs to them.',
    meaningFirst:
      'Hold up your own pen: “my pen”. Hand it to them: “your pen”. Point to a third person or a photo: “his pen” / “her pen”. Nothing is explained; the objects do the work.',
    correctExamples: ['This is my book.', 'She loves her job.', 'They brought their kids.'],
    noticePrompt: 'When I talked about the woman, I said “her”. About the man? Listen again — what changes?',
    commonErrors: [
      { wrong: 'He is my sister.', right: 'She is my sister.' },
      { wrong: 'She lost his phone. (about her own)', right: 'She lost her phone.' },
      { wrong: 'The book of me.', right: 'My book.' },
    ],
    correctionMethod:
      'Ask “Who does it belong to — a man or a woman?” then supply the right word and have them re-say the whole sentence.',
    correctionScript: [
      'Your sister — so, “SHE is my sister.” Try it.',
      'Whose phone? Hers. So: “She lost HER phone.”',
    ],
    controlledPractice: ['___ (I) name is Ana.', 'That is ___ (he) car.', '___ (they) house is big.'],
    conversationPractice: ['Describe three people in your family and what each of them owns or does.'],
    retrievalCue: 'Point at three things in the room and tell me whose they are.',
    fallback: 'Use only “my” and “your” with real objects passed back and forth.',
    extension: 'Add “mine / yours / hers” (“That book is mine”) and object pronouns (“I saw him”).',
    easierVariant: 'g_present_be',
    harderVariant: 'g_have_got',
    prerequisites: ['g_present_be'],
    tags: ['pronouns', 'possessive', 'his her', 'my your'],
  },
  {
    id: 'g_plurals',
    title: 'One and more than one (plurals)',
    cefr: 'A1',
    tutorExplanation:
      'Regular plurals add -s (/s/, /z/ or /ɪz/ depending on the sound before). A short list is irregular: man→men, woman→women, child→children, foot→feet, person→people. Some languages have no plural -s at all, so it is simply forgotten.',
    studentExplanation: 'For more than one thing, add “s” to the word.',
    meaningFirst:
      'Put one pen on the table: “a pen”. Add two more: “three pens”. Do it with three different objects before saying anything about the letter s.',
    correctExamples: ['I have two brothers.', 'There are children outside.', 'She bought three books.'],
    noticePrompt: 'Listen: “one pen… three pens.” What tiny sound did I add at the end?',
    commonErrors: [
      { wrong: 'I have two brother.', right: 'I have two brothers.' },
      { wrong: 'Three childs.', right: 'Three children.' },
      { wrong: 'Many informations.', right: 'A lot of information.' },
    ],
    correctionMethod:
      'Hold up the number of fingers, then say the word with the -s clearly. Let them repeat the whole phrase, not just the word.',
    correctionScript: [
      'Two… brotherSSS. Say the whole thing: “I have two brothers.”',
      'That one is a surprise word: one child, two CHILDREN.',
    ],
    controlledPractice: ['I see three ___ (cat).', 'She has two ___ (child).', 'We need five ___ (box).'],
    conversationPractice: ['Look around and tell me everything you can see, saying how many there are.'],
    retrievalCue: 'Quick round: I say one, you say more than one. Book… chair… child… person.',
    fallback: 'Count real objects together, 1 to 3, and let them just copy your phrase.',
    extension: 'Contrast the three plural sounds (cats /s/, dogs /z/, boxes /ɪz/) — a pronunciation win too.',
    easierVariant: 'g_present_be',
    harderVariant: 'g_there_is_are',
    prerequisites: ['g_present_be'],
    tags: ['plural', 's ending', 'irregular plural', 'countable'],
  },
  {
    id: 'g_have_got',
    title: 'Saying what you have',
    cefr: 'A1',
    tutorExplanation:
      '“I have a car” (American, neutral) and “I have got a car” (more British/spoken). Teach “have/has” — third person is “has”. Questions and negatives use do/does in American English: “Do you have…?”, “I don’t have…”.',
    studentExplanation: 'Use “have” to say what belongs to you. He, she and it use “has”.',
    meaningFirst:
      'Hold up your phone: “I have a phone.” Point at theirs: “You have a phone.” Point at an empty hand: “I don’t have a pen.”',
    correctExamples: ['I have two sisters.', 'She has a new job.', 'Do you have a minute?'],
    noticePrompt: 'I said “I have” but “she ___”. What was different?',
    commonErrors: [
      { wrong: 'She have a car.', right: 'She has a car.' },
      { wrong: 'I have not a pen.', right: 'I don’t have a pen.' },
      { wrong: 'Do you have got time?', right: 'Do you have time?' },
    ],
    correctionMethod: 'He/she/it → “has”. For a negative or a question, bring in do/does and go back to “have”.',
    correctionScript: [
      'She… HAS a car. One more time, the whole sentence.',
      'For a question we start with “Do”: “Do you have a pen?”',
    ],
    controlledPractice: ['He ___ (have) a dog.', 'They ___ (have) three kids.', '___ you ___ (have) my number?'],
    conversationPractice: ['Tell me what you have in your bag or on your desk right now.'],
    retrievalCue: 'Name three things you have at home that you use every day.',
    fallback: 'Only “I have ___” with objects you can both see and touch.',
    extension: 'Move into “How many … do you have?” and short answers (“Yes, I do.”).',
    easierVariant: 'g_present_be',
    harderVariant: 'g_present_simple',
    prerequisites: ['g_present_be'],
    tags: ['have', 'has', 'possession', 'have got'],
  },
  {
    id: 'g_there_is_are',
    title: 'There is / There are',
    cefr: 'A1',
    tutorExplanation:
      'Used to say something exists or is present: “There is a problem”, “There are two chairs”. Singular → is, plural → are. Many languages express this with a verb like “have”, which is where “Here have a chair” comes from.',
    studentExplanation: 'Use “There is” for one thing and “There are” for more than one.',
    meaningFirst:
      'Gesture around the room while you name what is in it: “There is a window. There are two chairs.” Let the gesture carry the meaning.',
    correctExamples: ['There is a café near my house.', 'There are three people waiting.', 'Is there a problem?'],
    noticePrompt: 'One window, two chairs. Which one did I say “is” with, and which “are”?',
    commonErrors: [
      { wrong: 'There is two chairs.', right: 'There are two chairs.' },
      { wrong: 'Here have a shop.', right: 'There is a shop here.' },
      { wrong: 'It has many people.', right: 'There are many people.' },
    ],
    correctionMethod: 'Ask “One, or more than one?” and let them choose is/are themselves before repeating the sentence.',
    correctionScript: [
      'Two chairs — more than one, so: “There ARE two chairs.”',
      'In English we say “There is…”, not “Here have…”. Try: “There is a shop here.”',
    ],
    controlledPractice: ['___ ___ a book on the table.', '___ ___ four windows in this room.'],
    conversationPractice: ['Describe your kitchen to me — what is in it and how much of it?'],
    retrievalCue: 'In ten seconds, tell me five things that are in this room.',
    fallback: 'Only “There is a ___” pointing at single objects.',
    extension: 'Add the past (“There was / There were”) and negatives (“There isn’t any…”).',
    easierVariant: 'g_present_be',
    harderVariant: 'g_prepositions_place',
    prerequisites: ['g_present_be', 'g_plurals'],
    tags: ['there is', 'there are', 'existence'],
  },
  {
    id: 'g_present_simple',
    title: 'Present simple',
    cefr: 'A1',
    tutorExplanation:
      'For habits, routines, and facts. Add -s in the third person singular (he/she/it). Questions and negatives use do/does, and the main verb goes back to its plain form.',
    studentExplanation: 'Use the present simple for things you do often or things that are always true.',
    meaningFirst:
      'Mime your own morning in order — wake, coffee, work — narrating as you go: “I wake up. I drink coffee. I go to work.” Then ask about theirs.',
    correctExamples: ['I work in an office.', 'She drinks tea every morning.', 'Do you like music?'],
    noticePrompt: 'I said “I work” and “she works”. Which one grew an extra sound at the end?',
    commonErrors: [
      { wrong: 'She go to school.', right: 'She goes to school.' },
      { wrong: 'Do he likes it?', right: 'Does he like it?' },
      { wrong: 'I no like coffee.', right: 'I don’t like coffee.' },
    ],
    correctionMethod: 'Highlight the subject he/she/it → verb needs -s. In questions, the -s moves to “does”.',
    correctionScript: [
      'She… goeSSS to school. Your turn.',
      'The “s” already went onto “does”, so the next verb stays plain: “Does he like it?”',
    ],
    controlledPractice: ['He ___ (play) football.', 'They ___ (live) here.', '___ you ___ (want) coffee?'],
    conversationPractice: ['Describe your normal morning, from waking up to leaving home.'],
    retrievalCue: 'Tell me one thing your best friend does every week that you never do.',
    fallback: 'Stay in “I” and “you” only — no -s to worry about — and build fluency there first.',
    extension: 'Add frequency words (“usually”, “hardly ever”) and third-person questions about someone else.',
    jargonBuster: [
      { term: 'third person singular', plain: 'just means he, she or it — the forms that take an extra -s.' },
    ],
    easierVariant: 'g_present_be',
    harderVariant: 'g_present_continuous',
    prerequisites: ['g_present_be'],
    tags: ['present simple', 'third person s', 'do does', 'habits'],
  },
  {
    id: 'g_wh_questions',
    title: 'Question words (what / where / when / who / why / how)',
    cefr: 'A1',
    tutorExplanation:
      'Wh- questions put the question word first, then the same do/does or be structure: “Where do you live?”, “Who is she?”. The word order flip is what learners lose.',
    studentExplanation: 'Start with the question word, then ask the question the normal way.',
    meaningFirst:
      'Answer first, question second: say “I live in Haifa,” then ask “Where do you live?” The pattern is visible before it is named.',
    correctExamples: ['Where do you live?', 'What does she do?', 'Why are you late?'],
    noticePrompt: 'Listen to the order: “Where — do — you — live?” What comes right after the question word?',
    commonErrors: [
      { wrong: 'Where you live?', right: 'Where do you live?' },
      { wrong: 'What she is doing?', right: 'What is she doing?' },
      { wrong: 'How much cost it?', right: 'How much does it cost?' },
    ],
    correctionMethod:
      'Say the correct question at natural speed, then slowly, tapping once per word so they hear the order. Have them ask it back to you.',
    correctionScript: [
      'Nearly — we need “do” in there: “Where DO you live?”',
      'Ask me the same question, exactly the way I said it.',
    ],
    controlledPractice: ['___ is your teacher?', '___ do you start work?', '___ are you learning English?'],
    conversationPractice: ['Interview me. Ask me six questions, each starting with a different question word.'],
    retrievalCue: 'Ask me three questions about my weekend before I ask you anything.',
    fallback: 'Give the whole question as a fixed chunk to copy (“Where do you live?”) and just swap the last word.',
    extension: 'Add “How long / How often / What kind of…” and follow-up questions that build on the answer.',
    easierVariant: 'g_present_simple',
    harderVariant: 'g_past_simple',
    prerequisites: ['g_present_simple'],
    tags: ['questions', 'wh questions', 'word order', 'do does'],
  },
  {
    id: 'g_can_ability',
    title: 'Can — ability, requests and permission',
    cefr: 'A1',
    tutorExplanation:
      '“Can” never takes -s and is always followed by the plain verb: “She can swim”. Questions invert: “Can you help?”. It covers ability, requests and permission all at once, which makes it excellent value early.',
    studentExplanation: 'Use “can” to say what you are able to do, and to ask for things.',
    meaningFirst:
      'Mime swimming and say “I can swim.” Mime failing to lift something heavy: “I can’t lift it.” Then ask what they can do.',
    correctExamples: ['I can drive.', 'She can’t come today.', 'Can you say that again?'],
    noticePrompt: 'After “can”, did I say “to swim” or just “swim”?',
    commonErrors: [
      { wrong: 'She cans swim.', right: 'She can swim.' },
      { wrong: 'I can to drive.', right: 'I can drive.' },
      { wrong: 'You can help me? (flat)', right: 'Can you help me?' },
    ],
    correctionMethod: 'Nothing is added to “can” and nothing is added to the verb after it. Model the bare pair.',
    correctionScript: [
      '“Can” never changes: “She CAN swim.”',
      'Drop the “to” — “I can drive.” Say it once more.',
    ],
    controlledPractice: ['He ___ cook very well.', '___ you open the window?', 'I ___ (not) hear you.'],
    conversationPractice: ['Tell me three things you can do well and one thing you can’t do at all.'],
    retrievalCue: 'Ask me for three things right now, using “Can you…?”',
    fallback: 'Only “I can ___” with mimed actions.',
    extension: 'Contrast “can” with “could” for polite requests, and with “be able to” in other tenses.',
    easierVariant: 'g_present_be',
    harderVariant: 'g_should_advice',
    prerequisites: ['g_present_be'],
    tags: ['can', 'ability', 'requests', 'modal'],
  },
  {
    id: 'g_present_continuous',
    title: 'Present continuous',
    cefr: 'A1',
    tutorExplanation:
      'am/is/are + verb-ing for actions happening now or around now. It has TWO parts and learners drop one of them — either the “be” or the “-ing”.',
    studentExplanation: 'Use am/is/are + -ing for what is happening right now.',
    meaningFirst:
      'Narrate live action: stand up and say “I am standing.” Sit: “Now I am sitting.” Ask them to do something and narrate them.',
    correctExamples: ['I am reading.', 'They are playing outside.', 'What are you doing?'],
    noticePrompt: 'Count the pieces with me: “I — am — reading.” How many words before the action word?',
    commonErrors: [
      { wrong: 'I reading a book.', right: 'I am reading a book.' },
      { wrong: 'She is play now.', right: 'She is playing now.' },
      { wrong: 'I am wanting a coffee.', right: 'I want a coffee.' },
    ],
    correctionMethod: 'Check for two parts: the “be” verb AND the -ing. If one is missing, add it together.',
    correctionScript: [
      'Two pieces: “I AM readING.” Say both.',
      'Some verbs don’t like -ing — “want” is one. Just “I want a coffee.”',
    ],
    controlledPractice: ['Look! It ___ (rain).', 'We ___ (wait) for the bus.'],
    conversationPractice: ['Look around the room and tell me what people are doing.'],
    retrievalCue: 'Describe what is happening outside the window right now.',
    fallback: 'Only “I am ___ing” while actually doing the action.',
    extension: 'Contrast with the present simple: “I work in a bank” vs. “I’m working from home this week.”',
    easierVariant: 'g_present_simple',
    harderVariant: 'g_past_simple',
    prerequisites: ['g_present_be'],
    tags: ['present continuous', 'ing', 'now'],
  },
  {
    id: 'g_prepositions_place',
    title: 'Where things are (in / on / at / under / next to)',
    cefr: 'A1',
    tutorExplanation:
      'in = inside a space, on = touching a surface, at = a point or a place you go to. Prepositions rarely map one-to-one between languages, so this is memorised in phrases, not derived from rules.',
    studentExplanation: 'Small words that say where something is: in the box, on the table, at home.',
    meaningFirst:
      'Move one object around while naming each position: in the cup, on the cup, under the cup, next to the cup. Say nothing else.',
    correctExamples: ['The keys are on the table.', 'She lives in Madrid.', 'I’ll meet you at the station.'],
    noticePrompt: 'Watch where I put the pen. In… on… under. Which one did I use when it went inside?',
    commonErrors: [
      { wrong: 'I am in home.', right: 'I am at home.' },
      { wrong: 'The picture is in the wall.', right: 'The picture is on the wall.' },
      { wrong: 'I live at Spain.', right: 'I live in Spain.' },
    ],
    correctionMethod:
      'Do not explain — demonstrate with the object again and let them re-say the phrase. These are learned by feel and repetition.',
    correctionScript: [
      'We say “at home” — it’s just the English phrase. “I am at home.”',
      'Touching the surface, so: “on the wall.”',
    ],
    controlledPractice: ['The cat is ___ the box.', 'I work ___ a hospital.', 'See you ___ the café.'],
    conversationPractice: ['Tell me exactly where everything is on your desk right now.'],
    retrievalCue: 'I’ll hide something and you tell me where it is.',
    fallback: 'Two prepositions only — in and on — with one object.',
    extension: 'Add movement prepositions (into, out of, through, across) by acting them out.',
    easierVariant: 'g_present_be',
    harderVariant: 'g_prepositions_time',
    prerequisites: ['g_present_be'],
    tags: ['prepositions', 'place', 'in on at'],
  },
  {
    id: 'g_adverbs_frequency',
    title: 'How often (always / usually / sometimes / never)',
    cefr: 'A1',
    tutorExplanation:
      'Frequency words normally sit BEFORE the main verb (“I always eat breakfast”) but AFTER “be” (“I am always late”). That split is the whole difficulty.',
    studentExplanation: 'Words like always, usually, sometimes and never say how often you do something.',
    meaningFirst:
      'Draw a line: never at one end, always at the other. Place a few of your own habits on it out loud before asking for theirs.',
    correctExamples: ['I always drink coffee in the morning.', 'She never eats meat.', 'He is usually late.'],
    noticePrompt: 'Listen: “I always eat” but “I am always late.” Where did “always” move to?',
    commonErrors: [
      { wrong: 'I eat always breakfast.', right: 'I always eat breakfast.' },
      { wrong: 'Always I am tired.', right: 'I am always tired.' },
      { wrong: 'She never don’t call.', right: 'She never calls.' },
    ],
    correctionMethod:
      'Put the frequency word right before the action word — unless the verb is am/is/are, where it goes after. Model both.',
    correctionScript: [
      'Move it earlier: “I ALWAYS eat breakfast.”',
      '“Never” is already negative, so the verb stays positive: “She never calls.”',
    ],
    controlledPractice: ['I ___ (usually) go to bed at eleven.', 'They ___ (never) answer the phone.'],
    conversationPractice: ['Tell me about your week using always, usually, sometimes and never at least once each.'],
    retrievalCue: 'Three habits: one you always do, one you sometimes do, one you never do.',
    fallback: 'Use only “always” and “never” with two very concrete habits.',
    extension: 'Add “hardly ever”, “once a week”, “every other day” and ask for reasons.',
    easierVariant: 'g_present_simple',
    harderVariant: 'g_past_simple',
    prerequisites: ['g_present_simple'],
    tags: ['adverbs', 'frequency', 'always never', 'word order'],
  },

  /* ======================================================================== */
  /* A2 — telling stories and talking about time                              */
  /* ======================================================================== */
  {
    id: 'g_articles',
    title: 'Articles (a / an / the)',
    cefr: 'A2',
    tutorExplanation:
      'a/an = one, not specific (an before a vowel SOUND). the = specific, or already known to both of us. No article for general plurals and uncountables. Speakers of article-less languages (Russian, Hebrew) leave them out entirely.',
    studentExplanation: 'Use “a/an” for one new thing, and “the” when we both know which one.',
    meaningFirst:
      'Tell a two-line story with the same noun: “I saw a dog. The dog was huge.” Say it twice and let the shift land before naming it.',
    correctExamples: ['I saw a dog. The dog was big.', 'She is an engineer.', 'I like music.'],
    noticePrompt: 'First time I said “a dog”, second time “the dog”. What changed between the two sentences?',
    commonErrors: [
      { wrong: 'I am teacher.', right: 'I am a teacher.' },
      { wrong: 'I go to the school every day.', right: 'I go to school every day.' },
      { wrong: 'I like the music.', right: 'I like music.' },
    ],
    correctionMethod: 'Ask: “One thing, first time?” → a/an. “Do we both know which?” → the. Model, then retry.',
    correctionScript: [
      'One of many jobs, so: “I am A teacher.”',
      'First mention — “a dog”. Now we both know it, so the second time it’s “the dog”.',
    ],
    controlledPractice: ['I need ___ umbrella.', 'She is ___ honest person.', 'Close ___ door, please.'],
    conversationPractice: ['Describe your room: “There is a…”, “The … is…”.'],
    retrievalCue: 'Tell me about something you bought recently — first mention it, then say more about it.',
    fallback: 'Practise only “a/an” with jobs and objects. Leave “the” for another lesson entirely.',
    extension: 'Work on the zero article with abstract nouns and generalisations (“Life is short”, “I love dogs”).',
    jargonBuster: [
      { term: 'article', plain: 'just the words a, an and the.' },
      { term: 'uncountable', plain: 'stuff you can’t count one-by-one: water, music, information.' },
    ],
    easierVariant: 'g_present_be',
    harderVariant: 'g_countable_quantifiers',
    prerequisites: ['g_present_be'],
    tags: ['articles', 'a an the', 'determiners'],
  },
  {
    id: 'g_past_simple',
    title: 'Past simple',
    cefr: 'A2',
    tutorExplanation:
      'Finished actions in the past. Regular verbs add -ed; many of the commonest verbs are irregular (go→went, buy→bought). Questions and negatives use “did”, and then the main verb goes back to plain form.',
    studentExplanation: 'Use the past simple for things that already finished. Many verbs change: go → went.',
    meaningFirst:
      'Draw a timeline, mark “now”, point behind it and tell a 20-second true story about your own yesterday. Then ask about theirs.',
    correctExamples: ['Yesterday I watched a film.', 'We went to the beach.', 'Did you call her?'],
    noticePrompt: 'I said “I watch” for every day, and “I watched” for yesterday. What did I add?',
    commonErrors: [
      { wrong: 'Yesterday I go to school.', right: 'Yesterday I went to school.' },
      { wrong: 'She buyed a car.', right: 'She bought a car.' },
      { wrong: 'Did you went?', right: 'Did you go?' },
    ],
    correctionMethod:
      'Notice the time word (yesterday, last…). Change the verb to past. After “did”, the verb goes back to base form.',
    correctionScript: [
      'You said yesterday, so the verb moves back too: “I WENT to school.”',
      '“Did” already carries the past, so: “Did you GO?”',
    ],
    controlledPractice: ['Last week we ___ (visit) Rome.', 'He ___ (see) the film.', '___ you ___ (eat)?'],
    conversationPractice: ['Tell me the story of your last holiday.'],
    retrievalCue: 'Three things you did yesterday, in order, before we start.',
    fallback:
      'Give them five irregular verbs on paper and let them tell the story reading from the list. Fluency first, memory later.',
    extension: 'Add “ago”, negatives, and follow-up questions so it becomes a real conversation, not a recitation.',
    jargonBuster: [
      { term: 'irregular verb', plain: 'a verb that doesn’t just add -ed — you have to learn its past form.' },
    ],
    easierVariant: 'g_present_simple',
    harderVariant: 'g_past_continuous',
    prerequisites: ['g_present_simple'],
    tags: ['past simple', 'ed', 'irregular verbs', 'did'],
  },
  {
    id: 'g_countable_quantifiers',
    title: 'How much / how many (some, any, a lot of)',
    cefr: 'A2',
    tutorExplanation:
      'Countable nouns take many / a few / How many. Uncountable nouns (water, money, time, information, advice) take much / a little / How much. “A lot of” works with both, which makes it a useful safe default.',
    studentExplanation: 'Things you can count use “many”; things you can’t count use “much”.',
    meaningFirst:
      'Put three coins and a glass of water on the table. Count the coins out loud; try to count the water and shrug. The distinction lands without a word of explanation.',
    correctExamples: ['How many brothers do you have?', 'I don’t have much time.', 'There’s a lot of traffic.'],
    noticePrompt: 'I asked “how many coins” but “how much water”. Which one could I count?',
    commonErrors: [
      { wrong: 'How much brothers?', right: 'How many brothers?' },
      { wrong: 'I have many informations.', right: 'I have a lot of information.' },
      { wrong: 'I have some money? (asking)', right: 'Do you have any money?' },
    ],
    correctionMethod: 'Ask “Can you count them one, two, three?” Let them answer, then supply much or many.',
    correctionScript: [
      'Can you count brothers? Yes — so “How MANY brothers?”',
      '“Information” doesn’t take an s in English. Just “a lot of information.”',
    ],
    controlledPractice: ['How ___ sugar do you take?', 'There aren’t ___ people here.', 'I need ___ help.'],
    conversationPractice: ['Plan a dinner for six people: what do we need, and how much of each thing?'],
    retrievalCue: 'Ask me four “How much / How many” questions about my week.',
    fallback: 'Use only “a lot of”, which is correct with everything, and build confidence first.',
    extension: 'Add “too much / too many / not enough” and let them complain about something realistically.',
    easierVariant: 'g_plurals',
    harderVariant: 'g_comparatives',
    prerequisites: ['g_plurals'],
    tags: ['quantifiers', 'much many', 'countable', 'uncountable', 'some any'],
  },
  {
    id: 'g_comparatives',
    title: 'Comparatives and superlatives',
    cefr: 'A2',
    tutorExplanation:
      'Short adjectives: -er / -est (big→bigger→biggest). Long adjectives: more/most (interesting). Irregular: good→better→best, bad→worse→worst. Comparisons take “than”.',
    studentExplanation: 'Compare two things with -er or “more”. For the top one, use -est or “most”.',
    meaningFirst:
      'Hold two objects of obviously different size: “This one is bigger.” Add a third: “And this is the biggest.” Physical, then verbal.',
    correctExamples: ['This is cheaper.', 'She is more careful than me.', 'It’s the best day.'],
    noticePrompt: 'Big → bigger. Interesting → more interesting. Why didn’t I say “interestinger”?',
    commonErrors: [
      { wrong: 'more bigger', right: 'bigger' },
      { wrong: 'She is more tall.', right: 'She is taller.' },
      { wrong: 'This is more good.', right: 'This is better.' },
    ],
    correctionMethod: 'Count the syllables: short → -er; long → more. Never use both “more” and “-er” together.',
    correctionScript: [
      'Pick one or the other, not both: just “bigger”.',
      '“Good” is a surprise word — “better”, “the best”.',
    ],
    controlledPractice: ['A plane is ___ (fast) than a car.', 'This is the ___ (good) café here.'],
    conversationPractice: ['Compare two cities you know.'],
    retrievalCue: 'Compare your life now with your life five years ago — three differences.',
    fallback: 'Two objects in front of them, one adjective, said aloud together.',
    extension: 'Add “as … as”, “not as … as”, and “the more … the more …”.',
    jargonBuster: [
      { term: 'syllable', plain: 'a beat in a word — “big” has one, “in-te-res-ting” has four.' },
    ],
    easierVariant: 'g_present_be',
    harderVariant: 'g_present_perfect',
    prerequisites: ['g_present_be'],
    tags: ['comparative', 'superlative', 'adjectives', 'than'],
  },
  {
    id: 'g_going_to',
    title: 'Plans with “going to”',
    cefr: 'A2',
    tutorExplanation:
      '“be going to” + verb for plans already decided and for predictions with visible evidence: “Look at those clouds — it’s going to rain.” Learners drop the “be” or use the present simple instead.',
    studentExplanation: 'Use “going to” for things you have already decided to do.',
    meaningFirst:
      'Show a calendar or diary — real or drawn — point at a future day and say what you are going to do. Then point at theirs.',
    correctExamples: ['I’m going to visit my parents on Sunday.', 'Are you going to take the job?', 'It’s going to rain.'],
    noticePrompt: 'Did I say “I go to visit” or “I am going to visit”? What extra word is in there?',
    commonErrors: [
      { wrong: 'I going to travel.', right: 'I’m going to travel.' },
      { wrong: 'I will visit my parents. (already booked)', right: 'I’m going to visit my parents.' },
      { wrong: 'I’m going to shopping.', right: 'I’m going shopping.' },
    ],
    correctionMethod:
      'Check the “be” is there, then the plain verb after “to”. If the plan is already decided, “going to” is the natural choice.',
    correctionScript: [
      'You need the “am”: “I’M going to travel.”',
      'It’s already booked, so English prefers “going to”: “I’m going to visit them.”',
    ],
    controlledPractice: ['She ___ ___ ___ (start) a new course.', '___ you ___ ___ (call) him?'],
    conversationPractice: ['Tell me everything you’re going to do this weekend, and why.'],
    retrievalCue: 'What are you going to do straight after this lesson?',
    fallback: 'Use one fixed frame: “I’m going to ___ tomorrow.”',
    extension: 'Contrast with “will” for decisions made in the moment, and with the present continuous for arrangements.',
    easierVariant: 'g_present_continuous',
    harderVariant: 'g_will_future',
    prerequisites: ['g_present_continuous'],
    tags: ['future', 'going to', 'plans'],
  },
  {
    id: 'g_will_future',
    title: '“Will” — decisions, offers and predictions',
    cefr: 'A2',
    tutorExplanation:
      '“will” + plain verb. Used for decisions made at the moment of speaking (“I’ll get it”), offers, promises, and predictions without evidence. Never takes -s, never takes “to”.',
    studentExplanation: 'Use “will” when you decide something right now, or when you think something will happen.',
    meaningFirst:
      'Drop something (or mime it), then immediately say “I’ll get it.” The decision happens in front of them, which is the whole meaning.',
    correctExamples: ['I’ll help you with that.', 'She’ll probably be late.', 'I think it will be fine.'],
    noticePrompt: 'I decided that as I said it. Did I say “I am going to get it” or “I’ll get it”?',
    commonErrors: [
      { wrong: 'She will to come.', right: 'She will come.' },
      { wrong: 'He wills help.', right: 'He will help.' },
      { wrong: 'I will go to the dentist tomorrow. (booked)', right: 'I’m going to the dentist tomorrow.' },
    ],
    correctionMethod: 'Nothing after “will” but the plain verb. If the plan was already made, switch to “going to”.',
    correctionScript: [
      'Drop the “to” — “She will come.”',
      'You booked it already, so it’s a plan: “I’m going to the dentist.”',
    ],
    controlledPractice: ['That bag looks heavy — I ___ carry it.', 'Do you think it ___ snow?'],
    conversationPractice: ['I’ll describe three small problems. Offer to help with each one.'],
    retrievalCue: 'Make me three predictions about next year.',
    fallback: 'Practise only offers: “I’ll ___.” with three mimed situations.',
    extension: 'Add “might / probably / definitely” to grade the confidence of a prediction.',
    easierVariant: 'g_going_to',
    harderVariant: 'g_conditionals',
    prerequisites: ['g_going_to'],
    tags: ['future', 'will', 'predictions', 'offers'],
  },
  {
    id: 'g_past_continuous',
    title: 'Past continuous (background in a story)',
    cefr: 'A2',
    tutorExplanation:
      'was/were + -ing for an action already in progress when something else happened: “I was cooking when he called.” The long action is continuous, the interrupting one is past simple.',
    studentExplanation: 'Use “was/were + -ing” for what was already happening when something else happened.',
    meaningFirst:
      'Act it out: start miming cooking, then have them “ring”. Freeze and narrate: “I was cooking when you called.”',
    correctExamples: ['I was working when you called.', 'They were waiting outside.', 'What were you doing at 8pm?'],
    noticePrompt: 'Which action was long and already going, and which one interrupted it?',
    commonErrors: [
      { wrong: 'I cooked when he called. (meaning interrupted)', right: 'I was cooking when he called.' },
      { wrong: 'I was cook.', right: 'I was cooking.' },
      { wrong: 'We was waiting.', right: 'We were waiting.' },
    ],
    correctionMethod:
      'Draw the long action as a line and the short one as a cross on it. Let the picture do the explaining, then re-say the sentence.',
    correctionScript: [
      'The cooking was already happening — “I WAS COOKING when he called.”',
      '“We” takes “were”: “We were waiting.”',
    ],
    controlledPractice: ['She ___ (read) when the lights went out.', 'What ___ you ___ (do) at midnight?'],
    conversationPractice: ['Tell me about a time something interrupted you. Set the scene first.'],
    retrievalCue: 'What were you doing this time yesterday?',
    fallback: 'Ask only “What were you doing at 8 o’clock?” and accept a single clause.',
    extension: 'Build a full anecdote alternating background (continuous) and events (simple).',
    easierVariant: 'g_past_simple',
    harderVariant: 'g_present_perfect',
    prerequisites: ['g_past_simple', 'g_present_continuous'],
    tags: ['past continuous', 'was were ing', 'narrative', 'when while'],
  },
  {
    id: 'g_must_have_to',
    title: 'Rules and necessity (have to / must / don’t have to)',
    cefr: 'A2',
    tutorExplanation:
      '“have to” = external necessity (a rule, a job). “must” = strong, often personal or written rules. The trap is the negative: “mustn’t” = it is forbidden, “don’t have to” = it is optional. Those are opposites.',
    studentExplanation: '“Have to” means it’s necessary. “Don’t have to” means it’s your choice.',
    meaningFirst:
      'Use two real rules from their life — one obligation, one free choice — and state each one as a fact before comparing them.',
    correctExamples: ['I have to start at eight.', 'You mustn’t smoke here.', 'You don’t have to come.'],
    noticePrompt: '“You mustn’t come” and “You don’t have to come” — do those mean the same thing?',
    commonErrors: [
      { wrong: 'I must to go.', right: 'I have to go.' },
      { wrong: 'You mustn’t pay. (meaning it’s free)', right: 'You don’t have to pay.' },
      { wrong: 'She have to work.', right: 'She has to work.' },
    ],
    correctionMethod:
      'Ask “Is it forbidden, or just optional?” The answer picks the form. Say both versions back so the contrast is audible.',
    correctionScript: [
      'Forbidden or optional? Optional — so “You don’t have to pay.”',
      'No “to” after “must”: “I must go.” Or more naturally, “I have to go.”',
    ],
    controlledPractice: ['He ___ ___ wear a uniform.', 'You ___ ___ bring anything — it’s all provided.'],
    conversationPractice: ['Tell me the rules of your workplace, school or building — what’s required, banned and optional.'],
    retrievalCue: 'Name one thing you have to do today and one thing you don’t have to do.',
    fallback: 'Use only “I have to ___” about their real day.',
    extension: 'Add past necessity (“had to”) and “should” for advice, and let them compare the strength of each.',
    easierVariant: 'g_can_ability',
    harderVariant: 'g_should_advice',
    prerequisites: ['g_present_simple'],
    tags: ['must', 'have to', 'obligation', 'modal', 'rules'],
  },
  {
    id: 'g_prepositions_time',
    title: 'When things happen (in / on / at)',
    cefr: 'A2',
    tutorExplanation:
      'at + clock time and “night”; on + days and dates; in + months, years, seasons, and parts of the day. Small set, high frequency, and wrong in almost every beginner’s speech.',
    studentExplanation: 'at 7 o’clock, on Monday, in July — three little words for three sizes of time.',
    meaningFirst:
      'Write a real schedule: a time, a day, a month. Read each one aloud with its preposition before comparing them.',
    correctExamples: ['We meet at seven.', 'I’ll see you on Friday.', 'She was born in 1998.'],
    noticePrompt: 'Small time, medium time, big time. Which word went with the clock?',
    commonErrors: [
      { wrong: 'I’ll see you in Friday.', right: 'I’ll see you on Friday.' },
      { wrong: 'We meet in seven.', right: 'We meet at seven.' },
      { wrong: 'On the morning.', right: 'In the morning.' },
    ],
    correctionMethod: 'Smallest to biggest: at (clock) → on (day) → in (month/year). Say the ladder, then the sentence.',
    correctionScript: [
      'Days take “on”: “on Friday.”',
      'Clock times take “at”: “at seven.”',
    ],
    controlledPractice: ['The class starts ___ nine.', 'My birthday is ___ March.', 'I work ___ Saturdays.'],
    conversationPractice: ['Walk me through your typical week with times, days and months.'],
    retrievalCue: 'Give me three times you are busy this week — a time, a day and a month.',
    fallback: 'Practise only clock times with “at”.',
    extension: 'Add “during / for / since / until / by” with a timeline drawn between you.',
    easierVariant: 'g_prepositions_place',
    harderVariant: 'g_present_perfect',
    prerequisites: ['g_prepositions_place'],
    tags: ['prepositions', 'time', 'in on at'],
  },

  /* ======================================================================== */
  /* B1 — connecting past to present, and expressing attitude                 */
  /* ======================================================================== */
  {
    id: 'g_present_perfect',
    title: 'Present perfect',
    cefr: 'B1',
    tutorExplanation:
      'have/has + past participle. Links past to now: experiences (ever/never), unfinished time (for/since), recent results. If there is a finished time word (yesterday, in 2019), English uses past simple instead.',
    studentExplanation:
      'Use have/has + verb for life experiences or things that still matter now. No exact past time.',
    meaningFirst:
      'Ask about experience, not events: “Have you ever eaten sushi?” Follow a yes with “When?” — and watch the tense switch to past simple naturally.',
    correctExamples: ['I have visited Japan.', 'She has lived here for years.', 'Have you ever tried sushi?'],
    noticePrompt: '“I’ve been to Rome” and “I went to Rome in 2019”. One has a date. Which one?',
    commonErrors: [
      { wrong: 'I have seen him yesterday.', right: 'I saw him yesterday.' },
      { wrong: 'She has went home.', right: 'She has gone home.' },
      { wrong: 'I live here since 2019.', right: 'I have lived here since 2019.' },
    ],
    correctionMethod:
      'If there is a finished time word (yesterday, in 2019), use past simple instead. Otherwise present perfect for “up to now”.',
    correctionScript: [
      'You said “yesterday”, so it’s finished: “I SAW him yesterday.”',
      'It started in the past and it’s still true, so: “I HAVE LIVED here since 2019.”',
    ],
    controlledPractice: ['I ___ (never / eat) octopus.', 'We ___ (know) each other since 2010.'],
    conversationPractice: ['Tell me about interesting things you have done in your life.'],
    retrievalCue: 'Two things you have never done but would like to.',
    fallback:
      'Stay with the fixed chunk “Have you ever…?” and let them answer with past simple. The question form alone is worth the lesson.',
    extension: 'Contrast present perfect with past simple in the same story, and add “just / already / yet”.',
    jargonBuster: [
      { term: 'past participle', plain: 'the third form of the verb: go – went – GONE, see – saw – SEEN.' },
    ],
    easierVariant: 'g_past_simple',
    harderVariant: 'g_conditionals',
    prerequisites: ['g_past_simple'],
    tags: ['present perfect', 'have has', 'for since', 'ever never', 'past participle'],
  },
  {
    id: 'g_used_to',
    title: '“Used to” — how things were before',
    cefr: 'B1',
    tutorExplanation:
      '“used to” + plain verb for past habits and states that are no longer true. In questions and negatives the “d” disappears: “Did you use to…?”, “I didn’t use to…”.',
    studentExplanation: 'Use “used to” for things that were true before, but aren’t any more.',
    meaningFirst:
      'Tell a true before/after fact about yourself: “I used to live in the States. Now I live here.” The contrast carries the meaning.',
    correctExamples: ['I used to smoke.', 'She used to live in Paris.', 'Did you use to play an instrument?'],
    noticePrompt: 'Did I say I still do it, or that I did it before and stopped?',
    commonErrors: [
      { wrong: 'I used to go there last week.', right: 'I went there last week.' },
      { wrong: 'I use to play football when I was young.', right: 'I used to play football when I was young.' },
      { wrong: 'Did you used to smoke?', right: 'Did you use to smoke?' },
    ],
    correctionMethod:
      'Check it is a repeated past habit, not one event. In questions “did” already carries the past, so the “d” drops.',
    correctionScript: [
      'Once, last week — that’s just past simple: “I went there.”',
      '“Did” has the past already: “Did you USE to smoke?”',
    ],
    controlledPractice: ['I ___ ___ ___ (be) afraid of dogs.', '___ you ___ ___ (live) in the city?'],
    conversationPractice: ['Tell me three ways you were different ten years ago.'],
    retrievalCue: 'One thing you used to believe that you don’t believe now.',
    fallback: 'One frame only: “I used to ___.” about childhood.',
    extension: 'Add “would” for repeated past actions in storytelling, and “be used to” (a completely different thing).',
    easierVariant: 'g_past_simple',
    harderVariant: 'g_present_perfect',
    prerequisites: ['g_past_simple'],
    tags: ['used to', 'past habits', 'no longer true'],
  },
  {
    id: 'g_should_advice',
    title: 'Giving advice (should / ought to / why don’t you)',
    cefr: 'B1',
    tutorExplanation:
      '“should” + plain verb. Softer than “must”. Very high value in conversation because advice is one of the things learners most want to give and most often phrase as a command.',
    studentExplanation: 'Use “should” to say what you think is a good idea.',
    meaningFirst:
      'Describe a small real problem of your own and invite advice. They will reach for the structure because they actually want to answer.',
    correctExamples: ['You should get more sleep.', 'He shouldn’t worry about it.', 'Maybe you should ask her.'],
    noticePrompt: 'Was that an order, or a suggestion? What word made it softer?',
    commonErrors: [
      { wrong: 'You should to rest.', right: 'You should rest.' },
      { wrong: 'You must rest. (as friendly advice)', right: 'You should rest.' },
      { wrong: 'I think you shouldn’t to go.', right: 'I don’t think you should go.' },
    ],
    correctionMethod: 'No “to” after “should”. If it should sound like a friend, not a boss, keep “should” over “must”.',
    correctionScript: [
      'Drop the “to”: “You should rest.”',
      'English usually moves the negative earlier: “I don’t think you should go.”',
    ],
    controlledPractice: ['You ___ (not) eat so late.', 'What ___ I do about it?'],
    conversationPractice: ['I’ll tell you three problems. Give me real advice for each, and a reason.'],
    retrievalCue: 'Give me one piece of advice about learning English.',
    fallback: 'One frame: “You should ___.” with three obvious problems.',
    extension: 'Grade the strength: “You might want to… / I’d suggest… / You really ought to…”.',
    easierVariant: 'g_can_ability',
    harderVariant: 'g_conditionals',
    prerequisites: ['g_can_ability'],
    tags: ['should', 'advice', 'modal', 'suggestions'],
  },
  {
    id: 'g_gerund_infinitive',
    title: 'Verb + -ing or verb + to',
    cefr: 'B1',
    tutorExplanation:
      'Some verbs are followed by -ing (enjoy, finish, avoid, mind, keep), others by “to” + verb (want, need, decide, hope, promise). A few take both. There is no reliable rule — it is learned per verb, in chunks.',
    studentExplanation: 'Some verbs take “-ing” after them, and some take “to”. Learn them as pairs.',
    meaningFirst:
      'Say four true sentences about yourself using the target verbs, so the pattern arrives inside real content: “I enjoy cooking. I want to travel.”',
    correctExamples: ['I enjoy cooking.', 'She wants to move.', 'We finished eating at nine.'],
    noticePrompt: 'Listen to what came after “enjoy” and after “want”. Same shape, or different?',
    commonErrors: [
      { wrong: 'I enjoy to cook.', right: 'I enjoy cooking.' },
      { wrong: 'I want going home.', right: 'I want to go home.' },
      { wrong: 'I’m looking forward to see you.', right: 'I’m looking forward to seeing you.' },
    ],
    correctionMethod:
      'Do not explain a rule — there isn’t one. Say the correct two-word chunk (“enjoy cooking”) and have them repeat the pair, then the whole sentence.',
    correctionScript: [
      '“Enjoy” likes -ing: “enjoy COOKING.” Say the pair, then your sentence.',
      'Keep a list of the ones that catch you — that’s genuinely how English speakers learned it too.',
    ],
    controlledPractice: ['I hope ___ (see) you soon.', 'Do you mind ___ (wait)?', 'She decided ___ (leave).'],
    conversationPractice: ['Tell me what you enjoy doing, what you want to do, and what you keep avoiding.'],
    retrievalCue: 'Finish these three: I enjoy… / I need… / I’ve finished…',
    fallback: 'Practise “I like ___ing” and “I want to ___” only. Two chunks, well drilled.',
    extension: 'Add verbs that change meaning with each form: “stop smoking” vs. “stop to smoke”, “remember to” vs. “remember -ing”.',
    jargonBuster: [
      { term: 'gerund', plain: 'a verb acting like a noun — the -ing form, as in “I like swimming”.' },
      { term: 'infinitive', plain: 'the “to + verb” form: to go, to eat.' },
    ],
    easierVariant: 'g_present_simple',
    harderVariant: 'g_reported_speech',
    prerequisites: ['g_present_simple'],
    tags: ['gerund', 'infinitive', 'verb patterns', 'ing to'],
  },
  {
    id: 'g_conditionals',
    title: 'Conditionals (zero, first, second)',
    cefr: 'B1',
    tutorExplanation:
      'Zero: general truths (If you heat ice, it melts). First: real future (If it rains, I will stay). Second: unreal or hypothetical (If I had time, I would travel). The universal error is putting will/would inside the “if” half.',
    studentExplanation:
      'Use “if” to talk about results. For real future use “will”; for imagined situations use “would”.',
    meaningFirst:
      'Start with something real and immediate: “If it rains tomorrow, I’ll stay home.” Then something impossible: “If I had a million dollars…” Let the second one be fun before it is grammar.',
    correctExamples: [
      'If it rains, we will cancel the trip.',
      'If I were rich, I would help others.',
      'If you mix blue and yellow, you get green.',
    ],
    noticePrompt: 'In my sentence, which half had “will” in it — the “if” half or the other one?',
    commonErrors: [
      { wrong: 'If it will rain, we stay.', right: 'If it rains, we will stay.' },
      { wrong: 'If I would have time…', right: 'If I had time…' },
      { wrong: 'If I will be rich…', right: 'If I were rich…' },
    ],
    correctionMethod:
      'Don’t put “will/would” in the “if” part. Real future = if + present, … will. Imagined = if + past, … would.',
    correctionScript: [
      'Keep “will” out of the “if” half: “If it RAINS, we will stay.”',
      'Imagined, so the if-half goes past: “If I HAD time, I would travel.”',
    ],
    controlledPractice: ['If I ___ (see) her, I’ll tell her.', 'If I ___ (be) you, I would rest.'],
    conversationPractice: ['What would you do if you won the lottery?'],
    retrievalCue: 'Finish this: “If I had one free day next week, I would…”',
    fallback: 'First conditional only, about tomorrow’s weather. One structure, many sentences.',
    extension: 'Add the third conditional for regrets and mixed conditionals for consequences that reach into now.',
    easierVariant: 'g_will_future',
    harderVariant: 'g_third_conditional',
    prerequisites: ['g_will_future'],
    tags: ['conditional', 'if', 'will', 'would', 'hypothetical'],
  },
  {
    id: 'g_reported_speech',
    title: 'Telling someone what was said',
    cefr: 'B1',
    tutorExplanation:
      'Reporting shifts the tense back one step (“I’m tired” → he said he WAS tired) and adjusts pronouns and time words. “Say” takes no person (“he said that…”), “tell” requires one (“he told ME…”).',
    studentExplanation: 'When you repeat what someone said, move the verb one step into the past.',
    meaningFirst:
      'Have them whisper a sentence to you; then report it aloud to the room. Doing it is faster than describing it.',
    correctExamples: ['She said she was busy.', 'He told me he would call.', 'They asked where I lived.'],
    noticePrompt: 'She said “I am busy.” When I repeated it, what happened to “am”?',
    commonErrors: [
      { wrong: 'He said me he was late.', right: 'He told me he was late.' },
      { wrong: 'She said she is tired.', right: 'She said she was tired.' },
      { wrong: 'He asked where do I live.', right: 'He asked where I lived.' },
    ],
    correctionMethod:
      'Two checks: “say” or “tell”, then step the verb back. In reported questions the word order goes back to a normal statement.',
    correctionScript: [
      '“Told” needs a person, “said” doesn’t: “He TOLD ME he was late.”',
      'Reported questions lose the question order: “He asked where I LIVED.”',
    ],
    controlledPractice: ['“I’m leaving.” → She said ___.', '“Do you work here?” → He asked ___.'],
    conversationPractice: ['Tell me about a conversation you had this week — what did each person say?'],
    retrievalCue: 'What was the last thing someone told you that surprised you?',
    fallback: 'Report only “He said…” with present → past, ignoring questions entirely.',
    extension: 'Add reporting verbs with attitude: admitted, insisted, denied, suggested, warned.',
    easierVariant: 'g_past_simple',
    harderVariant: 'g_passive',
    prerequisites: ['g_past_simple'],
    tags: ['reported speech', 'said told', 'backshift', 'indirect'],
  },

  /* ======================================================================== */
  /* B2 — precision, nuance and written register                              */
  /* ======================================================================== */
  {
    id: 'g_passive',
    title: 'The passive voice',
    cefr: 'B2',
    tutorExplanation:
      'be + past participle, used when the action matters more than who did it. The tense is carried by “be” (is made, was built, has been sold). Learners drop the “be” or use the plain past instead of the participle.',
    studentExplanation: 'Use the passive when we don’t know or don’t care who did the action.',
    meaningFirst:
      'Point at something manufactured and ask “Who made this?” They won’t know — which is exactly when English reaches for the passive: “It was made in China.”',
    correctExamples: ['The bridge was built in 1932.', 'English is spoken here.', 'The report has been sent.'],
    noticePrompt: 'Who built the bridge? Does my sentence even say?',
    commonErrors: [
      { wrong: 'The bridge was build.', right: 'The bridge was built.' },
      { wrong: 'It made in China.', right: 'It is made in China.' },
      { wrong: 'The report was sent by me. (unnatural)', right: 'I sent the report.' },
    ],
    correctionMethod: 'Check both parts: correct form of “be” + the past participle (the third verb form).',
    correctionScript: [
      'Third form: “was BUILT.” Say the whole sentence again.',
      'If the person matters, English usually prefers the active: “I sent the report.”',
    ],
    controlledPractice: ['This car ___ (make) in Germany.', 'The letters ___ (deliver) yesterday.'],
    conversationPractice: ['Explain how a product you like is made or delivered.'],
    retrievalCue: 'Tell me three things in this room and where each one was made.',
    fallback: 'Present passive only, with objects you can both see: “It’s made of wood.”',
    extension: 'Add “get” passives, passive reporting (“It is believed that…”) and when the passive is a hedge.',
    easierVariant: 'g_past_simple',
    harderVariant: 'g_causative',
    prerequisites: ['g_past_simple'],
    tags: ['passive', 'be past participle', 'was built'],
  },
  {
    id: 'g_relative_clauses',
    title: 'Relative clauses (who / which / that)',
    cefr: 'B2',
    tutorExplanation:
      'Add information about a noun: who (people), which (things), that (both). Defining clauses take no commas; non-defining ones do, and cannot use “that”. “What” is never a relative pronoun.',
    studentExplanation: 'Use who/which/that to join two ideas and describe a person or thing.',
    meaningFirst:
      'Say two short sentences about the same person, then join them out loud. The join is the lesson: “I have a friend. She lives in Rome. → I have a friend who lives in Rome.”',
    correctExamples: [
      'The man who called you is my uncle.',
      'The phone that I bought is great.',
      'Paris, which I love, is busy.',
    ],
    noticePrompt: 'I turned two sentences into one. What word did I use to glue them together?',
    commonErrors: [
      { wrong: 'The book what I read…', right: 'The book that I read…' },
      { wrong: 'The woman which helped me…', right: 'The woman who helped me…' },
      { wrong: 'The man who he called me…', right: 'The man who called me…' },
    ],
    correctionMethod: 'People → who; things → which/that. Never “what”. And never repeat the subject after who/that.',
    correctionScript: [
      'People take “who”: “the woman WHO helped me.”',
      '“Who” is already the subject, so drop the “he”: “the man who called me.”',
    ],
    controlledPractice: ['That’s the café ___ serves great coffee.', 'She’s the friend ___ I told you about.'],
    conversationPractice: ['Describe a person who changed your life, using “who”.'],
    retrievalCue: 'Define three things for me without naming them — “It’s a thing that…”.',
    fallback: 'Join two given sentences with “who” only, out loud, five times.',
    extension: 'Add non-defining clauses with commas, “whose”, and reduced clauses (“the man standing there”).',
    jargonBuster: [
      { term: 'subject', plain: 'the person or thing doing the action — the word before the verb.' },
    ],
    easierVariant: 'g_comparatives',
    harderVariant: 'g_advanced_cohesion',
    prerequisites: ['g_present_simple'],
    tags: ['relative clause', 'who which that', 'defining'],
  },
  {
    id: 'g_modals_deduction',
    title: 'Guessing with confidence (must / might / can’t)',
    cefr: 'B2',
    tutorExplanation:
      'Deduction about the present: “must be” (I’m sure it’s true), “might/could be” (possible), “can’t be” (I’m sure it’s not). Note that the opposite of “must be” is “can’t be”, never “mustn’t be”.',
    studentExplanation: 'Use “must” when you’re sure, “might” when you’re not, and “can’t” when you’re sure it’s wrong.',
    meaningFirst:
      'Hold something hidden in your hand and let them guess. Their guesses will need exactly this language, so supply it as they reach for it.',
    correctExamples: ['She must be tired.', 'It might be closed.', 'That can’t be right.'],
    noticePrompt: 'Rank my three guesses: which one was I most sure about?',
    commonErrors: [
      { wrong: 'It mustn’t be true.', right: 'It can’t be true.' },
      { wrong: 'She must to be tired.', right: 'She must be tired.' },
      { wrong: 'Maybe it is possible that perhaps…', right: 'It might be…' },
    ],
    correctionMethod: 'Ask “How sure are you — 100%, 50%, or sure it’s wrong?” and let them pick the modal themselves.',
    correctionScript: [
      'Sure it’s NOT true → “It CAN’T be true.”',
      'No “to” after a modal: “She must be tired.”',
    ],
    controlledPractice: ['The lights are off — they ___ be out.', 'He ___ be forty; he looks much younger.'],
    conversationPractice: ['I’ll describe three strange situations. Tell me what you think is going on and how sure you are.'],
    retrievalCue: 'Look at my desk and make three guesses about my day.',
    fallback: 'Two options only — “must be” and “might be” — with obvious pictures.',
    extension: 'Move into past deduction: “must have been”, “can’t have known”, “might have left”.',
    easierVariant: 'g_can_ability',
    harderVariant: 'g_third_conditional',
    prerequisites: ['g_should_advice'],
    tags: ['modals', 'deduction', 'must might cant', 'certainty'],
  },
  {
    id: 'g_third_conditional',
    title: 'Talking about what didn’t happen',
    cefr: 'B2',
    tutorExplanation:
      'Third conditional: if + had + participle, … would have + participle. Used for regrets and alternative pasts. Mixed conditionals connect a past cause to a present result: “If I had studied, I would have a better job now.”',
    studentExplanation: 'Use this to talk about a past that didn’t happen, and what would have been different.',
    meaningFirst:
      'Tell a small real regret of your own, plainly: “I didn’t take that job. If I had taken it, I would have moved.” Regret carries the grammar.',
    correctExamples: [
      'If I had known, I would have called.',
      'She wouldn’t have missed it if she’d left earlier.',
      'If I’d studied medicine, I’d be a doctor now.',
    ],
    noticePrompt: 'Did any of that actually happen? So why is the verb in the past?',
    commonErrors: [
      { wrong: 'If I would have known…', right: 'If I had known…' },
      { wrong: 'If I knew, I would have called.', right: 'If I had known, I would have called.' },
      { wrong: 'I would have went.', right: 'I would have gone.' },
    ],
    correctionMethod:
      'Keep “would” out of the if-half here too. Then check the participle after “have”. Model the whole sentence at natural speed.',
    correctionScript: [
      'If-half takes “had”: “If I HAD known, I would have called.”',
      'After “have” we need the third form: “would have GONE.”',
    ],
    controlledPractice: ['If we ___ (leave) earlier, we ___ (catch) the train.'],
    conversationPractice: ['Tell me about a decision you sometimes wonder about. What would have been different?'],
    retrievalCue: 'One small thing from last week you’d do differently — say it in full.',
    fallback: 'Drop to the second conditional about the present; the third can wait a lesson.',
    extension: 'Add “I wish I had…” and “If only…” for the same meaning with more feeling.',
    easierVariant: 'g_conditionals',
    harderVariant: 'g_wish_regret',
    prerequisites: ['g_conditionals', 'g_present_perfect'],
    tags: ['third conditional', 'regret', 'would have', 'hypothetical past'],
  },
  {
    id: 'g_wish_regret',
    title: 'Wishes and regrets (I wish / if only)',
    cefr: 'B2',
    tutorExplanation:
      '“I wish” + past for an unreal present (“I wish I had more time”), + past perfect for a past regret (“I wish I had said something”), + “would” to complain about someone else’s behaviour (“I wish he would listen”).',
    studentExplanation: 'Use “I wish” for something you want to be different — now, or in the past.',
    meaningFirst:
      'Offer a genuine small wish of your own about today. It is a personal structure, and it works best when the tutor goes first.',
    correctExamples: ['I wish I had more time.', 'I wish I hadn’t said that.', 'I wish he would stop.'],
    noticePrompt: 'Two of those are about now and one is about the past. Which is which?',
    commonErrors: [
      { wrong: 'I wish I have more time.', right: 'I wish I had more time.' },
      { wrong: 'I wish I would be taller.', right: 'I wish I were taller.' },
      { wrong: 'I wish I didn’t said that.', right: 'I wish I hadn’t said that.' },
    ],
    correctionMethod:
      'One step back from reality: now → past, past → past perfect. Say the true version and the wish version side by side.',
    correctionScript: [
      'True now, so the wish steps back: “I wish I HAD more time.”',
      'Past regret goes one further: “I wish I HADN’T said that.”',
    ],
    controlledPractice: ['I wish I ___ (can) speak Japanese.', 'She wishes she ___ (not / sell) the car.'],
    conversationPractice: ['Tell me one thing you wish were different about your work or your city, and why.'],
    retrievalCue: 'Give me one “I wish…” about this week.',
    fallback: 'Present wishes only: “I wish I had more ___.”',
    extension: 'Contrast “I wish” with “I hope” — the difference between unreal and still-possible.',
    easierVariant: 'g_conditionals',
    harderVariant: 'g_hedging_register',
    prerequisites: ['g_third_conditional'],
    tags: ['wish', 'regret', 'if only', 'unreal past'],
  },
  {
    id: 'g_causative',
    title: 'Getting something done by someone else',
    cefr: 'B2',
    tutorExplanation:
      '“have/get + object + past participle”: “I had my hair cut”, “We’re getting the kitchen painted”. Learners say “I cut my hair” and accidentally claim they did it themselves.',
    studentExplanation: 'Use “have something done” when someone else does the job for you.',
    meaningFirst:
      'Ask “Did you cut your own hair?” The laugh is the lesson: “No — you HAD it cut.”',
    correctExamples: ['I had my car repaired.', 'She’s getting her flat cleaned.', 'Where do you get your hair cut?'],
    noticePrompt: 'In my sentence, who actually did the work?',
    commonErrors: [
      { wrong: 'I cut my hair yesterday. (at a salon)', right: 'I had my hair cut yesterday.' },
      { wrong: 'I had repaired my car.', right: 'I had my car repaired.' },
      { wrong: 'I made repair my car.', right: 'I had my car repaired.' },
    ],
    correctionMethod: 'Object first, then the third form of the verb. Say the pair “my car repaired” before the full sentence.',
    correctionScript: [
      'Order matters: “I had MY CAR REPAIRED.”',
      'Unless you did it yourself — then “I repaired my car” is right.',
    ],
    controlledPractice: ['We ___ the windows ___ (clean) last month.', 'Where can I ___ this ___ (print)?'],
    conversationPractice: ['What do you do yourself, and what do you have done for you? Why?'],
    retrievalCue: 'Name two things you had done in the last year.',
    fallback: 'One frame: “I had my hair cut.” with three services.',
    extension: 'Add “have someone do something” and the annoyed “I had my phone stolen”.',
    easierVariant: 'g_passive',
    harderVariant: 'g_advanced_cohesion',
    prerequisites: ['g_passive'],
    tags: ['causative', 'have something done', 'get something done', 'services'],
  },

  /* ======================================================================== */
  /* C1 — precision, register and rhetorical control                          */
  /* ======================================================================== */
  {
    id: 'g_advanced_cohesion',
    title: 'Advanced linking & cohesion',
    cefr: 'C1',
    tutorExplanation:
      'Discourse markers and hedging for precise, natural argument: however, nevertheless, whereas, arguably, to some extent, having said that. At this level accuracy is rarely the issue — collocation and register are.',
    studentExplanation: 'Use natural linking words to connect ideas smoothly and sound precise.',
    meaningFirst:
      'Give the same short argument twice — once with only “and/but”, once with real linkers — and ask which one sounded like a professional.',
    correctExamples: [
      'It’s a strong plan; however, the timing is risky.',
      'Whereas the first option is cheap, the second is faster.',
      'That’s true to some extent, but…',
    ],
    noticePrompt: 'Same content, two versions. What made the second one sound more considered?',
    commonErrors: [
      { wrong: 'But however, I disagree.', right: 'However, I disagree.' },
      { wrong: 'In the other hand…', right: 'On the other hand…' },
      { wrong: 'Moreover, I like pizza. (register mismatch)', right: 'Also, I like pizza.' },
    ],
    correctionMethod:
      'At C1, focus on natural collocation and register rather than rules. Offer a more idiomatic phrasing and let them re-say it.',
    correctionScript: [
      'One linker is enough — “However, I disagree.”',
      '“Moreover” is quite formal for pizza. In conversation you’d just say “Also”.',
    ],
    controlledPractice: ['Rephrase “but” with a more formal linker.', 'Add a hedge to soften a strong claim.'],
    conversationPractice: ['Argue both sides of a topic, using at least three different linkers.'],
    retrievalCue: 'Summarise your week in four sentences, each joined by a different linker.',
    fallback: 'Work with three linkers only — however, although, on the other hand — until they are automatic.',
    extension: 'Move to full paragraph shape: signposting, concession, then the strongest point last.',
    easierVariant: 'g_relative_clauses',
    harderVariant: 'g_inversion_emphasis',
    prerequisites: ['g_relative_clauses'],
    tags: ['cohesion', 'discourse markers', 'hedging', 'register', 'linking'],
  },
  {
    id: 'g_inversion_emphasis',
    title: 'Emphasis and inversion',
    cefr: 'C1',
    tutorExplanation:
      'Fronting a negative or limiting phrase forces question word order: “Never have I seen…”, “Not only did she…”. Cleft sentences do the same job more conversationally: “What I really meant was…”, “It was the timing that worried me.”',
    studentExplanation: 'Move a phrase to the front to put weight on it — the sentence then flips like a question.',
    meaningFirst:
      'Say a flat sentence, then the emphatic version, and ask which one sounded like it mattered more. Emphasis is heard before it is analysed.',
    correctExamples: [
      'Never have I seen anything like it.',
      'Not only did she finish early, she also fixed the brief.',
      'What surprised me was how calm he stayed.',
    ],
    noticePrompt: 'After “Never”, my word order flipped. Flipped into what — a statement, or a question?',
    commonErrors: [
      { wrong: 'Never I have seen it.', right: 'Never have I seen it.' },
      { wrong: 'Not only she finished early…', right: 'Not only did she finish early…' },
      { wrong: 'The thing what I meant was…', right: 'What I meant was…' },
    ],
    correctionMethod:
      'Point out that the flip is the whole signal — without it the emphasis reads as an error rather than a choice. Then have them say it at speed, because hesitant inversion sounds worse than none.',
    correctionScript: [
      'The flip is what carries it: “Never HAVE I seen it.”',
      'Cleft sentences are the everyday version: “What I meant was…” — try that instead.',
    ],
    controlledPractice: ['Rewrite with inversion: “I have rarely met someone so direct.”', 'Turn into a cleft: “The timing worried me.”'],
    conversationPractice: ['Tell me about the most surprising thing that happened this year — make me feel the emphasis.'],
    retrievalCue: 'Give me one “What I really…” sentence about your work.',
    fallback: 'Stick to cleft sentences (“What I mean is…”) — same effect, no inversion needed.',
    extension: 'Add “Only when…”, “Little did I know…”, and rhetorical repetition, then have them deliver it as a short speech.',
    easierVariant: 'g_advanced_cohesion',
    harderVariant: 'g_hedging_register',
    prerequisites: ['g_advanced_cohesion'],
    tags: ['inversion', 'emphasis', 'cleft', 'rhetoric', 'fronting'],
  },
  {
    id: 'g_hedging_register',
    title: 'Register, hedging and diplomatic English',
    cefr: 'C1',
    tutorExplanation:
      'The same content sounds blunt or diplomatic depending on hedges (“it seems”, “I’d suggest”, “that may not be quite right”), tentative modals, and softened negatives (“not ideal” rather than “bad”). This is where C1 speakers are judged professionally.',
    studentExplanation: 'Say the same thing more softly or more directly, depending on who you’re talking to.',
    meaningFirst:
      'Give one blunt sentence and ask them to imagine saying it to their manager. The discomfort is the point — then supply the diplomatic version.',
    correctExamples: [
      'I’m not sure that’s quite right.',
      'It might be worth reconsidering the timeline.',
      'That’s not ideal, but it’s workable.',
    ],
    noticePrompt: 'Both versions say “no”. Which one could you send to a client?',
    commonErrors: [
      { wrong: 'You are wrong.', right: 'I’m not sure I’d agree with that.' },
      { wrong: 'I want you to change it.', right: 'Would it be possible to adjust it?' },
      { wrong: 'It is impossible. (in a negotiation)', right: 'That would be difficult for us.' },
    ],
    correctionMethod:
      'Never mark this as an error — it is a choice. Offer the alternative register, name the situation it fits, and let them pick.',
    correctionScript: [
      'That works with a friend. With a client you’d soften it: “I’m not sure that’s quite right.”',
      'Try the same sentence three ways: blunt, neutral, diplomatic.',
    ],
    controlledPractice: ['Soften: “That won’t work.”', 'Make direct: “It might perhaps be somewhat delayed.”'],
    conversationPractice: ['Role-play declining a request from someone senior to you, then from a close colleague.'],
    retrievalCue: 'Give me a piece of critical feedback twice — once bluntly, once diplomatically.',
    fallback: 'Work with three hedges only: “I think”, “maybe”, “it seems”.',
    extension: 'Add cultural range — how directness differs between their language and American English, and when bluntness is the right call.',
    easierVariant: 'g_advanced_cohesion',
    prerequisites: ['g_advanced_cohesion'],
    tags: ['register', 'hedging', 'diplomacy', 'politeness', 'nuance'],
  },
]

export function getGrammarById(id: string): GrammarConcept | undefined {
  return grammarLibrary.find((g) => g.id === id)
}

/** Concepts at a given CEFR level. */
export function grammarByCefr(cefr: GrammarConcept['cefr']): GrammarConcept[] {
  return grammarLibrary.filter((g) => g.cefr === cefr)
}

/**
 * Match an observed learner error to the concept that teaches it, by scanning
 * both the tag list and the recorded common errors. Used so a recurring error
 * captured during a lesson can choose the NEXT lesson's objective instead of
 * the generator falling back to whatever sits first in the library.
 */
/**
 * The concept a captured error belongs to, matched on the CORRECTION itself.
 *
 * `findGrammarForError` scores on how much of a recorded error's wording is
 * present, which works when the tutor's sentence resembles the library's — and
 * misses when it does not. This adds the higher-precision signal: if the tutor
 * changed "go" to "goes", and this concept lists an error that changes "go" to
 * "goes", it is that concept, no matter what the rest of the sentence said.
 */
export function findGrammarByCorrection(said: string, better: string): GrammarConcept | undefined {
  const sig = editSignature(said, better)
  if (sig.length === 0) return undefined
  for (const concept of grammarLibrary) {
    for (const err of concept.commonErrors) {
      if (signaturesOverlap(sig, editSignature(err.wrong, err.right))) return concept
    }
  }
  return undefined
}

export function findGrammarForError(text: string): GrammarConcept | undefined {
  const needle = text.toLocaleLowerCase()
  const words = new Set(needle.match(/[\p{L}\p{N}’']+/gu) ?? [])
  if (words.size === 0) return undefined

  /* Tutors type what they actually heard ("Yesterday I go to the shop"), not
     the library's example sentence, so an exact substring match almost never
     fires. Scoring on how much of a recorded error's wording is present is what
     makes this work on real input, while the 0.7 threshold keeps a partial
     overlap ("go to school") from claiming every sentence with "go" in it. */
  const overlap = (phrase: string): number => {
    const tokens = phrase.toLocaleLowerCase().match(/[\p{L}\p{N}’']+/gu) ?? []
    if (tokens.length === 0) return 0
    const hits = tokens.filter((token) => words.has(token)).length
    return hits / tokens.length
  }

  let best: { concept: GrammarConcept; score: number } | undefined
  for (const concept of grammarLibrary) {
    let score = 0
    for (const tag of concept.tags) {
      if (needle.includes(tag.toLocaleLowerCase())) score += tag.length
    }
    for (const err of concept.commonErrors) {
      const ratio = overlap(err.wrong)
      if (ratio >= 0.7) score += 40 * ratio
    }
    if (score > 0 && (!best || score > best.score)) best = { concept, score }
  }
  return best?.concept
}
