/* ==========================================================================
   Pronunciation curriculum — the major differentiator of these lessons.
   --------------------------------------------------------------------------
   Every one of the fourteen declared pronunciation areas now has a full entry.
   (Six of them — L, vowels, the R-coloured vowel, final consonants, consonant
   clusters and rhythm — were declared in the type but had no teaching content
   at all, so the app could set a learner a target it could not then teach.)

   Each concept follows the same practice flow:
     Listen -> Model -> Repeat -> Contrast -> Sentence -> Connected speech
   and carries a `recordingPlan`: what to capture as baseline, practice and
   improved evidence using the app's local recorder.

   There is NO automatic scoring anywhere in this app and none is implied. The
   evidence is the learner hearing their own before and after; the judgement is
   the tutor's ear. Ratings are explicitly qualitative for that reason.
   ========================================================================== */

import { PronunciationConcept } from '../types/content'
import { PronunciationArea, PronunciationRating } from '../types'

/** i18n key for each pronunciation rating label. Shared by the recorder
 *  panel and lesson reports so both resolve the same locale string. */
export const PRONUNCIATION_RATING_KEY: Record<PronunciationRating, string> = {
  clear: 'pron.ratingClear',
  understandable: 'pron.ratingUnderstandable',
  needsPractice: 'pron.ratingNeedsPractice',
  communicationProblem: 'pron.ratingProblem',
}

