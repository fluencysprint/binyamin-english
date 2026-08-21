import { ReactNode } from 'react'

/**
 * Bidi-isolates embedded content (a level code, a native-language word, a
 * lesson target) inside translated prose that may itself be RTL, so the
 * embedded run keeps its own direction without corrupting the surrounding
 * text's punctuation order. Semantic `<bdi>` — no forced `dir`, so mixed or
 * unknown-language content still auto-detects correctly.
 */
export function Bdi({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <bdi className={className}>
      {children}
    </bdi>
  )
}
