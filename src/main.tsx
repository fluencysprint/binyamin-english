import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/global.css'
import { AppProviders } from './app/AppProviders'
import { App } from './app/App'
import { primeVoices } from './utils/speech'

const BASE = import.meta.env.BASE_URL

/* The service worker is generated with skipWaiting/clientsClaim, so a new
   build takes control the moment it activates — but this tab is still running
   the assets it booted with, so a shipped fix looks "not deployed" until the
   app happens to be opened a second time. Reload once when control changes.
   Guarded twice: only when this tab already had a controller (so a first-ever
   install doesn't reload), and only once (so it cannot loop). */
if ('serviceWorker' in navigator) {
  const hadController = navigator.serviceWorker.controller != null
  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return
    reloading = true
    window.location.reload()
  })
}

/* The public site used hash routes (#/about) until real URLs replaced them.
   Bookmarks, installed PWA start URLs and any link shared before the switch
   still carry the old form, so translate it to the equivalent path before the
   router mounts. Done with replaceState so the dead hash URL does not stay in
   history — and so a crawler that follows an old link lands on the canonical
   path rather than an empty shell. */
if (window.location.hash.startsWith('#/')) {
  const path = BASE.replace(/\/$/, '') + window.location.hash.slice(1)
  window.history.replaceState(null, '', path + window.location.search)
}

/* Chrome returns an EMPTY voice list until it has loaded one, and an utterance
   spoken into that window can be dropped without an error — a Listen button
   that does nothing. Asking for the list at startup means it is ready long
   before the first tap. */
primeVoices()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={BASE} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppProviders>
        <App />
      </AppProviders>
    </BrowserRouter>
  </StrictMode>,
)
