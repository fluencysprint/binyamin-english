import { ReactNode, useEffect, useId, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useI18n } from '../i18n/I18nProvider'
import { BrandMark } from './BrandMark'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ThemeToggle } from './ThemeToggle'
import { useHeaderStage } from './useHeaderStage'
import { CloseIcon, MenuIcon } from './icons'
import { PublicPageId, pagePath } from '../seo/site'
import styles from './Layout.module.css'

const NAV_ITEMS: { id: PublicPageId; labelKey: string }[] = [
  { id: 'home', labelKey: 'nav.home' },
  { id: 'about', labelKey: 'nav.about' },
  { id: 'assessment', labelKey: 'nav.assessment' },
  { id: 'book', labelKey: 'nav.book' },
]

interface LayoutProps {
  children: ReactNode
  /** Hide the public nav (e.g. inside the focused lesson runner). */
  bare?: boolean
  /** Extra controls in the header (e.g. tutor mode switch). */
  headerExtra?: ReactNode
}

export function Layout({ children, bare, headerExtra }: LayoutProps) {
  const { t, lang } = useI18n()
  const location = useLocation()
  const rowRef = useRef<HTMLDivElement>(null)
  /* Remeasure whenever the row's CONTENT changes, not just its width: a
     locale switch can change every label's length at once. */
  const stage = useHeaderStage(rowRef, `${lang}|${bare ? 'bare' : 'nav'}|${headerExtra ? 'x' : ''}`)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuId = useId()
  const toggleRef = useRef<HTMLButtonElement>(null)

  /* What each stage gives up, in order: the wordmark (the mark alone is what
     people recognise), then the public nav (one menu button away), then the
     tutor mode controls (same menu). */
  const showWordmark = stage === 'full'
  const navInRow = !bare && (stage === 'full' || stage === 'compact')
  const extraInRow = Boolean(headerExtra) && stage !== 'mini'
  const collapsed = !navInRow && !bare
  const hasPanel = collapsed || (Boolean(headerExtra) && !extraInRow)

  // A route change means the menu did its job.
  useEffect(() => setMenuOpen(false), [location.pathname])

  // Growing past a breakpoint moves the nav back into the header row; a menu
  // left open would then be an orphaned panel under a nav that already shows.
  useEffect(() => {
    if (!hasPanel) setMenuOpen(false)
  }, [hasPanel])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setMenuOpen(false)
      toggleRef.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const navLinks = NAV_ITEMS.map(({ id, labelKey }) => (
    <NavLink
      key={id}
      to={pagePath(id, lang)}
      end={id === 'home'}
      className={({ isActive }) => (isActive ? styles.active : '')}
    >
      {t(labelKey)}
    </NavLink>
  ))

  return (
    <>
      <a className="skip-link" href="#main">
        {t('nav.skipToContent')}
      </a>
      <header className={styles.header} data-stage={stage}>
        <div ref={rowRef} className={`container ${styles.headerInner}`}>
          <Link to={pagePath('home', lang)} className={styles.brand} aria-label={t('common.appName')}>
            {/* The same mark as the installed app icon — see BrandMark. */}
            <BrandMark size={34} className={styles.brandMark} />
            {showWordmark && <span className={styles.brandName}>{t('common.appName')}</span>}
          </Link>

          {navInRow && (
            <nav className={styles.nav} aria-label="Primary">
              {navLinks}
            </nav>
          )}

          <div className={styles.controls}>
            {extraInRow && headerExtra}
            <ThemeToggle />
            <LanguageSwitcher compact={stage === 'mini'} />
            {hasPanel && (
              <button
                ref={toggleRef}
                type="button"
                className={styles.menuBtn}
                aria-expanded={menuOpen}
                aria-controls={menuId}
                aria-label={menuOpen ? t('nav.menuClose') : t('nav.menuOpen')}
                onClick={() => setMenuOpen((open) => !open)}
              >
                {menuOpen ? <CloseIcon /> : <MenuIcon />}
              </button>
            )}
          </div>
        </div>

        {hasPanel && (
          <div id={menuId} className={styles.menuPanel} hidden={!menuOpen}>
            {collapsed && (
              <nav className={`container ${styles.menuNav}`} aria-label="Primary">
                {navLinks}
              </nav>
            )}
            {headerExtra && !extraInRow && (
              <div className={`container ${styles.menuExtra}`}>{headerExtra}</div>
            )}
          </div>
        )}
      </header>

      <main id="main" className={styles.main} tabIndex={-1}>
        {children}
      </main>

      {!bare && (
        <footer className={styles.footer}>
          <div className={`container ${styles.footerInner}`}>
            {/* What the product is, then one honest line about privacy. The
                footer used to say only "Runs entirely in your browser", which
                described the software to a visitor shopping for a tutor. */}
            <span>{t('footer.madeWith')}</span>
            <span className="muted">{t('footer.privacy')}</span>
          </div>
        </footer>
      )}
    </>
  )
}
