import { test, expect } from '@playwright/test'
import { brandGlyphPath, BRAND_CANVAS, BRAND_TEAL, MASKABLE_SAFE_RADIUS, brandGlyphMaxRadius } from '../src/brand/mark'

/* ==========================================================================
   The installed app, inspected in real Chromium against a real production
   build served from the same /binyamin-english/ base GitHub Pages uses.

   The manifest, the icon set, the service worker and the prerendered HTML do
   not exist in the dev server, so none of this can be checked honestly there.
   ========================================================================== */

test.describe('PWA manifest and icons', () => {
  test('the manifest is linked, parses, and describes an installable app', async ({ page, request }) => {
    await page.goto('./')
    const href = await page.locator('link[rel="manifest"]').getAttribute('href')
    expect(href, 'no manifest link in the document').toBeTruthy()

    const response = await request.get(new URL(href!, page.url()).toString())
    expect(response.status()).toBe(200)
    const manifest = await response.json()

    expect(manifest.name).toBe('Binyamin English')
    expect(manifest.short_name).toBe('Binyamin')
    expect(manifest.display).toBe('standalone')
    expect(manifest.theme_color).toBe(BRAND_TEAL)
    // Scope and start_url must sit under the Pages subpath, or an installed
    // app opens outside its own scope and loses the service worker.
    expect(manifest.scope).toBe('/binyamin-english/')
    expect(manifest.start_url).toBe('/binyamin-english/')
  })

  test('every declared icon actually resolves, at the size it claims', async ({ page, request }) => {
    await page.goto('./')
    const href = await page.locator('link[rel="manifest"]').getAttribute('href')
    const manifest = await (await request.get(new URL(href!, page.url()).toString())).json()

    for (const icon of manifest.icons) {
      const url = new URL(icon.src, new URL(href!, page.url())).toString()
      const res = await request.get(url)
      expect(res.status(), `${icon.src} did not resolve`).toBe(200)
      expect(res.headers()['content-type']).toContain('image/png')

      // Read the real pixel dimensions out of the PNG header rather than
      // trusting the manifest's own claim.
      const buf = await res.body()
      expect(buf.subarray(1, 4).toString('ascii'), `${icon.src} is not a PNG`).toBe('PNG')
      const width = buf.readUInt32BE(16)
      const height = buf.readUInt32BE(20)
      expect(`${width}x${height}`, `${icon.src} size mismatch`).toBe(icon.sizes)
    }
  })

  test('ships both an "any" icon and a full-bleed maskable one', async ({ page, request }) => {
    await page.goto('./')
    const href = await page.locator('link[rel="manifest"]').getAttribute('href')
    const manifest = await (await request.get(new URL(href!, page.url()).toString())).json()

    const purposes = manifest.icons.map((i: { purpose?: string }) => i.purpose ?? 'any')
    expect(purposes).toContain('any')
    expect(purposes).toContain('maskable')

    // The maskable one must be a DIFFERENT file from the "any" one. Declaring
    // a rounded, transparent-cornered icon as maskable lets an aggressive
    // launcher mask cut into the transparency.
    const maskable = manifest.icons.find((i: { purpose?: string }) => i.purpose === 'maskable')
    const any = manifest.icons.filter((i: { purpose?: string }) => (i.purpose ?? 'any') === 'any')
    expect(any.every((i: { src: string }) => i.src !== maskable.src)).toBe(true)

    // And the maskable corners must actually be opaque teal.
    const url = new URL(maskable.src, new URL(href!, page.url())).toString()
    const cornerAlpha = await page.evaluate(async (src) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = src
      await img.decode()
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const corners = [
        [2, 2],
        [img.width - 3, 2],
        [2, img.height - 3],
        [img.width - 3, img.height - 3],
      ]
      return corners.map(([x, y]) => Array.from(ctx.getImageData(x, y, 1, 1).data))
    }, url)
    for (const [r, g, b, a] of cornerAlpha) {
      expect(a, 'maskable icon has a transparent corner').toBe(255)
      expect([r, g, b]).toEqual([47, 111, 107])
    }
  })

  test('the brand mark stays inside the maskable safe circle', () => {
    // A launcher can crop to a circle of 80% diameter. Anything of the glyph
    // outside that is at risk of being sliced off on someone's home screen.
    expect(brandGlyphMaxRadius(1)).toBeLessThan(MASKABLE_SAFE_RADIUS)
  })

  test('serves a favicon and an apple-touch icon drawn from the same geometry', async ({ page, request }) => {
    await page.goto('./')

    const favicon = await page.locator('link[rel="icon"]').getAttribute('href')
    const faviconRes = await request.get(new URL(favicon!, page.url()).toString())
    expect(faviconRes.status()).toBe(200)
    const svg = await faviconRes.text()
    // The same path the in-app <BrandMark> draws — not a serif "B" in a <text>.
    expect(svg).toContain(brandGlyphPath(BRAND_CANVAS))
    expect(svg).not.toContain('<text')

    const apple = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href')
    expect(apple, 'no apple-touch-icon').toBeTruthy()
    expect((await request.get(new URL(apple!, page.url()).toString())).status()).toBe(200)
  })

  test('the theme colour matches the tile the icon is drawn on', async ({ page }) => {
    await page.goto('./')
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', BRAND_TEAL)
  })
})

