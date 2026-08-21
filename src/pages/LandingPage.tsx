import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { useI18n } from '../i18n/I18nProvider'
import { pagePath } from '../seo/site'
import { CheckIcon, ArrowRightIcon } from '../components/icons'
import styles from './LandingPage.module.css'

/* The five beats of one lesson cycle, in the order a student lives them.
   Numbered prose, deliberately — a boxes-and-arrows diagram would say
   "software product" when what is being sold is an hour with a person. */
const HOW_STEPS = [1, 2, 3, 4, 5] as const

export function LandingPage() {
  const { t, lang } = useI18n()
  return (
    <Layout>
      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>{t('common.tagline')}</p>
            <h1 className={styles.title}>{t('landing.heroTitle')}</h1>
            <p className={styles.subtitle}>{t('landing.heroSubtitle')}</p>
            <p className={styles.strengths}>{t('landing.heroStrengths')}</p>
            <div className={`cluster ${styles.ctas}`}>
              <Link to={pagePath('book', lang)} className="btn btn-primary btn-lg">
                {t('landing.ctaBook')}
              </Link>
              <Link to={pagePath('assessment', lang)} className="btn btn-lg">
                {t('landing.ctaAssess')}
              </Link>
            </div>
            {/* The lesson format sits with the buttons, not three screens
                down. A visitor who wouldn't be interested should find that
                out here, without having to hunt for it. */}
            <p className={styles.priceLine}>{t('landing.priceLine')}</p>
            <p className={`muted ${styles.ctaNote}`}>{t('landing.ctaAssessNote')}</p>
          </div>

          {/* What the money buys, stated in the hero. This is the whole
              premium argument: an ordinary conversation hour leaves nothing
              behind, and this one leaves four things. */}
          <aside className={`card ${styles.deliverables}`} aria-labelledby="get">
            <h2 id="get" className={styles.deliverablesTitle}>
              {t('landing.getTitle')}
            </h2>
            <ul className={styles.getList}>
              {[1, 2, 3, 4].map((n) => (
                <li key={n}>
                  <CheckIcon />
                  <span>{t(`landing.get${n}`)}</span>
                </li>
              ))}
            </ul>
            <Link to={pagePath('sampleReport', lang)} className={styles.sampleLink}>
              {t('landing.sampleReportCta')} <ArrowRightIcon className="flip-in-rtl" />
            </Link>
          </aside>
        </div>
      </section>

      <section className="container" aria-labelledby="why">
        <h2 id="why" className={styles.sectionTitle}>
          {t('landing.whyTitle')}
        </h2>
        <div className={styles.grid3}>
          {[1, 2, 3].map((n) => (
            <div key={n} className="card">
              <h3>{t(`landing.why${n}Title`)}</h3>
              <p className="muted">{t(`landing.why${n}Body`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={`container ${styles.how}`} aria-labelledby="how">
        <h2 id="how" className={styles.sectionTitle}>
          {t('landing.howTitle')}
        </h2>
        <ol className={styles.steps}>
          {HOW_STEPS.map((n) => (
            <li key={n}>{t(`landing.how${n}`)}</li>
          ))}
        </ol>
      </section>

      <section className="container" aria-labelledby="for">
        <h2 id="for" className={styles.sectionTitle}>
          {t('landing.forTitle')}
        </h2>
        <div className={styles.grid3}>
          {(['Kids', 'Teens', 'Adults'] as const).map((k) => (
            <div key={k} className={`card ${styles.audience}`}>
              <h3>{t(`landing.for${k}`)}</h3>
              <p className="muted">{t(`landing.for${k}Body`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container" aria-labelledby="price">
        <div className={`card card-pad-lg ${styles.pricing}`}>
          <div>
            <h2 id="price" className={styles.priceTitle}>
              {t('landing.priceTitle')}
            </h2>
            <p className="muted">{t('landing.priceBody')}</p>
          </div>
          <div className={styles.included}>
            <h3 className={styles.includedTitle}>{t('landing.priceInclTitle')}</h3>
            <ul className={styles.getList}>
              {[1, 2, 3, 4].map((n) => (
                <li key={n}>
                  <CheckIcon />
                  <span>{t(`landing.priceIncl${n}`)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="container">
        <div className={`card card-pad-lg ${styles.finalCta}`}>
          <h2>{t('landing.finalCtaTitle')}</h2>
          <p className="muted">{t('landing.finalCtaBody')}</p>
          <div className="cluster">
            <Link to={pagePath('book', lang)} className="btn btn-primary btn-lg">
              {t('landing.ctaBook')}
            </Link>
            <Link to={pagePath('assessment', lang)} className="btn btn-lg">
              {t('landing.ctaAssess')}
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  )
}
