/* ==========================================================================
   Dedicated Pre-A1 curriculum — reusable activity templates.
   --------------------------------------------------------------------------
   Real beginner teaching content so lessons never fall back to A1 assumptions.
   Each template is a short, self-contained micro-activity with:
     • a native-language-ready student instruction (studentPromptKey),
     • an English target to MODEL aloud (speak),
     • the at-a-glance autopilot (SAY / DO / LOOK FOR / NEXT), and
     • the deeper tutor card underneath.
   Templates are tagged by internal stage (P0…P3) and audience (child/adult) so
   the generator can compose weeks of varied lessons without repeating, and so a
   5-year-old and a 65-year-old never get the same presentation.
   Quality and reuse over volume (per the brief).
   ========================================================================== */

import { LessonPhaseKind, PreA1Stage, TutorAutopilot, TutorCard } from '../types'

export type BeginnerTheme =
  | 'greetings'
  | 'names'
  | 'yesNo'
  | 'courtesy'
  | 'numbers'
  | 'colors'
  | 'objects'
  | 'food'
  | 'family'
  | 'actions'
  | 'body'
  | 'phonics'
  | 'sightWords'
  | 'chunks'
  | 'questions'
  | 'movement'
  /* Added after a coverage audit found P0 and P3 too thin to fill a lesson
     without repeating — see the note above `beginnerActivities`. */
  | 'listening'
  | 'sounds'
  | 'feelings'
  | 'classroom'
  | 'routine'
  | 'place'
  | 'weather'
  | 'reading'

export interface BeginnerActivityTemplate {
  id: string
  theme: BeginnerTheme
  /** Internal Pre-A1 stages this activity suits. */
  stages: PreA1Stage[]
  kind: LessonPhaseKind
  audience: 'child' | 'adult' | 'both'
  /** Tutor-facing short title. */
  title: string
  /** i18n key for the native-language instruction shown to a non-reader. */
  studentPromptKey: string
  /** English fallback instruction (also shown to learners who can read English). */
  studentPrompt: string
  /** English target to model aloud (Speech Synthesis / tutor voice). */
  speak?: string
  minutes: number
  /** A movement / reset activity — used to break up young-child lessons. */
  movement?: boolean
  autopilot: TutorAutopilot
  tutorCard: TutorCard
}

/* Shared "avoid" guidance for true beginners — no grammar lectures at P0. */
const NO_LECTURE = 'Explaining grammar terms. Teach the whole phrase as a chunk; the pattern comes later.'

/**
 * A coverage audit across (stage × audience) found two real holes: a P0 adult
 * lesson could draw on only three activities for a six-slot lesson, and P3 had
 * three or four for either audience. Both meant a weekly learner met the same
 * activity again the following week — exactly the repetition the recency window
 * exists to prevent. The templates tagged 'listening', 'sounds', 'feelings',
 * 'classroom', 'routine', 'place', 'weather' and 'reading' close those gaps
 * with genuinely different activity SHAPES, not variations on the same drill.
 */
