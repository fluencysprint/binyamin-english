import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { useI18n } from '../i18n/I18nProvider'
import { PrivateSeo } from '../seo/Seo'
import { pagePath } from '../seo/site'

export function NotFoundPage() {
  const { t, lang } = useI18n()
  return (
    <Layout>
      <PrivateSeo titleKey="errors.notFound" />
      <div className="container container-narrow text-center" style={{ paddingBlock: 'var(--sp-8)' }}>
        <h1>{t('errors.notFound')}</h1>
        <p className="muted" style={{ margin: 'var(--sp-4) 0' }}>
          {t('errors.notFoundBody')}
        </p>
        <Link to={pagePath('home', lang)} className="btn btn-primary btn-lg">
          {t('errors.goHome')}
        </Link>
      </div>
    </Layout>
  )
}
