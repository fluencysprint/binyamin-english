/** Stable, collision-resistant id generator that works without any network
 *  or crypto polyfills. Falls back gracefully where crypto is unavailable. */
export function uid(prefix = ''): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
  return prefix ? `${prefix}_${rand}` : rand
}
