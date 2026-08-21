import { ReactNode, useState } from 'react'
import { BrandMark } from '../components/BrandMark'
import { Layout } from '../components/Layout'
import { useI18n } from '../i18n/I18nProvider'
import { useSettings } from '../app/SettingsContext'
import { checkTutorPhrase } from '../app/config'
import { PrivateSeo } from '../seo/Seo'
import { WarningIcon } from '../components/icons'
import { useTeachingStrings } from '../i18n/teachingStrings'

/** Light access gate for the tutor area. Not real security — see disclaimer. */
export function TutorGate({ children }: { children: ReactNode }) {
  const { t, lang } = useI18n()
  const { tutorUnlocked, setTutorUnlocked } = useSettings()
  const [phrase, setPhrase] = useState('')
  const [error, setError] = useState(false)

  /* The tutor's teaching guidance in this language, fetched the moment the
     tutor area is entered — this is the one door every lesson comes through,
     and the only place in the app that needs it. Until it lands the guidance
     resolves in English rather than blocking the screen or showing a key. */
  useTeachingStrings(lang)

  if (tutorUnlocked)
    return (
      <>
        <PrivateSeo titleKey="nav.tutor" />
        {children}
      </>
    )

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (checkTutorPhrase(phrase)) {
      setTutorUnlocked(true)
      setError(false)
    } else {
      setError(true)
    }
  }

  return (
    <Layout>
      <PrivateSeo titleKey="gate.title" />
      <div className="container container-narrow" style={{ paddingBlock: 'var(--sp-8)' }}>
        <div className="card card-pad-lg stack">
          <BrandMark size={56} title={t('common.appName')} />
          <h1>{t('gate.title')}</h1>
          <p className="muted">{t('gate.body')}</p>
          <form onSubmit={submit} className="stack">
            <label className="field">
              <span className="sr-only">{t('gate.placeholder')}</span>
              <input
                className="input"
                type="password"
                value={phrase}
                onChange={(e) => setPhrase(e.target.value)}
                placeholder={t('gate.placeholder')}
                autoFocus
                aria-invalid={error}
              />
            </label>
            {error && (
              <p style={{ color: 'var(--err)', fontWeight: 600 }} role="alert">
                {t('gate.wrong')}
              </p>
            )}
            <button type="submit" className="btn btn-primary btn-lg btn-block">
              {t('gate.unlock')}
            </button>
          </form>
          <p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
            <WarningIcon /> {t('gate.disclaimer')}
          </p>
        </div>
      </div>
    </Layout>
  )
}
