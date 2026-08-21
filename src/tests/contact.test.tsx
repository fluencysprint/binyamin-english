/* ==========================================================================
   Contact handling.
   --------------------------------------------------------------------------
   The address is public and this is a static site, so it is in the JS bundle
   and cannot be secret. What IS worth protecting is the served HTML: a page
   with a `mailto:` in an href is trivially harvested, a page that builds the
   same link inside a click handler is not. These tests pin that behaviour, and
   pin the two things that must never appear: a phone number and WhatsApp.
   ========================================================================== */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AppProviders } from '../app/AppProviders'
import { BookingPage } from '../pages/BookingPage'
import { buildMailto, contactEmail, telegramEnabled, telegramUrl, TELEGRAM_USERNAME } from '../app/contact'

function renderBooking() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppProviders>
        <BookingPage />
      </AppProviders>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
})

describe('contact config', () => {
  it('resolves the single public booking address', () => {
    expect(contactEmail()).toBe('heybinyamin@gmail.com')
  })

  it('builds a mailto with an encoded subject and body', () => {
    const url = buildMailto('Lesson inquiry', 'Student: Sam\nAge: 9')
    expect(url.startsWith('mailto:heybinyamin@gmail.com?')).toBe(true)
    expect(url).toContain('subject=Lesson%20inquiry')
    expect(url).toContain('Student%3A%20Sam')
    // "+" for a space is legal in a query string but shows up literally in
    // several mail clients, so spaces must be percent-encoded.
    expect(url).not.toContain('+')
  })

  it('keeps Telegram off until a public username is configured', () => {
    expect(TELEGRAM_USERNAME).toBe('')
    expect(telegramEnabled()).toBe(false)
    expect(telegramUrl()).toBeNull()
  })
})

describe('booking page', () => {
  it('renders no email address and no mailto href before the visitor asks', () => {
    renderBooking()
    expect(document.body.innerHTML).not.toContain('heybinyamin')
    expect(document.body.innerHTML).not.toContain('mailto:')
    expect(document.querySelectorAll('a[href^="mailto:"]').length).toBe(0)
  })

  it('shows no Telegram entry point while Telegram is unconfigured', () => {
    renderBooking()
    expect(screen.queryByRole('link', { name: /telegram/i })).not.toBeInTheDocument()
    expect(document.body.innerHTML).not.toContain('t.me')
  })

  /* The form asks four things. Every field removed from it was a field a
     visitor could stall on before ever making contact, and every one of them
     is answerable in the reply email instead. */
  it('asks for a name, an email, an age group and a goal — and nothing else', () => {
    renderBooking()
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
    expect(screen.getByRole('group', { name: /who is the lesson for/i })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: /what would you like to work on/i })).toBeInTheDocument()

    for (const gone of [/parent name/i, /first language/i, /preferred days/i, /preferred time/i, /time zone/i, /how often/i, /best way to reach you/i]) {
      expect(screen.queryByLabelText(gone), String(gone)).not.toBeInTheDocument()
    }
    // Two text inputs (name, email) plus one textarea. Nothing else.
    expect(document.querySelectorAll('input').length).toBe(2)
  })

  /* A greyed-out primary button was the first thing this page showed. The
     buttons now work; pressing one with the form incomplete says what is
     missing and puts the cursor in it. */
  it('keeps both send buttons live and points at the missing field instead', async () => {
    const user = userEvent.setup()
    renderBooking()
    const email = screen.getByRole('button', { name: /send by email/i })
    expect(email).toBeEnabled()

    await user.click(email)
    expect(screen.getByText(/add your name and an email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/your name/i)).toHaveFocus()

    await user.type(screen.getByLabelText(/your name/i), 'Sam')
    await user.click(email)
    expect(screen.getByLabelText(/^email$/i)).toHaveFocus()
  })

  it('builds the mailto only on click, carrying the structured inquiry', async () => {
    const user = userEvent.setup()
    // jsdom refuses to navigate; capture the assignment instead.
    const assigned: string[] = []
    const original = Object.getOwnPropertyDescriptor(window, 'location')
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...window.location,
        set href(value: string) {
          assigned.push(value)
        },
        get href() {
          return 'http://localhost/'
        },
      },
    })

    try {
      renderBooking()
      await user.type(screen.getByLabelText(/your name/i), 'Sam')
      await user.type(screen.getByLabelText(/^email$/i), 'sam@example.com')
      await user.click(screen.getByRole('button', { name: /adult/i }))
      await user.click(screen.getByRole('button', { name: /send by email/i }))

      expect(assigned).toHaveLength(1)
      const url = decodeURIComponent(assigned[0])
      expect(url.startsWith('mailto:heybinyamin@gmail.com?')).toBe(true)
      expect(url).toContain('Name: Sam')
      expect(url).toContain('Email: sam@example.com')
      expect(url).toContain('Learner: Adult')
      expect(url).toContain('Binyamin English')

      // A mailto: that silently fails to open is the one real failure mode of
      // a static contact form, so the address is offered directly afterwards.
      expect(screen.getByText('heybinyamin@gmail.com')).toBeInTheDocument()
    } finally {
      if (original) Object.defineProperty(window, 'location', original)
      vi.restoreAllMocks()
    }
  })

  /* Someone who types half an enquiry, leaves to look something up and comes
     back must not find an empty form. There is no backend to hold the draft. */
  it('keeps what the visitor typed across a reload', async () => {
    const user = userEvent.setup()
    const first = renderBooking()
    await user.type(screen.getByLabelText(/your name/i), 'Dana')
    await user.type(screen.getByLabelText(/anything else/i), 'Evenings work best')
    first.unmount()

    renderBooking()
    expect(screen.getByLabelText(/your name/i)).toHaveValue('Dana')
    expect(screen.getByLabelText(/anything else/i)).toHaveValue('Evenings work best')
  })
})
