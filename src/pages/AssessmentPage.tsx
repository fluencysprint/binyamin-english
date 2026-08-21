import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { useI18n } from '../i18n/I18nProvider'
import { AgeBand, CEFR, EnglishLiteracyLevel, EnglishOralLevel } from '../types'
import { AssessmentRunner } from '../assessment/AssessmentRunner'
import { shouldUseFoundationalCheck } from '../assessment/foundationalGate'
import { ORAL_OPTIONS, READING_OPTIONS } from '../assessment/selfReportOptions'
import { SnapshotCard } from '../components/SnapshotCard'
import { saveLastSnapshot, loadLastSnapshot, clearLastSnapshot } from '../assessment/snapshotStore'
import { cefrLabel } from '../utils/cefr'
import { pagePath } from '../seo/site'
import { CheckIcon, LockIcon, SeedlingIcon } from '../components/icons'
import styles from './AssessmentPage.module.css'

type Stage = 'intro' | 'quiz' | 'result'

const AGE_OPTIONS: { band: AgeBand; key: string }[] = [
  { band: '6-8', key: 'assessment.ageChild' },
  { band: '9-12', key: 'assessment.agePreteen' },
  { band: '13-17', key: 'assessment.ageTeen' },
  { band: 'adult', key: 'assessment.ageAdult' },
]

// Optional self-estimate → seeds how many items land at each level.
const SELF_OPTIONS: { level: CEFR; key: string }[] = [
  { level: 'A1', key: 'cefr.A1Name' },
  { level: 'B1', key: 'cefr.B1Name' },
  { level: 'C1', key: 'cefr.C1Name' },
]

export function AssessmentPage() {
  const [stage, setStage] = useState<Stage>('intro')
  const [ageBand, setAgeBand] = useState<AgeBand>('adult')
  const [native, setNative] = useState('')
  const [selfLevel, setSelfLevel] = useState<CEFR | undefined>(undefined)
  const [reading, setReading] = useState<EnglishLiteracyLevel | undefined>(undefined)
  const [speaking, setSpeaking] = useState<EnglishOralLevel | undefined>(undefined)

  const foundational = shouldUseFoundationalCheck({
    ageBand,
    englishReading: reading,
    englishSpeaking: speaking,
  })

  return (
    <Layout>
      <div className="container container-narrow" style={{ paddingBlock: 'var(--sp-7)' }}>
        {stage === 'intro' && (
          <Intro
            ageBand={ageBand}
            setAgeBand={setAgeBand}
            native={native}
            setNative={setNative}
            selfLevel={selfLevel}
            setSelfLevel={setSelfLevel}
            reading={reading}
            setReading={setReading}
            speaking={speaking}
            setSpeaking={setSpeaking}
            foundational={foundational}
            onStart={() => setStage('quiz')}
          />
        )}
        {stage === 'quiz' && (
          <AssessmentRunner
            ageBand={ageBand}
            selfLevel={selfLevel}
            foundational={foundational}
            onComplete={(snapshot) => {
              saveLastSnapshot(snapshot)
              setStage('result')
            }}
          />
        )}
        {stage === 'result' && (
          <Result
            onRestart={() => {
              clearLastSnapshot()
              setStage('intro')
            }}
          />
        )}
      </div>
    </Layout>
  )
}

/* -------------------------------------------------------------------------- */
/* Module-level subcomponents — defining these inside AssessmentPage would    */
/* give them a new identity on every render, remounting the inputs and        */
/* stealing focus after each keystroke.                                       */
/* -------------------------------------------------------------------------- */

