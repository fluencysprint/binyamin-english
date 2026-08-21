/* ==========================================================================
   Public contact configuration — the single place any contact detail lives.
   --------------------------------------------------------------------------
   This is a static site: everything here ships to the browser and is readable
   by anyone who opens the bundle. Splitting the address into two constants and
   building the `mailto:` only when the visitor actively picks "email" keeps it
   out of the served HTML, which cuts down on the dumbest scrapers. It is NOT
   secret and must never be described as such.

   Deliberately absent: any phone number, and any WhatsApp entry point.
   ========================================================================== */

const EMAIL_LOCAL = 'heybinyamin'
const EMAIL_DOMAIN = 'gmail.com'

/** The public booking address. Call this only in response to a user action. */
export function contactEmail(): string {
  return `${EMAIL_LOCAL}@${EMAIL_DOMAIN}`
}

/**
 * Public Telegram username, WITHOUT the leading "@". Empty = feature off.
 * Telegram stays optional: no UI is rendered anywhere unless this is set to a
 * real public username.
 */
export const TELEGRAM_USERNAME: string = ''

export function telegramEnabled(): boolean {
  return TELEGRAM_USERNAME.trim().length > 0
}

/** Public t.me link, or null when Telegram is not configured. */
export function telegramUrl(): string | null {
  const user = TELEGRAM_USERNAME.trim().replace(/^@/, '')
  return user ? `https://t.me/${user}` : null
}

/** Build a mailto: URL. Called on click, never rendered into an href up front. */
export function buildMailto(subject: string, body: string): string {
  const params = new URLSearchParams({ subject, body })
  // URLSearchParams encodes spaces as "+", which mail clients show literally.
  return `mailto:${contactEmail()}?${params.toString().replace(/\+/g, '%20')}`
}

/** Open the user's mail client with a prefilled booking inquiry. */
export function openMailto(subject: string, body: string): void {
  window.location.href = buildMailto(subject, body)
}
