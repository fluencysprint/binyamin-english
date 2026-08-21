/* ==========================================================================
   Wrapper for the four crawlable public pages.
   --------------------------------------------------------------------------
   On a public page the URL is the source of truth for language: /about/ is
   English, /he/about/ is Hebrew. That is what makes hreflang honest — a
   crawler (or anyone opening a shared link) gets exactly the language the URL
   promises, with no runtime negotiation.

   The one concession to returning visitors is a single boot-time redirect from
   the bare "/" to their previously chosen locale. It fires at most once per
   page load, never on a deep link, and never for a crawler (which has no
   stored preference), so it cannot fork the index or hijack a shared URL.
   ========================================================================== */

import { ReactNode, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { UILanguage } from '../types'
import { useI18n } from '../i18n/I18nProvider'
import { loadSettings } from '../data/settings'
import { Seo } from '../seo/Seo'
import { DEFAULT_LANGUAGE, PublicPageId, pagePath } from '../seo/site'

/** Read once at import time — before any URL-driven language write lands. */
const STORED_LANGUAGE: UILanguage = loadSettings().language
let bootRedirectResolved = false

export function PublicRoute({
  page,
  lang,
  children,
}: {
  page: PublicPageId
  lang: UILanguage
  children: ReactNode
}) {
  const { lang: activeLang, setLang } = useI18n()

  const shouldRestoreLanguage =
    !bootRedirectResolved && page === 'home' && lang === DEFAULT_LANGUAGE && STORED_LANGUAGE !== DEFAULT_LANGUAGE

  // Resolve the one-shot check on the first public page of the session,
  // whichever page that is, so a later visit to "/" is never hijacked.
  useEffect(() => {
    bootRedirectResolved = true
  }, [])

  useEffect(() => {
    if (activeLang !== lang) setLang(lang)
  }, [activeLang, lang, setLang])

  if (shouldRestoreLanguage) {
    bootRedirectResolved = true
    return <Navigate to={pagePath(page, STORED_LANGUAGE)} replace />
  }

  return (
    <>
      <Seo page={page} lang={lang} />
      {children}
    </>
  )
}