export const beginnerActivities: BeginnerActivityTemplate[] = [
  /* ---------------------------- Greetings ---------------------------- */
  {
    id: 'b_greet_adult',
    theme: 'greetings',
    stages: ['P0', 'P1'],
    kind: 'warmup',
    audience: 'adult',
    title: 'Greeting: “Hello”',
    studentPromptKey: 'beginner.prompt.greetAdult',
    studentPrompt: 'Listen, then say “Hello.” Try it a few times.',
    speak: 'Hello',
    minutes: 5,
    autopilot: {
      say: ['Hello! I’m Binyamin.', 'Now you: “Hello.”'],
      do: ['Wave as you say “Hello.”', 'Point to yourself for your name, then open your hand toward the learner.'],
      lookFor: ['Do they say “Hello” back?', 'Is it clear enough to understand?'],
      next: ['Says it clearly → tap Harder (add “How are you?”)', 'Says it with help → Continue', 'No response → tap Easier (just wave + one word)'],
      teacherTip: 'A warm smile and a wave carry more meaning than words at this stage.',
    },
    tutorCard: {
      goal: 'A first, low-pressure spoken success: “Hello.”',
      listenFor: ['A clear /h/ at the start', 'Willingness to try out loud'],
      ifStruggle: 'Just wave and say “Hi” — one syllable is fine to start.',
      ifSucceed: 'Add “How are you?” and model “I’m good.”',
      howToExplain: 'We say “Hello” or “Hi” when we meet someone.',
      model: ['Hello.', 'Hi!'],
      practice: ['Wave and say “Hello” three times.'],
      avoid: [NO_LECTURE],
    },
  },
  {
    id: 'b_greet_child',
    theme: 'greetings',
    stages: ['P0', 'P1'],
    kind: 'warmup',
    audience: 'child',
    title: 'Hello + wave game',
    studentPromptKey: 'beginner.prompt.greetChild',
    studentPrompt: 'Wave and say “Hello!” Then wave and say “Bye!”',
    speak: 'Hello',
    minutes: 4,
    autopilot: {
      say: ['Helloooo!', 'Can you wave? Say “Hello!”', 'Now… “Bye-bye!”'],
      do: ['Wave big and smile.', 'Hide your eyes, peek, and say “Hello!” like peekaboo.'],
      lookFor: ['Do they copy the wave?', 'Do they try the word?'],
      next: ['Copies happily → Continue to names', 'Only waves → that’s a win, Continue', 'Shy → keep it playful, tap Easier'],
      teacherTip: 'For a 5-year-old, copying your action IS success — words follow movement.',
    },
    tutorCard: {
      goal: 'Playful first contact with “Hello” / “Bye.”',
      listenFor: ['Any attempt to imitate', 'Engagement over accuracy'],
      ifStruggle: 'Just do the wave together — no words needed yet.',
      ifSucceed: 'Add a puppet or toy that says “Hello” too.',
      howToExplain: 'Keep it as a game, not a lesson.',
      model: ['Hello!', 'Bye-bye!'],
      practice: ['Wave hello to three things in the room.'],
      avoid: ['Sitting still too long — keep it moving.'],
    },
  },

  /* ------------------------------ Names ------------------------------ */
  {
    id: 'b_name',
    theme: 'names',
    stages: ['P0', 'P1', 'P2'],
    kind: 'speakingListening',
    audience: 'both',
    title: 'Chunk: “My name is…”',
    studentPromptKey: 'beginner.prompt.name',
    studentPrompt: 'Listen: “My name is Binyamin.” Now you: “My name is ___.”',
    speak: 'My name is Binyamin. What is your name?',
    minutes: 5,
    autopilot: {
      say: ['My name is Binyamin.', 'What’s your name?', 'Great — “My name is ___.”'],
      do: ['Point to yourself on “My name is”, then to the learner on “your name”.'],
      lookFor: ['Do they give their name?', 'Do they use the whole chunk “My name is…”?'],
      next: ['Full chunk → tap Harder (ask “How old are you?”)', 'Just the name → Continue, model the chunk again', 'Nothing → tap Easier (point + name only)'],
      teacherTip: 'Teach “My name is…” as ONE piece. Do not explain “is” — that’s grammar for later.',
    },
    tutorCard: {
      goal: 'Produce a first useful sentence chunk about themselves.',
      listenFor: ['Whole-chunk production vs. single word', 'Clarity of their name in English rhythm'],
      ifStruggle: 'Accept just the name; you supply “My name is…”.',
      ifSucceed: 'Exchange names back and forth, then add “Nice to meet you.”',
      howToExplain: '“My name is…” is how we tell someone our name.',
      model: ['My name is Binyamin.', 'Nice to meet you.'],
      practice: ['Say “My name is ___” three times.'],
      avoid: [NO_LECTURE],
    },
  },

  /* --------------------------- Yes / No ----------------------------- */
  {
    id: 'b_yesno',
    theme: 'yesNo',
    stages: ['P0', 'P1'],
    kind: 'speakingListening',
    audience: 'both',
    title: 'Yes / No',
    studentPromptKey: 'beginner.prompt.yesNo',
    studentPrompt: 'Answer “Yes” or “No.” (Is this an apple? 🍎)',
    speak: 'Yes. No.',
    minutes: 4,
    autopilot: {
      say: ['Is this an apple? (hold up 🍎) … Yes!', 'Is this a car? (hold up 🍎) … No!'],
      do: ['Nod your head for “Yes”, shake it for “No”.', 'Show real objects or pictures.'],
      lookFor: ['Do they match “Yes/No” to the right object?', 'Head nod/shake used correctly?'],
      next: ['Correct + spoken → tap Harder', 'Correct with gesture only → Continue', 'Confused → tap Easier (one object, obvious yes)'],
    },
    tutorCard: {
      goal: 'Reliable comprehension + use of “Yes/No.”',
      listenFor: ['Comprehension shown by gesture even before speech'],
      ifStruggle: 'Use only clear yes cases first, then contrast with one no.',
      ifSucceed: 'Ask “Do you like apples?” for a personal yes/no.',
      howToExplain: '“Yes” = right / I agree. “No” = not right.',
      model: ['Yes.', 'No.'],
      practice: ['Point to 3 things — is it a book? Yes/No.'],
      avoid: ['Trick questions — keep answers obvious at first.'],
    },
  },

  /* --------------------------- Courtesy ----------------------------- */
  {
    id: 'b_courtesy',
    theme: 'courtesy',
    stages: ['P1', 'P2'],
    kind: 'speakingListening',
    audience: 'both',
    title: 'Please / Thank you',
    studentPromptKey: 'beginner.prompt.courtesy',
    studentPrompt: 'Listen and repeat: “Thank you.” “Please.”',
    speak: 'Thank you. Please.',
    minutes: 4,
    autopilot: {
      say: ['Here you go. (hand them something) … “Thank you!”', 'Can I have it, please?'],
      do: ['Pass an object back and forth to trigger “thank you”.'],
      lookFor: ['Do they say “thank you” when receiving?', 'Clarity of “th”? (don’t over-correct yet)'],
      next: ['Uses both naturally → Continue', 'Uses one → Continue, model the other', 'Neither → tap Easier'],
      teacherTip: 'Don’t drill the “th” sound here — reward the polite phrase; refine sounds later.',
    },
    tutorCard: {
      goal: 'Two high-frequency courtesy chunks used in context.',
      listenFor: ['Use in the right moment more than perfect sounds'],
      ifStruggle: 'Model and let them echo immediately.',
      ifSucceed: 'Add “You’re welcome.”',
      howToExplain: 'We say “please” to ask nicely and “thank you” when we get something.',
      model: ['Please.', 'Thank you.', 'You’re welcome.'],
      practice: ['Trade an object 3 times using the phrases.'],
      avoid: [NO_LECTURE],
    },
  },

  /* ---------------------------- Numbers ----------------------------- */
  {
    id: 'b_numbers',
    theme: 'numbers',
    stages: ['P1', 'P2'],
    kind: 'vocabulary',
    audience: 'both',
    title: 'Numbers 1–5',
    studentPromptKey: 'beginner.prompt.numbers',
    studentPrompt: 'Count together: one, two, three, four, five.',
    speak: 'one, two, three, four, five',
    minutes: 5,
    autopilot: {
      say: ['One… two… three… four… five.', 'Now you count with me.', 'How many? (show 3 fingers)'],
      do: ['Hold up fingers as you count.', 'Point to objects and count them together.'],
      lookFor: ['Do they count in order?', 'Can they answer “how many?” for a small set?'],
      next: ['Counts to 5 alone → tap Harder (6–10)', 'Counts with help → Continue', 'Loses order → tap Easier (1–3)'],
    },
    tutorCard: {
      goal: 'Recognize and produce numbers 1–5.',
      listenFor: ['Sequence accuracy', '“three” vs “free” (note, don’t drill)'],
      ifStruggle: 'Count 1–3 only, with fingers.',
      ifSucceed: 'Count real objects; ask “how many?”.',
      howToExplain: 'We count: one, two, three…',
      model: ['one, two, three, four, five'],
      practice: ['Count fingers, then count 3 objects.'],
      avoid: ['Rushing — let each number land.'],
    },
  },

  /* ----------------------------- Colors ----------------------------- */
  {
    id: 'b_colors',
    theme: 'colors',
    stages: ['P1', 'P2'],
    kind: 'vocabulary',
    audience: 'both',
    title: 'Colors',
    studentPromptKey: 'beginner.prompt.colors',
    studentPrompt: 'Point to something red. Now blue. Now green.',
    speak: 'red, blue, green, yellow',
    minutes: 5,
    autopilot: {
      say: ['This is red. (point) Find something red.', 'Good — what color is this? (hold up blue)'],
      do: ['Point to colored objects in the room.', 'Give a color word, let them find a match.'],
      lookFor: ['Do they point to the right color?', 'Can they name a color they see?'],
      next: ['Names colors → tap Harder (“It’s a red ball.”)', 'Points correctly → Continue', 'Guessing → tap Easier (two colors only)'],
    },
    tutorCard: {
      goal: 'Recognize and name 3–4 basic colors.',
      listenFor: ['Reception (pointing) before production (naming)'],
      ifStruggle: 'Two strongly-contrasting colors only (red/blue).',
      ifSucceed: 'Combine: “a red car”, “a blue book”.',
      howToExplain: 'Colors: red, blue, green, yellow.',
      model: ['red', 'blue', 'It’s a red ball.'],
      practice: ['Find 3 colors in the room.'],
      avoid: [NO_LECTURE],
    },
  },

  /* --------------------------- Objects ------------------------------ */
  {
    id: 'b_objects',
    theme: 'objects',
    stages: ['P1', 'P2'],
    kind: 'vocabulary',
    audience: 'both',
    title: 'Everyday objects',
    studentPromptKey: 'beginner.prompt.objects',
    studentPrompt: 'Listen and point: book, pen, cup, phone.',
    speak: 'book, pen, cup, phone',
    minutes: 5,
    autopilot: {
      say: ['This is a book. (hold it up)', 'Where is the cup? Point to it.', 'What is this?'],
      do: ['Use real objects on the table.', 'Say a word; they touch/point to it.'],
      lookFor: ['Do they point to the correct object when they hear it?'],
      next: ['Names objects → tap Harder (“It’s a book.”)', 'Points correctly → Continue', 'Unsure → tap Easier (two objects)'],
    },
    tutorCard: {
      goal: 'Match spoken words to common objects (listening-first).',
      listenFor: ['Word-to-object matching accuracy'],
      ifStruggle: 'Two objects only; exaggerate the difference.',
      ifSucceed: 'Ask “What is this?” for production.',
      howToExplain: 'Name the thing: “a book”, “a cup”.',
      model: ['a book', 'a cup', 'It’s a pen.'],
      practice: ['Point to 4 objects as you hear them.'],
      avoid: ['Abstract words — keep it concrete and visible.'],
    },
  },

  /* ------------------------------ Food ------------------------------ */
  {
    id: 'b_food',
    theme: 'food',
    stages: ['P1', 'P2', 'P3'],
    kind: 'communication',
    audience: 'both',
    title: 'Food & drink + “I like…”',
    studentPromptKey: 'beginner.prompt.food',
    studentPrompt: 'Say what you like: “I like ___.” (water, apple, bread, tea)',
    speak: 'water, apple, bread, I like tea',
    minutes: 5,
    autopilot: {
      say: ['This is water. I like water.', 'Do you like apples? … “I like apples.”'],
      do: ['Show food pictures/emoji.', 'Point to each and model “I like…”.'],
      lookFor: ['Do they use “I like ___”?', 'Real communication of a preference?'],
      next: ['Uses the chunk → tap Harder (“I don’t like…”)', 'Names food only → Continue', 'Silent → tap Easier (point to what they like)'],
      teacherTip: 'This is a real communication win — they’re expressing a genuine preference.',
    },
    tutorCard: {
      goal: 'Food vocabulary inside the useful chunk “I like…”.',
      listenFor: ['Whole-chunk use', 'Genuine preference, not just repetition'],
      ifStruggle: 'They point to a liked food; you voice “I like ___.”',
      ifSucceed: 'Contrast with “I don’t like ___.”',
      howToExplain: '“I like…” tells people what you enjoy.',
      model: ['I like water.', 'I don’t like coffee.'],
      practice: ['Name 3 foods you like.'],
      avoid: [NO_LECTURE],
    },
  },

  /* ----------------------------- Family ----------------------------- */
  {
    id: 'b_family',
    theme: 'family',
    stages: ['P2', 'P3'],
    kind: 'communication',
    audience: 'adult',
    title: 'People & family',
    studentPromptKey: 'beginner.prompt.family',
    studentPrompt: 'Say who is in your family: “mother, father, sister, brother.”',
    speak: 'mother, father, sister, brother',
    minutes: 5,
    autopilot: {
      say: ['This is my family. My mother, my father.', 'Who is in your family?'],
      do: ['Draw simple stick figures or show photos.', 'Point to each person as you name them.'],
      lookFor: ['Family words produced', 'Any use of “my ___”'],
      next: ['Uses “my mother” etc. → tap Harder', 'Names people → Continue', 'Struggles → tap Easier (point + one word)'],
    },
    tutorCard: {
      goal: 'Core people/family vocabulary with “my ___”.',
      listenFor: ['“my” + family word', 'Comfortable, dignified adult framing'],
      ifStruggle: 'One relationship at a time.',
      ifSucceed: 'Add numbers: “I have two sisters.”',
      howToExplain: 'We say “my mother”, “my brother”.',
      model: ['my mother', 'I have one brother.'],
      practice: ['Name three people in your family.'],
      avoid: ['Childish visuals for adults — keep it respectful.'],
    },
  },

  /* ---------------------------- Actions ----------------------------- */
  {
    id: 'b_actions_child',
    theme: 'actions',
    stages: ['P0', 'P1', 'P2'],
    kind: 'speakingListening',
    audience: 'child',
    title: 'Action words (TPR)',
    studentPromptKey: 'beginner.prompt.actionsChild',
    studentPrompt: 'Do it! Stand up. Sit down. Jump. Clap.',
    speak: 'stand up, sit down, jump, clap',
    minutes: 4,
    movement: true,
    autopilot: {
      say: ['Stand up! (stand) Sit down! (sit)', 'Can you jump? Jump!', 'Clap your hands!'],
      do: ['Do each action first, then have the child copy.', 'Speed it up like a game (Simon Says).'],
      lookFor: ['Do they respond to the command by moving?'],
      next: ['Follows commands → tap Harder (add “turn around”)', 'Follows with a model → Continue', 'Unsure → tap Easier (2 actions)'],
      teacherTip: 'Total Physical Response: understanding is shown by the body before the mouth.',
    },
    tutorCard: {
      goal: 'Understand simple action commands through movement.',
      listenFor: ['Comprehension via correct movement'],
      ifStruggle: 'Two actions only; always model first.',
      ifSucceed: 'Let the child give YOU commands.',
      howToExplain: 'Say it, then do it together.',
      model: ['Stand up.', 'Sit down.', 'Jump!'],
      practice: ['Play “Simon Says” with 3 actions.'],
      avoid: ['Long stretches of sitting.'],
    },
  },
  {
    id: 'b_actions_adult',
    theme: 'actions',
    stages: ['P1', 'P2'],
    kind: 'speakingListening',
    audience: 'adult',
    title: 'Everyday actions',
    studentPromptKey: 'beginner.prompt.actionsAdult',
    studentPrompt: 'Listen and match: eat, drink, go, come, sit.',
    speak: 'eat, drink, go, come',
    minutes: 4,
    autopilot: {
      say: ['I eat. (mime) I drink. (mime)', 'Show me “drink”.', 'What am I doing?'],
      do: ['Mime each verb clearly.', 'Ask them to mime a verb you say.'],
      lookFor: ['Verb-to-meaning matching', 'Any spoken production of the verb'],
      next: ['Says verbs → tap Harder (“I eat bread.”)', 'Mimes correctly → Continue', 'Unclear → tap Easier'],
    },
    tutorCard: {
      goal: 'Core everyday verbs, matched to meaning via mime.',
      listenFor: ['Comprehension before production'],
      ifStruggle: 'Pair each verb with an obvious gesture.',
      ifSucceed: 'Combine with food: “I drink water.”',
      howToExplain: 'Action words: eat, drink, go, come.',
      model: ['I eat.', 'I drink water.'],
      practice: ['Mime and say three verbs.'],
      avoid: [NO_LECTURE],
    },
  },

  /* ------------------------------ Body ------------------------------ */
  {
    id: 'b_body',
    theme: 'body',
    stages: ['P1', 'P2'],
    kind: 'vocabulary',
    audience: 'both',
    title: 'Body words',
    studentPromptKey: 'beginner.prompt.body',
    studentPrompt: 'Touch it: head, hand, eye, nose.',
    speak: 'head, hand, eye, nose',
    minutes: 4,
    movement: true,
    autopilot: {
      say: ['Touch your head. (touch yours)', 'Where is your nose?', 'This is my hand.'],
      do: ['Touch each body part as you name it.', 'Play a “touch your…” game, faster each time.'],
      lookFor: ['Do they touch the correct part when they hear the word?'],
      next: ['Names parts → tap Harder', 'Touches correctly → Continue', 'Mixed up → tap Easier (2 parts)'],
    },
    tutorCard: {
      goal: 'Recognize basic body vocabulary through touch.',
      listenFor: ['Word-to-body matching'],
      ifStruggle: 'Head and hand only, exaggerated.',
      ifSucceed: 'Add “my head hurts” for a real phrase.',
      howToExplain: 'Point and name: head, hand, eye, nose.',
      model: ['head', 'my hand'],
      practice: ['Touch 4 parts as you hear them.'],
      avoid: ['Overloading with too many parts at once.'],
    },
  },

  /* ----------------------------- Phonics ---------------------------- */
  {
    id: 'b_phonics',
    theme: 'phonics',
    stages: ['P2', 'P3'],
    kind: 'pronunciation',
    audience: 'child',
    title: 'Letter sounds /b/ /m/ /s/',
    studentPromptKey: 'beginner.prompt.phonics',
    studentPrompt: 'Hear the first sound: “ball” starts with /b/.',
    speak: 'b, ball. m, mama. s, sun.',
    minutes: 5,
    autopilot: {
      say: ['/b/… /b/… ball!', 'What starts with /b/ — ball or sun?', 'Your turn: /b/.'],
      do: ['Exaggerate the mouth shape for each sound.', 'Sort a few picture words by first sound.'],
      lookFor: ['Do they hear the difference between first sounds?', 'Can they produce the sound?'],
      next: ['Matches sounds → tap Harder (blend /b/ + /a/)', 'Repeats sound → Continue', 'Confused → tap Easier (one sound)'],
      teacherTip: 'Sound first, letter name later. “/b/” not “bee”. This builds real reading.',
    },
    tutorCard: {
      goal: 'Early phonemic awareness: first sounds of words.',
      listenFor: ['Hearing initial sounds', 'Sound (not letter-name) production'],
      ifStruggle: 'Contrast two very different sounds (/b/ vs /s/).',
      ifSucceed: 'Blend a simple CVC: /s/-/u/-/n/ → “sun”.',
      howToExplain: 'Every word starts with a sound. Ball → /b/.',
      model: ['/b/ — ball', '/s/ — sun'],
      practice: ['Find 2 things that start with /b/.'],
      avoid: ['Teaching letter names before sounds; drilling too long.'],
    },
  },

  /* --------------------------- Sight words -------------------------- */
  {
    id: 'b_sightwords',
    theme: 'sightWords',
    stages: ['P3'],
    kind: 'reading',
    audience: 'both',
    title: 'First written words',
    studentPromptKey: 'beginner.prompt.sightWords',
    studentPrompt: 'Read these words you know: I, you, yes, no, and.',
    speak: 'I, you, yes, no, and',
    minutes: 5,
    autopilot: {
      say: ['This says “yes”. (point) This says “no”.', 'Which one is “yes”?', 'Read this one.'],
      do: ['Show each word on a card next to a familiar spoken word.', 'Point under the word as you say it.'],
      lookFor: ['Do they recognize the WHOLE word by sight?', 'Only for words they already say well.'],
      next: ['Reads the words → tap Harder (short phrase)', 'Recognizes some → Continue', 'Not yet → tap Easier (back to sounds/speaking)'],
      teacherTip: 'Only put in writing words they can already SAY. Speaking leads reading.',
    },
    tutorCard: {
      goal: 'Recognize a few very common written words by sight.',
      listenFor: ['Sight recognition of known spoken words'],
      ifStruggle: 'Return to the spoken word; try reading later.',
      ifSucceed: 'Read a two-word phrase: “I like”.',
      howToExplain: 'These are words we already say. Now we can see them.',
      model: ['yes', 'no', 'I like'],
      practice: ['Match 3 spoken words to their cards.'],
      avoid: ['Introducing written words they can’t yet say.'],
    },
  },

  /* ---------------------------- Questions --------------------------- */
  {
    id: 'b_questions',
    theme: 'questions',
    stages: ['P2', 'P3'],
    kind: 'communication',
    audience: 'both',
    title: 'Basic questions',
    studentPromptKey: 'beginner.prompt.questions',
    studentPrompt: 'Ask me: “What is this?” Answer: “It’s a ___.”',
    speak: 'What is this? It is a book.',
    minutes: 5,
    autopilot: {
      say: ['What is this? … It’s a cup.', 'Now you ask me: “What is this?”'],
      do: ['Hold up objects to trigger the question.', 'Swap roles so they ask too.'],
      lookFor: ['Can they ask the question?', 'Can they answer “It’s a ___”?'],
      next: ['Asks & answers → tap Harder (“Where is…?”)', 'Answers only → Continue', 'Struggles → tap Easier (answer only)'],
    },
    tutorCard: {
      goal: 'A first question-and-answer exchange.',
      listenFor: ['Question intonation (rising)', '“It’s a ___” chunk'],
      ifStruggle: 'They answer your questions before asking their own.',
      ifSucceed: 'Add “Where is the ___?” with pointing.',
      howToExplain: '“What is this?” asks about a thing. “It’s a ___” answers.',
      model: ['What is this?', 'It’s a book.'],
      practice: ['Ask about 3 objects.'],
      avoid: [NO_LECTURE],
    },
  },

  /* ------------------- P0: before any production -------------------- */
  {
    id: 'b_listen_point',
    theme: 'listening',
    stages: ['P0', 'P1'],
    kind: 'listening',
    audience: 'both',
    title: 'Listening first — point to what you hear',
    studentPromptKey: 'beginner.prompt.listenPoint',
    studentPrompt: 'Listen. Point to the thing you hear. You do not have to speak.',
    speak: 'cup. book. phone.',
    minutes: 4,
    autopilot: {
      now: 'Pure listening. Three real objects on the table, no speaking required yet.',
      say: ['Cup. … Point to the cup.', 'Book. … Where is the book?', 'Phone.'],
      do: [
        'Put three real objects between you.',
        'Say one word, then wait. Do not point yourself — let them choose.',
      ],
      studentDoes: ['Listens, then points to the object. No English out loud at all.'],
      lookFor: ['Do they point to the right one?', 'Do they hesitate, or answer immediately?'],
      help: ['Take one object away, leaving two. With two, a correct guess is still a real success.'],
      challenge: ['Add a fourth object, or say two words in a row for them to point to in order.'],
      doneWhen: 'They point correctly to each of the three, in any order.',
      next: ['Move to saying one of the words out loud.'],
      teacherTip:
        'Understanding always arrives before speaking. A learner who points correctly is learning, even in total silence — do not push for words yet.',
    },
    tutorCard: {
      goal: 'Establish comprehension before any production is asked for.',
      listenFor: ['Correct pointing', 'speed of recognition'],
      ifStruggle: 'Two objects only, strongly different.',
      ifSucceed: 'Ask them to hand you the object you name.',
      howToExplain: 'Say the word, wait, let them choose. Nothing else.',
      model: ['cup', 'book', 'phone'],
      practice: ['Point to each of three objects as you hear it.'],
      avoid: ['Demanding speech at P0. Silence is not failure.'],
    },
  },
  {
    id: 'b_sound_copy',
    theme: 'sounds',
    stages: ['P0', 'P1'],
    kind: 'pronunciation',
    audience: 'both',
    title: 'Copy my sound',
    studentPromptKey: 'beginner.prompt.soundCopy',
    studentPrompt: 'Listen and copy the sound. It does not need to mean anything yet.',
    speak: 'th. r. w.',
    minutes: 4,
    autopilot: {
      now: 'Pure imitation of English sounds, with no meaning attached.',
      say: ['Watch my mouth: /th/. Now you.', '/r/ … /r/. Your turn.', 'Good — again, a bit longer.'],
      do: [
        'Face them so your mouth is clearly visible.',
        'Exaggerate the mouth shape, then say it normally.',
      ],
      studentDoes: ['Watches your mouth and copies the sound out loud.'],
      lookFor: ['Is the mouth shape right, even if the sound is not yet?', 'Willingness to try a strange sound.'],
      help: ['Pick the easiest sound of the three and stay on it. Use a mirror so they can see their own mouth.'],
      challenge: ['Put the sound into one real word, then into two.'],
      doneWhen: 'They attempt each sound out loud, whatever the accuracy.',
      next: ['Attach one of the sounds to a real word they already know.'],
      teacherTip:
        'Freeing a beginner from meaning for two minutes is what lets them experiment with their mouth. Accuracy comes later.',
    },
    tutorCard: {
      goal: 'Physical practice of unfamiliar English sounds, with no meaning load.',
      listenFor: ['Mouth position more than sound accuracy', 'willingness to try'],
      ifStruggle: 'One sound only, exaggerated, with a mirror.',
      ifSucceed: 'Move the sound into a familiar word.',
      howToExplain: 'Show, don’t describe. The mouth is the explanation.',
      model: ['/th/ — think', '/r/ — red'],
      practice: ['Copy three sounds, three times each.'],
      avoid: ['Correcting hard at this stage — this is exploration.'],
    },
  },
  {
    id: 'b_this_is',
    theme: 'chunks',
    stages: ['P0', 'P1'],
    kind: 'speakingListening',
    audience: 'adult',
    title: 'Chunk: “This is a ___”',
    studentPromptKey: 'beginner.prompt.thisIs',
    studentPrompt: 'Listen: “This is a cup.” Now you: “This is a ___.”',
    speak: 'This is a cup. This is a book.',
    minutes: 5,
    autopilot: {
      now: 'First full sentence about an object — a real one, said by them.',
      say: ['This is a cup.', 'This is a book.', 'Now you — this is a…?'],
      do: ['Hold up each object as you say the phrase.', 'Then hand them the object and wait.'],
      studentDoes: ['Holds the object and says the whole phrase, not just the noun.'],
      lookFor: ['Do they produce the whole chunk, or only the last word?'],
      help: ['You say “This is a…” and let them supply only the noun. That is still a shared sentence.'],
      challenge: ['Switch to “What is this?” and let them ask you.'],
      doneWhen: 'They say the full phrase for two different objects.',
      next: ['Move to yes/no questions about the same objects.'],
      teacherTip:
        'Teach “This is a” as ONE piece of sound. Do not explain “is” or “a” — that is grammar, and it is months away.',
    },
    tutorCard: {
      goal: 'A first complete spoken sentence, about something they can hold.',
      listenFor: ['Whole-chunk production', 'clarity of the noun'],
      ifStruggle: 'You supply the frame, they supply the noun.',
      ifSucceed: 'Add “What is this?” so they can ask as well as answer.',
      howToExplain: '“This is a ___” names the thing in your hand.',
      model: ['This is a cup.', 'This is a book.'],
      practice: ['Name three objects with the full phrase.'],
      avoid: [NO_LECTURE],
    },
  },
  {
    id: 'b_colors_receptive',
    theme: 'colors',
    stages: ['P0', 'P1'],
    kind: 'listening',
    audience: 'both',
    title: 'Point to the colour you hear',
    studentPromptKey: 'beginner.prompt.colorsReceptive',
    studentPrompt: 'Listen and point. Red… blue… You do not have to say the word.',
    speak: 'red. blue. green.',
    minutes: 4,
    autopilot: {
      now: 'Colour words, understood before they are spoken.',
      say: ['Red. … Point to something red.', 'Blue.', 'Where is green?'],
      do: [
        'Lay out three strongly different coloured objects.',
        'Say the colour, wait, and let them choose. Do not point yourself.',
      ],
      studentDoes: ['Points to the right colour. No speaking required.'],
      lookFor: ['Correct pointing', 'how quickly they decide'],
      help: ['Two colours only, as different as possible — red and blue.'],
      challenge: ['Ask them to name the colour, or to find a second thing that colour.'],
      doneWhen: 'They point correctly to three colours in a row.',
      next: ['Move on, or ask them to name one of the colours.'],
      teacherTip: 'At P0, pointing IS the answer. Asking for the word too early turns a success into a failure.',
    },
    tutorCard: {
      goal: 'Recognise colour words by ear, before producing them.',
      listenFor: ['Reception before production'],
      ifStruggle: 'Two contrasting colours only.',
      ifSucceed: 'Ask them to name one.',
      howToExplain: 'Say the colour and let the objects explain it.',
      model: ['red', 'blue', 'green'],
      practice: ['Point to three colours as you hear them.'],
      avoid: ['Demanding the spoken word at this stage.'],
    },
  },
  {
    id: 'b_numbers_first',
    theme: 'numbers',
    stages: ['P0', 'P1'],
    kind: 'vocabulary',
    audience: 'both',
    title: 'One, two, three',
    studentPromptKey: 'beginner.prompt.numbersFirst',
    studentPrompt: 'Count with me on your fingers: one, two, three.',
    speak: 'one, two, three',
    minutes: 4,
    autopilot: {
      now: 'The first three numbers, on fingers, with nothing else to hold in mind.',
      say: ['One… two… three.', 'Now with me.', 'How many? (hold up two fingers)'],
      do: ['Hold up fingers as you count.', 'Count real objects — three cups, three pens.'],
      studentDoes: ['Counts along on their fingers and says the numbers out loud.'],
      lookFor: ['Do the words and the fingers stay together?', 'Can they answer “how many?” for two or three?'],
      help: ['One and two only. Two numbers said clearly beats three said in a blur.'],
      challenge: ['Go to five, then ask “how many?” about things around the room.'],
      doneWhen: 'They count to three alone, in order.',
      next: ['Count three real objects together.'],
    },
    tutorCard: {
      goal: 'Produce the first three number words reliably.',
      listenFor: ['Order', 'clarity of “three” (note it, do not drill it)'],
      ifStruggle: 'One and two only.',
      ifSucceed: 'Extend to five and ask “how many?”.',
      howToExplain: 'Fingers first, words second.',
      model: ['one, two, three'],
      practice: ['Count to three three times.'],
      avoid: ['Rushing past a number before it has landed.'],
    },
  },
  {
    id: 'b_feelings',
    theme: 'feelings',
    stages: ['P1', 'P2'],
    kind: 'communication',
    audience: 'both',
    title: '“How are you?” — saying how you feel',
    studentPromptKey: 'beginner.prompt.feelings',
    studentPrompt: 'Answer: “How are you?” Say “I’m good,” “I’m tired,” or “I’m okay.”',
    speak: 'How are you? I am good. I am tired.',
    minutes: 5,
    autopilot: {
      now: 'The most-used exchange in English, made real rather than recited.',
      say: ['How are you?', 'I’m good, thanks. And you?', 'Are you tired today?'],
      do: [
        'Mime each feeling as you say it — tired, good, hungry.',
        'Ask it again later in the lesson, unexpectedly, so it becomes real.',
      ],
      studentDoes: ['Answers with a real feeling, not a memorised “I’m fine”.'],
      lookFor: ['Does the answer match how they actually seem?', 'Do they ask it back?'],
      help: ['Offer two options and let them point: good, or tired?'],
      challenge: ['Add “Why?” and accept a single word answer.'],
      doneWhen: 'They answer the question and ask it back at least once.',
      next: ['Use it again as the greeting at the start of the next activity.'],
      teacherTip:
        'This is genuine communication, not vocabulary. React to what they say as a person, not as a teacher.',
    },
    tutorCard: {
      goal: 'A real, reusable exchange about how they feel.',
      listenFor: ['A truthful answer', 'the return question'],
      ifStruggle: 'Two choices offered aloud with mime.',
      ifSucceed: 'Add “a little” and “very”.',
      howToExplain: 'We ask “How are you?” whenever we meet someone.',
      model: ['How are you?', 'I’m good.', 'I’m a little tired.'],
      practice: ['Ask and answer three times, swapping roles.'],
      avoid: ['Drilling it so hard it stops meaning anything.'],
    },
  },
  {
    id: 'b_classroom_language',
    theme: 'classroom',
    stages: ['P1', 'P2', 'P3'],
    kind: 'speakingListening',
    audience: 'both',
    title: 'Survival English: “Again, please” / “I don’t understand”',
    studentPromptKey: 'beginner.prompt.classroom',
    studentPrompt: 'Learn to say: “Again, please.” “I don’t understand.” “How do you say…?”',
    speak: 'Again, please. I don’t understand. How do you say this in English?',
    minutes: 5,
    autopilot: {
      now: 'The phrases that let the learner control the rest of every lesson.',
      say: ['Again, please.', 'I don’t understand.', 'How do you say this in English?'],
      do: [
        'Write the three phrases where they can see them for the rest of the lesson.',
        'Deliberately say something too fast, so they get to use “Again, please” for real.',
      ],
      studentDoes: ['Uses one of the phrases to stop you and ask for help.'],
      lookFor: ['Do they actually use one when they need it, not just when asked?'],
      help: ['One phrase only — “Again, please.” It is the highest-value one.'],
      challenge: ['Add “What does ___ mean?” and “Can you write it?”'],
      doneWhen: 'They interrupt you once, unprompted, with one of the phrases.',
      next: ['Leave the phrases visible and move on — they will be used all lesson.'],
      teacherTip:
        'This is the highest-value five minutes in a beginner course. It converts a passive learner into one who can steer.',
    },
    tutorCard: {
      goal: 'Give the learner the language to ask for help in English.',
      listenFor: ['Unprompted use later in the lesson'],
      ifStruggle: 'Just “Again, please”, practised until it is automatic.',
      ifSucceed: 'Add “What does that mean?” and “Slowly, please.”',
      howToExplain: 'These phrases let you stop me any time. Use them a lot.',
      model: ['Again, please.', 'I don’t understand.'],
      practice: ['Stop me three times using the phrases.'],
      avoid: ['Making them feel it is rude to interrupt. It is the opposite.'],
    },
  },

  /* --------------- P3: toward A1 — sentences and first reading -------- */
  {
    id: 'b_two_word_sentences',
    theme: 'chunks',
    stages: ['P2', 'P3'],
    kind: 'speakingListening',
    audience: 'both',
    title: 'Building a sentence: “I want / I like / I have”',
    studentPromptKey: 'beginner.prompt.twoWord',
    studentPrompt: 'Put two pieces together: “I want water.” “I have a book.”',
    speak: 'I want water. I like tea. I have a book.',
    minutes: 5,
    autopilot: {
      now: 'Combining two known chunks into one sentence they build themselves.',
      say: ['I want water.', 'I have a book.', 'Your turn — I want…?'],
      do: [
        'Write or draw the two halves separately, then physically push them together.',
        'Change only the second half each time; keep the first half fixed.',
      ],
      studentDoes: ['Says a full sentence by choosing the second half themselves.'],
      lookFor: ['Are they choosing the ending, or repeating yours?', 'Is the sentence about something real?'],
      help: ['Keep both halves fixed and just repeat the whole sentence together three times.'],
      challenge: ['Swap the first half too: “I want / I don’t want / Do you want…?”'],
      doneWhen: 'They produce three different sentences with the same opening.',
      next: ['Use one of their sentences in a real request to you.'],
      teacherTip:
        'This is the moment a learner stops repeating and starts generating. Notice it out loud — it is a big one.',
    },
    tutorCard: {
      goal: 'Move from fixed chunks to learner-generated sentences.',
      listenFor: ['Genuine choice of the second half', 'sentence-level rhythm'],
      ifStruggle: 'Back to one whole fixed sentence.',
      ifSucceed: 'Add the negative and the question form.',
      howToExplain: 'Take the piece you know and add a new ending.',
      model: ['I want water.', 'I like tea.'],
      practice: ['Make three sentences with “I want ___.”'],
      avoid: ['Correcting articles here — the achievement is the sentence.'],
    },
  },
  {
    id: 'b_daily_routine',
    theme: 'routine',
    stages: ['P2', 'P3'],
    kind: 'communication',
    audience: 'adult',
    title: 'My day, in order',
    studentPromptKey: 'beginner.prompt.routine',
    studentPrompt: 'Tell me your day: “I get up. I eat. I go to work.”',
    speak: 'I get up. I eat breakfast. I go to work. I come home.',
    minutes: 6,
    autopilot: {
      now: 'A short sequence about their own real day — their first connected turn.',
      say: ['I get up at seven. I eat breakfast. I go to work.', 'Now you. First…?'],
      do: [
        'Draw four boxes on paper as a timeline; fill yours first, then theirs.',
        'Point to each box as they speak so they know what comes next.',
      ],
      studentDoes: ['Says three or four sentences in order about their own day.'],
      lookFor: ['Do the sentences hold together as a sequence?', 'Do they get through it without you filling gaps?'],
      help: ['Two steps only — “I get up. I eat.” — and accept single verbs.'],
      challenge: ['Add times (“at seven”), then “and then”, then ask about their weekend.'],
      doneWhen: 'They say three sentences in order, in the right order, unprompted.',
      next: ['Ask one follow-up question about one of the steps.'],
      teacherTip:
        'For an adult beginner this is the first time English does something useful: it describes their actual life. Treat it as the milestone it is.',
    },
    tutorCard: {
      goal: 'A first connected sequence of sentences about real life.',
      listenFor: ['Sequence held across sentences', 'independence from your prompting'],
      ifStruggle: 'Two steps, with the drawing carrying the order.',
      ifSucceed: 'Add times and “then”, then move to the past.',
      howToExplain: 'Tell me what you do, in the order you do it.',
      model: ['I get up. I eat breakfast. I go to work.'],
      practice: ['Say four steps of your day.'],
      avoid: ['Childish visuals — this is an adult describing an adult life.'],
    },
  },
  {
    id: 'b_where_is_it',
    theme: 'place',
    stages: ['P2', 'P3'],
    kind: 'communication',
    audience: 'both',
    title: 'Where is it? (in / on / under)',
    studentPromptKey: 'beginner.prompt.where',
    studentPrompt: 'Say where it is: “in the bag”, “on the table”, “under the chair”.',
    speak: 'in the bag. on the table. under the chair.',
    minutes: 5,
    autopilot: {
      now: 'A hide-and-find game that forces a real prepositional phrase.',
      say: ['It’s on the table.', 'Now it’s in the bag.', 'Where is it?'],
      do: [
        'Move one object to three places, naming each.',
        'Then hide it while they look away and let them ask and guess.',
      ],
      studentDoes: ['Asks “Where is it?” and answers with a full phrase.'],
      lookFor: ['Do they use the phrase, or just point?', 'Is the preposition right for what they can see?'],
      help: ['Two places only — in and on — with the object visible the whole time.'],
      challenge: ['Add “next to”, “behind”, “between”, and let them hide it for you.'],
      doneWhen: 'They answer with a full phrase for three different positions.',
      next: ['Ask where something in the room actually is.'],
    },
    tutorCard: {
      goal: 'Prepositions of place learned by moving a real object.',
      listenFor: ['The whole phrase, not just the noun'],
      ifStruggle: 'Two prepositions, object always visible.',
      ifSucceed: 'Let them give you the instructions.',
      howToExplain: 'Show it, don’t explain it — move the object.',
      model: ['on the table', 'in the bag'],
      practice: ['Say where the object is, three times.'],
      avoid: ['Explaining preposition rules. There are none worth giving here.'],
    },
  },
  {
    id: 'b_blending',
    theme: 'phonics',
    stages: ['P3'],
    kind: 'reading',
    audience: 'child',
    title: 'Sounding out a whole word (s–u–n)',
    studentPromptKey: 'beginner.prompt.blending',
    studentPrompt: 'Say each sound, then push them together: s… u… n… sun!',
    speak: 's, u, n. sun. c, a, t. cat.',
    minutes: 5,
    autopilot: {
      now: 'Blending separate sounds into a real word — the doorway to reading.',
      say: ['s… u… n… What’s the word?', 'Say it faster: s-u-n… sun!', 'Now this one: c… a… t…'],
      do: [
        'Write the three letters far apart, then slide them together with your finger as you blend.',
        'Say the sounds, never the letter names.',
      ],
      studentDoes: ['Says each sound, then says the whole word.'],
      lookFor: ['Do the separate sounds turn into a word, or stay separate?'],
      help: ['Blend the first two only (s–u), then add the last sound.'],
      challenge: ['Four-sound words (stop, hand), or let them write the word after saying it.'],
      doneWhen: 'They blend two different words without you saying the answer.',
      next: ['Read the same word on a card, without sounding it out.'],
      teacherTip:
        'Sounds, never letter names: “sss”, not “ess”. Letter names actively get in the way of blending.',
    },
    tutorCard: {
      goal: 'Blend individual sounds into a whole spoken word.',
      listenFor: ['The moment the separate sounds fuse'],
      ifStruggle: 'Two sounds only; you supply the third.',
      ifSucceed: 'Move to four-sound words and simple writing.',
      howToExplain: 'Each letter makes a sound. Push them together and they make a word.',
      model: ['s-u-n → sun', 'c-a-t → cat'],
      practice: ['Blend three short words.'],
      avoid: ['Letter names, and long drilling. Five minutes is plenty.'],
    },
  },
  {
    id: 'b_short_dialogue',
    theme: 'questions',
    stages: ['P3'],
    kind: 'communication',
    audience: 'both',
    title: 'A whole short conversation',
    studentPromptKey: 'beginner.prompt.dialogue',
    studentPrompt: 'Let’s have a real conversation: hello, name, how are you, goodbye.',
    speak: 'Hello. What is your name? How are you? Nice to meet you. Goodbye.',
    minutes: 6,
    autopilot: {
      now: 'Everything learned so far, joined into one continuous exchange.',
      say: ['Hello!', 'What’s your name?', 'How are you?', 'Nice to meet you. Goodbye!'],
      do: [
        'Run the whole exchange once at natural speed so they hear the shape.',
        'Then run it again with them, and a third time with roles swapped.',
      ],
      studentDoes: ['Takes both roles across the three runs, asking as well as answering.'],
      lookFor: ['Do they get through it without stopping?', 'Do they ask the questions, not only answer them?'],
      help: ['Cut it to two exchanges: hello and name. A short complete conversation beats a long broken one.'],
      challenge: ['Add “Where are you from?” and an unexpected question so they have to react.'],
      doneWhen: 'They complete the whole exchange once in each role.',
      next: ['End the lesson with the same goodbye, for real.'],
      teacherTip:
        'This is the payoff: a learner who arrived with no English is holding a conversation. Say so — out loud.',
    },
    tutorCard: {
      goal: 'Join the lesson’s pieces into one sustained exchange.',
      listenFor: ['Continuity across turns', 'question production'],
      ifStruggle: 'Two exchanges only, both roles.',
      ifSucceed: 'Add an unscripted question and let them cope.',
      howToExplain: 'We’ll do the whole thing, start to finish, like real life.',
      model: ['Hello. What’s your name?', 'Nice to meet you.'],
      practice: ['Run the conversation three times, swapping roles.'],
      avoid: ['Stopping to correct mid-conversation. Note it, fix it after.'],
    },
  },
  {
    id: 'b_read_known_phrase',
    theme: 'reading',
    stages: ['P3'],
    kind: 'reading',
    audience: 'both',
    title: 'Reading a phrase you can already say',
    studentPromptKey: 'beginner.prompt.readPhrase',
    studentPrompt: 'Read these phrases you already know: “I like tea.” “My name is ___.”',
    speak: 'I like tea. My name is.',
    minutes: 5,
    autopilot: {
      now: 'Seeing, in writing, sentences they have already been saying for weeks.',
      say: ['You’ve been saying this all lesson. Now look at it.', 'Read it to me.'],
      do: [
        'Write only phrases they have already spoken confidently.',
        'Point under each word as they read; wait three seconds before helping.',
      ],
      studentDoes: ['Reads the phrase aloud and says what it means.'],
      lookFor: ['Recognition of the whole phrase rather than letter-by-letter decoding.'],
      help: ['Say the phrase aloud first, then show it. Matching sound to shape is the skill.'],
      challenge: ['Mix the phrases up and have them find the one you say.'],
      doneWhen: 'They read two phrases aloud without you supplying them.',
      next: ['Write one phrase together, then stop — writing is a whole other lesson.'],
      teacherTip:
        'Never put a written word in front of a beginner that they cannot already say. Speaking leads reading, always.',
    },
    tutorCard: {
      goal: 'Attach written form to spoken language they already own.',
      listenFor: ['Whole-phrase recognition', 'confidence rather than decoding effort'],
      ifStruggle: 'Say it first, then show it.',
      ifSucceed: 'Have them match spoken phrases to written cards.',
      howToExplain: 'These are your own words. Now you can see them.',
      model: ['I like tea.', 'My name is ___.'],
      practice: ['Read three familiar phrases aloud.'],
      avoid: ['Any phrase they cannot already say out loud.'],
    },
  },
  {
    id: 'b_weather_smalltalk',
    theme: 'weather',
    stages: ['P2', 'P3'],
    kind: 'communication',
    audience: 'adult',
    title: 'Small talk: the weather',
    studentPromptKey: 'beginner.prompt.weather',
    studentPrompt: 'Talk about today: “It’s hot.” “It’s raining.” “It’s cold today.”',
    speak: 'It is hot. It is cold. It is raining today.',
    minutes: 5,
    autopilot: {
      now: 'The universal opening for adult conversation, in four phrases.',
      say: ['It’s cold today.', 'Is it raining?', 'What’s the weather like where you are?'],
      do: ['Look out of a window, or show today’s forecast on a phone.', 'React genuinely to their answer.'],
      studentDoes: ['Describes today’s weather and asks you about yours.'],
      lookFor: ['Do they use the “It’s ___” frame?', 'Do they ask back?'],
      help: ['Two words: hot, cold. Point outside and let them pick.'],
      challenge: ['Add “yesterday it was…” and “tomorrow it will be…”.'],
      doneWhen: 'They describe the weather and ask you one question about it.',
      next: ['Use it as the opener at the start of the next lesson.'],
      teacherTip:
        'Small talk is not filler for an adult beginner — it is the first English they will actually use with a stranger.',
    },
    tutorCard: {
      goal: 'A short, genuinely usable piece of adult small talk.',
      listenFor: ['The “It’s ___” frame', 'a return question'],
      ifStruggle: 'Two adjectives with pointing.',
      ifSucceed: 'Move into past and future weather.',
      howToExplain: 'English speakers open conversations with the weather constantly.',
      model: ['It’s cold today.', 'It’s raining.'],
      practice: ['Describe the weather three days running.'],
      avoid: ['Teaching a long list of weather words. Four is plenty.'],
    },
  },

  /* ---------------------------- Movement ---------------------------- */
  {
    id: 'b_movement_shake',
    theme: 'movement',
    stages: ['P0', 'P1', 'P2', 'P3'],
    kind: 'warmup',
    audience: 'child',
    title: 'Shake and freeze',
    studentPromptKey: 'beginner.prompt.movementShake',
    studentPrompt: 'Shake your hands… shake your feet… and FREEZE!',
    speak: 'shake, freeze, go',
    minutes: 3,
    movement: true,
    autopilot: {
      now: 'A second movement break, so the reset does not become the same game every week.',
      say: ['Shake your hands! Shake your feet!', 'And… FREEZE!', 'Ready? Go!'],
      do: ['Lead it, then let the child call “freeze” for you.', 'End still and quiet, ready to sit.'],
      studentDoes: ['Moves on the word, stops on “freeze”.'],
      lookFor: ['Are they responding to the WORD, or copying your body?'],
      help: ['Just “go” and “stop”, with big gestures.'],
      challenge: ['Let them be the caller, in English.'],
      doneWhen: 'They stop on “freeze” without watching you.',
      next: ['Sit back down for the next focus activity.'],
      teacherTip: 'Ending a movement break calm is as important as the movement itself.',
    },
    tutorCard: {
      goal: 'Reset attention while smuggling in listening practice.',
      listenFor: ['Response to the word rather than to your movement'],
      ifStruggle: 'Two commands only.',
      ifSucceed: 'Swap roles and let them call it.',
      howToExplain: 'It’s a game — but they have to listen to play it.',
      model: ['go', 'freeze'],
      practice: ['Three rounds, then settle.'],
      avoid: ['Ending on high energy right before a focus task.'],
    },
  },
  {
    id: 'b_movement_break',
    theme: 'movement',
    stages: ['P0', 'P1', 'P2', 'P3'],
    kind: 'warmup',
    audience: 'child',
    title: 'Movement break',
    studentPromptKey: 'beginner.prompt.movement',
    studentPrompt: 'Let’s move! Stretch up high, then wiggle, then a big breath.',
    speak: 'up, down, jump, stop',
    minutes: 3,
    movement: true,
    autopilot: {
      say: ['Up! (reach) Down! (crouch)', 'Wiggle, wiggle… and STOP!', 'One big breath. Good.'],
      do: ['Lead the movements energetically, then settle.', 'End calm and ready for the next activity.'],
      lookFor: ['Re-engagement and a reset of attention.'],
      next: ['Refocused → Continue to the next activity', 'Still restless → one more round, then a quiet task'],
      teacherTip: 'Don’t leave a young child on one task for 10+ minutes — reset with movement.',
    },
    tutorCard: {
      goal: 'Reset attention with a short movement break.',
      listenFor: ['Energy and re-engagement'],
      ifStruggle: 'Keep it very short; end calm.',
      ifSucceed: 'Sneak in up/down/stop vocabulary.',
      howToExplain: 'This is a fun break, not a test.',
      model: ['up', 'down', 'stop'],
      practice: ['Follow 3 movements, then settle.'],
      avoid: ['Winding them up right before a focus task.'],
    },
  },
]

