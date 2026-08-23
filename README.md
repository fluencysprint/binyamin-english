# Binyamin English

**Speak clearly. Speak naturally.**

Private English tutoring & American pronunciation.

A zero-cost, offline-capable web app that helps Binyamin run high-quality,
adaptive 1-on-1 English lessons for learners from roughly age 6 through adult — and
gives the public a short, friendly self-check that ends in a personalized snapshot.

Everything runs in the browser. **No backend, no accounts, no paid APIs, no AI
runtime services, no trackers.** Student data lives on the device (IndexedDB) unless
the tutor exports a backup.

- **Live site:** [https://fluencysprint.github.io/binyamin-english/](https://fluencysprint.github.io/binyamin-english/)

---

## Two experiences

### 1. Public student experience (open)
- A landing page built around what a lesson actually delivers — a plan built
  from an assessment, speaking and pronunciation work, and a written report
  plus short homework after every lesson — with the lesson format (**private
  lessons · 50 minutes · online**) stated in the hero rather than buried
- An About page that builds trust from method, not from credentials: how a
  lesson is prepared, what carries over from the last one, what you get in
  writing. No invented certifications, testimonials or results.
- A short (~8–15 min) **level-balanced English self-check** (samples every CEFR level so a strong learner can still reach C1, instead of stopping early), which says up front that it reads grammar, vocabulary and reading and cannot hear you speak
- An **English Snapshot**: approximate CEFR level, strongest area, 2–3 priorities,
  and one useful correction — followed by an honest bridge into a lesson (what
  the check could not see, and what the first lesson does about it)
- A **four-question booking page**: name, email, who the lesson is for, what
  you want to work on. Everything else is answered in the reply. The enquiry is
  sent by email or copied to the clipboard — the address is built only when the
  visitor asks to send, so no `mailto:` is served in the HTML — the draft
  survives leaving the page, and nothing ever claims to have been "submitted".

The public experience gives real value without exposing the full teaching system.

### 2. Tutor system (behind a light access gate)
- Student profiles and onboarding
- A guided **~50-minute lesson runner** built around **micro-steps**: two-to-five
  minutes of one clear thing, each answering nine questions at a glance —
  **NOW / SAY / DO / STUDENT DOES / LOOK FOR / HELP / CHALLENGE / DONE WHEN / NEXT**
- **Pacing that guides rather than polices.** The runner always shows roughly where
  you are in the 50 minutes and whether to continue, simplify, advance or change
  activity — and never tells you to interrupt a conversation that is going well,
  whatever the clock says. Step length adapts by age, from two-minute bursts for a
  five-year-old to sustained conversation blocks for a C1 adult.
- **Adaptive difficulty** that finds the instructional level efficiently
- **Private tutor cards** on activities (goal, what to listen for, if they struggle /
  succeed, how to explain, models, practice, what to avoid), kept behind progressive
  disclosure so teaching theory never sits between the tutor and the next line
- **Grammar library** (A1–C1) and **pronunciation curriculum**, each entry carrying the
  full teaching sequence — meaning first, then model, notice, guided practice,
  retrieval, real use, and the exact words to say when correcting
- **Local pronunciation recording** with before/after comparison (never uploaded)
- A **fluency sprint** in every lesson from A1 upward: the same topic told two or
  three times against a shrinking clock, which is the one exercise that needs a
  live listener and the one that moves hesitation and speech rate
- **Contextual follow-up questions** written for the topic on the table, not a
  generic "Why do you think that is?" pool, and scaled to the learner's age and level
- **A learner-facing lesson screen with the lesson actually on it.** In Student and
  Together mode the shared screen carries the task, the follow-up questions one at a
  time, the target language behind a single disclosure, model sentences, minimal pairs
  and word banks — all derived from the same content banks the tutor guidance is built
  from, in the language selected right now. Support is present but closed, so nothing
  is on screen before the attempt.
- **Fast correction capture** and a **persistent learning model** with spaced review
- **A fix drill built from the learner's own recurring slips.** Once the same mistake
  has been captured in two lessons, "I am agree" → "I agree" becomes production
  practice inside the lesson, not just a line telling the tutor what to listen for —
  which is what actually shifts a habit the grammar library has no rule for.
- **Longitudinal progress that the tutor can actually act on.** Evidence is counted in
  *lessons*, not occurrences, so the system tells apart a slip from a weakness: an
  error seen in one lesson stays **new**, one seen across two or more is **recurring**,
  one that has gone quiet for two lessons is **improving**, and one absent for three
  stops influencing planning altogether. Every verdict carries the reason that
  produced it — no scores, no confidence percentages, nothing opaque.
- **A pre-lesson briefing** — where you left off, the corrections worth re-hearing,
  the words due for recall, what keeps coming back, last time's homework, and today's
  focus — so nobody has to read three old reports before teaching
- **Spaced vocabulary recall that closes the loop**: words captured in one lesson come
  back in a later one, the tutor taps *Got it* / *Not yet*, and the schedule moves.
  A word nobody was asked about claims nothing and is simply re-queued.
- **Automatic next-lesson generation** — deterministic and local, driven by the same
  ranked evidence the dashboard shows, so the briefing never recommends a focus the
  generated lesson then refuses to teach
- A **strong-C1 pathway** that shifts from teaching to advanced communication coaching
- Polished **student + parent lesson reports**, each ending with **one to three small
  homework tasks built from what actually happened** — their own corrected sentences,
  the words captured today, the sound practised, the sprint to repeat at home. A
  learner who cannot write yet is never asked to write.
- **Homework that comes back.** One tap on the briefing records whether last week's
  set was done, half-done or missed; a learner who did not do it gets a shorter set
  next time rather than a longer one, and the tutor sees the rate with its
  denominator ("came back 4 of the last 6 times") instead of a streak.
- **Backups**: export / import all data (including audio) as a single JSON file

> The tutor gate is a light deterrent, not security. This is a static site whose
> code is public — keep student data on trusted devices.

---

## Tech stack

- **React + TypeScript + Vite**
- **CSS** design-token system with light/dark themes and RTL support
- **IndexedDB** (via `idb`) for structured data + audio blobs; **localStorage** for
  settings and active-lesson recovery
- **Vitest + React Testing Library** for unit and integration tests
- **vite-plugin-pwa** for an installable, offline-capable PWA
- **BrowserRouter** with real crawlable URLs, plus build-time prerendering of one
  static HTML file per public page per locale (see below)

Full dependency + license list: [THIRD_PARTY_LICENSES.md](./THIRD_PARTY_LICENSES.md).

---

## Languages

Full UI in **English, Hebrew (RTL), Russian, Spanish, and French** — five locales
kept complete, deliberately, rather than six kept half-translated. All visible
strings come from locale resources in [`src/locales`](./src/locales). A test
(`src/tests/locales.test.ts`) enforces that every locale has exactly the same keys,
no empty values, matching interpolation placeholders, and that the supported set,
the dictionaries, the display names and the demo data all agree on which five.
Adding a language is a matter of adding one locale file and registering it.

The **teaching itself is localized too**, not just the shell around it. A lesson
plan stores what is being taught — a grammar concept id, a pronunciation area, a
warm-up id, the topic prompt — and never how to teach it. Every instruction the
tutor reads (NOW / DO / STUDENT DOES / LOOK FOR / HELP / CHALLENGE / DONE WHEN /
NEXT, the tutor card beneath it, activity and phase names, the objective and the
reason for it) is rebuilt from that id at render time by
[`src/lessons/guidance.ts`](./src/lessons/guidance.ts). Two consequences, both
deliberate: switching the picker re-renders a lesson in the new language with no
regeneration and no migration, and a plan saved months ago carries no stale
English because it never carried any prose to begin with.

Guidance prose written in code lives in [`src/locales/guide`](./src/locales/guide);
prose that belongs to a content bank entry is keyed by content id in
[`src/locales/content`](./src/locales/content), with the bank itself holding the
English. Five languages of teaching guidance is a lot of text and none of it is
any use on a public page, so only English is bundled — the other four are fetched
as their own chunks the first time the tutor area opens
([`src/i18n/teachingStrings.ts`](./src/i18n/teachingStrings.ts)), and resolve to
English until they land rather than blocking the screen. `src/tests/tutorLocalization.test.ts` audits both: every content key
exists in all four non-English locales, a real generated lesson is walked
step-by-step in each language with no English instruction surviving, and the
English targets come back byte-identical.

Three rules keep a screen in one language:

- **Everything renders in the locale selected right now.** Nothing translated is
  ever persisted, and a profile's stored language preference is a default for the
  picker, not a source of strings. A stored tag from an older build is normalized
  on the way out of storage (`normalizeUILanguage`), so legacy records cannot put
  two languages on one screen.
- **The English being taught stays English**, marked `lang="en"` and `dir="ltr"`.
  That includes everything the tutor SAYS out loud: example sentences, minimal
  pairs, practice items, conversation prompts. Translating those would delete the
  lesson, so the audit asserts they are the same in all five locales.
- **Nothing the tutor typed is ever translated.**

Quotation marks belong to whoever renders a value, never to the value
([`src/utils/quotes.ts`](./src/utils/quotes.ts)): views call `quoted()`, and
`interpolate` normalizes any value a template already wrapped in quotes, so an
inner quote nests instead of doubling. Translated strings that embed English
inside RTL prose are split into direction runs
([`src/utils/bidi.ts`](./src/utils/bidi.ts)) and rendered through `<bdi dir="ltr">`
— isolation, never rearranged punctuation.

The header measures itself rather than switching at a fixed breakpoint
([`src/components/useHeaderStage.ts`](./src/components/useHeaderStage.ts)): a width
chosen for English labels overflowed in Russian and French, so the row now gives up
the wordmark, then the nav, then the tutor controls, in that order, at whatever
width its actual contents stop fitting.

---

## Getting started

Requires Node 20+.

```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:5173)
```

### Tutor area
Open `/tutor` and enter the access phrase. The default is **`teach`**.
To change it, replace `TUTOR_GATE_HASH` in [`src/app/config.ts`](./src/app/config.ts)
with `djb2(yourPhrase)`.

### Contact / booking
All contact configuration lives in one place:
[`src/app/contact.ts`](./src/app/contact.ts).

The booking page collects the student details, then offers **Send by email** or
**Copy inquiry**. The `mailto:` URL is assembled inside the click handler, so the
served HTML contains no address and no `mailto:` href. That reduces casual
scraping — it is **not** secrecy: this is a static site, so the address is in the
JS bundle and always readable by anyone who looks.

No phone number and no WhatsApp entry point exist anywhere in the app. Telegram is
supported but **off**: set `TELEGRAM_USERNAME` to a public username to render the
link, leave it empty (the default) and no Telegram UI is rendered at all.

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Typecheck and build the production bundle to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run typecheck` | Run the TypeScript compiler (no emit) |
| `npm run lint` | Run ESLint (zero warnings allowed) |
| `npm test` | Run all unit + integration tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:e2e` | Run the Playwright (real Chromium) suite |

---

## Testing

```bash
npm test
```

Covers the placement engine, skill estimates, level progression, lesson generation,
review scheduling, persistence, backup import/export, localization completeness,
audio metadata, SEO output (titles, canonicals, hreflang clusters, sitemap,
prerendered HTML), contact handling, brand/name discipline, glyph safety, and
end-to-end public/tutor flows (assessment → snapshot → booking, onboarding →
dashboard, tutor gate, RTL switching, 404).

Four suites carry most of the pedagogy and safety guarantees:

| Suite | What it protects |
| --- | --- |
| `src/tests/curriculum.test.ts` | The coverage matrix: every CEFR level has enough grammar, every declared pronunciation area has teaching content, every Pre-A1 stage × audience can fill a lesson without repeating, and no concept opens with an abstract rule or unexplained jargon |
| `src/lessons/microSteps.test.ts` | Every activity, for every learner profile in the audit matrix, produces steps with all nine sections filled and an age-appropriate length |
| `src/tests/educationalDecisions.test.ts` | The decisions themselves: a P0 child and a P0 older adult get different lessons, oral ability above reading ability never produces a paragraph, a repeated error picks the next objective, spaced review returns, and mastery needs repeated evidence |
| `src/tests/validation.test.ts` | Hebrew, Cyrillic, accented and emoji input survive untouched while empty, absurd, over-long and malformed input is refused with a localized message |

Real-browser tests (`npm run test:e2e`, Playwright/Chromium) cover what jsdom
cannot see. They run in two projects: `chromium` against the dev server for layout
and behaviour, and `pwa` against a real production build served from the same
`/binyamin-english/` base GitHub Pages uses — the manifest, service worker and icon
set only exist in a build, so they can only be inspected there. Between them:
header and lesson-runner layout at 320/360/390/414/768/1024/1440, horizontal
overflow and rendered-rectangle overlap in all five locales, Hebrew RTL including
mixed Hebrew/English punctuation, live locale switching across several student
profiles, speech playback and its failure path, dark mode, mobile keyboard
semantics and validation messages, mode isolation, the manifest and every icon it
declares, and the runtime SEO head.

---

## The brand mark

The installed Android PWA icon — a teal rounded tile carrying a geometric white **B**
built from a stem and two open bowls — is the canonical brand treatment. It used to be
drawn three incompatible ways (a scanline rasterizer, a Georgia `<text>` glyph in the
favicon, a CSS letter in the header), so the app looked nothing like its own home-screen
icon.

Everything now derives from one set of numbers:

- [`src/brand/geometry.json`](./src/brand/geometry.json) — the source of truth, read by
  [`scripts/gen-icons.mjs`](./scripts/gen-icons.mjs)
- [`src/brand/mark.ts`](./src/brand/mark.ts) — the same numbers as a TS literal (a Node
  script cannot import TypeScript, and importing JSON from TS needs an import attribute
  three module loaders disagree about), pinned identical to the JSON by a test
- [`src/components/BrandMark.tsx`](./src/components/BrandMark.tsx) — the one component
  that draws it, used where a logo belongs and nowhere else

```bash
node scripts/gen-icons.mjs   # regenerates every icon + favicon.svg from the geometry
```

It emits `icon-192.png` and `icon-512.png` (purpose `any`, rounded tile), a **separate
full-bleed `icon-maskable-512.png`** so a launcher mask can never cut into transparent
corners, an opaque `apple-touch-icon.png`, and `favicon.svg`. The maskable icon is the
identical mark at the identical size — only the corners change — so the installed icon
looks exactly as it always has. The glyph's furthest point sits at 0.312 of the icon
width from the centre, comfortably inside the 0.40 maskable safe radius; a test asserts
it stays there.

---

## SEO architecture

The public pages are real, crawlable URLs; the tutor app is not indexed at all.

| Page | English | Other locales |
| --- | --- | --- |
| Home | `/` | `/he/`, `/ru/`, `/es/`, `/fr/` |
| Level check | `/check-english/` | `/he/check-english/`, … |
| Book a lesson | `/book/` | `/he/book/`, … |
| About | `/about/` | `/he/about/`, … |

- [`src/seo/site.ts`](./src/seo/site.ts) is the single source of truth for that map.
  The router, the runtime `<Seo>` component and the build-time prerenderer all read
  it, so they cannot drift apart.
- At build time [`src/seo/prerender.ts`](./src/seo/prerender.ts) writes **one real
  HTML file per page per locale** (`dist/he/about/index.html`, …), each with its own
  `<title>`, meta description, canonical, full `hreflang` cluster with `x-default`,
  Open Graph/Twitter tags, and a crawlable copy of the page's headline, summary and
  links. GitHub Pages therefore answers every public URL with a 200 and real content
  instead of an empty SPA shell. React removes the fallback block on mount.
- It also emits `sitemap.xml` (every URL with its hreflang cluster) and `404.html`,
  the `noindex` SPA fallback GitHub Pages serves for tutor routes and wrong URLs.
- JSON-LD is emitted on the home page only, and describes just what is true: an
  online English tutoring service and its provider. No ratings, prices or addresses
  are invented.
- Tutor screens and the 404 page emit `noindex, nofollow` and drop the public
  canonical/hreflang set (`<PrivateSeo>`).
- `robots.txt` ships with the site, but note that on a *project* Pages site only
  `fluencysprint.github.io/robots.txt` is authoritative — the `noindex` meta tag is
  what actually keeps the tutor area out of search results.
- Old `#/about`-style links still work: they are rewritten to the real path before
  the router mounts.
- No `meta keywords` tag is emitted, and a test enforces that.

---

## Deployment (GitHub Pages)

Deployment is automated by [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml):
on every push to `main` it typechecks, lints, tests, builds, and publishes `dist/`
to GitHub Pages.

One-time setup: in the repository **Settings → Pages**, set **Source** to
**GitHub Actions**.

The Vite `base` is `/binyamin-english/` for production builds (see
[`vite.config.ts`](./vite.config.ts)). If you fork under a different repo name,
update that base path.

### Manual deploy
```bash
npm run build       # outputs to dist/
# then serve dist/ from any static host
```

---

## Data & privacy

- Student records are stored **on the device** in IndexedDB. Nothing is uploaded.
- Pronunciation recordings stay on the device and are never sent anywhere. The
  microphone is only requested when the tutor chooses to record, after a clear notice.
- Export a full backup (including audio) at any time; import it on another device.
- Delete an individual recording, all recordings for a student, a whole student, or
  all local data.

---

## Project structure

```
src/
  app/           App shell, routing, providers, config, contact details
  assessment/    Level-balanced placement engine, scoring, snapshot
  audio/         Recorder hook + UI, playback/comparison list
  booking/       Inquiry formatting (copy-to-clipboard)
  components/    Reusable UI (layout, controls, modal, toast, ui primitives)
  data/          IndexedDB layer, backup, settings, content banks, example seed
  i18n/          Lightweight i18n provider + dictionary utilities
  lessons/       Lesson generator, activity content, completion logic, briefing
  locales/       en / he / ru / es / fr
  pages/         Public pages (landing, about, assessment, booking, 404)
  reports/       Report generator + report view
  seo/           Public URL map, head metadata, build-time prerenderer
  students/      Learning model, longitudinal progress engine, service layer
  tutor/         Tutor pages (home, onboarding, dashboard, lesson runner, data)
  types/         Domain + content types
  tests/         Integration tests + setup
  utils/         cefr, id, time, blob helpers
```
