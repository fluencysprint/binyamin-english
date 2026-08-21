import { describe, it, expect } from 'vitest'
import { editSignature, signaturesOverlap } from './editSignature'

describe('editSignature', () => {
  it('reports the one word that changed, ignoring the sentence around it', () => {
    expect(editSignature('She go to school every day.', 'She goes to school every day.')).toEqual([
      'go→goes',
    ])
    expect(editSignature('He go to work by bus.', 'He goes to work by bus.')).toEqual(['go→goes'])
  })

  it('keeps a changed run of words together instead of splitting it into noise', () => {
    expect(editSignature('I no like coffee.', 'I don’t like coffee.')).toEqual(['no→don’t'])
  })

  it('reports several independent changes separately', () => {
    expect(editSignature('Do he likes it?', 'Does he like it?')).toEqual(['do→does', 'likes→like'])
  })

  it('reports an insertion and a deletion for their own sake', () => {
    expect(editSignature('I student.', 'I am a student.')).toEqual(['→am a'])
    expect(editSignature('I am go home.', 'I go home.')).toEqual(['am→'])
  })

  it('is empty when nothing changed, or when there is nothing to compare', () => {
    expect(editSignature('Same sentence.', 'Same sentence.')).toEqual([])
    expect(editSignature('Something', '')).toEqual([])
  })

  it('does not treat unrelated corrections as the same weakness', () => {
    const a = editSignature('She go to school.', 'She goes to school.')
    const b = editSignature('I make a photo.', 'I take a photo.')
    expect(signaturesOverlap(a, b)).toBe(false)
    expect(signaturesOverlap(a, editSignature('It go fast.', 'It goes fast.'))).toBe(true)
    expect(signaturesOverlap([], a)).toBe(false)
  })
})
