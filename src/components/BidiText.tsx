import { Fragment } from 'react'
import { splitBidiRuns } from '../utils/bidi'

/**
 * Renders a translated string that may embed English inside RTL prose, with
 * each embedded left-to-right run in its own `<bdi dir="ltr">`.
 *
 * This is the ONLY correct way to handle these strings: without isolation the
 * bidi algorithm resolves the neutral characters — quotes, blanks, colons,
 * parentheses, the final period — against the Hebrew paragraph direction and
 * scatters them to the wrong end of the line. Nothing here reorders or
 * respaces the text; it only tells the browser where one direction ends and
 * the other begins. Left-to-right locales get the string back unchanged.
 *
 * A single inline isolate is enough for one embedded phrase, but several
 * phrases glued together (`Goodbye. · Can you say that again, please?`) stay
 * fragile even isolated: once that run is long enough to wrap, the SECOND
 * line is a new line box inside the surrounding RTL paragraph, and the bidi
 * algorithm reorders it against that paragraph, not against the isolate's own
 * first line — a trailing "?" can end up leading the wrapped line. Pass
 * `block` where the caller can afford a block-level child (a `<li>`, not a
 * `<span>` or `<p>`) to render such a run as its own LTR list instead: each
 * phrase gets its own line, so nothing has to wrap mid-isolate.
 */
export function BidiText({ text, block = false }: { text: string; block?: boolean }) {
  const runs = splitBidiRuns(text)
  return (
    <>
      {runs.map((run, i) => {
        if (run.phrases && block) {
          return (
            <span key={i} dir="ltr" className="bidi-phrases">
              {run.phrases.map((phrase, j) => (
                <span key={j} className="bidi-phrase">
                  {phrase}
                </span>
              ))}
            </span>
          )
        }
        if (run.isolate) {
          return (
            <bdi key={i} dir="ltr">
              {run.text}
            </bdi>
          )
        }
        return <Fragment key={i}>{run.text}</Fragment>
      })}
    </>
  )
}