export const pronunciationLibrary: PronunciationConcept[] = [
  /* ---------------------------- Consonants ------------------------------- */
  {
    area: 'th',
    title: 'The TH sounds (think / this)',
    cefrFrom: 'A1',
    why: 'TH is rare in many languages, so learners swap it for /s/, /z/, /t/, /d/, or /f/ — which changes words (think → sink).',
    howTo: 'Put the tip of your tongue lightly between your teeth and push air out. Voiceless for “think”, voiced for “this”.',
    minimalPairs: [
      { a: 'think', b: 'sink' },
      { a: 'thin', b: 'tin' },
      { a: 'they', b: 'day' },
      { a: 'breathe', b: 'breeze' },
    ],
    words: ['three', 'thank', 'mother', 'weather', 'birthday', 'nothing'],
    sentences: ['I think this is the third one.', 'They both thanked their mother.'],
    tutorNotes:
      'Have them look in a mirror to see the tongue between the teeth. Exaggerate first, then blend back to normal speed.',
    firstLanguageNotes: {
      ru: 'Russian has no TH; /s/ and /z/ are the usual substitutes (“sink” for “think”).',
      he: 'Hebrew speakers often use /t/ and /d/ — “dis” for “this”.',
      fr: 'French speakers typically substitute /s/ and /z/, sometimes /f/ and /v/.',
      es: 'Latin American Spanish speakers usually use /t/ or /d/; peninsular Spanish already has the voiceless TH.',
    },
    conversationPrompt: 'Talk about the weather this week and your birthday plans (loaded with TH).',
    connectedSpeech:
      'In fast speech “the” and “them” often reduce almost to a hum. Full crisp TH on every function word actually sounds less natural than a light one.',
    recordingPlan: {
      baseline: 'Record them saying “I think this is the third thing” before any practice.',
      practice: 'Record the minimal pair “think / sink” three times each.',
      improved: 'Record the same opening sentence at the end and play both back to back.',
    },
  },
  {
    area: 'r',
    title: 'The American R',
    cefrFrom: 'A1',
    why: 'A rolled or French/Hebrew R makes American English sound less clear. The American R has no tongue tap at all.',
    howTo: 'Pull the tongue back and slightly up without touching the roof; round the lips a little. The tongue touches nothing.',
    minimalPairs: [
      { a: 'right', b: 'light' },
      { a: 'red', b: 'led' },
      { a: 'rock', b: 'lock' },
    ],
    words: ['red', 'right', 'sorry', 'around', 'really', 'problem'],
    sentences: ['Robert drove the red car to work.', 'The water was really cold.'],
    tutorNotes:
      'Cue: “no tongue tap — pull it back like a soft growl.” Contrast directly with L, which does touch the roof.',
    firstLanguageNotes: {
      ru: 'Russian R is a strong tap/trill; the tongue must learn to stop touching anything.',
      he: 'Hebrew R is made at the back of the throat — a completely different place. Start from “w” and slide back.',
      es: 'Spanish has both a tap and a trill; the trill is the harder habit to drop.',
      fr: 'French R is uvular (back of the throat), so it sounds guttural rather than American.',
    },
    conversationPrompt: 'Describe your daily route to work or school (lots of R words).',
    connectedSpeech:
      'Between vowels, Americans often flap T and D (“water” → “wadder”), which sits right next to R. Practise them together.',
    recordingPlan: {
      baseline: 'Record “Robert really wanted to write it right” cold.',
      practice: 'Record “right / light” and “red / led” as pairs.',
      improved: 'Re-record the same sentence and ask which one is easier to understand.',
    },
  },
  {
    area: 'l',
    title: 'The two Ls (light L and dark L)',
    cefrFrom: 'A2',
    why: 'English has a bright L at the start of a word (“light”) and a heavy, back-of-the-mouth L at the end (“full”, “cold”). Using the bright one everywhere sounds foreign; dropping the final one entirely makes “cold” sound like “code”.',
    howTo:
      'Light L: tongue tip firmly on the ridge behind the top teeth. Dark L: tongue tip still touches, but the back of the tongue lifts — it sounds almost like “oo”.',
    minimalPairs: [
      { a: 'light', b: 'right' },
      { a: 'full', b: 'foo' },
      { a: 'cold', b: 'code' },
      { a: 'feel', b: 'fee' },
    ],
    words: ['little', 'people', 'well', 'help', 'still', 'usually'],
    sentences: ['I still feel a little cold.', 'Well, people usually help.'],
    tutorNotes:
      'Have them hold the final L for two seconds so they can feel the tongue land. Then say the word at normal speed. The contrast with R matters as much as the L itself.',
    firstLanguageNotes: {
      ru: 'Russian has a hard and soft L that map imperfectly; the soft L is often too palatal for English.',
      he: 'Hebrew L is bright everywhere, so the dark final L is the one to build.',
      es: 'Spanish L is always bright; final Ls tend to disappear.',
      fr: 'French L is bright; the dark English final L is unfamiliar.',
    },
    conversationPrompt: 'Talk about how you usually feel at the end of a long day (naturally full of dark Ls).',
    connectedSpeech:
      'When a dark L is followed by a vowel (“feel it”), it links and brightens: “fee-lit”. That link is a strong intelligibility win.',
    recordingPlan: {
      baseline: 'Record “I still feel a little cold” before any work on it.',
      practice: 'Record “cold / code” and “feel / fee” as contrasts.',
      improved: 'Re-record the sentence and listen specifically to the ends of the words.',
    },
  },
  {
    area: 'vw',
    title: 'V versus W',
    cefrFrom: 'A2',
    why: 'Many learners merge V and W, so “vest” and “west”, or “very” and “wery”, become confusing.',
    howTo: 'V: top teeth touch the bottom lip (a buzzing sound). W: round both lips, no teeth, like the start of “oo”.',
    minimalPairs: [
      { a: 'vest', b: 'west' },
      { a: 'vine', b: 'wine' },
      { a: 'veil', b: 'whale' },
    ],
    words: ['very', 'well', 'village', 'window', 'travel', 'water', 'winter'],
    sentences: ['We were very well.', 'I want a very warm winter coat.'],
    tutorNotes: 'Feel the teeth for V; feel the lips round for W. Have them touch their own lip to check.',
    firstLanguageNotes: {
      ru: 'Russian has V but no W, so W becomes V: “vest” for “west”.',
      he: 'Hebrew ו covers both, so the two collapse into one sound.',
      es: 'Spanish B and V are the same sound, and neither is the English V.',
      fr: 'French has both, so this is usually an easy win for French speakers.',
    },
    conversationPrompt: 'Talk about a trip: “We went…”, “It was very…”, mixing V and W words.',
    connectedSpeech:
      'In “we were very”, three of these sit together at speed — that phrase is the real test, not the isolated word.',
    recordingPlan: {
      baseline: 'Record “We were very well in the west village” cold.',
      practice: 'Record “vest / west” and “vine / wine”.',
      improved: 'Re-record the sentence; the difference is usually dramatic and motivating.',
    },
  },
  {
    area: 'finalConsonants',
    title: 'Finishing the word (final consonants)',
    cefrFrom: 'A2',
    why: 'Dropping the last consonant erases grammar as well as vocabulary: “walked” becomes “walk”, “cats” becomes “cat”, “I need” becomes “I knee”. This is one of the highest-impact intelligibility fixes at any level.',
    howTo:
      'Finish the word. The final sound does not need to be loud — it needs to exist. Hold the last consonant for a beat while practising, then shorten it.',
    minimalPairs: [
      { a: 'walked', b: 'walk' },
      { a: 'cats', b: 'cat' },
      { a: 'find', b: 'fine' },
      { a: 'send', b: 'sen' },
    ],
    words: ['asked', 'looked', 'friends', 'months', 'best', 'helped'],
    sentences: ['I asked my friends last month.', 'She helped and then she left.'],
    tutorNotes:
      'This is often heard as a grammar mistake when it is a pronunciation one — the learner knows the past tense and says it, but the -ed never lands. Check by asking them to write the sentence: if the -ed is on the page, it is a sound problem.',
    firstLanguageNotes: {
      es: 'Spanish words rarely end in these consonants, so final sounds routinely vanish.',
      ru: 'Russian devoices final consonants, so “bed” can sound like “bet”.',
      he: 'Hebrew allows fewer final clusters, so “asked” loses its ending.',
      fr: 'French drops most written final consonants, and the habit transfers directly.',
    },
    conversationPrompt: 'Tell me three things you finished last week — every verb will need its ending.',
    connectedSpeech:
      'A final consonant before a vowel links forward and becomes easy: “asked_all”, “helped_us”. Teach the link and the ending appears for free.',
    recordingPlan: {
      baseline: 'Record “I asked my friends last month” and count how many endings survive.',
      practice: 'Record “walk / walked” and “cat / cats” as pairs.',
      improved: 'Re-record the sentence and count the endings again together.',
    },
  },
  {
    area: 'consonantClusters',
    title: 'Consonant clusters (street, asked, sixths)',
    cefrFrom: 'B1',
    why: 'English stacks consonants in ways many languages never do. Learners either insert a vowel (“estreet”) or delete a sound (“ast” for “asked”). Both are noticeable.',
    howTo:
      'Say the cluster slowly with no vowel between the consonants, then speed it up. Never add a vowel before an initial /s/ cluster.',
    minimalPairs: [
      { a: 'street', b: 'estreet' },
      { a: 'asked', b: 'ast' },
      { a: 'texts', b: 'tex' },
    ],
    words: ['street', 'spring', 'asked', 'twelfth', 'strengths', 'clothes'],
    sentences: ['She asked about the street.', 'I sent three texts last spring.'],
    tutorNotes:
      'Build clusters backwards: “eet → treet → street”. It is far easier than attacking the whole cluster at once. Some deletion is normal in native speech too — “clothes” really does sound like “close”.',
    firstLanguageNotes: {
      es: 'Spanish speakers add an /e/ before initial /s/ clusters: “eschool”, “estreet”.',
      he: 'Hebrew allows many clusters, so this is often easier for Hebrew speakers.',
      ru: 'Russian allows heavy clusters, so initial clusters are usually fine; final ones still simplify.',
      fr: 'French speakers may add a slight vowel between stacked consonants.',
    },
    conversationPrompt: 'Describe your street and your favourite season — both are cluster-heavy on purpose.',
    connectedSpeech:
      'Across word boundaries clusters get even heavier (“last spring”). Native speakers simplify some of these too, so aim for natural, not maximal.',
    recordingPlan: {
      baseline: 'Record “She asked about the street last spring” cold.',
      practice: 'Record the backwards build: “eet, treet, street”.',
      improved: 'Re-record the sentence at conversational speed.',
    },
  },

  /* ------------------------------ Vowels --------------------------------- */
  {
    area: 'vowels',
    title: 'The vowels that change meaning (ship / sheep, bad / bed)',
    cefrFrom: 'A2',
    why: 'English has far more vowel sounds than most languages. Merging the long and short pairs turns “sheep” into “ship” and “beach” into something you cannot say at work.',
    howTo:
      'Long /iː/ (sheep): lips spread wide, sound held. Short /ɪ/ (ship): relaxed, quick. Same for /æ/ (bad, jaw open) vs /e/ (bed, jaw nearly closed). Length AND mouth shape both change.',
    minimalPairs: [
      { a: 'sheep', b: 'ship' },
      { a: 'bad', b: 'bed' },
      { a: 'full', b: 'fool' },
      { a: 'cot', b: 'caught' },
    ],
    words: ['live', 'leave', 'sit', 'seat', 'man', 'men', 'pull', 'pool'],
    sentences: ['I live here, but I leave at six.', 'The man sat in the seat.'],
    tutorNotes:
      'Have them put a hand under their chin to feel the jaw drop on /æ/. Do not chase every vowel — pick the ONE pair that is causing real confusion for this learner and stay with it.',
    firstLanguageNotes: {
      es: 'Spanish has five vowels; the long/short English pairs all collapse into one.',
      ru: 'Russian vowel length is not meaningful, so “ship” and “sheep” sound identical.',
      he: 'Hebrew has five vowels, so the same merging happens.',
      fr: 'French speakers usually manage /iː/ but struggle with /ɪ/ and /æ/.',
    },
    conversationPrompt: 'Talk about where you live and when you leave in the morning — the pair appears naturally.',
    connectedSpeech:
      'In unstressed syllables most of these vowels reduce to schwa anyway, so precision matters mainly in stressed syllables. That is a relief worth telling the learner.',
    recordingPlan: {
      baseline: 'Record “I live here but I leave at six” before any practice.',
      practice: 'Record the one problem pair, four times each, alternating.',
      improved: 'Re-record the sentence; ask them which word they can now hear the difference in.',
    },
  },
  {
    area: 'americanR',
    title: 'R-coloured vowels (bird, work, car, more)',
    cefrFrom: 'A2',
    why: 'American English pronounces R after a vowel — “car”, “work”, “bird”, “here”. Dropping it sounds British; over-rolling it sounds foreign. This single feature carries much of what people mean by “an American accent”.',
    howTo:
      'The vowel and the R merge into one sound. Do not say a vowel and then add an R — start the tongue retraction during the vowel itself.',
    minimalPairs: [
      { a: 'car (American)', b: 'cah (British)' },
      { a: 'bird', b: 'bud' },
      { a: 'four', b: 'faw' },
    ],
    words: ['work', 'first', 'world', 'learn', 'water', 'never', 'important'],
    sentences: ['The first word was hard to learn.', 'Her brother works in another world entirely.'],
    tutorNotes:
      'The “er” in “water”, “never”, “better” is unstressed and very short — a quick r-coloured schwa, not a full “ER”. Over-pronouncing it is the commonest overcorrection.',
    firstLanguageNotes: {
      ru: 'A tapped R after a vowel is very audible; aim for merge, not tap.',
      he: 'The throat R is especially noticeable in this position — this is usually the highest-value target for Hebrew speakers.',
      fr: 'French speakers may simply drop it, which sounds British rather than American.',
      es: 'Spanish speakers tend to tap it, which separates the vowel and the R.',
    },
    conversationPrompt: 'Describe your work and what you learned first — the target is unavoidable.',
    connectedSpeech:
      'Americans link a final R into a following vowel (“far away” → “fa-raway”). That link is a strong marker of natural speech.',
    recordingPlan: {
      baseline: 'Record “The first word was hard to learn” cold.',
      practice: 'Record “work, first, world, learn” as a set.',
      improved: 'Re-record and compare directly with the baseline in the same panel.',
    },
  },

  /* ---------------------- Stress, rhythm and melody ---------------------- */
  {
    area: 'wordStress',
    title: 'Word stress',
    cefrFrom: 'A2',
    why: 'English words have one strong syllable. Wrong stress (PHOto-graph vs. pho-TO-gra-pher) can make a word unrecognisable even when every sound is correct.',
    howTo: 'Say the whole word, then make ONE syllable longer, louder, and higher. The others become shorter and quieter.',
    minimalPairs: [
      { a: 'PRESent (gift)', b: 'preSENT (to give)' },
      { a: 'REcord (noun)', b: 'reCORD (verb)' },
    ],
    words: ['banana', 'computer', 'photograph', 'photographer', 'important', 'hotel'],
    sentences: ['That’s an imPORtant deCIsion.', 'She’s a professional phoTOgrapher.'],
    tutorNotes: 'Tap the table on the stressed syllable. Have the learner hum the rhythm before saying the word.',
    firstLanguageNotes: {
      fr: 'French stresses the last syllable of a phrase, so English stress placement feels arbitrary.',
      es: 'Spanish stress is regular and spelling-marked; English stress must be learned per word.',
      ru: 'Russian also has moveable stress, which usually makes this easier to grasp.',
      he: 'Hebrew stress is often final, so English words get stressed too late.',
    },
    conversationPrompt: 'Describe your job or studies using longer words, focusing on the strong syllable.',
    connectedSpeech:
      'Stress is what a listener uses to find word boundaries. Get the stress right and imperfect sounds are still understood.',
    recordingPlan: {
      baseline: 'Record five long words from their own field, cold.',
      practice: 'Record the same words while tapping the stressed syllable.',
      improved: 'Record a sentence containing three of them.',
    },
  },
  {
    area: 'sentenceStress',
    title: 'Sentence stress',
    cefrFrom: 'B1',
    why: 'English stresses the content words (nouns, main verbs, adjectives) and reduces the small ones. Flat, equal stress sounds robotic and is genuinely harder to follow.',
    howTo: 'Stress the important words; say the small words (a, the, to, of) quickly and quietly.',
    minimalPairs: [
      { a: 'I want to GO. (natural)', b: 'I WANT TO GO. (flat)' },
      { a: 'I didn’t say HE stole it.', b: 'I didn’t say he STOLE it.' },
    ],
    // Content words carry the stress; function words are the ones that shrink.
    words: ['COFFEE', 'MEETING', 'TOMORROW', 'to', 'of', 'and', 'the'],
    sentences: ['I’d LIKE a CUP of COFfee.', 'She’s GOING to the STORE.', 'We NEED to TALK about the PLAN.'],
    tutorNotes:
      'Clap on stressed words only. Ask them to say a sentence while tapping the table on the strong words — the reduction happens by itself.',
    firstLanguageNotes: {
      fr: 'French is syllable-timed, so every syllable comes out equally strong.',
      es: 'Spanish is also syllable-timed — this is usually a big change for Spanish speakers.',
      ru: 'Russian reduces unstressed vowels already, which transfers well.',
      he: 'Hebrew is closer to syllable-timed, so the reduction needs building.',
    },
    conversationPrompt: 'Tell a short story; the tutor claps the beat while the learner keeps the rhythm.',
    connectedSpeech:
      'Moving the stress changes the meaning: “I didn’t say HE stole it” means something different from “I didn’t say he STOLE it.” Demonstrate that — it lands instantly.',
    recordingPlan: {
      baseline: 'Record “I’d like a cup of coffee” cold.',
      practice: 'Record it stressing only LIKE, CUP and COFFEE.',
      improved: 'Record one sentence six times, moving the stress each time, and discuss how the meaning shifts.',
    },
  },
  {
    area: 'rhythm',
    title: 'The beat of English',
    cefrFrom: 'B1',
    why: 'English is stress-timed: the strong beats come at roughly even intervals and everything between them gets squeezed. Speaking every syllable at equal length is the single biggest thing that makes fluent grammar still sound non-native.',
    howTo:
      'Keep a steady beat — tap it — and fit the small words into the gaps. “The BOY is in the GARden” has two beats, not six.',
    minimalPairs: [
      { a: 'CATS eat FISH. (3 beats)', b: 'The CATS have eaten the FISH. (still 3 beats)' },
    ],
    words: ['and', 'of', 'for', 'to', 'that', 'was'],
    sentences: ['The CATS have eaten the FISH.', 'I’ve been THINKing about it ALL day.'],
    tutorNotes:
      'Say the pair of sentences above at the same tempo so the learner hears that adding words did not add time. That demonstration is the whole lesson; everything else is repetition.',
    firstLanguageNotes: {
      fr: 'Syllable-timed — this needs the most work and gives the biggest payoff.',
      es: 'Syllable-timed; squeezing the function words feels like mumbling at first. Reassure them it is correct.',
      ru: 'Already reduces unstressed vowels, so the beat comes fairly naturally.',
      he: 'Fairly even timing, so the squeeze must be practised deliberately.',
    },
    conversationPrompt: 'Say the same story twice: once syllable by syllable, once on the beat. Ask which felt easier.',
    connectedSpeech:
      'Rhythm is where stress, reduction and linking all meet. If a learner only ever fixes one thing above the level of individual sounds, this is it.',
    recordingPlan: {
      baseline: 'Record the four-beat sentence cold.',
      practice: 'Record it again while tapping the beats out loud.',
      improved: 'Record thirty seconds of free speech and listen for whether the beat survives.',
    },
  },
  {
    area: 'reducedVowels',
    title: 'Reduced vowels (the schwa)',
    cefrFrom: 'B2',
    why: 'Unstressed syllables reduce to a quick “uh”. Pronouncing every vowel fully sounds unnatural, slows the speaker down, and paradoxically makes them harder to follow.',
    howTo: 'In unstressed syllables, relax the vowel to a short “uh”: banana → “bə-NA-nə”.',
    minimalPairs: [
      { a: 'to /tə/ (natural)', b: 'to /tuː/ (over-full)' },
      { a: 'can /kən/ (I can go)', b: 'can’t /kænt/' },
    ],
    words: ['banana', 'about', 'support', 'the', 'photograph', 'was'],
    sentences: ['I’d like a banana and a coffee.', 'It was about an hour ago.'],
    tutorNotes:
      'Circle the schwa syllables on paper. The “can / can’t” pair is worth its own minute: in American speech the difference is the vowel, not the T, which is often barely released.',
    firstLanguageNotes: {
      es: 'Spanish vowels are always full — reduction feels like being sloppy. Name that explicitly.',
      fr: 'French has a schwa but uses it differently; the English distribution must be learned.',
      ru: 'Russian already reduces unstressed vowels, so this transfers well.',
      he: 'Hebrew has a schwa, which helps, though its placement differs.',
    },
    conversationPrompt: 'Order food and drinks, keeping the small words short and reduced.',
    connectedSpeech:
      'Reduction is what makes room for the beat. Practise it with rhythm, never as an isolated sound.',
    recordingPlan: {
      baseline: 'Record “It was about an hour ago” cold.',
      practice: 'Record “can / can’t” pairs in full sentences.',
      improved: 'Re-record the sentence and count how many full vowels survived.',
    },
  },
  {
    area: 'linking',
    title: 'Linking & connected speech',
    cefrFrom: 'B2',
    why: 'Native speech links words together (an apple → “anapple”). Learners who separate every word sound choppy, and — more importantly — cannot follow natural speech coming back at them.',
    howTo: 'Connect a final consonant to a following vowel; blend words into groups, not one at a time.',
    minimalPairs: [{ a: 'an apple → “anapple”', b: 'an • apple (separated)' }],
    words: ['pick it up', 'a lot of', 'turn it on', 'want to → wanna'],
    sentences: ['I worked there for three years. → “worked-there-for-three-years”', 'Turn it off, please.'],
    tutorNotes:
      'Mark the links with a pen. Practise one phrase at natural speed rather than word-by-word. Linking also improves listening, which is worth saying out loud — it is not only about output.',
    firstLanguageNotes: {
      fr: 'French already links (liaison), so the concept is familiar even though the rules differ.',
      es: 'Spanish links vowel to vowel readily; consonant-to-vowel linking is the new part.',
      ru: 'Russian tends to separate words more; linking needs deliberate practice.',
      he: 'Hebrew separates words fairly clearly, so English blending sounds unclear at first.',
    },
    conversationPrompt: 'Say three everyday phrases at natural speed, linking the words.',
    connectedSpeech:
      'This IS connected speech. Test it by having them listen to a natural-speed sentence and write down how many words they heard.',
    recordingPlan: {
      baseline: 'Record “I worked there for about three years” word by word.',
      practice: 'Record the same phrase as one linked group.',
      improved: 'Record a natural-speed answer to a real question and listen for the blending.',
    },
  },
  {
    area: 'intonation',
    title: 'Intonation (rising & falling)',
    cefrFrom: 'B1',
    why: 'Melody carries meaning and attitude: falling for statements and wh-questions, rising for yes/no questions and to sound polite or unfinished. Flat intonation is often heard as rude or bored, which is a real social cost.',
    howTo: 'Let the voice fall at the end of statements. Let it rise for yes/no questions and to signal “there’s more”.',
    minimalPairs: [
      { a: 'You’re coming. (statement, falling)', b: 'You’re coming? (question, rising)' },
      { a: 'Sure. (falling — genuine)', b: 'Sure… (rising — doubtful)' },
    ],
    words: ['really?', 'okay.', 'right?'],
    sentences: ['Are you ready?', 'I finished the report.', 'So, first… then…'],
    tutorNotes:
      'Draw the melody line in the air. Over-exaggerate first, then normalise. Point out the social meaning — learners often do not realise flat delivery reads as unfriendly.',
    firstLanguageNotes: {
      ru: 'Russian intonation patterns can sound abrupt in English; the polite rise is worth teaching explicitly.',
      he: 'Hebrew directness plus flat melody can read as blunt to American ears.',
      fr: 'French phrase-final rise transfers oddly onto English statements.',
      es: 'Spanish question intonation is close enough to transfer well.',
    },
    conversationPrompt: 'Role-play asking and answering questions at a café, matching the melody.',
    connectedSpeech:
      'In a long turn, intonation is what tells the listener you have not finished. Practise a three-part list: rise, rise, fall.',
    recordingPlan: {
      baseline: 'Record three questions and three statements read flat.',
      practice: 'Record the same six lines with the melody exaggerated.',
      improved: 'Record a short role-play and listen for whether the melody survived real content.',
    },
  },
]

