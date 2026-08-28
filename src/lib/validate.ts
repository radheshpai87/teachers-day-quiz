import { TIMER_CHOICES, type QuestionType } from './types'
import type { QuestionInput } from './content'

/**
 * Validation for admin-authored questions. Kept in one place so the API routes
 * and the editor agree on exactly what a valid question is.
 */

const TYPES: QuestionType[] = ['MCQ', 'TRUE_FALSE', 'IMAGE']

export const TRUE_FALSE_OPTIONS = ['True', 'False']

export interface QuestionDraft {
  type?: unknown
  prompt?: unknown
  options?: unknown
  correctIndex?: unknown
  timerSeconds?: unknown
  explanation?: unknown
  imageId?: unknown
}

export function validateQuestion(
  draft: QuestionDraft,
): { ok: true; value: QuestionInput } | { ok: false; error: string } {
  const type = draft.type
  if (typeof type !== 'string' || !TYPES.includes(type as QuestionType)) {
    return { ok: false, error: 'Choose a question type.' }
  }
  const questionType = type as QuestionType

  const prompt = typeof draft.prompt === 'string' ? draft.prompt.trim() : ''
  if (prompt.length < 3) return { ok: false, error: 'Write a question of at least 3 characters.' }
  if (prompt.length > 300) return { ok: false, error: 'Questions are limited to 300 characters.' }

  const rawOptions = Array.isArray(draft.options) ? draft.options.map((o) => String(o ?? '').trim()) : []

  let options: string[]
  if (questionType === 'TRUE_FALSE') {
    options = TRUE_FALSE_OPTIONS
  } else if (questionType === 'MCQ') {
    options = rawOptions.slice(0, 4)
    if (options.length !== 4 || options.some((o) => o.length === 0)) {
      return { ok: false, error: 'Multiple choice questions need all four answers filled in.' }
    }
  } else {
    // Image questions may use either two or four answers.
    options = rawOptions.filter((o) => o.length > 0).slice(0, 4)
    if (options.length !== 2 && options.length !== 4) {
      return { ok: false, error: 'Image questions need either two or four answers.' }
    }
  }

  if (options.some((o) => o.length > 120)) {
    return { ok: false, error: 'Answers are limited to 120 characters.' }
  }

  const correctIndex = Number(draft.correctIndex)
  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
    return { ok: false, error: 'Pick which answer is correct.' }
  }

  const timerSeconds = Number(draft.timerSeconds) || 5
  if (Number.isNaN(timerSeconds) || timerSeconds < 1 || timerSeconds > 300) {
    return { ok: false, error: 'Timer must be between 1 and 300 seconds.' }
  }

  const explanationRaw = typeof draft.explanation === 'string' ? draft.explanation.trim() : ''
  const explanation = explanationRaw.length > 0 ? explanationRaw.slice(0, 400) : null

  const imageId = typeof draft.imageId === 'string' && draft.imageId.length > 0 ? draft.imageId : null
  if (questionType === 'IMAGE' && !imageId) {
    return { ok: false, error: 'Image questions need an image.' }
  }

  return {
    ok: true,
    value: { type: questionType, prompt, options, correctIndex, timerSeconds, explanation, imageId },
  }
}