function Intro({
  ageBand,
  setAgeBand,
  native,
  setNative,
  selfLevel,
  setSelfLevel,
  reading,
  setReading,
  speaking,
  setSpeaking,
  foundational,
  onStart,
}: {
  ageBand: AgeBand
  setAgeBand: (b: AgeBand) => void
  native: string
  setNative: (s: string) => void
  selfLevel: CEFR | undefined
  setSelfLevel: (l: CEFR | undefined) => void
  reading: EnglishLiteracyLevel | undefined
  setReading: (l: EnglishLiteracyLevel | undefined) => void
  speaking: EnglishOralLevel | undefined
  setSpeaking: (l: EnglishOralLevel | undefined) => void
  foundational: boolean
  onStart: () => void
}) {
  const { t } = useI18n()
  return (
    <div className="stack-lg">
      <div>
        <h1>{t('assessment.introTitle')}</h1>
        <p className="muted" style={{ marginTop: 'var(--sp-3)' }}>
          {t('assessment.introBody')}
        </p>
        {/* Said before the first question, not only in the small print under
            the result: this check reads, it does not listen. */}
        <p className="muted" style={{ marginTop: 'var(--sp-3)' }}>
          {t('assessment.introScope')}
        </p>
      </div>

      <div className="field">
        <label>{t('assessment.ageQuestion')}</label>
        <div className="cluster">
          {AGE_OPTIONS.map((o) => (
            <button
              key={o.band}
              type="button"
              className="chip"
              aria-pressed={ageBand === o.band}
              onClick={() => setAgeBand(o.band)}
            >
              {t(o.key)}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label htmlFor="native">{t('assessment.nativeQuestion')}</label>
        <input
          id="native"
          className="input"
          value={native}
          onChange={(e) => setNative(e.target.value)}
          placeholder={t('assessment.nativePlaceholder')}
        />
      </div>

      {/* Spoken English is asked BEFORE reading: a fluent speaker who never
          learned to read English must not be routed to the beginner check. */}
      <div className="field">
        <label>{t('assessment.oralQuestion')}</label>
        <div className="cluster">
          {ORAL_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              className="chip"
              aria-pressed={speaking === o.value}
              onClick={() => setSpeaking(speaking === o.value ? undefined : o.value)}
            >
              {t(o.key)}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>{t('assessment.readingQuestion')}</label>
        <div className="cluster">
          {READING_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              className="chip"
              aria-pressed={reading === o.value}
              onClick={() => setReading(reading === o.value ? undefined : o.value)}
            >
              {t(o.key)}
            </button>
          ))}
        </div>
      </div>

      {!foundational && (
        <div className="field">
          <label>
            {t('onboarding.selfLevel')} ({t('common.optional')})
          </label>
          <div className="cluster">
            {SELF_OPTIONS.map((o) => (
              <button
                key={o.level}
                type="button"
                className="chip"
                aria-pressed={selfLevel === o.level}
                onClick={() => setSelfLevel(selfLevel === o.level ? undefined : o.level)}
              >
                {t(o.key)}
              </button>
            ))}
          </div>
        </div>
      )}

      {foundational && (
        <p className={styles.foundationalNote}>
          <SeedlingIcon /> {t('assessment.foundationalNote')}
        </p>
      )}

      <p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
        <LockIcon /> {t('assessment.introPrivacy')}
      </p>

      <button className="btn btn-primary btn-lg" onClick={onStart}>
        {t('assessment.startBtn')}
      </button>
    </div>
  )
}

function Result({ onRestart }: { onRestart: () => void }) {
  const { t, lang } = useI18n()
  const snapshot = useMemo(() => loadLastSnapshot(), [])

  if (!snapshot) {
    return (
      <div className="stack">
        <p>{t('errors.generic')}</p>
        <button className="btn" onClick={onRestart}>
          {t('assessment.resultRestart')}
        </button>
      </div>
    )
  }

  return (
    <div className="stack-lg">
      <SnapshotCard snapshot={snapshot} />

      {/* The bridge from "here is your level" to "here is what a lesson does
          with it". It opens by naming what the check could NOT see, which is
          both the honest thing to say and the actual reason to book. */}
      <div className={`card card-pad-lg ${styles.cta}`}>
        <h2>{t('assessment.resultCtaTitle')}</h2>
        <p className="muted">{t('assessment.resultCtaBody')}</p>
        <ul className={styles.next}>
          {[1, 2, 3].map((n) => (
            <li key={n}>
              <CheckIcon />
              <span>{t(`assessment.resultNext${n}`)}</span>
            </li>
          ))}
        </ul>
        <p className={styles.price}>{t('assessment.resultPrice')}</p>
        <div className="cluster">
          <Link to={pagePath('book', lang)} className="btn btn-primary btn-lg">
            {t('assessment.resultCtaBook')}
          </Link>
          <button className="btn btn-lg" onClick={onRestart}>
            {t('assessment.resultRestart')}
          </button>
        </div>
      </div>

      <p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
        {t('assessment.levelExplainer')} {cefrLabel(snapshot.overallCEFR)}.
      </p>
    </div>
  )
}
