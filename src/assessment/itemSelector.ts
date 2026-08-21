import { AssessmentItem } from '../types'

/** Score an auto-scorable item against a chosen option index. */
export function scoreAutoItem(item: AssessmentItem, chosenIndex: number): 'correct' | 'needsWork' {
  return chosenIndex === item.answerIndex ? 'correct' : 'needsWork'
}
