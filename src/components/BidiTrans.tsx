import { Fragment } from 'react'
import { UILanguage } from '../types'
import { translateSegments } from '../i18n/translate'

/**
 * Render a translated string whose PLACEHOLDER VALUES are known, structurally,
 * to be dynamic English/LTR learning content — a phrase, a sentence frame, a
 * list of example words — never a string parsed after translation to guess
 * where English begins and ends.
 *
 * `BidiText` isolates embedded LTR runs by scanning the FINISHED string,
 * which cannot tell "this trailing period ends the English phrase" from
 * "this trailing period ends the Hebrew sentence" — both are the same
 * character by the time translation has already glued them together. Here
 * the caller names which `{{param}}`s are English content (`ltr`), so each
 * one is wrapped in its own LTR isolate using its own exact value — including
 * any punctuation the value carries — never a substring recovered by
 * scanning.
 *
 * Pass an array for a param that is several English chunks (phrases, example
 * words); with `block`, 2+ items render one per line instead of one long run
 * that would wrap mid-isolate. See `BidiText` for why that wrapping breaks.
 */
export function BidiTrans({
  lang,
  i18nKey,
  params,
  ltr,
  block = false,
}: {
  lang: UILanguage
  i18nKey: string
  params?: Record<string, string | number | string[]>
  ltr: readonly string[]
  block?: boolean
}) {
  const segments = translateSegments(lang, i18nKey, params ?? {}, ltr)
  return (
    <>
      {segments.map((seg, i) => {
        if (!seg.ltr) return <Fragment key={i}>{seg.text}</Fragment>
        if (block && seg.items && seg.items.length > 1) {
          return (
            <span key={i} dir="ltr" className="bidi-phrases">
              {seg.items.map((item, j) => (
                <span key={j} className="bidi-phrase">
                  {item}
                </span>
              ))}
            </span>
          )
        }
        return (
          <bdi key={i} dir="ltr">
            {seg.text}
          </bdi>
        )
      })}
    </>
  )
}
