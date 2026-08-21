import { useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { FieldError } from '../components/FieldError'
import {
  AGE_MAX,
  AGE_MIN,
  LIMITS,
  collectIssues,
  isValid,
  validateAge,
  validateOptionalText,
  validateRequiredText,
} from '../utils/validation'
import { useI18n } from '../i18n/I18nProvider'
import { FamilyIcon, SparkleIcon } from '../components/icons'
import {
  AssessmentSnapshot,
  CEFR,
  CEFR_LEVELS,
  EnglishLiteracyLevel,
  EnglishOralLevel,
  Goal,
  GOALS,
  UILanguage,
} from '../types'
import { needsNativeScaffolding } from '../students/beginnerModel'
import { cefrLabel } from '../utils/cefr'
import { Bdi } from '../components/Bdi'
import { ChipGroup, RatingScale, TagInput, Progress } from '../components/ui'
import { ageToBand } from '../lessons/lessonGenerator'
import { createStudent } from '../students/studentService'
import { AssessmentRunner } from '../assessment/AssessmentRunner'
import { shouldUseFoundationalCheck } from '../assessment/foundationalGate'
import { ORAL_OPTIONS, READING_OPTIONS } from '../assessment/selfReportOptions'
import { SnapshotCard } from '../components/SnapshotCard'
import { languageNames } from '../locales'
import { UI_LANGUAGES } from '../types'
import styles from './StudentOnboardingPage.module.css'

/** Where this student is starting from. The single most important question in
 *  onboarding: it decides whether we teach from scratch, place them with a real
 *  assessment, or go straight to fluency coaching. */
type Triage = 'beginner' | 'assessed' | 'fluent'

/** School grades, as a choice rather than free text — the allowed values are
 *  known, so nobody should have to type "7th grade" and hope. */
const GRADE_OPTIONS = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']

/** The first languages this tutor actually meets, offered as suggestions.
 *  Not a closed list: the field stays typeable in any script. */
const COMMON_FIRST_LANGUAGES = [
  'Hebrew',
  'Russian',
  'Spanish',
  'French',
  'Arabic',
  'Portuguese',
  'Ukrainian',
  'Amharic',
  'English',
]

const TRIAGE_OPTIONS: { value: Triage; labelKey: string; descKey: string }[] = [
  { value: 'beginner', labelKey: 'onboarding.triageBeginner', descKey: 'onboarding.triageBeginnerDesc' },
  { value: 'assessed', labelKey: 'onboarding.triageAssessed', descKey: 'onboarding.triageAssessedDesc' },
  { value: 'fluent', labelKey: 'onboarding.triageFluent', descKey: 'onboarding.triageFluentDesc' },
]

export function StudentOnboardingPage() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()

  const idBase = useId()
  const ids = {
    name: `${idBase}-name`,
    age: `${idBase}-age`,
    grade: `${idBase}-grade`,
    nativeLanguage: `${idBase}-native`,
    parentName: `${idBase}-parent`,
  }

  const [stepIndex, setStepIndex] = useState(0)
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [grade, setGrade] = useState('')
  const [nativeLanguage, setNativeLanguage] = useState('')
  const [otherLanguages, setOtherLanguages] = useState<string[]>([])
  const [interfaceLanguage, setInterfaceLanguage] = useState<UILanguage>(lang)
  const [experience, setExperience] = useState('')
  const [selfLevel, setSelfLevel] = useState<CEFR | ''>('')
  const [goals, setGoals] = useState<Goal[]>([])
  const [interests, setInterests] = useState<string[]>([])
  const [speakingConfidence, setSpeakingConfidence] = useState(3)
  const [pronunciationImportance, setPronunciationImportance] = useState(3)
  const [parentName, setParentName] = useState('')
  const [englishListening, setEnglishListening] = useState<EnglishOralLevel | undefined>()
  const [englishSpeaking, setEnglishSpeaking] = useState<EnglishOralLevel | undefined>()
  const [englishReading, setEnglishReading] = useState<EnglishLiteracyLevel | undefined>()
  const [respondedByParent, setRespondedByParent] = useState(false)
  const [triage, setTriage] = useState<Triage | ''>('')
  const [snapshot, setSnapshot] = useState<AssessmentSnapshot | null>(null)
  const [quizStarted, setQuizStarted] = useState(false)

  /* Validation. Every field goes through the shared layer (src/utils/validation.ts)
     so a name in Hebrew, Cyrillic or with accents survives untouched while
     control characters, absurd ages and over-long input are caught with a
     localized message instead of being silently mangled. `touched` keeps the
     form from shouting at someone who has not typed anything yet. */
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const touch = (field: string) => setTouched((cur) => ({ ...cur, [field]: true }))

  const nameResult = validateRequiredText(name, { maxLength: LIMITS.name })
  const ageResult = validateAge(age)
  const nativeResult = validateOptionalText(nativeLanguage, { maxLength: LIMITS.shortText })
  const gradeResult = validateOptionalText(grade, { maxLength: LIMITS.shortText })
  const parentResult = validateOptionalText(parentName, { maxLength: LIMITS.name })
  const experienceResult = validateOptionalText(experience, { maxLength: LIMITS.line })
  const identityResults = {
    name: nameResult,
    age: ageResult,
    nativeLanguage: nativeResult,
    grade: gradeResult,
    parentName: parentResult,
  }
  const issues = collectIssues({ ...identityResults, experience: experienceResult })

  const ageNum = ageResult.ok ? ageResult.value : NaN
  const isMinor = !Number.isNaN(ageNum) && ageNum < 18
  const canProceed = isValid(identityResults)
  const band = Number.isNaN(ageNum) ? 'adult' : ageToBand(ageNum)

  // An already-fluent learner needs neither a placement quiz nor beginner
  // questions, so their flow is one step shorter.
  const steps: ('identity' | 'triage' | 'level' | 'details')[] =
    triage === 'fluent'
      ? ['identity', 'triage', 'details']
      : ['identity', 'triage', 'level', 'details']
  const step = steps[Math.min(stepIndex, steps.length - 1)]
  const next = () => setStepIndex((i) => Math.min(i + 1, steps.length - 1))
  const back = () => setStepIndex((i) => Math.max(i - 1, 0))

  const submit = async () => {
    // Re-validate at the boundary. The Create button is already gated, but a
    // profile is persisted here and everything downstream (reports, backups,
    // the booking email) reads these values back.
    if (!isValid(identityResults)) {
      setTouched({ name: true, age: true, nativeLanguage: true, grade: true, parentName: true })
      setStepIndex(0)
      return
    }
    const student = await createStudent({
      name: nameResult.ok ? nameResult.value : '',
      age: ageNum,
      ageBand: ageToBand(ageNum),
      grade: gradeResult.ok ? gradeResult.value : undefined,
      nativeLanguage: (nativeResult.ok && nativeResult.value) || '',
      otherLanguages,
      interfaceLanguage,
      englishExperience: experienceResult.ok ? experienceResult.value : undefined,
      selfEstimatedLevel: selfLevel || undefined,
      goals,
      interests,
      speakingConfidence: speakingConfidence as 1 | 2 | 3 | 4 | 5,
      pronunciationImportance: pronunciationImportance as 1 | 2 | 3 | 4 | 5,
      parentName: isMinor && parentResult.ok ? parentResult.value : undefined,
      englishListening,
      englishSpeaking,
      englishReading,
      nativeLanguageLiteracy: respondedByParent ? 'no' : undefined,
      needsNativeLanguageScaffolding: needsNativeScaffolding(englishReading),
      respondedByParent: respondedByParent || undefined,
      // Placement comes from THIS session only — never from a leftover public
      // self-check sitting in browser storage.
      snapshot: triage === 'assessed' ? snapshot : undefined,
      startLevelOverride:
        triage === 'beginner' ? 'preA1' : triage === 'fluent' ? 'C1' : undefined,
    })
    navigate(`/tutor/student/${student.id}`)
  }

  return (
    <Layout>
      <div className="container container-narrow" style={{ paddingBlock: 'var(--sp-6)' }}>
        <h1>{t('onboarding.title')}</h1>
        <p className="muted" style={{ margin: 'var(--sp-2) 0 var(--sp-4)' }}>
          {t('onboarding.step', { current: stepIndex + 1, total: steps.length })}
        </p>
        <Progress value={stepIndex + 1} max={steps.length} label="onboarding progress" />

        {step === 'identity' && (
          <div className="stack-lg" style={{ marginTop: 'var(--sp-5)' }}>
            {/* The error sits OUTSIDE the <label> and is wired up with
                aria-describedby. Nesting it inside the label folded the message
                into the field's accessible name, so the input stopped being
                findable as "Age" the moment it became invalid — which is
                precisely when assistive tech most needs to find it. */}
            <div className="field">
              <label htmlFor={ids.name}>{t('onboarding.name')}</label>
              <input
                id={ids.name}
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => touch('name')}
                autoFocus
                type="text"
                autoComplete="given-name"
                autoCapitalize="words"
                enterKeyHint="next"
                maxLength={LIMITS.name}
                required
                aria-invalid={touched.name && !nameResult.ok}
                aria-describedby={touched.name && issues.name ? `${ids.name}-error` : undefined}
              />
              {touched.name && <FieldError issue={issues.name} id={`${ids.name}-error`} />}
            </div>

            <div className={styles.row2}>
              <div className="field">
                <label htmlFor={ids.age}>{t('onboarding.age')}</label>
                {/* type=number rather than a plain text field: it opens the
                    numeric keypad on Android and iOS, and the bounds are the
                    real ones this app teaches within (see AGE_MIN/AGE_MAX).
                    `pattern` keeps iOS on the digits keypad. */}
                <input
                  id={ids.age}
                  className="input"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  onBlur={() => touch('age')}
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min={AGE_MIN}
                  max={AGE_MAX}
                  step={1}
                  enterKeyHint="next"
                  required
                  aria-invalid={touched.age && !ageResult.ok}
                  aria-describedby={touched.age && issues.age ? `${ids.age}-error` : undefined}
                />
                {touched.age && <FieldError issue={issues.age} id={`${ids.age}-error`} />}
              </div>
              {isMinor && (
                <div className="field">
                  <label htmlFor={ids.grade}>{t('onboarding.grade')}</label>
                  {/* A known, small set of values — so it is chosen, not typed. */}
                  <select
                    id={ids.grade}
                    className="select"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                  >
                    <option value="">{t('common.optional')}</option>
                    {GRADE_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className={styles.row2}>
              <div className="field">
                <label htmlFor={ids.nativeLanguage}>{t('onboarding.nativeLanguage')}</label>
                {/* A datalist, not a select: the common cases are one tap, but
                    a learner whose language is not listed can still type it,
                    in their own script. */}
                <input
                  id={ids.nativeLanguage}
                  className="input"
                  value={nativeLanguage}
                  onChange={(e) => setNativeLanguage(e.target.value)}
                  onBlur={() => touch('nativeLanguage')}
                  type="text"
                  list={`${ids.nativeLanguage}-list`}
                  autoComplete="language"
                  enterKeyHint="next"
                  maxLength={LIMITS.shortText}
                  aria-invalid={touched.nativeLanguage && !nativeResult.ok}
                  aria-describedby={
                    touched.nativeLanguage && issues.nativeLanguage
                      ? `${ids.nativeLanguage}-error`
                      : undefined
                  }
                />
                <datalist id={`${ids.nativeLanguage}-list`}>
                  {COMMON_FIRST_LANGUAGES.map((l) => (
                    <option key={l} value={l} />
                  ))}
                </datalist>
                {touched.nativeLanguage && (
                  <FieldError issue={issues.nativeLanguage} id={`${ids.nativeLanguage}-error`} />
                )}
              </div>
              <div className="field">
                <span style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>
                  {t('onboarding.otherLanguages')} ({t('common.optional')})
                </span>
                <TagInput
                  value={otherLanguages}
                  onChange={setOtherLanguages}
                  placeholder={t('onboarding.otherLanguagesPlaceholder')}
                  ariaLabel={t('onboarding.otherLanguages')}
                />
              </div>
            </div>

            {isMinor && (
              <div className="field">
                <label htmlFor={ids.parentName}>
                  {t('onboarding.parentName')} ({t('common.optional')})
                </label>
                <input
                  id={ids.parentName}
                  className="input"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  onBlur={() => touch('parentName')}
                  type="text"
                  autoComplete="name"
                  autoCapitalize="words"
                  enterKeyHint="next"
                  maxLength={LIMITS.name}
                  aria-invalid={touched.parentName && !parentResult.ok}
                  aria-describedby={
                    touched.parentName && issues.parentName ? `${ids.parentName}-error` : undefined
                  }
                />
                {touched.parentName && (
                  <FieldError issue={issues.parentName} id={`${ids.parentName}-error`} />
                )}
              </div>
            )}

            <label className="field">
              <span>{t('onboarding.interfaceLanguage')}</span>
              <select
                className="select"
                value={interfaceLanguage}
                onChange={(e) => setInterfaceLanguage(e.target.value as UILanguage)}
              >
                {UI_LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {languageNames[l]}
                  </option>
                ))}
              </select>
            </label>

            <div className="cluster" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-primary btn-lg" disabled={!canProceed} onClick={next}>
                {t('common.next')}
              </button>
            </div>
          </div>
        )}

        {step === 'triage' && (
          <div className="stack-lg" style={{ marginTop: 'var(--sp-5)' }}>
            <div>
              <h2>{t('onboarding.triageTitle')}</h2>
              <p className="muted" style={{ marginTop: 'var(--sp-2)' }}>
                {t('onboarding.triageHelp')}
              </p>
            </div>

            <div className={styles.triageList} role="radiogroup" aria-label={t('onboarding.triageTitle')}>
              {TRIAGE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={triage === o.value}
                  className={`${styles.triageOption} ${triage === o.value ? styles.triageActive : ''}`}
                  onClick={() => setTriage(o.value)}
                >
                  <span className={styles.triageLabel}>{t(o.labelKey)}</span>
                  <span className={styles.triageDesc}>{t(o.descKey)}</span>
                </button>
              ))}
            </div>

            <div className="cluster" style={{ justifyContent: 'space-between' }}>
              <button className="btn btn-lg" onClick={back}>
                {t('common.back')}
              </button>
              <button className="btn btn-primary btn-lg" disabled={triage === ''} onClick={next}>
                {t('common.next')}
              </button>
            </div>
          </div>
        )}

        {step === 'level' && triage === 'beginner' && (
          <div className="stack-lg" style={{ marginTop: 'var(--sp-5)' }}>
            <div>
              <h2>{t('onboarding.beginnerStepTitle')}</h2>
              <p className="muted" style={{ marginTop: 'var(--sp-2)' }}>
                {t('onboarding.beginnerStepHelp')}
              </p>
            </div>

            <EnglishSelfReport
              isMinor={isMinor}
              respondedByParent={respondedByParent}
              setRespondedByParent={setRespondedByParent}
              englishListening={englishListening}
              setEnglishListening={setEnglishListening}
              englishSpeaking={englishSpeaking}
              setEnglishSpeaking={setEnglishSpeaking}
              englishReading={englishReading}
              setEnglishReading={setEnglishReading}
            />

            <div className="cluster" style={{ justifyContent: 'space-between' }}>
              <button className="btn btn-lg" onClick={back}>
                {t('common.back')}
              </button>
              <button className="btn btn-primary btn-lg" onClick={next}>
                {t('common.next')}
              </button>
            </div>
          </div>
        )}

        {step === 'level' && triage === 'assessed' && (
          <div className="stack-lg" style={{ marginTop: 'var(--sp-5)' }}>
            {snapshot ? (
              <>
                <div>
                  <h2>{t('onboarding.placementDoneTitle')}</h2>
                  <p className="muted" style={{ marginTop: 'var(--sp-2)' }}>
                    {t('onboarding.placementDoneHelp')}
                  </p>
                </div>
                <SnapshotCard snapshot={snapshot} />
                <div className="cluster" style={{ justifyContent: 'space-between' }}>
                  <button className="btn btn-lg" onClick={() => setSnapshot(null)}>
                    {t('onboarding.placementRetake')}
                  </button>
                  <button className="btn btn-primary btn-lg" onClick={next}>
                    {t('common.next')}
                  </button>
                </div>
              </>
            ) : quizStarted ? (
              <>
                <div>
                  <h2>{t('onboarding.placementTitle')}</h2>
                  <p className="muted" style={{ marginTop: 'var(--sp-2)' }}>
                    {t('onboarding.placementHelp')}
                  </p>
                </div>
                <AssessmentRunner
                  ageBand={band}
                  selfLevel={selfLevel || undefined}
                  foundational={shouldUseFoundationalCheck({
                    ageBand: band,
                    englishReading,
                    englishListening,
                    englishSpeaking,
                  })}
                  onComplete={(result) => setSnapshot(result)}
                />
                <div className="cluster">
                  <button className="btn btn-lg" onClick={() => setQuizStarted(false)}>
                    {t('common.back')}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h2>{t('onboarding.placementTitle')}</h2>
                  <p className="muted" style={{ marginTop: 'var(--sp-2)' }}>
                    {t('onboarding.placementHelp')}
                  </p>
                </div>

                {/* A rough self-estimate just aims the adaptive plan at the
                    right difficulty — it never decides the final level. */}
                <div className="field">
                  <span style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>
                    {t('onboarding.selfLevel')} ({t('common.optional')})
                  </span>
                  <div className="cluster">
                    {CEFR_LEVELS.map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        className="chip"
                        aria-pressed={selfLevel === lvl}
                        onClick={() => setSelfLevel(selfLevel === lvl ? '' : lvl)}
                      >
                        <Bdi>{cefrLabel(lvl)}</Bdi>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="cluster" style={{ justifyContent: 'space-between' }}>
                  <button className="btn btn-lg" onClick={back}>
                    {t('common.back')}
                  </button>
                  <button className="btn btn-primary btn-lg" onClick={() => setQuizStarted(true)}>
                    {t('assessment.startBtn')}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {step === 'details' && (
          <div className="stack-lg" style={{ marginTop: 'var(--sp-5)' }}>
            {triage === 'fluent' && <p className={styles.reviewNote}>
                <SparkleIcon /> {t('onboarding.fluentNote')}
              </p>}

            <label className="field">
              <span>
                {t('onboarding.experience')} ({t('common.optional')})
              </span>
              {/* Free prose about years of study — a textarea, because people
                  write a sentence or two here, not a word. */}
              <textarea
                className="textarea"
                rows={2}
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder={t('onboarding.experiencePlaceholder')}
                maxLength={LIMITS.line}
                aria-invalid={!experienceResult.ok}
              />
              <FieldError issue={issues.experience} />
            </label>

            <div className="field">
              <span style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>{t('onboarding.goals')}</span>
              <ChipGroup<Goal>
                options={GOALS}
                value={goals}
                onChange={setGoals}
                labelFor={(g) => t(`goals.${g}`)}
              />
            </div>

            <div className="field">
              <span style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>
                {t('onboarding.interests')} ({t('common.optional')})
              </span>
              <TagInput
                value={interests}
                onChange={setInterests}
                placeholder={t('onboarding.interestsPlaceholder')}
                ariaLabel={t('onboarding.interests')}
              />
            </div>

            <div className="field">
              <span style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>
                {t('onboarding.speakingConfidence')}
              </span>
              <RatingScale
                value={speakingConfidence}
                onChange={setSpeakingConfidence}
                lowLabel={t('onboarding.notConfident')}
                highLabel={t('onboarding.veryConfident')}
                ariaLabel={t('onboarding.speakingConfidence')}
              />
            </div>

            <div className="field">
              <span style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>
                {t('onboarding.pronunciationImportance')}
              </span>
              <RatingScale
                value={pronunciationImportance}
                onChange={setPronunciationImportance}
                lowLabel={t('onboarding.notImportant')}
                highLabel={t('onboarding.veryImportant')}
                ariaLabel={t('onboarding.pronunciationImportance')}
              />
            </div>

            <div className="cluster" style={{ justifyContent: 'space-between' }}>
              <button className="btn btn-lg" onClick={back}>
                {t('common.back')}
              </button>
              <button className="btn btn-primary btn-lg" onClick={submit}>
                {t('onboarding.create')}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

/** Oral English and English literacy, modeled independently — simple human
 *  questions, no jargon. A parent can answer for a young child. */
function EnglishSelfReport({
  isMinor,
  respondedByParent,
  setRespondedByParent,
  englishListening,
  setEnglishListening,
  englishSpeaking,
  setEnglishSpeaking,
  englishReading,
  setEnglishReading,
}: {
  isMinor: boolean
  respondedByParent: boolean
  setRespondedByParent: (b: boolean) => void
  englishListening?: EnglishOralLevel
  setEnglishListening: (l: EnglishOralLevel | undefined) => void
  englishSpeaking?: EnglishOralLevel
  setEnglishSpeaking: (l: EnglishOralLevel | undefined) => void
  englishReading?: EnglishLiteracyLevel
  setEnglishReading: (l: EnglishLiteracyLevel | undefined) => void
}) {
  const { t } = useI18n()
  return (
    <fieldset className={styles.englishSection}>
      <legend style={{ fontWeight: 700 }}>{t('onboarding.englishSectionTitle')}</legend>

      {isMinor && (
        <label className={styles.parentToggle}>
          <input
            type="checkbox"
            checked={respondedByParent}
            onChange={(e) => setRespondedByParent(e.target.checked)}
          />
          <span>
            <FamilyIcon /> {t('onboarding.answerForChild')}
          </span>
        </label>
      )}

      <div className="field">
        <span style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>{t('onboarding.englishListening')}</span>
        <div className="cluster">
          {ORAL_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              className="chip"
              aria-pressed={englishListening === o.value}
              onClick={() => setEnglishListening(englishListening === o.value ? undefined : o.value)}
            >
              {t(o.key)}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>{t('onboarding.englishSpeaking')}</span>
        <div className="cluster">
          {ORAL_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              className="chip"
              aria-pressed={englishSpeaking === o.value}
              onClick={() => setEnglishSpeaking(englishSpeaking === o.value ? undefined : o.value)}
            >
              {t(o.key)}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>{t('onboarding.englishReading')}</span>
        <div className="cluster">
          {READING_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              className="chip"
              aria-pressed={englishReading === o.value}
              onClick={() => setEnglishReading(englishReading === o.value ? undefined : o.value)}
            >
              {t(o.key)}
            </button>
          ))}
        </div>
      </div>
    </fieldset>
  )
}