export interface BeginnerSelectionOpts {
  stage: PreA1Stage
  audience: 'child' | 'adult'
  seed: number
  themes?: BeginnerTheme[]
  exclude?: Set<string>
}

/** Deterministic rotation so repeated lessons vary rather than repeat exactly. */
function rotate<T>(arr: T[], seed: number): T[] {
  if (arr.length === 0) return arr
  const k = ((seed % arr.length) + arr.length) % arr.length
  return [...arr.slice(k), ...arr.slice(0, k)]
}

/** Activities suitable for a given stage + audience (audience 'both' always ok). */
export function beginnerActivitiesFor(
  stage: PreA1Stage,
  audience: 'child' | 'adult',
): BeginnerActivityTemplate[] {
  return beginnerActivities.filter(
    (a) => a.stages.includes(stage) && (a.audience === 'both' || a.audience === audience),
  )
}

/**
 * Pick a varied, non-repeating set of beginner activities for one lesson.
 * `count` templates are chosen across distinct themes where possible; the seed
 * rotates the pool so successive lessons differ.
 */
export function selectBeginnerActivities(
  opts: BeginnerSelectionOpts & { count: number },
): BeginnerActivityTemplate[] {
  const all = rotate(beginnerActivitiesFor(opts.stage, opts.audience), opts.seed).filter(
    (a) => !a.movement,
  )
  // Prefer activities this learner hasn't just done, but a full lesson matters
  // more than novelty: once the fresh ones run out, fall back to the rest.
  const fresh = all.filter((a) => !opts.exclude?.has(a.id))
  const pool = fresh.length >= opts.count ? fresh : [...fresh, ...all.filter((a) => !fresh.includes(a))]
  const picked: BeginnerActivityTemplate[] = []
  const usedThemes = new Set<BeginnerTheme>()
  /* A beginner lesson opens with a greeting if one is available. Rotation was
     picking whatever the seed landed on, so a five-year-old could start their
     lesson on "Food & drink" and meet "Hello" forty minutes later. Saying
     hello first is not decoration — it is the one exchange they can already
     succeed at, and success is what the first two minutes are for. */
  const opener = pool.find((a) => a.theme === 'greetings')
  if (opener) {
    picked.push(opener)
    usedThemes.add(opener.theme)
  }
  // First pass: one per theme for variety.
  for (const a of pool) {
    if (picked.length >= opts.count) break
    if (usedThemes.has(a.theme)) continue
    picked.push(a)
    usedThemes.add(a.theme)
  }
  // Second pass: fill remaining slots if the themed pass was too strict.
  for (const a of pool) {
    if (picked.length >= opts.count) break
    if (!picked.includes(a)) picked.push(a)
  }
  return picked
}

/** A movement/reset activity for young-child lessons (or null if none fit). */
export function movementActivity(stage: PreA1Stage, pick = 0): BeginnerActivityTemplate | null {
  // Rotate through the available breaks. A child who gets the identical
  // "movement break" twice in one lesson (and again next week) stops treating
  // it as a reset and starts treating it as more of the same.
  const options = beginnerActivities.filter(
    (a) => a.movement && a.theme === 'movement' && a.stages.includes(stage),
  )
  if (options.length === 0) return null
  return options[((pick % options.length) + options.length) % options.length]
}
