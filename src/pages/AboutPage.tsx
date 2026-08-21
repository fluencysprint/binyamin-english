import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { Bdi } from '../components/Bdi'
import { useI18n } from '../i18n/I18nProvider'
import { pagePath } from '../seo/site'
import styles from './AboutPage.module.css'

/** The languages Binyamin speaks, each written in its own script.
 *  Endonyms, deliberately: the name a language gives itself doesn't translate,
 *  so this specimen reads identically in every UI locale — and three scripts
 *  set side by side say "I have learned languages too" far more warmly than
 *  the comma-separated list this replaced. */
const LANGUAGES = ['English', 'עברית', 'Русский']

export function AboutPage() {
  const { t, lang } = useI18n()
  return (
    <Layout>
      <article className={styles.page}>
        <section className={styles.hero}>
          <div className="container">
            <p className={styles.eyebrow}>{t('common.tagline')}</p>

            {/* Kicker above, then headline and standfirst sharing a top edge.
                Boxes aligned to `start` land the two very different type sizes
                on near-identical cap heights, which is what makes the column
                rule read as structure rather than a stray line. */}
            <div className={styles.masthead}>
              <h1 className={styles.title}>{t('about.title')}</h1>

              {/* The standfirst carries the hairline column rule. Logical
                  border, so it sits on the correct side in RTL. */}
              <div className={styles.standfirst}>
                <p className={styles.lede}>{t('about.intro')}</p>
                <p className={styles.body}>{t('about.body1')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* No aria-label on the section: it would give the page a second
            accessible "Languages" landmark competing with the header's
            language <select>. The heading alone carries the structure. */}
        <section className={styles.langBand}>
          <div className="container">
            <h2 className={styles.langLabel}>{t('about.languagesLabel')}</h2>
            <ul className={styles.langList}>
              {LANGUAGES.map((lang) => (
                <li key={lang}>
                  <Bdi>{lang}</Bdi>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Where the trust actually comes from. Not years, not certificates —
            what happens before, during and after a lesson. Everything here is
            a thing the tutor genuinely does; nothing is a credential. */}
        <section className={`container ${styles.method}`} aria-labelledby="how-i-work">
          <h2 id="how-i-work" className={styles.methodTitle}>
            {t('about.howTitle')}
          </h2>
          <div className={styles.methodGrid}>
            {[1, 2, 3].map((n) => (
              <div key={n} className={styles.methodItem}>
                <h3>{t(`about.how${n}Title`)}</h3>
                <p className="muted">{t(`about.how${n}Body`)}</p>
              </div>
            ))}
          </div>
          <p className={styles.methodNote}>{t('about.smallPractice')}</p>
        </section>

        {/* Closing beat, built on the same two-column hairline structure as the
            masthead so the page reads as one system rather than three
            unrelated blocks. */}
        <section className={`container ${styles.close}`}>
          <p className={styles.statement}>{t('about.body2')}</p>
          <div className={styles.ctas}>
            <Link to={pagePath('book', lang)} className="btn btn-primary btn-lg">
              {t('about.ctaBook')}
            </Link>
            <Link to={pagePath('assessment', lang)} className="btn btn-lg">
              {t('about.ctaAssess')}
            </Link>
          </div>
        </section>
      </article>
    </Layout>
  )
}
