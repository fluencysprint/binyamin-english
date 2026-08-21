# Third-party licenses

Binyamin English is built entirely on open-source software under OSI-approved,
permissive licenses. There are **no paid APIs, no proprietary SaaS dependencies,
no trackers, and no AI runtime services**. Everything runs in the browser.

## Runtime dependencies

| Package | License | Purpose |
| --- | --- | --- |
| [react](https://github.com/facebook/react) | MIT | UI library |
| [react-dom](https://github.com/facebook/react) | MIT | React DOM renderer |
| [react-router-dom](https://github.com/remix-run/react-router) | MIT | Client-side routing (HashRouter) |
| [idb](https://github.com/jakearchibald/idb) | ISC | Small IndexedDB promise wrapper |

## Build & development dependencies

| Package | License | Purpose |
| --- | --- | --- |
| [vite](https://github.com/vitejs/vite) | MIT | Build tool / dev server |
| [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react) | MIT | React fast refresh + JSX |
| [vite-plugin-pwa](https://github.com/vite-pwa/vite-plugin-pwa) | MIT | PWA manifest + service worker (Workbox) |
| [typescript](https://github.com/microsoft/TypeScript) | Apache-2.0 | Type checking |
| [eslint](https://github.com/eslint/eslint) | MIT | Linting |
| [@typescript-eslint/*](https://github.com/typescript-eslint/typescript-eslint) | MIT | TypeScript lint rules |
| [vitest](https://github.com/vitest-dev/vitest) | MIT | Unit/integration test runner |
| [@testing-library/react](https://github.com/testing-library/react-testing-library) | MIT | Component testing |
| [@testing-library/jest-dom](https://github.com/testing-library/jest-dom) | MIT | DOM matchers |
| [@testing-library/user-event](https://github.com/testing-library/user-event) | MIT | User interaction simulation |
| [jsdom](https://github.com/jsdom/jsdom) | MIT | DOM environment for tests |
| [fake-indexeddb](https://github.com/dumbmatter/fakeIndexedDB) | Apache-2.0 | IndexedDB in tests |

## Bundled fonts

| Font | License | Purpose |
| --- | --- | --- |
| [Rubik](https://github.com/googlefonts/rubik) | SIL OFL 1.1 | UI typeface (self-hosted variable font; Latin, Cyrillic, Hebrew). See `src/assets/fonts/LICENSE-Rubik.txt`. |

## Browser standards used (no dependency required)

- **IndexedDB** — structured student data + audio storage
- **localStorage** — lightweight settings and session recovery
- **MediaRecorder / getUserMedia** — local pronunciation recording (nothing uploaded)
- **Web App Manifest + Service Worker** — installable, offline-capable PWA
- **`mailto:`** — booking inquiries, no backend

All trademarks and product names referenced in educational content belong to
their respective owners and are used for descriptive purposes only.
