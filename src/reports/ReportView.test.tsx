import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StudentProfile, LessonRecord, Correction } from '../types'
import { initLearningModel } from '../students/learningModel'
import { generateFirstLesson } from '../lessons/lessonGenerator'
import { applyCompletedLesson } from '../lessons/lessonCompletion'
import { I18nProvider } from '../i18n/I18nProvider'
import { ToastProvider } from '../components/Toast'
import { ReportView } from './ReportView'

const now = 1_700_000_000_000

function makeStudent(over: Partial<StudentProfile> = {}): StudentProfile {
  return {
    id: 'stu1',
    createdAt: now,
    updatedAt: now,
    name: 'Alex',
    age: 10,
    ageBand: '9-12',
    nativeLanguage: 'Hebrew',
    otherLanguages: [],
    interfaceLanguage: 'he',
    goals: ['conversation', 'pronunciation'],
    interests: ['cooking'],
    speakingConfidence: 3,
    pronunciationImportance: 5,
    ...over,
  }
}

function makeLesson(student: StudentProfile): LessonRecord {
  const plan = generateFirstLesson(student, initLearningModel(student.id, 'A2', now))
  return {
    id: 'les1',
    studentId: student.id,
    plan,
    status: 'completed',
    currentPhaseIndex: plan.phases.length - 1,
    elapsedSeconds: 3000,
    responses: [],
    correctionIds: [],
    audioIds: [],
    vocabularyAdded: ['delighted'],
    objectiveOutcome: 'correct',
  }
}

describe('ReportView in Hebrew', () => {
  it('renders went-well/improvement narrative in Hebrew, keeps English quotes LTR', () => {
    const student = makeStudent()
    const model = initLearningModel(student.id, 'A2', now)
    const lesson = makeLesson(student)
    const corrections: Correction[] = [
      {
        id: 'c1',
        studentId: student.id,
        category: 'grammar',
        said: 'She go',
        better: 'She goes',
        priority: 'high',
        at: now,
        retried: true,
      },
    ]
    const { report } = applyCompletedLesson(model, lesson, student, corrections, now)

    render(
      <I18nProvider initialLang="he">
        <ToastProvider>
          <ReportView report={report} parentSection />
        </ToastProvider>
      </I18nProvider>,
    )

    // "What went well" narrative (objective outcome was 'correct') must be
    // Hebrew — it appears in both the student section and the parent
    // "strengths" section (minors get both), so there are two matches.
    expect(screen.getAllByText(/השתמשתם ב-.+ בצורה מדויקת\./).length).toBeGreaterThan(0)
    // "Signs of progress" narrative (parent section, minor student) must be Hebrew.
    expect(screen.getByText(/יישמתם את .+ נכון עד סוף השיעור\./)).toBeInTheDocument()

    // The correction quote ("said" → "better") stays LTR even inside the
    // Hebrew page. "She go"/"She goes" also appear elsewhere (priorities,
    // next focus) with dir="auto", so assert at least one LTR match exists.
    expect(screen.getAllByText('She go').some((el) => el.getAttribute('dir') === 'ltr')).toBe(true)
    expect(screen.getAllByText('She goes').some((el) => el.getAttribute('dir') === 'ltr')).toBe(true)

    // Nothing renders a bare "Next focus:" prefix baked into body text — the
    // badge is the only label now (previously the student section doubled it).
    expect(screen.queryByText(/^Next focus:/)).not.toBeInTheDocument()
  })

  it('always prints a homework block, in the learner’s own language', () => {
    const student = makeStudent()
    const model = initLearningModel(student.id, 'A2', now)
    const lesson = makeLesson(student)
    const { report } = applyCompletedLesson(model, lesson, student, [], now)

    render(
      <I18nProvider initialLang="he">
        <ToastProvider>
          <ReportView report={report} parentSection />
        </ToastProvider>
      </I18nProvider>,
    )

    expect(screen.getByRole('heading', { name: 'שיעורי בית' })).toBeInTheDocument()
    const items = screen.getAllByRole('listitem').filter((li) => li.closest('ol'))
    expect(items.length).toBeGreaterThan(0)
    // "delighted" was captured during the lesson, so it must reach the tasks —
    // not only the "new words" chips higher up the page.
    expect(items.some((li) => /delighted/.test(li.textContent ?? ''))).toBe(true)
  })
})

describe('ReportView in Russian', () => {
  it('writes homework in everyday Russian, keeping the English being practised in English', () => {
    const student = makeStudent({ id: 'ru1', age: 34, ageBand: 'adult', interfaceLanguage: 'ru' })
    const model = initLearningModel(student.id, 'B1', now)
    const lesson = makeLesson(student)
    const corrections: Correction[] = [
      {
        id: 'c1',
        studentId: student.id,
        category: 'grammar',
        said: 'I go yesterday',
        better: 'I went yesterday',
        priority: 'high',
        at: now,
      },
    ]
    const { report } = applyCompletedLesson(model, lesson, student, corrections, now)

    render(
      <I18nProvider initialLang="ru">
        <ToastProvider>
          <ReportView report={report} parentSection />
        </ToastProvider>
      </I18nProvider>,
    )

    expect(screen.getByRole('heading', { name: 'Домашнее задание' })).toBeInTheDocument()
    const task = screen.getByText(/Проговорите вслух/)
    expect(task).toBeInTheDocument()
    // The Russian is the instruction; the English is what they practise.
    expect(task.textContent).toContain('I went yesterday')
  })
})
