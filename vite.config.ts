/// <reference types="vitest" />
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { buildStaticPages } from './src/seo/prerender'

/**
 * Writes one real HTML file per public page per locale, plus sitemap.xml and
 * the 404.html SPA fallback. Runs in closeBundle, after Vite has written
 * index.html, so it can use the built shell (with hashed asset URLs) as its
 * template.
 */
function seoPrerender(base: string, outDir = 'dist'): Plugin {
  return {
    name: 'binyamin-seo-prerender',
    apply: 'build',
    closeBundle() {
      const shell = readFileSync(join(outDir, 'index.html'), 'utf-8')
      const lastmod = new Date().toISOString().slice(0, 10)
      const files = buildStaticPages(shell, base, lastmod)
      for (const [relative, contents] of Object.entries(files)) {
        const target = join(outDir, relative)
        mkdirSync(dirname(target), { recursive: true })
        writeFileSync(target, contents, 'utf-8')
      }
      this.info?.(`prerendered ${Object.keys(files).length} static files`)
    },
  }
}

// GitHub Pages serves the app under /binyamin-english/.
// Dev runs at / for convenience; the build uses the real Pages base — and so
// does `vite preview`, which otherwise serves a build whose bundle expects
// /binyamin-english/ from the server root, breaking routing and making the
// manifest, icons and service worker fall through to the SPA shell. `preview`
// reports command === 'serve', so it needs the explicit isPreview check.
export default defineConfig(({ command, isPreview }) => {
  const base = command === 'build' || isPreview ? '/binyamin-english/' : '/'
  return {
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Binyamin English',
        short_name: 'Binyamin',
        description: 'Private English tutoring — clear American pronunciation and real conversation.',
        theme_color: '#2f6f6b',
        background_color: '#faf9f6',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: base,
        start_url: base,
        lang: 'en',
        categories: ['education'],
        // The "any" icons keep their own rounded tile (that is the mark as
        // drawn); the maskable one is the identical mark full-bleed, so a
        // launcher mask can never clip into transparent corners. Both come
        // from scripts/gen-icons.mjs and src/brand/geometry.json.
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Only the shell is precached, not the 20 prerendered locale pages:
        // navigations are answered from navigateFallback anyway, and the app
        // re-applies each page's metadata at runtime (src/seo/head.ts).
        globPatterns: ['assets/**/*.{js,css,woff2}', '*.{svg,png,ico}', 'index.html'],
        navigateFallback: base + 'index.html',
      },
    }),
    seoPrerender(base),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    // CSS is stubbed out in tests for speed, except theme.css: the dark-theme
    // contrast regression test reads its real tokens via a `?raw` import.
    css: { include: [/theme\.css/] },
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.{test,spec}.{ts,tsx}', 'src/tests/**'],
    },
  },
  }
})
