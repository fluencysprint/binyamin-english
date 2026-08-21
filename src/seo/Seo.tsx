import { useEffect } from 'react'
import { UILanguage } from '../types'
import { useI18n } from '../i18n/I18nProvider'
import { buildHeadMeta, buildPrivateHeadMeta } from './head'
import { applyHead } from './applyHead'
import { PublicPageId, SITE_NAME } from './site'

/** Head metadata for an indexable public page. Renders nothing. */
export function Seo({ page, lang }: { page: PublicPageId; lang: UILanguage }) {
  useEffect(() => {
    applyHead(buildHeadMeta(page, lang))
  }, [page, lang])
  return null
}

/**
 * Head metadata for a screen that must never be indexed — the tutor area and
 * the 404 page. Emits `noindex, nofollow` and drops the canonical/hreflang set
 * left behind by whichever public page was rendered before it.
 */
export function PrivateSeo({ titleKey }: { titleKey: string }) {
  const { lang, t } = useI18n()
  const title = `${t(titleKey)} · ${SITE_NAME}`
  useEffect(() => {
    applyHead(buildPrivateHeadMeta(lang, title))
  }, [lang, title])
  return null
}
