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
 */
export function BidiText({ text }: { text: string }) {
  const runs = splitBidiRuns(text)
  return (
    <>
      {runs.map((run, i) =>
        run.isolate ? (
          <bdi key={i} dir="ltr">
            {run.text}
          </bdi>
        ) : (
          <Fragment key={i}>{run.text}</Fragment>
        ),
      )}
    </>
  )
}