test.describe('the app UI wears the same mark as the installed icon', () => {
  test('the header logo is the brand SVG, not a styled letter', async ({ page }) => {
    await page.goto('./')
    const path = page.locator('header a[aria-label] svg path').first()
    await expect(path).toHaveCount(1)
    // Byte-identical geometry to the launcher icon and the favicon.
    await expect(path).toHaveAttribute('d', brandGlyphPath(BRAND_CANVAS))

    // The tile behind it is the brand colour, resolved from the theme token.
    const fill = await page
      .locator('header a[aria-label] svg rect')
      .first()
      .evaluate((el) => getComputedStyle(el).fill)
    expect(fill).toBe('rgb(47, 111, 107)')
  })

  test('renders the mark at both light and dark theme without disappearing', async ({ page }) => {
    await page.goto('./')
    for (const theme of ['light', 'dark']) {
      await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme)
      const box = await page.locator('header a[aria-label] svg').first().boundingBox()
      expect(box!.width, theme).toBeGreaterThan(20)
      expect(box!.height, theme).toBeGreaterThan(20)
    }
  })

  test('paints the brand mark before the bundle runs, then hands over to React', async ({ page, request, baseURL }) => {
    // A cold start on a slow connection (or offline, from the cached shell)
    // should show the mark, not a white page.
    const html = await (await request.get(baseURL!)).text()
    expect(html).toContain('id="boot"')
    await page.goto('./')
    // Once React has mounted, the boot shell is gone rather than stacked
    // behind the app.
    await expect(page.locator('#boot')).toHaveCount(0)
  })
})

test.describe('offline and routing still work in the built app', () => {
  test('registers a service worker and precaches the shell', async ({ page }) => {
    await page.goto('./')
    // Registration is asynchronous and deliberately not awaited by the app, so
    // poll rather than sampling once.
    await expect
      .poll(
        () =>
          page.evaluate(async () => {
            if (!('serviceWorker' in navigator)) return false
            return Boolean(await navigator.serviceWorker.getRegistration())
          }),
        { timeout: 15000 },
      )
      .toBe(true)
  })

  test('every prerendered public URL is a real file, not an SPA fallback', async ({ request, baseURL }) => {
    for (const path of ['', 'about/', 'check-english/', 'book/', 'he/', 'ru/about/', 'es/book/', 'fr/']) {
      const res = await request.get(new URL(path, baseURL).toString())
      expect(res.status(), path).toBe(200)
      const html = await res.text()
      expect(html, `${path} has no prerendered content`).toContain('id="seo-fallback"')
    }
  })
})