export function getPronunciationByArea(area: string): PronunciationConcept | undefined {
  return pronunciationLibrary.find((p) => p.area === area)
}

/** Areas with no teaching content — should always be empty; pinned by a test
 *  so a new area can never be offered as a target the app cannot teach. */
export function pronunciationAreasWithoutContent(areas: readonly PronunciationArea[]): PronunciationArea[] {
  return areas.filter((area) => !getPronunciationByArea(area))
}

/**
 * The pronunciation area a captured mispronunciation belongs to.
 *
 * A tutor types the word they actually heard ("free" for "three"), not an area
 * code, so the match runs over the words and minimal pairs each area already
 * teaches. Whole-word matching only: a substring rule would file "other" under
 * every area whose word list happens to contain "the". Returns undefined
 * rather than guessing — an unmatched correction stays its own issue, which is
 * honest, instead of being filed under a sound nobody observed.
 */
export function findPronunciationForError(text: string): PronunciationConcept | undefined {
  const words = new Set((text.toLocaleLowerCase().match(/[\p{L}\p{N}’']+/gu) ?? []))
  if (words.size === 0) return undefined
  let best: { concept: PronunciationConcept; hits: number } | undefined
  for (const concept of pronunciationLibrary) {
    const targets = new Set(
      [...concept.words, ...concept.minimalPairs.flatMap((p) => [p.a, p.b])].map((w) =>
        w.toLocaleLowerCase(),
      ),
    )
    let hits = 0
    for (const w of words) if (targets.has(w)) hits += 1
    if (hits > 0 && (!best || hits > best.hits)) best = { concept, hits }
  }
  return best?.concept
}
